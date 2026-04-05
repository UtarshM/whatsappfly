create extension if not exists pgcrypto;

create type public.workspace_plan as enum ('starter', 'growth', 'enterprise');
create type public.connection_status as enum ('pending', 'connected', 'disconnected');
create type public.business_verification_status as enum ('unverified', 'in_review', 'verified');
create type public.account_review_status as enum ('pending_review', 'in_review', 'approved', 'rejected');
create type public.oba_status as enum ('not_applied', 'pending', 'approved', 'rejected');
create type public.conversation_status as enum ('open', 'pending', 'resolved');
create type public.message_direction as enum ('inbound', 'outbound');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');
create type public.lead_source as enum ('meta_ads', 'whatsapp_inbound', 'campaign', 'manual', 'organic');
create type public.automation_rule_type as enum ('auto_reply_first_inbound', 'auto_assign_new_lead', 'no_reply_reminder', 'follow_up_after_contacted');
create type public.template_category as enum ('marketing', 'utility');
create type public.template_status as enum ('approved', 'pending', 'rejected');
create type public.campaign_status as enum ('draft', 'scheduled', 'sending', 'delivered');
create type public.recipient_status as enum ('queued', 'sent', 'delivered', 'failed');
create type public.wallet_reference_type as enum ('manual_topup', 'campaign_send', 'adjustment');

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan public.workspace_plan not null default 'starter',
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  meta_business_id text,
  meta_business_portfolio_id text,
  waba_id text,
  phone_number_id text,
  display_phone_number text not null,
  verified_name text,
  business_name text not null,
  business_portfolio text not null,
  status public.connection_status not null default 'pending',
  business_verification_status public.business_verification_status not null default 'unverified',
  account_review_status public.account_review_status not null default 'pending_review',
  oba_status public.oba_status not null default 'not_applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, phone)
);

