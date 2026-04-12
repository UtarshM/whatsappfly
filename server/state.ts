import {
  CampaignStatus,
  MessageTemplateCategory,
  Prisma,
  TemplateStatus,
  type PrismaClient,
  type User,
} from "@prisma/client";
import { COST_PER_MESSAGE, type AppState } from "../src/lib/api/types";
import { getSupabaseAdmin } from "./supabaseAdmin";

function getAuthorizationStatus(expiresAt: string | null | undefined): "missing" | "active" | "expiring_soon" | "expired" {
  if (!expiresAt) return "missing";
  const expires = new Date(expiresAt).getTime();
  const now = Date.now();
  if (expires <= now) return "expired";
  if (expires - now <= 7 * 24 * 60 * 60 * 1000) return "expiring_soon";
  return "active";
}

const seedContacts = [
  { name: "Rahul Sharma", phone: "+91 98765 43210", tags: ["VIP", "Shopify"] },
  { name: "Priya Patel", phone: "+91 87654 32109", tags: ["New"] },
  { name: "Amit Kumar", phone: "+91 76543 21098", tags: ["Returning"] },
  { name: "Sneha Gupta", phone: "+91 65432 10987", tags: ["VIP", "D2C"] },
  { name: "Vikram Singh", phone: "+91 54321 09876", tags: ["Shopify"] },
  { name: "Anjali Reddy", phone: "+91 43210 98765", tags: ["New", "D2C"] },
];

const seedTemplates = [
  {
    name: "Order Confirmation",
    category: MessageTemplateCategory.utility,
    status: TemplateStatus.approved,
    language: "English",
    body: "Hi {{1}}, your order #{{2}} has been confirmed! Track here: {{3}}",
  },
  {
    name: "Diwali Sale Offer",
    category: MessageTemplateCategory.marketing,
    status: TemplateStatus.approved,
    language: "English",
    body: "Diwali Sale is LIVE! Get up to {{1}}% off on all products. Shop now: {{2}}",
  },
  {
    name: "Cart Reminder",
    category: MessageTemplateCategory.marketing,
    status: TemplateStatus.pending,
    language: "English",
    body: "Hey {{1}}, you left items in your cart! Complete your purchase before they sell out.",
  },
  {
    name: "Shipping Update",
    category: MessageTemplateCategory.utility,
    status: TemplateStatus.approved,
    language: "Hindi",
    body: "Hi {{1}}, your order has been shipped! Delivery by {{2}}. Track: {{3}}",
  },
];

export async function ensureSession(prisma: PrismaClient) {
  return prisma.appSession.upsert({
    where: { id: "primary" },
    update: {},
    create: { id: "primary" },
  });
}

export async function setCurrentUser(prisma: PrismaClient, userId: string | null) {
  await prisma.appSession.upsert({
    where: { id: "primary" },
    update: { currentUserId: userId },
    create: { id: "primary", currentUserId: userId },
  });
}

export async function getCurrentUser(prisma: PrismaClient) {
  const session = await prisma.appSession.findUnique({
    where: { id: "primary" },
    include: { currentUser: true },
  });

  return session?.currentUser ?? null;
}

export async function createWorkspaceForUser(prisma: PrismaClient, input: { name: string; email: string }) {
  const workspace = await prisma.workspace.create({
    data: {
      name: `${input.name}'s Workspace`,
      users: {
        create: {
          name: input.name,
          email: input.email,
        },
      },
    },
    include: {
      users: true,
    },
  });

  const user = workspace.users[0];
  await seedWorkspace(prisma, workspace.id);
  await setCurrentUser(prisma, user.id);
  return user;
}

export async function findOrCreateUserByEmail(prisma: PrismaClient, email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await setCurrentUser(prisma, existing.id);
    return existing;
  }

  const fallbackName = email.split("@")[0].replace(/[._-]/g, " ");
  const name = fallbackName.replace(/\b\w/g, (char) => char.toUpperCase());
  return createWorkspaceForUser(prisma, { name, email });
}

