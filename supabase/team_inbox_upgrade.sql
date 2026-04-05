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

alter table public.conversation_notes enable row level security;
alter table public.conversation_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'conversation_notes' and policyname = 'conversation_notes_workspace_member'
  ) then
    create policy "conversation_notes_workspace_member" on public.conversation_notes
    for all using (workspace_id = public.current_workspace_id())
    with check (workspace_id = public.current_workspace_id());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'conversation_events' and policyname = 'conversation_events_workspace_member'
  ) then
    create policy "conversation_events_workspace_member" on public.conversation_events
    for all using (workspace_id = public.current_workspace_id())
    with check (workspace_id = public.current_workspace_id());
  end if;
end $$;
