do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'business_verification_status'
  ) then
    create type public.business_verification_status as enum ('unverified', 'in_review', 'verified');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'account_review_status'
  ) then
    create type public.account_review_status as enum ('pending_review', 'in_review', 'approved', 'rejected');
  end if;

  if not exists (
    select 1 from pg_type where typname = 'oba_status'
  ) then
    create type public.oba_status as enum ('not_applied', 'pending', 'approved', 'rejected');
  end if;
end $$;

alter table public.whatsapp_connections
  add column if not exists meta_business_id text,
  add column if not exists display_phone_number text,
  add column if not exists verified_name text,
  add column if not exists business_verification_status public.business_verification_status not null default 'unverified',
  add column if not exists account_review_status public.account_review_status not null default 'pending_review',
  add column if not exists oba_status public.oba_status not null default 'not_applied';

update public.whatsapp_connections
set display_phone_number = coalesce(display_phone_number, phone_number)
where display_phone_number is null;
