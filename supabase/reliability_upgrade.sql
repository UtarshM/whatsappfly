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

alter table public.failed_send_logs enable row level security;
alter table public.operational_logs enable row level security;
alter table public.processed_webhook_events enable row level security;

drop policy if exists "failed_send_logs_workspace_member" on public.failed_send_logs;
create policy "failed_send_logs_workspace_member" on public.failed_send_logs
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

drop policy if exists "operational_logs_workspace_member" on public.operational_logs;
create policy "operational_logs_workspace_member" on public.operational_logs
for select using (workspace_id = public.current_workspace_id());

drop policy if exists "processed_webhook_events_workspace_member" on public.processed_webhook_events;
create policy "processed_webhook_events_workspace_member" on public.processed_webhook_events
for select using (workspace_id = public.current_workspace_id());
