-- SQL Migration: Add link_clicks table
-- This table tracks when a customer clicks on a tracked link (e.g., to join a group).

create table if not exists public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  link_code text not null,
  original_url text not null,
  ip_address text,
  user_agent text,
  clicked_at timestamptz not null default now()
);

-- Index for analytics
create index if not exists idx_link_clicks_workspace_code on public.link_clicks (workspace_id, link_code);
create index if not exists idx_link_clicks_clicked_at on public.link_clicks (clicked_at);

-- RLS
alter table public.link_clicks enable row level security;
create policy "link_clicks_workspace_member" on public.link_clicks
for all using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());
