import { supabase } from "@/lib/supabase/client";
import { defaultSupabaseSampleContacts, defaultSupabaseTemplates } from "@/lib/supabase/defaults";
import { triggerAutomationLeadContacted, triggerAutomationReminderSweep } from "@/lib/automation/server";
import { retryFailedSendWithServer } from "@/lib/ops/server";
import {
  COST_PER_MESSAGE,
  emptyAppState,
  type ActionResult,
  type AddConversationNoteInput,
  type AddContactInput,
  type AppState,
  type ConnectWhatsAppInput,
  type CreateCampaignInput,
  type RetryFailedSendInput,
  type UpdateAutomationInput,
  type UpdateConversationInput,
  type UpdateLeadInput,
} from "@/lib/api/types";
import type { AppApi } from "@/lib/api/mockApi";

function getAuthorizationStatus(expiresAt: string | null | undefined) {
  if (!expiresAt) {
    return "missing" as const;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return "missing" as const;
  }

  const remainingMs = expiresAtMs - Date.now();
  if (remainingMs <= 0) {
    return "expired" as const;
  }

  if (remainingMs <= 7 * 24 * 60 * 60 * 1000) {
    return "expiring_soon" as const;
  }

  return "active" as const;
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";
  const details = "details" in error && typeof error.details === "string" ? error.details.toLowerCase() : "";
  const code = "code" in error && typeof error.code === "string" ? error.code : "";

  return (
    code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("relation") ||
    details.includes("could not find the table")
  );
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  return supabase;
}

const defaultAutomationRules = [
  {
    rule_type: "auto_reply_first_inbound",
    name: "First inbound auto-reply",
    enabled: true,
    config: {
      message: "Hi {{contact.name}}, thanks for reaching out. Our team has received your message and will reply shortly.",
    },
  },
  {
    rule_type: "auto_assign_new_lead",
    name: "Auto-assign new leads",
    enabled: true,
    config: {
      ownerName: "Growth Desk",
    },
  },
  {
    rule_type: "no_reply_reminder",
    name: "No-reply follow-up reminder",
    enabled: true,
    config: {
      ownerName: "Sales Team",
      reminderHours: 4,
    },
  },
  {
    rule_type: "follow_up_after_contacted",
    name: "Post-contacted follow-up",
    enabled: false,
    config: {
      message: "Hi {{contact.name}}, thanks for speaking with us. I am sharing the next step here so we can keep the conversation moving.",
    },
  },
] as const;

async function getCurrentContext() {
  const client = requireSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    return { user: null, workspaceId: null };
  }

  const { data: member, error: memberError } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) {
    throw memberError;
  }

  return {
    user,
    workspaceId: member?.workspace_id ?? null,
  };
}

