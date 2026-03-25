-- SQL Migration: Add automation_flow_runs table
-- This table tracks the state of a lead's journey through an automation flow.

create table if not exists public.automation_flow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'failed', 'paused')),
  current_step integer not null default 0,
  retry_count integer not null default 0,
  scheduled_at timestamptz not null default now(),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for the flow scheduler (sweep) to find due runs efficiently
create index if not exists idx_flow_runs_scheduled_at on public.automation_flow_runs (scheduled_at) where status = 'active';
create index if not exists idx_flow_runs_lead_id on public.automation_flow_runs (lead_id);

-- Trigger for updated_at
drop trigger if exists set_automation_flow_runs_updated_at on public.automation_flow_runs;
create trigger set_automation_flow_runs_updated_at
before update on public.automation_flow_runs
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.automation_flow_runs enable row level security;
create policy "automation_flow_runs_workspace_member" on public.automation_flow_runs
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());
