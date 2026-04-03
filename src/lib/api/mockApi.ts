import { defaultAppState, sampleUploadedContacts } from "@/lib/api/mockData";
import {
  COST_PER_MESSAGE,
  STORAGE_KEY,
  type ActionResult,
  type AddContactInput,
  type AppState,
  type ConnectWhatsAppInput,
  type CreateCampaignInput,
  type CreateTemplateInput,
  type AddConversationNoteInput,
  type RetryFailedSendInput,
  type ResellerProfile,
  type UpdateAutomationInput,
  type UpdateConversationInput,
  type UpdateLeadInput,
  type UserAccessRole,
} from "@/lib/api/types";

function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState;
}

function pushActivity(state: AppState, title: string, subtitle: string) {
  return [
    {
      id: crypto.randomUUID(),
      title,
      subtitle,
      timestamp: "Just now",
    },
    ...state.recentActivity,
  ].slice(0, 6);
}

function resolveRoleFromEmail(email: string): UserAccessRole {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail.includes("admin")) {
    return "platform_admin";
  }

  if (normalizedEmail.includes("reseller") || normalizedEmail.includes("partner")) {
    return "reseller";
  }

  return "workspace_owner";
}

function findResellerProfile(state: AppState, email: string): ResellerProfile | null {
  const normalizedEmail = email.trim().toLowerCase();
  return state.platform.resellers.find((reseller) => reseller.email.toLowerCase() === normalizedEmail) ?? null;
}

function applyRoleToState(state: AppState, email: string) {
  const role = resolveRoleFromEmail(email);
  const matchedReseller = role === "reseller" ? findResellerProfile(state, email) : null;

  return {
    onboardingComplete: role === "workspace_owner" ? state.onboardingComplete : true,
    platform: {
      ...state.platform,
      currentRole: role,
      resellerProfile: role === "reseller"
        ? matchedReseller ?? {
            id: "res-demo",
            name: "Demo Reseller",
            email,
            companyName: "New Partner Desk",
            tier: "Silver",
            status: "Pending",
            commissionRate: 12,
            clientsManaged: 0,
            monthlyRecurringRevenue: 0,
            monthlyPayout: 0,
            referralCode: "NEW-PARTNER",
            pipelineValue: 0,
          }
        : state.platform.resellerProfile,
    },
  };
}

export function readAppState(): AppState {
  if (typeof window === "undefined") {
    return cloneState(defaultAppState);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneState(defaultAppState);
  }

  try {
    return { ...cloneState(defaultAppState), ...JSON.parse(raw) };
  } catch {
    return cloneState(defaultAppState);
  }
}