async function ensureWorkspaceDefaults(workspaceId: string) {
  const client = requireSupabase();
  const { count, error } = await client
    .from("message_templates")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error: insertError } = await client.from("message_templates").insert(
    defaultSupabaseTemplates.map((template) => ({
      workspace_id: workspaceId,
      ...template,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function ensureAutomationDefaults(workspaceId: string) {
  const client = requireSupabase();
  const { count, error } = await client
    .from("automation_rules")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) {
    if (isMissingTableError(error)) {
      return;
    }
    throw error;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error: insertError } = await client.from("automation_rules").insert(
    defaultAutomationRules.map((rule) => ({
      workspace_id: workspaceId,
      ...rule,
    })),
  );

  if (insertError) {
    if (isMissingTableError(insertError)) {
      return;
    }
    throw insertError;
  }
}

async function getOptionalWorkspaceQuery<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>) {
  try {
    const response = await query;
    if (response.error && !isMissingTableError(response.error)) {
      throw response.error;
    }

    return response.data ?? [];
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }

    throw error;
  }
}

async function buildSupabaseAppState(): Promise<AppState> {
  const client = requireSupabase();
  const context = await getCurrentContext();

  if (!context.user || !context.workspaceId) {
    return emptyAppState();
  }

  await ensureWorkspaceDefaults(context.workspaceId);
  await ensureAutomationDefaults(context.workspaceId);

  const [profileRes, contactsRes, templatesRes, campaignsRes, transactionsRes, connectionRes, authorizationRes, conversationsData, messagesData, notesData, conversationEventsData, failedSendLogsData, operationalLogsData, leadsData, automationRulesData, automationEventsData] = await Promise.all([
    client.from("profiles").select("full_name, email, onboarding_complete").eq("id", context.user.id).single(),
    client.from("contacts").select("id, name, phone, contact_tags(tag)").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    client.from("message_templates").select("id, name, category, status, language, body").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    client.from("campaigns").select("id, name, template_id, status, estimated_cost, spent, launched_at, scheduled_for, created_at, campaign_recipients(contact_id)").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    client.from("wallet_transactions").select("id, type, amount, description, balance_after, created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    client.from("whatsapp_connections").select("meta_business_id, meta_business_portfolio_id, waba_id, phone_number_id, display_phone_number, verified_name, business_portfolio, business_name, status, business_verification_status, account_review_status, oba_status").eq("workspace_id", context.workspaceId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("meta_authorizations").select("expires_at").eq("workspace_id", context.workspaceId).maybeSingle(),
    getOptionalWorkspaceQuery(
      client.from("conversations").select("id, contact_id, phone, display_name, status, source, assigned_to, last_message_preview, last_message_at, unread_count").eq("workspace_id", context.workspaceId).order("last_message_at", { ascending: false }),
    ),
    getOptionalWorkspaceQuery(
      client.from("conversation_messages").select("id, conversation_id, direction, message_type, body, status, sent_at").eq("workspace_id", context.workspaceId).order("sent_at", { ascending: false }),
    ),
    getOptionalWorkspaceQuery(
      client.from("conversation_notes").select("id, conversation_id, body, author_name, created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    ),
    getOptionalWorkspaceQuery(
      client.from("conversation_events").select("id, conversation_id, event_type, summary, actor_name, created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    ),
    getOptionalWorkspaceQuery(
      client.from("failed_send_logs").select("id, channel, target_type, target_id, destination, template_name, message_body, error_message, status, created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }).limit(20),
    ),
    getOptionalWorkspaceQuery(
      client.from("operational_logs").select("id, event_type, level, summary, created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }).limit(20),
    ),
    getOptionalWorkspaceQuery(
      client.from("leads").select("id, contact_id, conversation_id, full_name, phone, email, status, source, source_label, assigned_to, notes, created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }),
    ),
    getOptionalWorkspaceQuery(
      client.from("automation_rules").select("id, rule_type, name, enabled, config, updated_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: true }),
    ),
    getOptionalWorkspaceQuery(
      client.from("automation_events").select("id, rule_type, conversation_id, lead_id, status, summary, created_at").eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }).limit(12),
    ),
  ]);

  for (const response of [profileRes, contactsRes, templatesRes, campaignsRes, transactionsRes, connectionRes, authorizationRes]) {
    if (response.error) {
      throw response.error;
    }
  }

  const walletBalance = transactionsRes.data?.[0]?.balance_after ?? 0;
  const totalSpent = Math.abs(
    (transactionsRes.data ?? [])
      .filter((transaction) => transaction.type === "debit")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
  );

  return {
    user: profileRes.data
      ? {
          name: profileRes.data.full_name,
          email: profileRes.data.email,
        }
      : null,
    onboardingComplete: profileRes.data?.onboarding_complete ?? false,
    walletBalance,
    totalSpent,
    messagesSent: (campaignsRes.data ?? []).reduce((sum, campaign) => {
      if (campaign.status === "draft") {
        return sum;
      }
      return sum + (campaign.campaign_recipients?.length ?? 0);
    }, 0),
    contacts: (contactsRes.data ?? []).map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      tags: (contact.contact_tags ?? []).map((tag) => tag.tag),
    })),
    templates: (templatesRes.data ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category === "marketing" ? "Marketing" : "Utility",
      status: template.status === "approved" ? "Approved" : template.status === "pending" ? "Pending" : "Rejected",
      language: template.language,
      preview: template.body,
    })),
    campaigns: (campaignsRes.data ?? []).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      templateId: campaign.template_id,
      contactIds: (campaign.campaign_recipients ?? []).map((recipient) => recipient.contact_id),
      status: campaign.status === "draft" ? "Draft" : campaign.status === "scheduled" ? "Scheduled" : campaign.status === "sending" ? "Sending" : "Delivered",
      date: (campaign.launched_at ?? campaign.scheduled_for ?? campaign.created_at)!,
      estimatedCost: Number(campaign.estimated_cost),
      spent: Number(campaign.spent),
    })),
    transactions: (transactionsRes.data ?? []).map((transaction) => ({
      id: transaction.id,
      type: transaction.type === "credit" ? "credit" : "debit",
      desc: transaction.description,
      amount: Number(transaction.amount),
      date: transaction.created_at,
      balance: Number(transaction.balance_after),
    })),
    whatsApp: connectionRes.data
      ? {
          connected: connectionRes.data.status === "connected",
          connectionStatus: connectionRes.data.status,
          businessVerificationStatus: connectionRes.data.business_verification_status,
          accountReviewStatus: connectionRes.data.account_review_status,
          obaStatus: connectionRes.data.oba_status,
          metaBusinessId: connectionRes.data.meta_business_id ?? "",
          metaBusinessPortfolioId: connectionRes.data.meta_business_portfolio_id ?? "",
          wabaId: connectionRes.data.waba_id ?? "",
          phoneNumberId: connectionRes.data.phone_number_id ?? "",
          displayPhoneNumber: connectionRes.data.display_phone_number,
          verifiedName: connectionRes.data.verified_name ?? "",
          businessPortfolio: connectionRes.data.business_portfolio,
          businessName: connectionRes.data.business_name,
          authorizationStatus: getAuthorizationStatus(authorizationRes.data?.expires_at ?? null),
          authorizationExpiresAt: authorizationRes.data?.expires_at ?? null,
        }
      : emptyAppState().whatsApp,
    conversations: conversationsData.map((conversation) => ({
      id: conversation.id,
      contactId: conversation.contact_id,
      phone: conversation.phone,
      displayName: conversation.display_name,
      status: conversation.status === "pending" ? "Pending" : conversation.status === "resolved" ? "Resolved" : "Open",
      source: conversation.source === "meta_ads"
        ? "Meta Ads"
        : conversation.source === "campaign"
          ? "Campaign"
          : conversation.source === "manual"
            ? "Manual"
            : conversation.source === "organic"
              ? "Organic"
              : "WhatsApp Inbound",
      assignedTo: conversation.assigned_to,
      lastMessagePreview: conversation.last_message_preview,
      lastMessageAt: conversation.last_message_at,
      unreadCount: conversation.unread_count,
    })),
    conversationMessages: messagesData.map((message) => ({
      id: message.id,
      conversationId: message.conversation_id,
      direction: message.direction === "outbound" ? "Outbound" : "Inbound",
      messageType: message.message_type,
      body: message.body,
      status: message.status,
      sentAt: message.sent_at,
    })),
    conversationNotes: notesData.map((note) => ({
      id: note.id,
      conversationId: note.conversation_id,
      body: note.body,
      authorName: note.author_name,
      createdAt: note.created_at,
    })),
    conversationEvents: conversationEventsData.map((event) => ({
      id: event.id,
      conversationId: event.conversation_id,
      eventType: event.event_type,
      summary: event.summary,
      actorName: event.actor_name,
      createdAt: event.created_at,
    })),
    failedSendLogs: failedSendLogsData.map((log) => ({
      id: log.id,
      channel: log.channel,
      targetType: log.target_type,
      targetId: log.target_id,
      destination: log.destination,
      templateName: log.template_name,
      messageBody: log.message_body,
      errorMessage: log.error_message,
      status: log.status,
      createdAt: log.created_at,
    })),
    operationalLogs: operationalLogsData.map((log) => ({
      id: log.id,
      eventType: log.event_type,
      level: log.level,
      summary: log.summary,
      createdAt: log.created_at,
    })),
    leads: leadsData.map((lead) => ({
      id: lead.id,
      contactId: lead.contact_id,
      conversationId: lead.conversation_id,
      fullName: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      status: lead.status === "contacted"
        ? "Contacted"
        : lead.status === "qualified"
          ? "Qualified"
          : lead.status === "won"
            ? "Won"
            : lead.status === "lost"
              ? "Lost"
              : "New",
      source: lead.source === "meta_ads"
        ? "Meta Ads"
        : lead.source === "campaign"
          ? "Campaign"
          : lead.source === "manual"
            ? "Manual"
            : lead.source === "organic"
              ? "Organic"
              : "WhatsApp Inbound",
      sourceLabel: lead.source_label,
      assignedTo: lead.assigned_to,
      notes: lead.notes,
      createdAt: lead.created_at,
    })),
    automations: automationRulesData.map((rule) => ({
      id: rule.id,
      type: rule.rule_type,
      name: rule.name,
      enabled: rule.enabled,
      config: typeof rule.config === "object" && rule.config ? rule.config as Record<string, string | number> : {},
      updatedAt: rule.updated_at,
    })),
    automationEvents: automationEventsData.map((event) => ({
      id: event.id,
      ruleType: event.rule_type,
      conversationId: event.conversation_id,
      leadId: event.lead_id,
      status: event.status,
      summary: event.summary,
      createdAt: event.created_at,
    })),
    recentActivity: [
      ...(campaignsRes.data ?? []).slice(0, 3).map((campaign) => ({
        id: `campaign-${campaign.id}`,
        title: campaign.status === "draft" ? "Campaign drafted" : "Campaign updated",
        subtitle: `${campaign.name} is currently ${campaign.status}`,
        timestamp: new Date(campaign.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }),
      })),
      ...(transactionsRes.data ?? []).slice(0, 3).map((transaction) => ({
        id: `wallet-${transaction.id}`,
        title: transaction.type === "credit" ? "Wallet recharged" : "Wallet debited",
        subtitle: transaction.description,
        timestamp: new Date(transaction.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }),
      })),
    ].slice(0, 6),
  };
}

