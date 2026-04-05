do $$
begin
  if not exists (select 1 from pg_type where typname = 'conversation_status') then
    create type public.conversation_status as enum ('open', 'pending', 'resolved');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_direction') then
    create type public.message_direction as enum ('inbound', 'outbound');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_source') then
    create type public.lead_source as enum ('meta_ads', 'whatsapp_inbound', 'campaign', 'manual', 'organic');
  end if;
end $$;

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

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.leads enable row level security;

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute procedure public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'conversations' and policyname = 'conversations_workspace_member'
  ) then
    create policy "conversations_workspace_member" on public.conversations
    for all using (workspace_id = public.current_workspace_id())
    with check (workspace_id = public.current_workspace_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'conversation_messages' and policyname = 'conversation_messages_workspace_member'
  ) then
    create policy "conversation_messages_workspace_member" on public.conversation_messages
    for all using (workspace_id = public.current_workspace_id())
    with check (workspace_id = public.current_workspace_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_workspace_member'
  ) then
    create policy "leads_workspace_member" on public.leads
    for all using (workspace_id = public.current_workspace_id())
    with check (workspace_id = public.current_workspace_id());
  end if;
end $$;