export function writeAppState(state: AppState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export const mockApi = {
  async getAppState() {
    return readAppState();
  },

  async signIn(email: string, _password: string) {
    const state = readAppState();
    const fallbackName = email.split("@")[0].replace(/[._-]/g, " ");
    const roleState = applyRoleToState(state, email);
    const nextState: AppState = {
      ...state,
      user: {
        name: fallbackName.replace(/\b\w/g, (char) => char.toUpperCase()),
        email,
      },
      onboardingComplete: roleState.onboardingComplete,
      platform: roleState.platform,
    };
    writeAppState(nextState);
    return nextState;
  },

  async signUp(name: string, email: string, _password: string) {
    const state = readAppState();
    const roleState = applyRoleToState(state, email);
    const nextState: AppState = {
      ...state,
      user: { name, email },
      onboardingComplete: roleState.onboardingComplete,
      platform: roleState.platform,
    };
    writeAppState(nextState);
    return nextState;
  },

  async signOut() {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      user: null,
      onboardingComplete: false,
      platform: {
        ...state.platform,
        currentRole: "workspace_owner",
      },
    };
    writeAppState(nextState);
    return nextState;
  },

  async completeOnboarding() {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      onboardingComplete: true,
    };
    writeAppState(nextState);
    return nextState;
  },

  async connectWhatsApp(input: ConnectWhatsAppInput) {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      whatsApp: {
        connected: input.connectionStatus === "connected",
        authorizationStatus: input.authorizationStatus || "active",
        authorizationExpiresAt: input.authorizationExpiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        ...input,
      },
      recentActivity: pushActivity(
        state,
        "WhatsApp connected",
        `${input.displayPhoneNumber} linked to ${input.businessName}`,
      ),
    };
    writeAppState(nextState);
    return nextState;
  },

  async disconnectWhatsApp() {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      whatsApp: cloneState(defaultAppState).whatsApp,
      recentActivity: pushActivity(
        state,
        "WhatsApp disconnected",
        "Business connection has been removed from the workspace",
      ),
    };
    writeAppState(nextState);
    return nextState;
  },

  async addWalletFunds(amount: number, source = "Wallet Recharge"): Promise<{ state: AppState; result: ActionResult }> {
    const state = readAppState();
    if (!Number.isFinite(amount) || amount <= 0) {
      return { state, result: { ok: false, message: "Enter a valid recharge amount." } };
    }

    const nextBalance = state.walletBalance + amount;
    const nextState: AppState = {
      ...state,
      walletBalance: nextBalance,
      transactions: [
        {
          id: crypto.randomUUID(),
          type: "credit",
          desc: source,
          amount,
          date: new Date().toISOString(),
          balance: nextBalance,
        },
        ...state.transactions,
      ],
      recentActivity: pushActivity(
        state,
        "Wallet recharged",
        `Added Rs ${amount.toLocaleString()} to your wallet`,
      ),
    };
    writeAppState(nextState);
    return { state: nextState, result: { ok: true, message: "Balance added successfully." } };
  },

  async addContact(input: AddContactInput) {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      contacts: [{ id: crypto.randomUUID(), ...input }, ...state.contacts],
      recentActivity: pushActivity(
        state,
        "Contact added",
        `${input.name} is now available for campaigns`,
      ),
    };
    writeAppState(nextState);
    return nextState;
  },

  async uploadSampleContacts() {
    const state = readAppState();
    const extraContacts = sampleUploadedContacts();
    const nextState: AppState = {
      ...state,
      contacts: [...extraContacts, ...state.contacts],
      recentActivity: pushActivity(
        state,
        "Contacts uploaded",
        `${extraContacts.length} contacts imported from CSV`,
      ),
    };
    writeAppState(nextState);
    return nextState;
  },

  async updateConversation(input: UpdateConversationInput) {
    const state = readAppState();
    const previousConversation = state.conversations.find((conversation) => conversation.id === input.id);
    const nextState: AppState = {
      ...state,
      conversations: state.conversations.map((conversation) => (
        conversation.id === input.id
          ? {
              ...conversation,
              status: input.status ?? conversation.status,
              assignedTo: input.assignedTo === undefined ? conversation.assignedTo : input.assignedTo,
              unreadCount: input.unreadCount ?? conversation.unreadCount,
            }
          : conversation
      )),
      conversationEvents: previousConversation ? [
        {
          id: crypto.randomUUID(),
          conversationId: input.id,
          eventType: input.status && input.status !== previousConversation.status
            ? "status_updated"
            : input.assignedTo !== undefined && input.assignedTo !== previousConversation.assignedTo
              ? "assignment_updated"
              : "conversation_updated",
          summary: input.status && input.status !== previousConversation.status
            ? `Conversation moved to ${input.status}.`
            : input.assignedTo !== undefined && input.assignedTo !== previousConversation.assignedTo
              ? `Conversation assignment updated to ${input.assignedTo || "Unassigned"}.`
              : "Conversation updated.",
          actorName: input.actorName || "Workspace Operator",
          createdAt: new Date().toISOString(),
        },
        ...state.conversationEvents,
      ] : state.conversationEvents,
    };
    writeAppState(nextState);
    return nextState;
  },

  async addConversationNote(input: AddConversationNoteInput) {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      conversationNotes: [
        {
          id: crypto.randomUUID(),
          conversationId: input.conversationId,
          body: input.body,
          authorName: input.authorName,
          createdAt: new Date().toISOString(),
        },
        ...state.conversationNotes,
      ],
      conversationEvents: [
        {
          id: crypto.randomUUID(),
          conversationId: input.conversationId,
          eventType: "internal_note_added",
          summary: "Internal note added to conversation.",
          actorName: input.authorName,
          createdAt: new Date().toISOString(),
        },
        ...state.conversationEvents,
      ],
    };
    writeAppState(nextState);
    return nextState;
  },

  async updateLead(input: UpdateLeadInput) {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      leads: state.leads.map((lead) => (
        lead.id === input.id
          ? {
              ...lead,
              status: input.status ?? lead.status,
              assignedTo: input.assignedTo === undefined ? lead.assignedTo : input.assignedTo,
              notes: input.notes ?? lead.notes,
            }
          : lead
      )),
    };
    writeAppState(nextState);
    return nextState;
  },

  async updateAutomation(input: UpdateAutomationInput) {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      automations: state.automations.map((automation) => (
        automation.type === input.type
          ? {
              ...automation,
              enabled: input.enabled,
              config: input.config,
              updatedAt: new Date().toISOString(),
            }
          : automation
      )),
    };
    writeAppState(nextState);
    return nextState;
  },

  async runAutomationSweep() {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      automationEvents: [
        {
          id: crypto.randomUUID(),
          ruleType: "no_reply_reminder",
          conversationId: state.conversations[0]?.id ?? null,
          leadId: state.leads[0]?.id ?? null,
          status: "triggered",
          summary: "Reminder sweep completed and pending follow-up conversations were flagged.",
          createdAt: new Date().toISOString(),
        },
        ...state.automationEvents,
      ].slice(0, 20),
    };
    writeAppState(nextState);
    return {
      state: nextState,
      result: { ok: true, message: "Automation reminder sweep completed." },
    };
  },

  async retryFailedSend(input: RetryFailedSendInput) {
    const state = readAppState();
    const failedSend = state.failedSendLogs.find((item) => item.id === input.failedSendLogId);
    if (!failedSend) {
      return { state, result: { ok: false, message: "Failed send record not found." } };
    }

    const nextState: AppState = {
      ...state,
      failedSendLogs: state.failedSendLogs.map((item) => (
        item.id === input.failedSendLogId ? { ...item, status: "retried" } : item
      )),
      operationalLogs: [
        {
          id: crypto.randomUUID(),
          eventType: "failed_send_retried",
          level: "info",
          summary: `Retry initiated for ${failedSend.channel} send to ${failedSend.destination}.`,
          createdAt: new Date().toISOString(),
        },
        ...state.operationalLogs,
      ],
    };
    writeAppState(nextState);
    return {
      state: nextState,
      result: { ok: true, message: "Retry initiated for the failed send." },
    };
  },

  async createCampaign(input: CreateCampaignInput): Promise<{ state: AppState; result: ActionResult }> {
    const state = readAppState();

    if (!input.name.trim()) {
      return { state, result: { ok: false, message: "Campaign name is required." } };
    }
    if (!input.templateId) {
      return { state, result: { ok: false, message: "Choose a template before continuing." } };
    }
    if (input.contactIds.length === 0) {
      return { state, result: { ok: false, message: "Select at least one contact." } };
    }

    const estimatedCost = Number((input.contactIds.length * COST_PER_MESSAGE).toFixed(2));
    if (input.sendNow && state.walletBalance < estimatedCost) {
      return { state, result: { ok: false, message: "Insufficient wallet balance for this campaign." } };
    }

    const selectedTemplate = state.templates.find((template) => template.id === input.templateId);
    const nextBalance = input.sendNow ? state.walletBalance - estimatedCost : state.walletBalance;
    const nextState: AppState = {
      ...state,
      campaigns: [
        {
          id: crypto.randomUUID(),
          name: input.name,
          templateId: input.templateId,
          contactIds: input.contactIds,
          status: input.sendNow ? "Sending" : (input.scheduledAt ? "Scheduled" : "Draft"),
          date: new Date().toISOString(),
          scheduledAt: input.scheduledAt,
          estimatedCost,
          spent: input.sendNow ? estimatedCost : 0,
          sent: input.sendNow ? input.contactIds.length : 0,
          delivered: 0,
          read: 0,
        },
        ...state.campaigns,
      ],
      walletBalance: nextBalance,
      totalSpent: input.sendNow ? state.totalSpent + estimatedCost : state.totalSpent,
      messagesSent: input.sendNow ? state.messagesSent + input.contactIds.length : state.messagesSent,

      transactions: input.sendNow
        ? [
            {
              id: crypto.randomUUID(),
              type: "debit",
              desc: `${input.name} (${input.contactIds.length} msgs)`,
              amount: -estimatedCost,
              date: new Date().toISOString(),
              balance: nextBalance,
            },
            ...state.transactions,
          ]
        : state.transactions,
      recentActivity: pushActivity(
        state,
        input.sendNow ? "Campaign launched" : "Campaign drafted",
        `${input.name} using ${selectedTemplate?.name ?? "selected template"}`,
      ),
    };

    writeAppState(nextState);
    return {
      state: nextState,
      result: {
        ok: true,
        message: input.sendNow ? "Campaign launched successfully." : "Draft saved successfully.",
      },
    };
  },
  
  async createTemplate(input: CreateTemplateInput) {
    const state = readAppState();
    const nextState: AppState = {
      ...state,
      templates: [
        {
          id: crypto.randomUUID(),
          status: "Pending",
          preview: input.body,
          ...input,
        },
        ...state.templates,
      ],
      recentActivity: pushActivity(
        state,
        "Template submitted",
        `${input.name} is now pending Meta approval`,
      ),
    };
    writeAppState(nextState);
    return nextState;
  },
};