async function currentWorkspaceIdOrThrow() {
  const context = await getCurrentContext();
  if (!context.user || !context.workspaceId) {
    throw new Error("No authenticated Supabase workspace found.");
  }
  return { userId: context.user.id, workspaceId: context.workspaceId };
}

export const supabaseApi: AppApi = {
  async getAppState() {
    return buildSupabaseAppState();
  },

  async signIn(email: string, password: string) {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    return buildSupabaseAppState();
  },

  async signUp(name: string, email: string, password: string) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) {
      throw error;
    }

    if (data.user && !data.session) {
      throw new Error("Signup succeeded, but email confirmation is required before we can open your workspace session.");
    }

    return buildSupabaseAppState();
  },

  async signOut() {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();
    if (error) {
      throw error;
    }
    return emptyAppState();
  },

  async completeOnboarding() {
    const client = requireSupabase();
    const { userId } = await currentWorkspaceIdOrThrow();
    const { error } = await client
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", userId);
    if (error) {
      throw error;
    }
    return buildSupabaseAppState();
  },

  async connectWhatsApp(input: ConnectWhatsAppInput) {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();
    const { error } = await client
      .from("whatsapp_connections")
      .upsert({
        workspace_id: workspaceId,
        meta_business_id: input.metaBusinessId || null,
        meta_business_portfolio_id: input.metaBusinessPortfolioId || null,
        waba_id: input.wabaId || null,
        phone_number_id: input.phoneNumberId || null,
        display_phone_number: input.displayPhoneNumber,
        verified_name: input.verifiedName || null,
        business_portfolio: input.businessPortfolio,
        business_name: input.businessName,
        status: input.connectionStatus,
        business_verification_status: input.businessVerificationStatus,
        account_review_status: input.accountReviewStatus,
        oba_status: input.obaStatus,
      }, { onConflict: "workspace_id" });
    if (error) {
      throw error;
    }
    return buildSupabaseAppState();
  },

  async disconnectWhatsApp() {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();
    const { error } = await client
      .from("whatsapp_connections")
      .update({ status: "disconnected" })
      .eq("workspace_id", workspaceId);
    if (error) {
      throw error;
    }
    return buildSupabaseAppState();
  },

  async addWalletFunds(amount: number, source = "Wallet Recharge") {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { state: await buildSupabaseAppState(), result: { ok: false, message: "Enter a valid recharge amount." } };
    }

    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();
    const state = await buildSupabaseAppState();
    const nextBalance = state.walletBalance + amount;
    const { error } = await client.from("wallet_transactions").insert({
      workspace_id: workspaceId,
      type: "credit",
      amount,
      description: source,
      reference_type: "manual_topup",
      balance_after: nextBalance,
    });
    if (error) {
      throw error;
    }
    return { state: await buildSupabaseAppState(), result: { ok: true, message: "Balance added successfully." } };
  },

  async addContact(input: AddContactInput) {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();
    const { data: contact, error } = await client
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        name: input.name,
        phone: input.phone,
      })
      .select("id")
      .single();
    if (error) {
      throw error;
    }

    if (input.tags.length > 0) {
      const { error: tagsError } = await client.from("contact_tags").insert(
        input.tags.map((tag) => ({
          workspace_id: workspaceId,
          contact_id: contact.id,
          tag,
        })),
      );
      if (tagsError) {
        throw tagsError;
      }
    }

    return buildSupabaseAppState();
  },

  async uploadSampleContacts() {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();
    for (const sample of defaultSupabaseSampleContacts) {
      const { data: contact, error } = await client
        .from("contacts")
        .upsert({
          workspace_id: workspaceId,
          name: sample.name,
          phone: sample.phone,
        }, { onConflict: "workspace_id,phone" })
        .select("id")
        .single();
      if (error) {
        throw error;
      }
      await client.from("contact_tags").upsert(
        sample.tags.map((tag) => ({
          workspace_id: workspaceId,
          contact_id: contact.id,
          tag,
        })),
        { onConflict: "contact_id,tag" },
      );
    }

    return buildSupabaseAppState();
  },

  async updateConversation(input: UpdateConversationInput) {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();
    const previousState = await buildSupabaseAppState();
    const previousConversation = previousState.conversations.find((conversation) => conversation.id === input.id);

    const payload: Record<string, string | number | null> = {};
    if (input.status) {
      payload.status = input.status === "Pending" ? "pending" : input.status === "Resolved" ? "resolved" : "open";
    }
    if (input.assignedTo !== undefined) {
      payload.assigned_to = input.assignedTo;
    }
    if (input.unreadCount !== undefined) {
      payload.unread_count = input.unreadCount;
    }

    const { error } = await client
      .from("conversations")
      .update(payload)
      .eq("workspace_id", workspaceId)
      .eq("id", input.id);

    if (error) {
      throw error;
    }
    const eventType = input.status && input.status !== previousConversation?.status
      ? "status_updated"
      : input.assignedTo !== undefined && input.assignedTo !== previousConversation?.assignedTo
        ? "assignment_updated"
        : "conversation_updated";
    const summary = input.status && input.status !== previousConversation?.status
      ? `Conversation moved to ${input.status}.`
      : input.assignedTo !== undefined && input.assignedTo !== previousConversation?.assignedTo
        ? `Conversation assignment updated to ${input.assignedTo || "Unassigned"}.`
        : "Conversation updated.";

    await client.from("conversation_events").insert({
      workspace_id: workspaceId,
      conversation_id: input.id,
      event_type: eventType,
      summary,
      actor_name: input.actorName || "Workspace Operator",
    });

    return buildSupabaseAppState();
  },

  async addConversationNote(input: AddConversationNoteInput) {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();

    const [{ error: noteError }, { error: eventError }] = await Promise.all([
      client.from("conversation_notes").insert({
        workspace_id: workspaceId,
        conversation_id: input.conversationId,
        body: input.body,
        author_name: input.authorName,
      }),
      client.from("conversation_events").insert({
        workspace_id: workspaceId,
        conversation_id: input.conversationId,
        event_type: "internal_note_added",
        summary: "Internal note added to conversation.",
        actor_name: input.authorName,
      }),
    ]);

    if (noteError) {
      throw noteError;
    }
    if (eventError) {
      throw eventError;
    }

    return buildSupabaseAppState();
  },

  async updateLead(input: UpdateLeadInput) {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();

    const payload: Record<string, string | null> = {};
    if (input.status) {
      payload.status = input.status === "Contacted"
        ? "contacted"
        : input.status === "Qualified"
          ? "qualified"
          : input.status === "Won"
            ? "won"
            : input.status === "Lost"
              ? "lost"
              : "new";
    }
    if (input.assignedTo !== undefined) {
      payload.assigned_to = input.assignedTo;
    }
    if (input.notes !== undefined) {
      payload.notes = input.notes;
    }

    const { error } = await client
      .from("leads")
      .update(payload)
      .eq("workspace_id", workspaceId)
      .eq("id", input.id);

    if (error) {
      throw error;
    }

    if (input.status === "Contacted") {
      try {
        await triggerAutomationLeadContacted(input.id);
      } catch (automationError) {
        console.error("Lead contacted automation failed", automationError);
      }
    }

    return buildSupabaseAppState();
  },

  async updateAutomation(input: UpdateAutomationInput) {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();

    const defaultName = input.type === "auto_reply_first_inbound"
      ? "First inbound auto-reply"
      : input.type === "auto_assign_new_lead"
        ? "Auto-assign new leads"
        : input.type === "no_reply_reminder"
          ? "No-reply follow-up reminder"
          : "Post-contacted follow-up";

    const { error } = await client
      .from("automation_rules")
      .upsert({
        workspace_id: workspaceId,
        rule_type: input.type,
        name: defaultName,
        enabled: input.enabled,
        config: input.config,
      }, { onConflict: "workspace_id,rule_type" });

    if (error) {
      throw error;
    }

    return buildSupabaseAppState();
  },

  async runAutomationSweep() {
    const result = await triggerAutomationReminderSweep();
    return {
      state: await buildSupabaseAppState(),
      result,
    };
  },

  async retryFailedSend(input: RetryFailedSendInput) {
    const result = await retryFailedSendWithServer(input.failedSendLogId);
    return {
      state: await buildSupabaseAppState(),
      result,
    };
  },

  async createCampaign(input: CreateCampaignInput) {
    const client = requireSupabase();
    const { workspaceId } = await currentWorkspaceIdOrThrow();
    const currentState = await buildSupabaseAppState();
    const estimatedCost = Number((input.contactIds.length * COST_PER_MESSAGE).toFixed(2));

    if (input.sendNow && currentState.walletBalance < estimatedCost) {
      return { state: currentState, result: { ok: false, message: "Insufficient wallet balance for this campaign." } };
    }

    const { data: campaign, error } = await client
      .from("campaigns")
      .insert({
        workspace_id: workspaceId,
        template_id: input.templateId,
        name: input.name,
        status: input.sendNow ? "sending" : "draft",
        estimated_cost: estimatedCost,
        spent: input.sendNow ? estimatedCost : 0,
        launched_at: input.sendNow ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error) {
      throw error;
    }

    const { error: recipientsError } = await client.from("campaign_recipients").insert(
      input.contactIds.map((contactId) => ({
        workspace_id: workspaceId,
        campaign_id: campaign.id,
        contact_id: contactId,
        status: input.sendNow ? "sent" : "queued",
        cost: COST_PER_MESSAGE,
      })),
    );
    if (recipientsError) {
      throw recipientsError;
    }

    if (input.sendNow) {
      const { error: transactionError } = await client.from("wallet_transactions").insert({
        workspace_id: workspaceId,
        type: "debit",
        amount: -estimatedCost,
        description: `${input.name} (${input.contactIds.length} msgs)`,
        reference_type: "campaign_send",
        reference_id: campaign.id,
        balance_after: currentState.walletBalance - estimatedCost,
      });
      if (transactionError) {
        throw transactionError;
      }
    }

    return {
      state: await buildSupabaseAppState(),
      result: {
        ok: true,
        message: input.sendNow ? "Campaign launched successfully." : "Draft saved successfully.",
      },
    };
  },
};
