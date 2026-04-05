alter table if exists public.meta_authorizations enable row level security;
alter table if exists public.meta_webhook_events enable row level security;

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

drop trigger if exists set_meta_authorizations_updated_at on public.meta_authorizations;
create trigger set_meta_authorizations_updated_at
before update on public.meta_authorizations
for each row execute procedure public.set_updated_at();

drop trigger if exists set_meta_lead_source_mappings_updated_at on public.meta_lead_source_mappings;
create trigger set_meta_lead_source_mappings_updated_at
before update on public.meta_lead_source_mappings
for each row execute procedure public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_authorizations'
      and policyname = 'meta_authorizations_workspace_member'
  ) then
    create policy "meta_authorizations_workspace_member" on public.meta_authorizations
    for select using (workspace_id = public.current_workspace_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_webhook_events'
      and policyname = 'meta_webhook_events_workspace_member'
  ) then
    create policy "meta_webhook_events_workspace_member" on public.meta_webhook_events
    for select using (workspace_id = public.current_workspace_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'meta_lead_source_mappings'
      and policyname = 'meta_lead_source_mappings_workspace_member'
  ) then
    create policy "meta_lead_source_mappings_workspace_member" on public.meta_lead_source_mappings
    for all using (workspace_id = public.current_workspace_id())
    with check (workspace_id = public.current_workspace_id());
  end if;
end $$;