export interface AppApi {
  getAppState: () => Promise<AppState>;
  signIn: (email: string, password: string) => Promise<AppState>;
  signUp: (name: string, email: string, password: string) => Promise<AppState>;
  signOut: () => Promise<AppState>;
  completeOnboarding: () => Promise<AppState>;
  connectWhatsApp: (input: ConnectWhatsAppInput) => Promise<AppState>;
  disconnectWhatsApp: () => Promise<AppState>;
  addWalletFunds: (amount: number, source?: string) => Promise<{ state: AppState; result: ActionResult }>;
  addContact: (input: AddContactInput) => Promise<AppState>;
  uploadSampleContacts: () => Promise<AppState>;
  updateConversation: (input: UpdateConversationInput) => Promise<AppState>;
  addConversationNote: (input: AddConversationNoteInput) => Promise<AppState>;
  updateLead: (input: UpdateLeadInput) => Promise<AppState>;
  updateAutomation: (input: UpdateAutomationInput) => Promise<AppState>;
  runAutomationSweep: () => Promise<{ state: AppState; result: ActionResult }>;
  retryFailedSend: (input: RetryFailedSendInput) => Promise<{ state: AppState; result: ActionResult }>;
  createCampaign: (input: CreateCampaignInput) => Promise<{ state: AppState; result: ActionResult }>;
  createTemplate: (input: CreateTemplateInput) => Promise<AppState>;
}
