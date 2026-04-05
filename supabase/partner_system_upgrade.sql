-- =============================================================
-- Partner System Upgrade
-- =============================================================

-- Partners table
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  partner_type text not null default 'affiliate',
  status text not null default 'pending',
  company_name text,
  contact_name text not null,
  email text not null,
  phone text,
  commission_rate numeric(5,2) not null default 20.00,
  tier text not null default 'standard',
  referral_code text unique,
  total_referrals integer default 0,
  total_earned numeric(12,2) default 0,
  total_paid numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partner Referrals table
create table public.partner_referrals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  referred_email text not null,
  referred_workspace_id uuid references public.workspaces(id),
  status text not null default 'pending',
  commission_amount numeric(12,2) default 0,
  converted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Partner Payouts table
create table public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  amount numeric(12,2) not null,
  status text not null default 'pending',
  payment_method text,
  payment_details jsonb,
  notes text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_partners_workspace on public.partners(workspace_id);
create index idx_partners_user on public.partners(user_id);
create index idx_partners_referral_code on public.partners(referral_code);
create index idx_partners_status on public.partners(status);
create index idx_partner_referrals_partner on public.partner_referrals(partner_id);
create index idx_partner_referrals_workspace on public.partner_referrals(workspace_id);
create index idx_partner_payouts_partner on public.partner_payouts(partner_id);
create index idx_partner_payouts_workspace on public.partner_payouts(workspace_id);

-- Updated at triggers
drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at
before update on public.partners
for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public.partners enable row level security;
alter table public.partner_referrals enable row level security;
alter table public.partner_payouts enable row level security;

-- Partners RLS policies
create policy "partners_workspace_read" on public.partners
  for select using (
    workspace_id = public.current_workspace_id()
    or user_id = auth.uid()
  );

create policy "partners_insert" on public.partners
  for insert with check (user_id = auth.uid());

create policy "partners_update" on public.partners
  for update using (
    workspace_id = public.current_workspace_id()
  );

-- Partner Referrals RLS policies
create policy "partner_referrals_workspace_member" on public.partner_referrals
  for all using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());

-- Partner Payouts RLS policies
create policy "partner_payouts_workspace_member" on public.partner_payouts
  for all using (workspace_id = public.current_workspace_id())
  with check (workspace_id = public.current_workspace_id());
