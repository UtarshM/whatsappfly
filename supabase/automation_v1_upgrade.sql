do $$
begin
  if not exists (select 1 from pg_type where typname = 'automation_rule_type') then
    create type public.automation_rule_type as enum ('auto_reply_first_inbound', 'auto_assign_new_lead', 'no_reply_reminder', 'follow_up_after_contacted');
  end if;
end $$;

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

alter table public.automation_rules enable row level security;
alter table public.automation_events enable row level security;

drop trigger if exists set_automation_rules_updated_at on public.automation_rules;
create trigger set_automation_rules_updated_at
before update on public.automation_rules
for each row execute procedure public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'automation_rules' and policyname = 'automation_rules_workspace_member'
  ) then
    create policy "automation_rules_workspace_member" on public.automation_rules
    for all using (workspace_id = public.current_workspace_id())
    with check (workspace_id = public.current_workspace_id());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'automation_events' and policyname = 'automation_events_workspace_member'
  ) then
    create policy "automation_events_workspace_member" on public.automation_events
    for select using (workspace_id = public.current_workspace_id());
  end if;
end $$;