export async function seedWorkspace(prisma: PrismaClient, workspaceId: string) {
  const existingTemplates = await prisma.messageTemplate.count({ where: { workspaceId } });
  if (existingTemplates > 0) {
    return;
  }

  const createdContacts = await Promise.all(
    seedContacts.map((contact) =>
      prisma.contact.create({
        data: {
          workspaceId,
          name: contact.name,
          phone: contact.phone,
          tags: {
            create: contact.tags.map((tag) => ({
              workspaceId,
              tag,
            })),
          },
        },
      }),
    ),
  );

  const createdTemplates = await Promise.all(
    seedTemplates.map((template) =>
      prisma.messageTemplate.create({
        data: {
          workspaceId,
          name: template.name,
          category: template.category,
          status: template.status,
          language: template.language,
          body: template.body,
        },
      }),
    ),
  );

  const deliveredRecipients = createdContacts.slice(0, 4);
  const sendingRecipients = createdContacts.slice(0, 2);
  const scheduledRecipients = createdContacts;

  const deliveredCampaign = await prisma.campaign.create({
    data: {
      workspaceId,
      templateId: createdTemplates[1].id,
      name: "Diwali Sale Blast",
      status: CampaignStatus.delivered,
      estimatedCost: 625,
      spent: 625,
      launchedAt: new Date("2026-03-20T09:00:00.000Z"),
      recipients: {
        create: deliveredRecipients.map((contact) => ({
          workspaceId,
          contactId: contact.id,
          status: "delivered",
          cost: COST_PER_MESSAGE,
        })),
      },
    },
  });

  const sendingCampaign = await prisma.campaign.create({
    data: {
      workspaceId,
      templateId: createdTemplates[0].id,
      name: "New Arrival Alert",
      status: CampaignStatus.sending,
      estimatedCost: 430,
      spent: 430,
      launchedAt: new Date("2026-03-21T11:30:00.000Z"),
      recipients: {
        create: sendingRecipients.map((contact) => ({
          workspaceId,
          contactId: contact.id,
          status: "sent",
          cost: COST_PER_MESSAGE,
        })),
      },
    },
  });

  await prisma.campaign.create({
    data: {
      workspaceId,
      templateId: createdTemplates[3].id,
      name: "Weekly Newsletter",
      status: CampaignStatus.scheduled,
      estimatedCost: 1600,
      spent: 0,
      scheduledFor: new Date("2026-03-25T10:00:00.000Z"),
      recipients: {
        create: scheduledRecipients.map((contact) => ({
          workspaceId,
          contactId: contact.id,
          status: "queued",
          cost: COST_PER_MESSAGE,
        })),
      },
    },
  });

  await prisma.walletTransaction.createMany({
    data: [
      {
        workspaceId,
        type: "credit",
        amount: 2000,
        description: "Wallet Recharge",
        referenceType: "manual_topup",
        balanceAfter: 4250,
        createdAt: new Date("2026-03-20T12:00:00.000Z"),
      },
      {
        workspaceId,
        type: "debit",
        amount: -625,
        description: "Diwali Sale Blast",
        referenceType: "campaign_send",
        referenceId: deliveredCampaign.id,
        balanceAfter: 2250,
        createdAt: new Date("2026-03-20T09:10:00.000Z"),
      },
      {
        workspaceId,
        type: "debit",
        amount: -1050,
        description: "Order Confirmation",
        referenceType: "campaign_send",
        referenceId: sendingCampaign.id,
        balanceAfter: 2875,
        createdAt: new Date("2026-03-18T08:00:00.000Z"),
      },
      {
        workspaceId,
        type: "credit",
        amount: 3000,
        description: "Wallet Recharge",
        referenceType: "manual_topup",
        balanceAfter: 3925,
        createdAt: new Date("2026-03-16T08:00:00.000Z"),
      },
    ],
  });
}

