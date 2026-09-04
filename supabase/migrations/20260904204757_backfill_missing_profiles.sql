-- Users created before the profile trigger was installed can otherwise fail
-- legal-consent and every feature whose rows reference public.profiles.
-- Preserve any existing profile data and only create genuinely missing rows.
insert into public.profiles (id, name, avatar_url)
select
  users.id,
  coalesce(
    users.raw_user_meta_data->>'full_name',
    users.raw_user_meta_data->>'name'
  ),
  users.raw_user_meta_data->>'avatar_url'
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
)
on conflict (id) do nothing;
