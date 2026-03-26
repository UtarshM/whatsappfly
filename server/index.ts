import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import cors from "cors";
import express from "express";
import { CampaignStatus, ConnectionStatus, MessageTemplateCategory, TemplateStatus } from "@prisma/client";
import { z } from "zod";
import { COST_PER_MESSAGE } from "../src/lib/api/types.js";
import { prisma } from "./prisma.js";
import {
  buildAppState,
  createWorkspaceForUser,
  ensureSession,
  findOrCreateUserByEmail,
  getCurrentUser,
  seedWorkspace,
  setCurrentUser,
} from "./state.js";
import { startFlowForLead, processFlowRun } from "./flowEngine.js";
import {
  buildCampaignBodyParameters,
  buildTemplateBodyParameters,
  exchangeMetaCode,
  getMetaWebhookVerifyToken,
  mapTemplateLanguageToMetaCode,
  sendMetaTemplateMessage,
  sendMetaTextMessage,
} from "./meta.js";
import {
  type SummarizedLeadWebhookEvent,
  type SummarizedMetaWebhookEvent,
  type SummarizedWhatsAppWebhookEvent,
  summarizeMetaWebhookPayload,
} from "./metaWebhook.js";
import { getSupabaseAdmin, getWorkspaceContextFromRequestAuthHeader } from "./supabaseAdmin.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({
  origin: true,
  credentials: true,
}));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

const emailSchema = z.object({
  email: z.string().email(),
});

const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const connectWhatsAppSchema = z.object({
  businessPortfolio: z.string().min(1),
  wabaName: z.string().min(1),
  phoneNumber: z.string().min(1),
  businessName: z.string().min(1),
});

const walletSchema = z.object({
  amount: z.number().positive(),
  source: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

const campaignSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().min(1),
  contactIds: z.array(z.string()).min(1),
  sendNow: z.boolean(),
});

const metaExchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

const metaSendTemplateSchema = z.object({
  to: z.string().min(1),
  templateName: z.string().min(1),
  languageCode: z.string().min(1),
  bodyParameters: z.array(z.string()).optional(),
});

const metaSendCampaignSchema = z.object({
  templateId: z.string().min(1),
  contactIds: z.array(z.string()).min(1),
  bodyParameters: z.array(z.string()).optional(),
});

const metaReplySchema = z.object({
  conversationId: z.string().uuid(),
  to: z.string().min(1),
  body: z.string().min(1).max(4096),
});

const metaLeadSourceMappingSchema = z.object({
  label: z.string().default(""),
  pageId: z.string().optional().default(""),
  adId: z.string().optional().default(""),
  formId: z.string().optional().default(""),
});

const automationLeadContactedSchema = z.object({
  leadId: z.string().uuid(),
});

const retryFailedSendSchema = z.object({
  failedSendLogId: z.string().uuid(),
});

function actionResponse(data: unknown, result: { ok: boolean; message: string }) {
  return { data, result };
}

function leadSourceToDb(source: string) {
  if (source === "Meta Ads") {
    return "meta_ads";
  }

  if (source === "Campaign") {
    return "campaign";
  }

  if (source === "Manual") {
    return "manual";
  }

  if (source === "Organic") {
    return "organic";
  }

  return "whatsapp_inbound";
}

