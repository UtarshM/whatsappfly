export type FlowStepType = "wait" | "tag" | "send_message" | "send_interactive" | "condition";

export interface FlowStep {
  type: FlowStepType;
  config: Record<string, any>;
}

export interface FlowRun {
  id: string;
  workspace_id: string;
  lead_id: string;
  flow_definition_id: string;
  current_node_id: string;
  status: "active" | "completed" | "failed";
  retry_count: number;
  scheduled_at: string;
}

export interface FlowNode {
  id: string;
  type: string;
  data: any;
}

export interface FlowEdge {
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface FlowDefinition {
  id: string;
  workspace_id: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export const PHASE_1_FLOW: FlowStep[] = [
  {
    type: "tag",
    config: { tag: "Meta Lead" },
  },
  {
    type: "wait",
    config: { hours: 2 },
  },
  {
    type: "send_interactive",
    config: {
      body: "Ready to grow your business? Click below to join our exclusive WhatsApp group!",
      buttons: [
        { type: "reply", reply: { id: "join_group", title: "Join Group" } },
        { type: "reply", reply: { id: "not_now", title: "Not Now" } },
      ],
    },
  },
];

export async function startFlowForLead(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  workspaceId: string,
  leadId: string,
) {
  // Find the active "Meta Lead" flow definition
  const { data: definition } = await supabase
    .from("automation_flow_definitions")
    .select("id, nodes")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!definition) {
    console.error("No active flow definition found for Meta Lead trigger.");
    return;
  }

  // Find the trigger node
  const triggerNode = (definition.nodes as any[]).find((n: any) => n.type === "trigger" || n.type === "lead_trigger");
  const firstNodeId = triggerNode?.id;

  const { data: flowRun, error } = await supabase
    .from("automation_flow_runs")
    .insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      flow_definition_id: definition.id,
      current_node_id: firstNodeId,
      status: "active",
      scheduled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to start flow for lead", error);
    return;
  }

  return flowRun;
}

export async function processFlowRun(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  flowRun: FlowRun,
) {
  if (!flowRun.flow_definition_id || !flowRun.current_node_id) {
    await supabase.from("automation_flow_runs").update({ status: "failed" }).eq("id", flowRun.id);
    return;
  }

  const { data: definition } = await supabase
    .from("automation_flow_definitions")
    .select("*")
    .eq("id", flowRun.flow_definition_id)
    .single();

  if (!definition) {
    await supabase.from("automation_flow_runs").update({ status: "failed" }).eq("id", flowRun.id);
    return;
  }

  const nodes = definition.nodes as FlowNode[];
  const edges = definition.edges as FlowEdge[];
  const node = nodes.find((n) => n.id === flowRun.current_node_id);

  if (!node) {
    await supabase.from("automation_flow_runs").update({ status: "completed" }).eq("id", flowRun.id);
    return;
  }

  try {
    let nextNodeId: string | null = null;
    let delayHours = 0;

    switch (node.type) {
      case "trigger":
      case "lead_trigger":
        nextNodeId = findNextNodeId(node.id, edges);
        break;

      case "tag":
        await handleTagStep(supabase, flowRun, node.data);
        nextNodeId = findNextNodeId(node.id, edges);
        break;

      case "wait":
        delayHours = (node.data as any)?.hours ?? 1;
        nextNodeId = findNextNodeId(node.id, edges);
        break;

      case "send_message":
        await handleFlowMessageSend(supabase, flowRun, node.data);
        nextNodeId = findNextNodeId(node.id, edges);
        break;

      case "send_interactive":
        await handleFlowInteractiveSend(supabase, flowRun, node.data);
        nextNodeId = findNextNodeId(node.id, edges);
        break;

      case "condition": {
        const result = await evaluateCondition(supabase, flowRun, node.data);
        nextNodeId = findNextNodeId(node.id, edges, result ? "true" : "false");
        break;
      }
    }

    if (nextNodeId) {
      await supabase
        .from("automation_flow_runs")
        .update({
          current_node_id: nextNodeId,
          scheduled_at: new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString(),
          retry_count: 0,
        })
        .eq("id", flowRun.id);
    } else {
      await supabase.from("automation_flow_runs").update({ status: "completed" }).eq("id", flowRun.id);
    }
  } catch (error) {
    console.error(`Flow node ${flowRun.current_node_id} failed`, error);
    if ((flowRun.retry_count ?? 0) < 3) {
      await supabase
        .from("automation_flow_runs")
        .update({
          retry_count: (flowRun.retry_count ?? 0) + 1,
          scheduled_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .eq("id", flowRun.id);
    } else {
      await supabase.from("automation_flow_runs").update({ status: "failed" }).eq("id", flowRun.id);
    }
  }
}

function findNextNodeId(nodeId: string, edges: FlowEdge[], sourceHandle?: string): string | null {
  const edge = edges.find((e) => e.source === nodeId && (!sourceHandle || e.sourceHandle === sourceHandle));
  return edge ? edge.target : null;
}

async function handleTagStep(supabase: any, flowRun: FlowRun, data: any) {
  const { data: lead } = await supabase.from("leads").select("contact_id").eq("id", flowRun.lead_id).single();
  if (lead?.contact_id) {
    await supabase.from("contact_tags").upsert({
      workspace_id: flowRun.workspace_id,
      contact_id: lead.contact_id,
      tag: data.tag,
    }, { onConflict: "contact_id,tag" });
  }
}

async function evaluateCondition(supabase: any, flowRun: FlowRun, data: any): Promise<boolean> {
  if (data.type === "has_tag") {
    const { data: tag } = await supabase
      .from("contact_tags")
      .select("tag")
      .eq("contact_id", flowRun.lead_id)
      .eq("tag", data.tag)
      .maybeSingle();
    return !!tag;
  }
  return false;
}

async function handleFlowMessageSend(supabase: any, flowRun: FlowRun, config: any) {
  const { data: connection } = await supabase
    .from("whatsapp_connections")
    .select("phone_number_id")
    .eq("workspace_id", flowRun.workspace_id)
    .single();

  const { data: auth } = await supabase
    .from("meta_authorizations")
    .select("access_token")
    .eq("workspace_id", flowRun.workspace_id)
    .single();

  const { data: lead } = await supabase
    .from("leads")
    .select("phone, full_name")
    .eq("id", flowRun.lead_id)
    .single();

  if (!connection || !auth || !lead) throw new Error("Missing flow prerequisites.");

  await sendMetaTemplateMessage({
    accessToken: auth.access_token,
    phoneNumberId: connection.phone_number_id,
    to: lead.phone,
    templateName: config.templateName,
    languageCode: config.languageCode || "en",
    bodyParameters: [lead.full_name],
  });
}

async function handleFlowInteractiveSend(supabase: any, flowRun: FlowRun, config: any) {
  const { data: connection } = await supabase
    .from("whatsapp_connections")
    .select("phone_number_id")
    .eq("workspace_id", flowRun.workspace_id)
    .single();

  const { data: auth } = await supabase
    .from("meta_authorizations")
    .select("access_token")
    .eq("workspace_id", flowRun.workspace_id)
    .single();

  const { data: lead } = await supabase
    .from("leads")
    .select("phone")
    .eq("id", flowRun.lead_id)
    .single();

  if (!connection || !auth || !lead) throw new Error("Missing flow prerequisites.");

  await sendMetaInteractiveMessage({
    accessToken: auth.access_token,
    phoneNumberId: connection.phone_number_id,
    to: lead.phone,
    type: "button",
    body: config.body,
    buttons: config.buttons,
  });
}