export async function buildAppState(prisma: PrismaClient, user: User | null): Promise<AppState> {
  if (!user) {
    return {
      user: null,
      onboardingComplete: false,
      walletBalance: 0,
      totalSpent: 0,
      messagesSent: 0,
      contacts: [],
      templates: [],
      campaigns: [],
      transactions: [],
      whatsApp: {
        connected: false,
        connectionStatus: "pending",
        businessVerificationStatus: "unverified",
        accountReviewStatus: "pending_review",
        obaStatus: "not_applied",
        metaBusinessId: "",
        metaBusinessPortfolioId: "",
        wabaId: "",
        phoneNumberId: "",
        displayPhoneNumber: "",
        verifiedName: "",
        businessPortfolio: "",
        businessName: "",
        authorizationStatus: "missing",
        authorizationExpiresAt: null,
      },
      conversations: [],
      conversationMessages: [],
      conversationNotes: [],
      conversationEvents: [],
      failedSendLogs: [],
      operationalLogs: [],
      leads: [],
      automations: [],
      automationEvents: [],
      recentActivity: [],
    };
  }

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: user.workspaceId },
    include: {
      contacts: {
        include: { tags: true },
        orderBy: { createdAt: "desc" },
      },
      templates: {
        orderBy: { createdAt: "desc" },
      },
      campaigns: {
        include: {
          recipients: true,
          template: true,
        },
        orderBy: { createdAt: "desc" },
      },
      walletTransactions: {
        orderBy: { createdAt: "desc" },
      },
      whatsAppConnections: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const latestConnection = workspace.whatsAppConnections[0];

  // Fetch data from Supabase for automation, inbox and connection features
  const supabase = getSupabaseAdmin();
  const [
    { data: connectionRes },
    { data: authorizationRes },
    { data: conversations },
    { data: conversationMessages },
    { data: conversationNotes },
    { data: conversationEvents },
    { data: failedSendLogs },
    { data: operationalLogs },
    { data: leads },
    { data: rules },
    { data: automationEvents },
    transactionsRes,
  ] = await Promise.all([
    supabase.from("whatsapp_connections").select("*").eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("meta_authorizations").select("*").eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("conversations").select("*").eq("workspace_id", workspace.id).orderBy("last_message_at", { ascending: false }),
    supabase.from("conversation_messages").select("*").eq("workspace_id", workspace.id).orderBy("sent_at", { ascending: true }),
    supabase.from("conversation_notes").select("*").eq("workspace_id", workspace.id).orderBy("created_at", { ascending: false }),
    supabase.from("conversation_events").select("*").eq("workspace_id", workspace.id).orderBy("created_at", { ascending: false }),
    supabase.from("failed_send_logs").select("*").eq("workspace_id", workspace.id).orderBy("created_at", { ascending: false }),
    supabase.from("operational_logs").select("*").eq("workspace_id", workspace.id).orderBy("created_at", { ascending: false }),
    supabase.from("leads").select("*").eq("workspace_id", workspace.id).orderBy("created_at", { ascending: false }),
    supabase.from("automation_rules").select("*").eq("workspace_id", workspace.id).orderBy("updated_at", { ascending: false }),
    supabase.from("automation_events").select("*").eq("workspace_id", workspace.id).orderBy("created_at", { ascending: false }),
    supabase.from("wallet_transactions").select("*").eq("workspace_id", workspace.id).orderBy("created_at", { ascending: false }),
  ]);

  const supabaseTransactions = transactionsRes?.data ?? [];
  const walletBalance = supabaseTransactions[0]?.balance_after ?? 0;
  const totalSpent = Math.abs(
    supabaseTransactions
      .filter((tx: any) => tx.type === "debit")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0),
  );
  const messagesSent = (workspace.campaigns || []).reduce((sum, campaign) => {
    if (campaign.status === CampaignStatus.draft) {
      return sum;
    }
    return sum + (campaign.recipients?.length ?? 0);
  }, 0);

  return {
    user: {
      name: user.name,
      email: user.email,
    },
    onboardingComplete: user.onboardingComplete,
    walletBalance,
    totalSpent,
    messagesSent,
    contacts: (contacts ?? []).map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      tags: (contact.contact_tags ?? []).map((t: any) => t.tag),
    })),
    templates: workspace.templates.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category === MessageTemplateCategory.marketing ? "Marketing" : "Utility",
      status: template.status === TemplateStatus.approved
        ? "Approved"
        : template.status === TemplateStatus.pending
          ? "Pending"
          : "Rejected",
      language: template.language,
      preview: template.body,
    })),
    campaigns: workspace.campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      templateId: campaign.templateId,
      contactIds: campaign.recipients.map((recipient) => recipient.contactId),
      status: campaign.status === CampaignStatus.draft
        ? "Draft"
        : campaign.status === CampaignStatus.scheduled
          ? "Scheduled"
          : campaign.status === CampaignStatus.sending
            ? "Sending"
            : "Delivered",
      date: (campaign.launchedAt ?? campaign.scheduledFor ?? campaign.createdAt).toISOString(),
      estimatedCost: campaign.estimatedCost,
      spent: campaign.spent,
    })),
    transactions: supabaseTransactions.map((transaction: any) => ({
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
          authorizationStatus: authorizationRes.data ? getAuthorizationStatus(authorizationRes.data.expires_at) : "missing",
          authorizationExpiresAt: authorizationRes.data?.expires_at ?? null,
        }
      : {
          connected: false,
          connectionStatus: "pending" as const,
          businessVerificationStatus: "unverified" as const,
          accountReviewStatus: "pending_review" as const,
          obaStatus: "not_applied" as const,
          metaBusinessId: "",
          metaBusinessPortfolioId: "",
          wabaId: "",
          phoneNumberId: "",
          displayPhoneNumber: "",
          verifiedName: "",
          businessPortfolio: "",
          businessName: "",
          authorizationStatus: "missing" as const,
          authorizationExpiresAt: null,
        },
    conversations: (conversations ?? []).map((c) => ({
      id: c.id,
      contactId: c.contact_id,
      phone: c.phone,
      displayName: c.display_name,
      status: c.status === "open" ? "Open" : c.status === "pending" ? "Pending" : "Resolved",
      source: c.source === "meta_ads" ? "Meta Ads" : c.source === "whatsapp_inbound" ? "WhatsApp Inbound" : c.source === "campaign" ? "Campaign" : c.source === "manual" ? "Manual" : "Organic",
      assignedTo: c.assigned_to,
      lastMessagePreview: c.last_message_preview,
      lastMessageAt: c.last_message_at,
      unreadCount: c.unread_count,
    })),
    conversationMessages: (conversationMessages ?? []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      direction: m.direction === "inbound" ? "Inbound" : "Outbound",
      messageType: m.message_type,
      body: m.body,
      status: m.status,
      sentAt: m.sent_at,
    })),
    conversationNotes: (conversationNotes ?? []).map((n) => ({
      id: n.id,
      conversationId: n.conversation_id,
      body: n.body,
      authorName: n.author_name,
      createdAt: n.created_at,
    })),
    conversationEvents: (conversationEvents ?? []).map((e) => ({
      id: e.id,
      conversationId: e.conversation_id,
      eventType: e.event_type,
      summary: e.summary,
      actorName: e.actor_name,
      createdAt: e.created_at,
    })),
    failedSendLogs: (failedSendLogs ?? []).map((l) => ({
      id: l.id,
      channel: l.channel,
      targetType: l.target_type,
      targetId: l.target_id,
      destination: l.destination,
      templateName: l.template_name,
      messageBody: l.message_body,
      errorMessage: l.error_message,
      status: l.status,
      createdAt: l.created_at,
    })),
    operationalLogs: (operationalLogs ?? []).map((l) => ({
      id: l.id,
      eventType: l.event_type,
      level: l.level,
      summary: l.summary,
      createdAt: l.created_at,
    })),
    leads: (leads ?? []).map((l) => ({
      id: l.id,
      contactId: l.contact_id,
      conversationId: l.conversation_id,
      fullName: l.full_name,
      phone: l.phone,
      email: l.email,
      status: l.status === "new" ? "New" : l.status === "contacted" ? "Contacted" : l.status === "qualified" ? "Qualified" : l.status === "won" ? "Won" : "Lost",
      source: l.source === "meta_ads" ? "Meta Ads" : l.source === "whatsapp_inbound" ? "WhatsApp Inbound" : l.source === "campaign" ? "Campaign" : l.source === "manual" ? "Manual" : "Organic",
      sourceLabel: l.source_label,
      assignedTo: l.assigned_to,
      notes: l.notes,
      createdAt: l.created_at,
    })),
    automations: (rules ?? []).map((r) => ({
      id: r.id,
      type: r.rule_type,
      name: r.name,
      enabled: r.enabled,
      config: r.config as any,
      updatedAt: r.updated_at,
    })),
    automationEvents: (automationEvents ?? []).map((e) => ({
      id: e.id,
      ruleType: e.rule_type,
      conversationId: e.conversation_id,
      leadId: e.lead_id,
      status: e.status as any,
      summary: e.summary,
      createdAt: e.created_at,
    })),
    recentActivity,
    // Partner system (mocked for now as it's purely in Prisma)
    partners: workspace.partners.map((p) => ({
      id: p.id,
      partnerType: p.partnerType,
      status: p.status,
      companyName: p.companyName,
      contactName: p.contactName,
      email: p.email,
      phone: p.phone,
      commissionRate: p.commissionRate,
      tier: p.tier,
      referralCode: p.referralCode,
      totalReferrals: p.totalReferrals,
      totalEarned: p.totalEarned,
      totalPaid: p.totalPaid,
      createdAt: p.createdAt.toISOString(),
    })),
    partnerProfile: null,
    partnerStats: null,
    partnerReferrals: [],
    partnerPayouts: [],
  };
}
