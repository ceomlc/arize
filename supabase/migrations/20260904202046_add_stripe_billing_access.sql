-- Stripe billing access is server-controlled. Authenticated users can read only
-- their own access/customer records, while webhook state is service-role only.

create table if not exists public.coach_requests (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

create index if not exists coach_requests_user_id_created_at
  on public.coach_requests (user_id, created_at desc);

alter table public.coach_requests enable row level security;
revoke all on table public.coach_requests from anon, authenticated;
grant all on table public.coach_requests to service_role;
grant usage, select on sequence public.coach_requests_id_seq to service_role;

create table if not exists public.access_grants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null default 'plus' check (plan in ('core', 'plus')),
  source text not null check (source in ('early_member_trial', 'checkout_trial', 'subscription', 'admin')),
  status text not null default 'active' check (status in ('scheduled', 'active', 'expired', 'revoked')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists access_grants_user_status_dates
  on public.access_grants (user_id, status, starts_at desc, ends_at);

create unique index if not exists access_grants_external_reference_unique
  on public.access_grants (external_reference);

alter table public.access_grants enable row level security;
drop policy if exists "access grants: own read" on public.access_grants;
create policy "access grants: own read" on public.access_grants for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.access_grants from anon, authenticated;
grant select on table public.access_grants to authenticated;
grant all on table public.access_grants to service_role;

create table if not exists public.billing_customers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;
drop policy if exists "billing customers: own read" on public.billing_customers;
create policy "billing customers: own read" on public.billing_customers for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.billing_customers from anon, authenticated;
grant select on table public.billing_customers to authenticated;
grant all on table public.billing_customers to service_role;

create table if not exists public.billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.billing_webhook_events enable row level security;
revoke all on table public.billing_webhook_events from anon, authenticated;
grant all on table public.billing_webhook_events to service_role;

create or replace function public.claim_billing_webhook_event(
  p_event_id text,
  p_event_type text,
  p_livemode boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  was_claimed boolean := false;
begin
  insert into public.billing_webhook_events (event_id, event_type, livemode)
  values (p_event_id, p_event_type, p_livemode)
  on conflict (event_id) do update set
    status = 'processing',
    attempt_count = public.billing_webhook_events.attempt_count + 1,
    error = null,
    updated_at = now()
  where public.billing_webhook_events.status = 'failed'
     or (
       public.billing_webhook_events.status = 'processing'
       and public.billing_webhook_events.updated_at < now() - interval '10 minutes'
     )
  returning true into was_claimed;

  return coalesce(was_claimed, false);
end;
$$;

revoke all on function public.claim_billing_webhook_event(text, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_billing_webhook_event(text, text, boolean) to service_role;

create or replace function public.consume_coach_quota_for_plan(
  p_daily_limit integer,
  p_monthly_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  effective_daily_limit integer := greatest(1, least(p_daily_limit, 30));
  effective_monthly_limit integer := greatest(1, least(p_monthly_limit, 300));
  minute_count integer;
  day_count integer;
  month_count integer;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select count(*) into minute_count
  from public.coach_requests
  where user_id = current_user_id and created_at >= now() - interval '1 minute';
  if minute_count >= 10 then
    return jsonb_build_object('allowed', false, 'retry_after_seconds', 60, 'limit', 'minute');
  end if;

  select count(*) into day_count
  from public.coach_requests
  where user_id = current_user_id and created_at >= now() - interval '1 day';
  if day_count >= effective_daily_limit then
    return jsonb_build_object('allowed', false, 'retry_after_seconds', 3600, 'limit', 'day');
  end if;

  select count(*) into month_count
  from public.coach_requests
  where user_id = current_user_id and created_at >= date_trunc('month', now());
  if month_count >= effective_monthly_limit then
    return jsonb_build_object('allowed', false, 'retry_after_seconds', 86400, 'limit', 'month');
  end if;

  insert into public.coach_requests (user_id) values (current_user_id);
  delete from public.coach_requests
  where user_id = current_user_id and created_at < date_trunc('month', now());

  return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
end;
$$;

revoke all on function public.consume_coach_quota_for_plan(integer, integer) from public, anon, authenticated;
grant execute on function public.consume_coach_quota_for_plan(integer, integer) to authenticated;