function buildLeadAttributionLabel(input: {
  label?: string | null;
  adId?: string | null;
  formId?: string | null;
  pageId?: string | null;
}) {
  const parts = [
    input.label?.trim(),
    input.pageId ? `Page ${input.pageId}` : null,
    input.adId ? `Ad ${input.adId}` : null,
    input.formId ? `Form ${input.formId}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Meta Lead Ad";
}

function buildLeadAttributionNotes(input: {
  adId?: string | null;
  formId?: string | null;
  pageId?: string | null;
}) {
  const details = [
    "Lead captured automatically from Meta Lead Ads webhook.",
    input.pageId ? `Page ID: ${input.pageId}` : null,
    input.adId ? `Ad ID: ${input.adId}` : null,
    input.formId ? `Form ID: ${input.formId}` : null,
  ].filter(Boolean);

  return details.join("\n");
}

type AutomationRuleRecord = {
  id: string;
  rule_type: "auto_reply_first_inbound" | "auto_assign_new_lead" | "no_reply_reminder" | "follow_up_after_contacted";
  enabled: boolean;
  config: Record<string, unknown> | null;
};

async function getEnabledAutomationRule(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  workspaceId: string,
  ruleType: AutomationRuleRecord["rule_type"],
) {
  const { data } = await supabase
    .from("automation_rules")
    .select("id, rule_type, enabled, config")
    .eq("workspace_id", workspaceId)
    .eq("rule_type", ruleType)
    .eq("enabled", true)
    .maybeSingle();

  return (data as AutomationRuleRecord | null) ?? null;
}

async function logAutomationEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  input: {
    workspaceId: string;
    ruleType: AutomationRuleRecord["rule_type"];
    conversationId?: string | null;
    leadId?: string | null;
    status: "triggered" | "skipped" | "failed";
    summary: string;
    payload?: Record<string, unknown>;
  },
) {
  await supabase.from("automation_events").insert({
    workspace_id: input.workspaceId,
    rule_type: input.ruleType,
    conversation_id: input.conversationId ?? null,
    lead_id: input.leadId ?? null,
    status: input.status,
    summary: input.summary,
    payload: input.payload ?? {},
  });
}

function resolveAutomationMessage(template: string, input: { contactName: string; contactPhone: string }) {
  return template
    .replaceAll("{{contact.name}}", input.contactName)
    .replaceAll("{{contact.phone}}", input.contactPhone);
}

async function getActiveMetaAuthorization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  workspaceId: string,
) {
  const { data: authorization } = await supabase
    .from("meta_authorizations")
    .select("access_token, expires_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!authorization?.access_token) {
    throw new Error("No stored Meta authorization found for this workspace. Reconnect WhatsApp to continue.");
  }

  if (authorization.expires_at && new Date(authorization.expires_at).getTime() <= Date.now()) {
    throw new Error("Meta authorization has expired for this workspace. Reconnect WhatsApp before sending again.");
  }

  return authorization;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown server error";
}

async function logOperationalEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  input: {
    workspaceId: string;
    eventType: string;
    level: "info" | "warning" | "error";
    summary: string;
    payload?: Record<string, unknown>;
  },
) {
  await supabase.from("operational_logs").insert({
    workspace_id: input.workspaceId,
    event_type: input.eventType,
    level: input.level,
    summary: input.summary,
    payload: input.payload ?? {},
  });
}

async function logFailedSend(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  input: {
    workspaceId: string;
    channel: "campaign" | "reply" | "automation" | "template";
    targetType: "contact" | "conversation" | "lead" | "workspace";
    targetId?: string | null;
    destination: string;
    templateName?: string | null;
    messageBody?: string | null;
    errorMessage: string;
    payload?: Record<string, unknown>;
  },
) {
  await Promise.all([
    supabase.from("failed_send_logs").insert({
      workspace_id: input.workspaceId,
      channel: input.channel,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      destination: input.destination,
      template_name: input.templateName ?? null,
      message_body: input.messageBody ?? null,
      error_message: input.errorMessage,
      payload: input.payload ?? {},
    }),
    logOperationalEvent(supabase, {
      workspaceId: input.workspaceId,
      eventType: `${input.channel}_send_failed`,
      level: "error",
      summary: `${input.channel} send failed for ${input.destination}.`,
      payload: {
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        templateName: input.templateName ?? null,
        errorMessage: input.errorMessage,
        ...input.payload,
      },
    }),
  ]);
}

function fingerprintWebhookEvent(event: SummarizedMetaWebhookEvent) {
  return createHash("sha256").update(JSON.stringify(event)).digest("hex");
}

async function claimWebhookEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  event: SummarizedMetaWebhookEvent,
) {
  const { error } = await supabase.from("processed_webhook_events").insert({
    fingerprint: fingerprintWebhookEvent(event),
    event_type: event.field,
    workspace_id: null,
  });

  if (!error) {
    return true;
  }

  if (typeof error === "object" && error && "code" in error && error.code === "23505") {
    return false;
  }

  throw error;
}

async function sendWorkspaceAutomationMessage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  input: {
    workspaceId: string;
    to: string;
    body: string;
  },
) {
  const [authorization, { data: connection }] = await Promise.all([
    getActiveMetaAuthorization(supabase, input.workspaceId),
    supabase.from("whatsapp_connections").select("phone_number_id").eq("workspace_id", input.workspaceId).maybeSingle(),
  ]);

  if (!connection?.phone_number_id) {
    throw new Error("Meta authorization or connected phone number is missing for this workspace.");
  }

  return sendMetaTextMessage({
    accessToken: authorization.access_token,
    phoneNumberId: connection.phone_number_id,
    to: input.to,
    body: input.body,
  });
}

async function persistWhatsAppWebhookEvent(supabase: ReturnType<typeof getSupabaseAdmin>, event: SummarizedWhatsAppWebhookEvent) {
  if (!event.phoneNumberId) {
    return;
  }

  const { data: connection } = await supabase
    .from("whatsapp_connections")
    .select("workspace_id")
    .eq("phone_number_id", event.phoneNumberId)
    .maybeSingle();

  const workspaceId = connection?.workspace_id ?? null;
  if (!workspaceId) {
    await supabase.from("meta_webhook_events").insert({
      workspace_id: null,
      event_type: event.field,
      payload: event,
    });
    return;
  }

  await supabase.from("meta_webhook_events").insert({
    workspace_id: workspaceId,
    event_type: event.field,
    payload: event,
  });

  await logOperationalEvent(supabase, {
    workspaceId,
    eventType: "meta_webhook_received",
    level: "info",
    summary: `Webhook received with ${event.inboundMessages.length} inbound message(s) and ${event.messageStatuses.length} status update(s).`,
    payload: {
      phoneNumberId: event.phoneNumberId,
      field: event.field,
    },
  });

  for (const inboundMessage of event.inboundMessages) {
    if (!inboundMessage.from) {
      continue;
    }

    const { data: contact } = await supabase
      .from("contacts")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .eq("phone", inboundMessage.from)
      .maybeSingle();

    const displayName = contact?.name ?? inboundMessage.from;

    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id, unread_count")
      .eq("workspace_id", workspaceId)
      .eq("phone", inboundMessage.from)
      .maybeSingle();

    const conversationPayload = {
      workspace_id: workspaceId,
      contact_id: contact?.id ?? null,
      phone: inboundMessage.from,
      display_name: displayName,
      status: "open",
      source: "whatsapp_inbound",
      last_message_preview: inboundMessage.body ?? "",
      last_message_at: inboundMessage.timestamp ? new Date(Number(inboundMessage.timestamp) * 1000).toISOString() : new Date().toISOString(),
      unread_count: (existingConversation?.unread_count ?? 0) + 1,
    };

    const { data: conversation } = await supabase
      .from("conversations")
      .upsert(
        existingConversation
          ? { id: existingConversation.id, ...conversationPayload }
          : conversationPayload,
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (!conversation) {
      continue;
    }

    await supabase.from("conversation_messages").insert({
      workspace_id: workspaceId,
      conversation_id: conversation.id,
      meta_message_id: inboundMessage.id,
      direction: "inbound",
      message_type: inboundMessage.type ?? "text",
      body: inboundMessage.body ?? "",
      status: "received",
      payload: inboundMessage,
      sent_at: inboundMessage.timestamp ? new Date(Number(inboundMessage.timestamp) * 1000).toISOString() : new Date().toISOString(),
    });

    try {
      if (contact?.id) {
        await supabase.from("contact_tags").upsert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          tag: "Joined",
        }, { onConflict: "contact_id,tag" });

        // If it was a button click, log it as an automation interactive step
        if (inboundMessage.interactiveId) {
          await logAutomationEvent(supabase, {
            workspaceId,
            ruleType: "auto_reply_first_inbound", // Or a specific flow rule
            conversationId: conversation.id,
            status: "triggered",
            summary: `User clicked interactive button: ${inboundMessage.interactiveTitle} (${inboundMessage.interactiveId})`,
            payload: {
              interactiveId: inboundMessage.interactiveId,
              interactiveTitle: inboundMessage.interactiveTitle,
            },
          });
        }
      }
    } catch (tagError) {
      console.error("Failed to apply 'Joined' tag or log interactive response", tagError);
    }

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("phone", inboundMessage.from)
      .maybeSingle();

    if (!existingLead) {
      let assignedTo: string | null = null;
      const assignRule = await getEnabledAutomationRule(supabase, workspaceId, "auto_assign_new_lead");
      if (assignRule?.config && typeof assignRule.config === "object") {
        const configuredOwner = "ownerName" in assignRule.config && typeof assignRule.config.ownerName === "string"
          ? assignRule.config.ownerName.trim()
          : "";
        assignedTo = configuredOwner || null;
      }

      const { data: createdLead } = await supabase.from("leads").insert({
        workspace_id: workspaceId,
        contact_id: contact?.id ?? null,
        conversation_id: conversation.id,
        full_name: displayName,
        phone: inboundMessage.from,
        status: "new",
        source: "whatsapp_inbound",
        source_label: "Inbound WhatsApp conversation",
        assigned_to: assignedTo,
        notes: "Lead created automatically from inbound WhatsApp webhook.",
      }).select("id").single();

      if (assignedTo && createdLead?.id) {
        await logAutomationEvent(supabase, {
          workspaceId,
          ruleType: "auto_assign_new_lead",
          conversationId: conversation.id,
          leadId: createdLead.id,
          status: "triggered",
          summary: `New inbound lead assigned to ${assignedTo}.`,
        });
      }
    }

    if (!existingConversation?.id) {
      const autoReplyRule = await getEnabledAutomationRule(supabase, workspaceId, "auto_reply_first_inbound");
      const autoReplyTemplate = autoReplyRule?.config && typeof autoReplyRule.config === "object" && "message" in autoReplyRule.config && typeof autoReplyRule.config.message === "string"
        ? autoReplyRule.config.message.trim()
        : "";

      if (autoReplyTemplate) {
        try {
          const body = resolveAutomationMessage(autoReplyTemplate, {
            contactName: displayName,
            contactPhone: inboundMessage.from,
          });
          const response = await sendWorkspaceAutomationMessage(supabase, {
            workspaceId,
            to: inboundMessage.from,
            body,
          });
          const sentAt = new Date().toISOString();
          const messageId = Array.isArray((response as { messages?: Array<{ id?: string }> }).messages)
            ? (response as { messages?: Array<{ id?: string }> }).messages?.[0]?.id ?? null
            : null;

          await Promise.all([
            supabase.from("conversation_messages").insert({
              workspace_id: workspaceId,
              conversation_id: conversation.id,
              meta_message_id: messageId,
              direction: "outbound",
              message_type: "text",
              body,
              status: "sent",
              payload: response,
              sent_at: sentAt,
            }),
            supabase
              .from("conversations")
              .update({
                last_message_preview: body,
                last_message_at: sentAt,
              })
              .eq("workspace_id", workspaceId)
              .eq("id", conversation.id),
          ]);

          await logAutomationEvent(supabase, {
            workspaceId,
            ruleType: "auto_reply_first_inbound",
            conversationId: conversation.id,
            status: "triggered",
            summary: `First inbound auto-reply sent to ${displayName}.`,
          });
        } catch (error) {
          await logFailedSend(supabase, {
            workspaceId,
            channel: "automation",
            targetType: "conversation",
            targetId: conversation.id,
            destination: inboundMessage.from,
            messageBody: autoReplyTemplate,
            errorMessage: getErrorMessage(error),
            payload: {
              automationRule: "auto_reply_first_inbound",
              conversationId: conversation.id,
            },
          });
          await logAutomationEvent(supabase, {
            workspaceId,
            ruleType: "auto_reply_first_inbound",
            conversationId: conversation.id,
            status: "failed",
            summary: `First inbound auto-reply failed for ${displayName}.`,
            payload: {
              message: error instanceof Error ? error.message : "Unknown automation error",
            },
          });
        }
      }
    }
  }

  for (const messageStatus of event.messageStatuses) {
    if (!messageStatus.id) {
      continue;
    }

    await supabase
      .from("conversation_messages")
      .update({
        status: messageStatus.status ?? "sent",
      })
      .eq("workspace_id", workspaceId)
      .eq("meta_message_id", messageStatus.id);
  }
}

async function persistLeadgenWebhookEvent(supabase: ReturnType<typeof getSupabaseAdmin>, event: SummarizedLeadWebhookEvent) {
  const fullName = event.fieldData.find((field) => field.name?.toLowerCase().includes("name"))?.values?.[0] ?? "Meta Lead";
  const phone = event.fieldData.find((field) => field.name?.toLowerCase().includes("phone"))?.values?.[0] ?? "";
  const email = event.fieldData.find((field) => field.name?.toLowerCase().includes("email"))?.values?.[0] ?? "";

  if (!phone) {
    return;
  }

  const { data: mappedSource } = await supabase
    .from("meta_lead_source_mappings")
    .select("workspace_id, label, page_id, ad_id, form_id")
    .or([
      event.adId ? `ad_id.eq.${event.adId}` : "",
      event.leadgenId ? `id.eq.${event.leadgenId}` : "",
      event.pageId ? `page_id.eq.${event.pageId}` : "",
    ].filter(Boolean).join(","))
    .limit(5);

  const prioritizedMapping = (mappedSource ?? []).sort((left, right) => {
    const leftScore = (left.ad_id ? 4 : 0) + (left.form_id ? 2 : 0) + (left.page_id ? 1 : 0);
    const rightScore = (right.ad_id ? 4 : 0) + (right.form_id ? 2 : 0) + (right.page_id ? 1 : 0);
    return rightScore - leftScore;
  })[0];

  const workspaceId = prioritizedMapping?.workspace_id ?? null;
  await supabase.from("meta_webhook_events").insert({
    workspace_id: workspaceId,
    event_type: event.field,
    payload: event,
  });

  if (!workspaceId) {
    return;
  }

  await logOperationalEvent(supabase, {
    workspaceId,
    eventType: "meta_lead_captured",
    level: "info",
    summary: `Lead captured from Meta Ads for ${fullName}.`,
    payload: {
      pageId: event.pageId,
      adId: event.adId,
      phone,
    },
  });

  const { data: contact } = await supabase
    .from("contacts")
    .upsert({
      workspace_id: workspaceId,
      name: fullName,
      phone,
    }, { onConflict: "workspace_id,phone" })
    .select("id")
    .single();

  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      workspace_id: workspaceId,
      contact_id: contact?.id ?? null,
      phone,
      display_name: fullName,
      status: "open",
      source: "meta_ads",
      last_message_preview: "Lead captured from Meta ad form",
      last_message_at: event.createdTime ? new Date(event.createdTime * 1000).toISOString() : new Date().toISOString(),
      unread_count: 0,
    })
    .select("id")
    .single();

  const assignRule = await getEnabledAutomationRule(supabase, workspaceId, "auto_assign_new_lead");
  const configuredOwner = assignRule?.config && typeof assignRule.config === "object" && "ownerName" in assignRule.config && typeof assignRule.config.ownerName === "string"
    ? assignRule.config.ownerName.trim()
    : "";

  const { data: leadRecord } = await supabase.from("leads").upsert({
    workspace_id: workspaceId,
    contact_id: contact?.id ?? null,
    conversation_id: conversation?.id ?? null,
    meta_lead_id: event.leadgenId,
    full_name: fullName,
    phone,
    email,
    status: "new",
    source: "meta_ads",
    source_label: buildLeadAttributionLabel({
      label: prioritizedMapping?.label,
      pageId: event.pageId,
      adId: event.adId,
    }),
    assigned_to: configuredOwner || null,
    notes: buildLeadAttributionNotes({
      pageId: event.pageId,
      adId: event.adId,
    }),
  }, { onConflict: "meta_lead_id" }).select("id").single();

  if (leadRecord?.id) {
    if (configuredOwner) {
      await logAutomationEvent(supabase, {
        workspaceId,
        ruleType: "auto_assign_new_lead",
        conversationId: conversation?.id ?? null,
        leadId: leadRecord.id,
        status: "triggered",
        summary: `Meta ad lead assigned to ${configuredOwner}.`,
      });
    }

    try {
      await startFlowForLead(supabase, workspaceId, leadRecord.id);
    } catch (flowError) {
      console.error("Failed to start Phase 1 flow for lead", flowError);
    }
  }
}

async function requireUser() {
  const user = await getCurrentUser(prisma);
  if (!user) {
    throw new Error("No active session. Sign in first.");
  }

  return user;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/t/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const supabase = getSupabaseAdmin();

    // Use a hardcoded or dynamic mapping for Phase 2
    // In a real app, we'd lookup in a 'links' table
    // For now, let's support a few predefined codes for the demo
    const links: Record<string, string> = {
      "join-group": "https://chat.whatsapp.com/example-group-id",
    };

    const targetUrl = links[code];
    if (!targetUrl) {
      res.status(404).send("Link not found.");
      return;
    }

    // Log the click asynchronously
    // Ideally we'd have the contact_id from a query param if coming from a message
    const contactId = typeof req.query.cid === "string" ? req.query.cid : null;
    const workspaceId = typeof req.query.wid === "string" ? req.query.wid : null;

    if (workspaceId) {
      supabase.from("link_clicks").insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        link_code: code,
        original_url: targetUrl,
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      }).then(({ error }) => {
        if (error) console.error("Failed to log link click", error);
      });
    }

    res.redirect(targetUrl);
  } catch (error) {
    console.error("Link redirect failed", error);
    res.status(500).send("Internal server error.");
  }
});

app.get("/meta/webhook", (req, res) => {
  const verifyToken = getMetaWebhookVerifyToken();
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && verifyToken && token === verifyToken && typeof challenge === "string") {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send("Webhook verification failed.");
});

app.post("/meta/webhook", (req, res) => {
  const summary = summarizeMetaWebhookPayload(req.body);
  console.log("Meta webhook payload received", JSON.stringify(summary));

  void (async () => {
    try {
      const supabase = getSupabaseAdmin();

      for (const event of summary) {
        const isNewEvent = await claimWebhookEvent(supabase, event);
        if (!isNewEvent) {
          continue;
        }

        if (event.kind === "whatsapp") {
          await persistWhatsAppWebhookEvent(supabase, event);
          continue;
        }

        await persistLeadgenWebhookEvent(supabase, event);
      }
    } catch (error) {
      console.error("Failed to persist Meta webhook event", error);
    }
  })();

  res.status(200).json({ received: true });
});

app.post("/meta/exchange-code", async (req, res, next) => {
  try {
    const payload = metaExchangeSchema.parse(req.body);
    const data = await exchangeMetaCode(payload);

    try {
      const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
      if (workspaceContext) {
        const supabase = getSupabaseAdmin();
        await supabase.from("meta_authorizations").upsert({
          workspace_id: workspaceContext.workspaceId,
          access_token: data.authorization.accessToken,
          token_type: data.authorization.tokenType,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (persistenceError) {
      console.error("Failed to persist Meta authorization", persistenceError);
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.get("/meta/source-mappings", async (req, res, next) => {
  try {
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to load Meta source mappings.");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("meta_lead_source_mappings")
      .select("id, label, page_id, ad_id, form_id, created_at")
      .eq("workspace_id", workspaceContext.workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/meta/source-mappings", async (req, res, next) => {
  try {
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to save Meta source mappings.");
    }

    const payload = metaLeadSourceMappingSchema.parse(req.body);
    if (!payload.pageId && !payload.adId && !payload.formId) {
      throw new Error("Provide at least one Meta identifier: page ID, ad ID, or form ID.");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("meta_lead_source_mappings")
      .insert({
        workspace_id: workspaceContext.workspaceId,
        label: payload.label,
        page_id: payload.pageId || null,
        ad_id: payload.adId || null,
        form_id: payload.formId || null,
      })
      .select("id, label, page_id, ad_id, form_id, created_at")
      .single();

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/meta/send-template", async (req, res, next) => {
  let workspaceId: string | null = null;
  let payload: z.infer<typeof metaSendTemplateSchema> | null = null;
  try {
    payload = metaSendTemplateSchema.parse(req.body);
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to send WhatsApp templates.");
    }
    workspaceId = workspaceContext.workspaceId;

    const supabase = getSupabaseAdmin();
    const [authorization, { data: connection }] = await Promise.all([
      getActiveMetaAuthorization(supabase, workspaceContext.workspaceId),
      supabase.from("whatsapp_connections").select("phone_number_id").eq("workspace_id", workspaceContext.workspaceId).maybeSingle(),
    ]);

    if (!connection?.phone_number_id) {
      throw new Error("No connected Meta phone number was found for this workspace.");
    }

    const data = await sendMetaTemplateMessage({
      accessToken: authorization.access_token,
      phoneNumberId: connection.phone_number_id,
      to: payload.to,
      templateName: payload.templateName,
      languageCode: payload.languageCode,
      bodyParameters: payload.bodyParameters,
    });

    await logOperationalEvent(supabase, {
      workspaceId: workspaceContext.workspaceId,
      eventType: "template_sent",
      level: "info",
      summary: `Template ${payload.templateName} sent to ${payload.to}.`,
      payload: {
        destination: payload.to,
        templateName: payload.templateName,
      },
    });

    res.json({ data });
  } catch (error) {
    if (workspaceId && payload) {
      try {
        await logFailedSend(getSupabaseAdmin(), {
          workspaceId,
          channel: "template",
          targetType: "workspace",
          destination: payload.to,
          templateName: payload.templateName,
          errorMessage: getErrorMessage(error),
          payload: {
            languageCode: payload.languageCode,
            bodyParameters: payload.bodyParameters ?? [],
          },
        });
      } catch (loggingError) {
        console.error("Failed to log template send failure", loggingError);
      }
    }
    next(error);
  }
});

app.post("/meta/send-campaign", async (req, res, next) => {
  try {
    const payload = metaSendCampaignSchema.parse(req.body);
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to send WhatsApp campaigns.");
    }

    const supabase = getSupabaseAdmin();
    const [authorization, { data: connection }, { data: template }, { data: contacts }] = await Promise.all([
      getActiveMetaAuthorization(supabase, workspaceContext.workspaceId),
      supabase.from("whatsapp_connections").select("phone_number_id").eq("workspace_id", workspaceContext.workspaceId).maybeSingle(),
      supabase.from("message_templates").select("id, name, language, body").eq("workspace_id", workspaceContext.workspaceId).eq("id", payload.templateId).maybeSingle(),
      supabase.from("contacts").select("id, name, phone").eq("workspace_id", workspaceContext.workspaceId).in("id", payload.contactIds),
    ]);

    if (!connection?.phone_number_id) {
      throw new Error("No connected Meta phone number was found for this workspace.");
    }

    if (!template) {
      throw new Error("Template not found for this workspace.");
    }

    if (!contacts || contacts.length !== payload.contactIds.length) {
      throw new Error("One or more contacts could not be found for this workspace.");
    }

    const results = [];
    const failures: Array<{ contactId: string; phone: string; errorMessage: string }> = [];
    for (const contact of contacts) {
      const bodyParameters = buildCampaignBodyParameters({
        templateBody: template.body,
        contactName: contact.name,
        contactPhone: contact.phone,
        bodyParameters: payload.bodyParameters,
      });

      try {
        const data = await sendMetaTemplateMessage({
          accessToken: authorization.access_token,
          phoneNumberId: connection.phone_number_id,
          to: contact.phone,
          templateName: template.name,
          languageCode: mapTemplateLanguageToMetaCode(template.language),
          bodyParameters,
        });

        results.push({
          contactId: contact.id,
          phone: contact.phone,
          data,
        });
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        failures.push({
          contactId: contact.id,
          phone: contact.phone,
          errorMessage,
        });
        await logFailedSend(supabase, {
          workspaceId: workspaceContext.workspaceId,
          channel: "campaign",
          targetType: "contact",
          targetId: contact.id,
          destination: contact.phone,
          templateName: template.name,
          messageBody: template.body,
          errorMessage,
          payload: {
            templateId: template.id,
            campaignContactId: contact.id,
            languageCode: mapTemplateLanguageToMetaCode(template.language),
            bodyParameters,
          },
        });
      }
    }

    await logOperationalEvent(supabase, {
      workspaceId: workspaceContext.workspaceId,
      eventType: "campaign_send_completed",
      level: failures.length > 0 ? "warning" : "info",
      summary: `Campaign send completed with ${results.length} success(es) and ${failures.length} failure(s).`,
      payload: {
        templateId: payload.templateId,
        sentCount: results.length,
        failedCount: failures.length,
      },
    });

    if (results.length === 0 && failures.length > 0) {
      res.status(502).json({
        message: `Campaign send failed for all selected contacts. ${failures[0]?.errorMessage ?? ""}`.trim(),
        data: {
          sentCount: 0,
          failedCount: failures.length,
          failures,
        },
      });
      return;
    }

    res.json({
      data: {
        sentCount: results.length,
        failedCount: failures.length,
        results,
        failures,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/meta/send-reply", async (req, res, next) => {
  let workspaceId: string | null = null;
  let payload: z.infer<typeof metaReplySchema> | null = null;
  try {
    payload = metaReplySchema.parse(req.body);
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to send WhatsApp replies.");
    }
    workspaceId = workspaceContext.workspaceId;

    const supabase = getSupabaseAdmin();
    const [authorization, { data: connection }, { data: conversation }] = await Promise.all([
      getActiveMetaAuthorization(supabase, workspaceContext.workspaceId),
      supabase.from("whatsapp_connections").select("phone_number_id").eq("workspace_id", workspaceContext.workspaceId).maybeSingle(),
      supabase
        .from("conversations")
        .select("id, workspace_id")
        .eq("workspace_id", workspaceContext.workspaceId)
        .eq("id", payload.conversationId)
        .maybeSingle(),
    ]);

    if (!connection?.phone_number_id) {
      throw new Error("No connected Meta phone number was found for this workspace.");
    }

    if (!conversation) {
      throw new Error("Conversation not found for this workspace.");
    }

    const data = await sendMetaTextMessage({
      accessToken: authorization.access_token,
      phoneNumberId: connection.phone_number_id,
      to: payload.to,
      body: payload.body,
    });

    const messageId = Array.isArray((data as { messages?: Array<{ id?: string }> }).messages)
      ? (data as { messages?: Array<{ id?: string }> }).messages?.[0]?.id ?? null
      : null;
    const sentAt = new Date().toISOString();

    await Promise.all([
      supabase
        .from("conversations")
        .update({
          last_message_preview: payload.body,
          last_message_at: sentAt,
          status: "open",
        })
        .eq("workspace_id", workspaceContext.workspaceId)
        .eq("id", payload.conversationId),
      supabase.from("conversation_messages").insert({
        workspace_id: workspaceContext.workspaceId,
        conversation_id: payload.conversationId,
        meta_message_id: messageId,
        direction: "outbound",
        message_type: "text",
        body: payload.body,
        status: "sent",
        payload: data,
        sent_at: sentAt,
      }),
    ]);

    await logOperationalEvent(supabase, {
      workspaceId: workspaceContext.workspaceId,
      eventType: "reply_sent",
      level: "info",
      summary: `Inbox reply sent to ${payload.to}.`,
      payload: {
        conversationId: payload.conversationId,
        destination: payload.to,
      },
    });

    res.json({
      data: {
        messageId,
        sentAt,
        providerResponse: data,
      },
    });
  } catch (error) {
    if (workspaceId && payload) {
      try {
        await logFailedSend(getSupabaseAdmin(), {
          workspaceId,
          channel: "reply",
          targetType: "conversation",
          targetId: payload.conversationId,
          destination: payload.to,
          messageBody: payload.body,
          errorMessage: getErrorMessage(error),
          payload: {
            conversationId: payload.conversationId,
          },
        });
      } catch (loggingError) {
        console.error("Failed to log reply send failure", loggingError);
      }
    }
    next(error);
  }
});

app.post("/automation/process-reminders", async (req, res, next) => {
  try {
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to process automation reminders.");
    }

    const supabase = getSupabaseAdmin();
    const reminderRule = await getEnabledAutomationRule(supabase, workspaceContext.workspaceId, "no_reply_reminder");
    if (!reminderRule) {
      res.json({ result: { ok: true, message: "No reminder automation is enabled for this workspace." } });
      return;
    }

    const reminderHours = reminderRule.config && typeof reminderRule.config === "object" && "reminderHours" in reminderRule.config
      ? Number(reminderRule.config.reminderHours)
      : 4;
    const configuredOwner = reminderRule.config && typeof reminderRule.config === "object" && "ownerName" in reminderRule.config && typeof reminderRule.config.ownerName === "string"
      ? reminderRule.config.ownerName.trim()
      : "";

    const [{ data: conversations }, { data: messages }, { data: priorEvents }] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, display_name, status, assigned_to")
        .eq("workspace_id", workspaceContext.workspaceId)
        .in("status", ["open", "pending"]),
      supabase
        .from("conversation_messages")
        .select("conversation_id, direction, sent_at")
        .eq("workspace_id", workspaceContext.workspaceId),
      supabase
        .from("automation_events")
        .select("conversation_id, created_at")
        .eq("workspace_id", workspaceContext.workspaceId)
        .eq("rule_type", "no_reply_reminder"),
    ]);

    const now = Date.now();
    let triggeredCount = 0;

    for (const conversation of conversations ?? []) {
      const threadMessages = (messages ?? []).filter((message) => message.conversation_id === conversation.id);
      const latestInbound = threadMessages
        .filter((message) => message.direction === "inbound")
        .sort((left, right) => new Date(right.sent_at).getTime() - new Date(left.sent_at).getTime())[0];
      const latestOutbound = threadMessages
        .filter((message) => message.direction === "outbound")
        .sort((left, right) => new Date(right.sent_at).getTime() - new Date(left.sent_at).getTime())[0];

      if (!latestInbound) {
        continue;
      }

      const latestInboundAt = new Date(latestInbound.sent_at).getTime();
      const latestOutboundAt = latestOutbound ? new Date(latestOutbound.sent_at).getTime() : 0;
      const mostRecentReminder = (priorEvents ?? [])
        .filter((event) => event.conversation_id === conversation.id)
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
      const mostRecentReminderAt = mostRecentReminder ? new Date(mostRecentReminder.created_at).getTime() : 0;

      if (latestOutboundAt >= latestInboundAt) {
        continue;
      }

      if (mostRecentReminderAt >= latestInboundAt) {
        continue;
      }

      const hoursSinceInbound = (now - latestInboundAt) / (1000 * 60 * 60);
      if (hoursSinceInbound < reminderHours) {
        continue;
      }

      await supabase
        .from("conversations")
        .update({
          status: "pending",
          assigned_to: configuredOwner || conversation.assigned_to,
        })
        .eq("workspace_id", workspaceContext.workspaceId)
        .eq("id", conversation.id);

      await logAutomationEvent(supabase, {
        workspaceId: workspaceContext.workspaceId,
        ruleType: "no_reply_reminder",
        conversationId: conversation.id,
        status: "triggered",
        summary: `No-reply reminder flagged ${conversation.display_name} for follow-up after ${reminderHours} hours.`,
      });
      triggeredCount += 1;
    }

    res.json({
      result: {
        ok: true,
        message: triggeredCount > 0
          ? `${triggeredCount} conversation reminder${triggeredCount === 1 ? "" : "s"} flagged for follow-up.`
          : "No overdue conversations needed reminders right now.",
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /automation/definitions

app.get("/automation/definitions", async (req, res) => {
  try {
    const context = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!context) return res.status(401).json({ error: "Unauthorized" });
    const { workspaceId } = context;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("automation_flow_definitions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/automation/definitions", async (req, res) => {
  try {
    const context = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!context) return res.status(401).json({ error: "Unauthorized" });
    const { workspaceId } = context;
    const supabase = getSupabaseAdmin();
    const { id, name, description, nodes, edges, is_active } = req.body;

    const payload: any = {
      workspace_id: workspaceId,
      name,
      description,
      nodes,
      edges,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      payload.id = id;
    }

    const { data, error } = await supabase
      .from("automation_flow_definitions")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/automation/process-flows", async (req, res, next) => {
  try {
    const cronSecret = req.headers["x-cron-secret"];
    const isCronAuthorized = cronSecret && cronSecret === process.env.CRON_SECRET;

    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    
    if (!workspaceContext && !isCronAuthorized) {
      throw new Error("Authorization or CRON_SECRET is required to process automation flows.");
    }

    const supabase = getSupabaseAdmin();
    
    // If it's a cron trigger without a specific workspace context, we process ALL active flows across all workspaces
    const query = supabase
      .from("automation_flow_runs")
      .select("*")
      .eq("status", "active")
      .lte("scheduled_at", new Date().toISOString());

    if (workspaceContext) {
      query.eq("workspace_id", workspaceContext.workspaceId);
    }

    const { data: dueFlows } = await query;

    if (!dueFlows || dueFlows.length === 0) {
      res.json({ result: { ok: true, message: "No due automation flows to process." } });
      return;
    }

    for (const flowRun of dueFlows) {
      await processFlowRun(supabase, flowRun);
    }

    res.json({ result: { ok: true, message: `Processed ${dueFlows.length} automation flow(s).` } });
  } catch (error) {
    next(error);
  }
});

app.post("/automation/lead-contacted", async (req, res, next) => {
  try {
    const payload = automationLeadContactedSchema.parse(req.body);
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to process contacted-lead automation.");
    }

    const supabase = getSupabaseAdmin();
    const followUpRule = await getEnabledAutomationRule(supabase, workspaceContext.workspaceId, "follow_up_after_contacted");
    if (!followUpRule) {
      res.json({ result: { ok: true, message: "No contacted-lead follow-up automation is enabled." } });
      return;
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("id, full_name, phone, conversation_id, source")
      .eq("workspace_id", workspaceContext.workspaceId)
      .eq("id", payload.leadId)
      .maybeSingle();

    if (!lead?.phone) {
      throw new Error("Lead not found or missing phone number.");
    }

    const followUpTemplate = followUpRule.config && typeof followUpRule.config === "object" && "message" in followUpRule.config && typeof followUpRule.config.message === "string"
      ? followUpRule.config.message.trim()
      : "";

    if (!followUpTemplate) {
      res.json({ result: { ok: true, message: "Follow-up automation is enabled but no message template is configured." } });
      return;
    }

    let conversationId = lead.conversation_id;
    if (!conversationId) {
      const { data: conversation } = await supabase
        .from("conversations")
        .insert({
          workspace_id: workspaceContext.workspaceId,
          contact_id: null,
          phone: lead.phone,
          display_name: lead.full_name,
          status: "open",
          source: lead.source,
          last_message_preview: "",
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
        .select("id")
        .single();
      conversationId = conversation?.id ?? null;
    }

    const body = resolveAutomationMessage(followUpTemplate, {
      contactName: lead.full_name,
      contactPhone: lead.phone,
    });

    try {
      const response = await sendWorkspaceAutomationMessage(supabase, {
        workspaceId: workspaceContext.workspaceId,
        to: lead.phone,
        body,
      });
      const sentAt = new Date().toISOString();
      const messageId = Array.isArray((response as { messages?: Array<{ id?: string }> }).messages)
        ? (response as { messages?: Array<{ id?: string }> }).messages?.[0]?.id ?? null
        : null;

      if (conversationId) {
        await Promise.all([
          supabase.from("conversation_messages").insert({
            workspace_id: workspaceContext.workspaceId,
            conversation_id: conversationId,
            meta_message_id: messageId,
            direction: "outbound",
            message_type: "text",
            body,
            status: "sent",
            payload: response,
            sent_at: sentAt,
          }),
          supabase
            .from("conversations")
            .update({
              last_message_preview: body,
              last_message_at: sentAt,
              status: "open",
            })
            .eq("workspace_id", workspaceContext.workspaceId)
            .eq("id", conversationId),
          supabase
            .from("leads")
            .update({ conversation_id: conversationId })
            .eq("workspace_id", workspaceContext.workspaceId)
            .eq("id", lead.id),
        ]);
      }

      await logAutomationEvent(supabase, {
        workspaceId: workspaceContext.workspaceId,
        ruleType: "follow_up_after_contacted",
        conversationId,
        leadId: lead.id,
        status: "triggered",
        summary: `Contacted follow-up sent to ${lead.full_name}.`,
      });
      await logOperationalEvent(supabase, {
        workspaceId: workspaceContext.workspaceId,
        eventType: "automation_follow_up_sent",
        level: "info",
        summary: `Follow-up automation sent to ${lead.full_name}.`,
        payload: {
          leadId: lead.id,
          conversationId,
          phone: lead.phone,
        },
      });
    } catch (error) {
      await logFailedSend(supabase, {
        workspaceId: workspaceContext.workspaceId,
        channel: "automation",
        targetType: "lead",
        targetId: lead.id,
        destination: lead.phone,
        messageBody: body,
        errorMessage: getErrorMessage(error),
        payload: {
          automationRule: "follow_up_after_contacted",
          conversationId,
        },
      });
      await logAutomationEvent(supabase, {
        workspaceId: workspaceContext.workspaceId,
        ruleType: "follow_up_after_contacted",
        conversationId,
        leadId: lead.id,
        status: "failed",
        summary: `Contacted follow-up failed for ${lead.full_name}.`,
        payload: {
          message: error instanceof Error ? error.message : "Unknown automation error",
        },
      });
      throw error;
    }

    res.json({ result: { ok: true, message: "Contacted-lead follow-up automation processed." } });
  } catch (error) {
    next(error);
  }
});

app.post("/ops/retry-failed-send", async (req, res, next) => {
  try {
    const payload = retryFailedSendSchema.parse(req.body);
    const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
    if (!workspaceContext) {
      throw new Error("Supabase authorization is required to retry failed sends.");
    }

    const supabase = getSupabaseAdmin();
    const { data: failedLog } = await supabase
      .from("failed_send_logs")
      .select("id, workspace_id, channel, target_type, target_id, destination, template_name, message_body, payload, retry_count")
      .eq("workspace_id", workspaceContext.workspaceId)
      .eq("id", payload.failedSendLogId)
      .maybeSingle();

    if (!failedLog) {
      throw new Error("Failed send log not found for this workspace.");
    }

    const [authorization, { data: connection }] = await Promise.all([
      getActiveMetaAuthorization(supabase, workspaceContext.workspaceId),
      supabase.from("whatsapp_connections").select("phone_number_id").eq("workspace_id", workspaceContext.workspaceId).maybeSingle(),
    ]);

    if (!connection?.phone_number_id) {
      throw new Error("No connected Meta phone number was found for this workspace.");
    }

    const payloadData = failedLog.payload && typeof failedLog.payload === "object"
      ? failedLog.payload as Record<string, unknown>
      : {};

    if (failedLog.channel === "campaign" || failedLog.channel === "template") {
      await sendMetaTemplateMessage({
        accessToken: authorization.access_token,
        phoneNumberId: connection.phone_number_id,
        to: failedLog.destination,
        templateName: failedLog.template_name ?? String(payloadData.templateName ?? ""),
        languageCode: String(payloadData.languageCode ?? "en"),
        bodyParameters: Array.isArray(payloadData.bodyParameters)
          ? payloadData.bodyParameters.filter((value): value is string => typeof value === "string")
          : [],
      });
    } else {
      const replyBody = failedLog.message_body ?? String(payloadData.body ?? "");
      if (!replyBody.trim()) {
        throw new Error("No retry payload body was stored for this failed send.");
      }

      const providerResponse = await sendMetaTextMessage({
        accessToken: authorization.access_token,
        phoneNumberId: connection.phone_number_id,
        to: failedLog.destination,
        body: replyBody,
      });

      const conversationId = typeof payloadData.conversationId === "string" ? payloadData.conversationId : null;
      const leadId = typeof payloadData.leadId === "string" ? payloadData.leadId : null;
      const sentAt = new Date().toISOString();
      const messageId = Array.isArray((providerResponse as { messages?: Array<{ id?: string }> }).messages)
        ? (providerResponse as { messages?: Array<{ id?: string }> }).messages?.[0]?.id ?? null
        : null;

      if (conversationId) {
        await Promise.all([
          supabase.from("conversation_messages").insert({
            workspace_id: workspaceContext.workspaceId,
            conversation_id: conversationId,
            meta_message_id: messageId,
            direction: "outbound",
            message_type: "text",
            body: replyBody,
            status: "sent",
            payload: providerResponse,
            sent_at: sentAt,
          }),
          supabase
            .from("conversations")
            .update({
              last_message_preview: replyBody,
              last_message_at: sentAt,
              status: "open",
            })
            .eq("workspace_id", workspaceContext.workspaceId)
            .eq("id", conversationId),
        ]);
      }

      if (leadId) {
        await supabase
          .from("leads")
          .update({ updated_at: sentAt })
          .eq("workspace_id", workspaceContext.workspaceId)
          .eq("id", leadId);
      }
    }

    await Promise.all([
      supabase
        .from("failed_send_logs")
        .update({
          status: "resolved",
          retry_count: (failedLog.retry_count ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceContext.workspaceId)
        .eq("id", failedLog.id),
      logOperationalEvent(supabase, {
        workspaceId: workspaceContext.workspaceId,
        eventType: "failed_send_retried",
        level: "info",
        summary: `Failed ${failedLog.channel} send retried successfully for ${failedLog.destination}.`,
        payload: {
          failedSendLogId: failedLog.id,
          channel: failedLog.channel,
        },
      }),
    ]);

    res.json({
      result: {
        ok: true,
        message: "Failed send retried successfully.",
      },
    });
  } catch (error) {
    try {
      const payload = retryFailedSendSchema.safeParse(req.body);
      const workspaceContext = await getWorkspaceContextFromRequestAuthHeader(req.headers.authorization);
      if (payload.success && workspaceContext) {
        const supabase = getSupabaseAdmin();
        const { data: failedLog } = await supabase
          .from("failed_send_logs")
          .select("id, retry_count")
          .eq("workspace_id", workspaceContext.workspaceId)
          .eq("id", payload.data.failedSendLogId)
          .maybeSingle();

        if (failedLog) {
          await Promise.all([
            supabase
              .from("failed_send_logs")
              .update({
                retry_count: (failedLog.retry_count ?? 0) + 1,
                last_attempt_at: new Date().toISOString(),
              })
              .eq("workspace_id", workspaceContext.workspaceId)
              .eq("id", failedLog.id),
            logOperationalEvent(supabase, {
              workspaceId: workspaceContext.workspaceId,
              eventType: "failed_send_retry_failed",
              level: "error",
              summary: `Retry failed for failed send ${failedLog.id}.`,
              payload: {
                failedSendLogId: failedLog.id,
                errorMessage: getErrorMessage(error),
              },
            }),
          ]);
        }
      }
    } catch (loggingError) {
      console.error("Failed to log retry failure", loggingError);
    }

    next(error);
  }
});

app.get("/app-state", async (_req, res, next) => {
  try {
    await ensureSession(prisma);
    const user = await getCurrentUser(prisma);
    const data = await buildAppState(prisma, user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/session", async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    const user = await findOrCreateUserByEmail(prisma, email);
    const data = await buildAppState(prisma, user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/signup", async (req, res, next) => {
  try {
    const { name, email } = signUpSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    const user = existing ?? await createWorkspaceForUser(prisma, { name, email });
    await setCurrentUser(prisma, user.id);
    const data = await buildAppState(prisma, user);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/signout", async (_req, res, next) => {
  try {
    await setCurrentUser(prisma, null);
    const data = await buildAppState(prisma, null);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/onboarding/complete", async (_req, res, next) => {
  try {
    const user = await requireUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingComplete: true },
    });
    const freshUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const data = await buildAppState(prisma, freshUser);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/whatsapp/connect", async (req, res, next) => {
  try {
    const user = await requireUser();
    const payload = connectWhatsAppSchema.parse(req.body);
    const existing = await prisma.whatsAppConnection.findFirst({
      where: { workspaceId: user.workspaceId },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.whatsAppConnection.update({
        where: { id: existing.id },
        data: {
          businessPortfolio: payload.businessPortfolio,
          businessName: payload.businessName,
          phoneNumber: payload.phoneNumber,
          status: ConnectionStatus.connected,
        },
      });
    } else {
      await prisma.whatsAppConnection.create({
        data: {
          workspaceId: user.workspaceId,
          businessPortfolio: payload.businessPortfolio,
          businessName: payload.businessName,
          phoneNumber: payload.phoneNumber,
          status: ConnectionStatus.connected,
        },
      });
    }

    const freshUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const data = await buildAppState(prisma, freshUser);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/whatsapp/disconnect", async (_req, res, next) => {
  try {
    const user = await requireUser();
    await prisma.whatsAppConnection.updateMany({
      where: { workspaceId: user.workspaceId },
      data: { status: ConnectionStatus.disconnected },
    });
    const freshUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const data = await buildAppState(prisma, freshUser);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/wallet/top-up", async (req, res, next) => {
  try {
    const user = await requireUser();
    const { amount, source } = walletSchema.parse(req.body);
    const currentState = await buildAppState(prisma, user);
    const nextBalance = currentState.walletBalance + amount;

    await prisma.walletTransaction.create({
      data: {
        workspaceId: user.workspaceId,
        type: "credit",
        amount,
        description: source || "Wallet Recharge",
        referenceType: "manual_topup",
        balanceAfter: nextBalance,
      },
    });

    const freshUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const data = await buildAppState(prisma, freshUser);
    res.json(actionResponse(data, { ok: true, message: "Balance added successfully." }));
  } catch (error) {
    next(error);
  }
});

app.post("/contacts", async (req, res, next) => {
  try {
    const user = await requireUser();
    const payload = contactSchema.parse(req.body);
    const contact = await prisma.contact.create({
      data: {
        workspaceId: user.workspaceId,
        name: payload.name,
        phone: payload.phone,
        tags: {
          create: payload.tags.map((tag) => ({
            workspaceId: user.workspaceId,
            tag,
          })),
        },
      },
    });

    await prisma.contact.findUniqueOrThrow({ where: { id: contact.id } });
    const freshUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const data = await buildAppState(prisma, freshUser);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/contacts/upload-sample", async (_req, res, next) => {
  try {
    const user = await requireUser();
    await seedWorkspace(prisma, user.workspaceId);
    const sampleContacts = [
      { name: "Kunal Mehta", phone: "+91 99887 77665", tags: ["CSV", "Shopify"] },
      { name: "Neha Kapoor", phone: "+91 90909 80808", tags: ["CSV", "VIP"] },
      { name: "Ritesh Jain", phone: "+91 93456 78123", tags: ["CSV", "Retail"] },
    ];

    for (const sample of sampleContacts) {
      const exists = await prisma.contact.findFirst({
        where: { workspaceId: user.workspaceId, phone: sample.phone },
      });
      if (exists) {
        continue;
      }
      await prisma.contact.create({
        data: {
          workspaceId: user.workspaceId,
          name: sample.name,
          phone: sample.phone,
          tags: {
            create: sample.tags.map((tag) => ({
              workspaceId: user.workspaceId,
              tag,
            })),
          },
        },
      });
    }

    const freshUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const data = await buildAppState(prisma, freshUser);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

app.post("/campaigns", async (req, res, next) => {
  try {
    const user = await requireUser();
    const payload = campaignSchema.parse(req.body);
    const currentState = await buildAppState(prisma, user);
    const estimatedCost = Number((payload.contactIds.length * COST_PER_MESSAGE).toFixed(2));

    if (payload.sendNow && currentState.walletBalance < estimatedCost) {
      res.status(400).json(actionResponse(currentState, {
        ok: false,
        message: "Insufficient wallet balance for this campaign.",
      }));
      return;
    }

    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId: user.workspaceId,
        id: { in: payload.contactIds },
      },
    });

    if (contacts.length !== payload.contactIds.length) {
      res.status(400).json(actionResponse(currentState, {
        ok: false,
        message: "One or more contacts were not found.",
      }));
      return;
    }

    const template = await prisma.messageTemplate.findFirst({
      where: {
        workspaceId: user.workspaceId,
        id: payload.templateId,
      },
    });

    if (!template) {
      res.status(400).json(actionResponse(currentState, {
        ok: false,
        message: "Template not found.",
      }));
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: user.workspaceId,
        templateId: template.id,
        name: payload.name,
        status: payload.sendNow ? CampaignStatus.sending : CampaignStatus.draft,
        estimatedCost,
        spent: payload.sendNow ? estimatedCost : 0,
        launchedAt: payload.sendNow ? new Date() : null,
        recipients: {
          create: contacts.map((contact) => ({
            workspaceId: user.workspaceId,
            contactId: contact.id,
            status: payload.sendNow ? "sent" : "queued",
            cost: COST_PER_MESSAGE,
          })),
        },
      },
    });

    if (payload.sendNow) {
      await prisma.walletTransaction.create({
        data: {
          workspaceId: user.workspaceId,
          type: "debit",
          amount: -estimatedCost,
          description: `${payload.name} (${payload.contactIds.length} msgs)`,
          referenceType: "campaign_send",
          referenceId: campaign.id,
          balanceAfter: currentState.walletBalance - estimatedCost,
        },
      });
    }

    const freshUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const data = await buildAppState(prisma, freshUser);
    res.json(actionResponse(data, {
      ok: true,
      message: payload.sendNow ? "Campaign launched successfully." : "Draft saved successfully.",
    }));
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);

  if (error instanceof z.ZodError) {
    res.status(400).json({ message: "Invalid request payload.", issues: error.flatten() });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "Unexpected server error." });
});

// Fallback for SPA to serve index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

ensureSession(prisma)
  .then(() => {
    app.listen(port, () => {
      console.log(`WaBiz API listening on http://localhost:${port}`);
    });
  })
  .catch(async (error) => {
    console.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  });

export default app;