create table if not exists public.contact_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (contact_id, tag)
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  category public.template_category not null,
  status public.template_status not null,
  language text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid not null references public.message_templates(id) on delete restrict,
  name text not null,
  status public.campaign_status not null default 'draft',
  estimated_cost numeric(12,2) not null,
  spent numeric(12,2) not null default 0,
  scheduled_for timestamptz,
  launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status public.recipient_status not null default 'queued',
  cost numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(12,2) not null,
  description text not null,
  reference_type public.wallet_reference_type not null,
  reference_id uuid,
  balance_after numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.meta_authorizations (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  access_token text not null,
  token_type text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create table if not exists public.meta_lead_source_mappings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text not null default '',
  page_id text,
  ad_id text,
  form_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  phone text not null,
  display_name text not null,
  status public.conversation_status not null default 'open',
  source public.lead_source not null default 'whatsapp_inbound',
  assigned_to text,
  last_message_preview text not null default '',
  last_message_at timestamptz not null default now(),
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  meta_message_id text,
  direction public.message_direction not null,
  message_type text not null default 'text',
  body text not null default '',
  status text not null default 'received',
  payload jsonb,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  body text not null default '',
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  event_type text not null default 'conversation_updated',
  summary text not null default '',
  actor_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  meta_lead_id text unique,
  full_name text not null,
  phone text not null,
  email text not null default '',
  status public.lead_status not null default 'new',
  source public.lead_source not null default 'manual',
  source_label text not null default '',
  assigned_to text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  rule_type public.automation_rule_type not null,
  name text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, rule_type)
);

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  rule_type public.automation_rule_type not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'triggered',
  summary text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.failed_send_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel text not null check (channel in ('campaign', 'reply', 'automation', 'template')),
  target_type text not null check (target_type in ('contact', 'conversation', 'lead', 'workspace')),
  target_id uuid,
  destination text not null,
  template_name text,
  message_body text,
  error_message text not null,
  status text not null default 'failed' check (status in ('failed', 'retried', 'resolved')),
  retry_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  last_attempt_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.operational_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  level text not null check (level in ('info', 'warning', 'error')),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.processed_webhook_events (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  event_type text not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_whatsapp_connections_updated_at on public.whatsapp_connections;
create trigger set_whatsapp_connections_updated_at
before update on public.whatsapp_connections
for each row execute procedure public.set_updated_at();

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row execute procedure public.set_updated_at();

drop trigger if exists set_meta_authorizations_updated_at on public.meta_authorizations;
create trigger set_meta_authorizations_updated_at
before update on public.meta_authorizations
for each row execute procedure public.set_updated_at();

drop trigger if exists set_meta_lead_source_mappings_updated_at on public.meta_lead_source_mappings;
create trigger set_meta_lead_source_mappings_updated_at
before update on public.meta_lead_source_mappings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_message_templates_updated_at on public.message_templates;
create trigger set_message_templates_updated_at
before update on public.message_templates
for each row execute procedure public.set_updated_at();

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute procedure public.set_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute procedure public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

drop trigger if exists set_automation_rules_updated_at on public.automation_rules;
create trigger set_automation_rules_updated_at
before update on public.automation_rules
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  derived_name text;
begin
  derived_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  insert into public.workspaces (name)
  values (derived_name || '''s Workspace')
  returning id into new_workspace_id;

  insert into public.profiles (id, full_name, email)
  values (new.id, derived_name, new.email);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  insert into public.message_templates (workspace_id, name, category, status, language, body)
  values
    (new_workspace_id, 'Order Confirmation', 'utility', 'approved', 'English', 'Hi {{1}}, your order #{{2}} has been confirmed! Track here: {{3}}'),
    (new_workspace_id, 'Diwali Sale Offer', 'marketing', 'approved', 'English', 'Diwali Sale is LIVE! Get up to {{1}}% off on all products. Shop now: {{2}}'),
    (new_workspace_id, 'Cart Reminder', 'marketing', 'pending', 'English', 'Hey {{1}}, you left items in your cart! Complete your purchase before they sell out.'),
    (new_workspace_id, 'Shipping Update', 'utility', 'approved', 'Hindi', 'Hi {{1}}, your order has been shipped! Delivery by {{2}}. Track: {{3}}');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid()
  limit 1;
$$;

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;
alter table public.whatsapp_connections enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_tags enable row level security;
alter table public.message_templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.meta_authorizations enable row level security;
alter table public.meta_webhook_events enable row level security;
alter table public.meta_lead_source_mappings enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.conversation_notes enable row level security;
alter table public.conversation_events enable row level security;
alter table public.leads enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_events enable row level security;
alter table public.failed_send_logs enable row level security;
alter table public.operational_logs enable row level security;
alter table public.processed_webhook_events enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid());

create policy "workspace_members_select_own" on public.workspace_members
for select using (user_id = auth.uid());

create policy "workspaces_select_member" on public.workspaces
for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
  )
);

create policy "whatsapp_connections_workspace_member" on public.whatsapp_connections
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "contacts_workspace_member" on public.contacts
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "contact_tags_workspace_member" on public.contact_tags
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "templates_workspace_member" on public.message_templates
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "campaigns_workspace_member" on public.campaigns
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "campaign_recipients_workspace_member" on public.campaign_recipients
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "meta_authorizations_workspace_member" on public.meta_authorizations
for select using (workspace_id = public.current_workspace_id());

create policy "meta_webhook_events_workspace_member" on public.meta_webhook_events
for select using (workspace_id = public.current_workspace_id());

create policy "meta_lead_source_mappings_workspace_member" on public.meta_lead_source_mappings
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "conversations_workspace_member" on public.conversations
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "conversation_messages_workspace_member" on public.conversation_messages
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "conversation_notes_workspace_member" on public.conversation_notes
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "conversation_events_workspace_member" on public.conversation_events
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "leads_workspace_member" on public.leads
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "automation_rules_workspace_member" on public.automation_rules
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "automation_events_workspace_member" on public.automation_events
for select using (workspace_id = public.current_workspace_id());

create policy "wallet_transactions_workspace_member" on public.wallet_transactions
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "failed_send_logs_workspace_member" on public.failed_send_logs
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "operational_logs_workspace_member" on public.operational_logs
for select using (workspace_id = public.current_workspace_id());

create policy "processed_webhook_events_workspace_member" on public.processed_webhook_events
for select using (workspace_id = public.current_workspace_id());
