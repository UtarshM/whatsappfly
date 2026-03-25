-- SQL Migration: Add automation_flow_definitions table and upgrade flow_runs

-- 1. Create automation_flow_definitions table
create table if not exists public.automation_flow_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Upgrade automation_flow_runs to support branching
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'automation_flow_runs' and column_name = 'flow_definition_id') then
    alter table public.automation_flow_runs add column flow_definition_id uuid references public.automation_flow_definitions(id) on delete set null;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'automation_flow_runs' and column_name = 'current_node_id') then
    alter table public.automation_flow_runs add column current_node_id text;
  end if;
end $$;

-- 3. RLS for definitions
alter table public.automation_flow_definitions enable row level security;
create policy "automation_flow_definitions_workspace_member" on public.automation_flow_definitions
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

-- Index for definitions
create index if not exists idx_flow_definitions_workspace_id on public.automation_flow_definitions (workspace_id);
