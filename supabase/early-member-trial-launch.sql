-- RUN ONLY ON THE AGREED BILLING LAUNCH DATE.
-- Replace NULL below with the actual launch timestamp. The trial end is
-- calculated as exactly 14 days later. Until edited, this script fails safely.

do $$
declare
  launch_at timestamptz := null; -- Example: timestamptz '2026-10-01 09:00:00-04'
begin
  if launch_at is null then
    raise exception 'Set launch_at before creating early-member trials';
  end if;

  insert into public.access_grants (
    user_id,
    plan,
    source,
    status,
    starts_at,
    ends_at,
    metadata
  )
  select
    profile.id,
    'plus',
    'early_member_trial',
    'active',
    launch_at,
    launch_at + interval '14 days',
    jsonb_build_object('reason', 'early_member_complimentary_trial')
  from public.profiles profile
  where profile.created_at < launch_at
    and not exists (
      select 1
      from public.access_grants existing
      where existing.user_id = profile.id
        and existing.source = 'early_member_trial'
    );
end;
$$;
