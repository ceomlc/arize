-- ============================================================
-- Arize by AmazeGen — Supabase Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text,
  company text,
  avatar_url text,
  streak_count int default 0,
  last_checkin_date date,
  onboarded boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on user sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CHECK-INS
-- ============================================================
create table if not exists check_ins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  mood text check (mood in ('tense','meh','steady','grounded','thriving')) not null,
  mood_score int check (mood_score between 1 and 5) not null,
  energy int check (energy between 0 and 10) not null,
  emotion_tags text[] default '{}',
  journal_text text,
  created_at timestamptz default now()
);

create index if not exists check_ins_user_id_created_at on check_ins (user_id, created_at desc);

-- ============================================================
-- GOALS
-- ============================================================
create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  category text check (category in ('Career','Wellness','Deliverable','Reflection','Personal')) default 'Personal',
  progress int check (progress between 0 and 100) default 0,
  deadline date,
  week_of date,
  is_complete boolean default false,
  created_at timestamptz default now()
);

create index if not exists goals_user_id_week_of on goals (user_id, week_of desc);

-- ============================================================
-- VILLAGE ROOMS
-- ============================================================
create table if not exists village_rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- Seed default rooms
insert into village_rooms (name, description, is_featured) values
  ('First Gen in Finance', 'Navigating spaces not built for you — together.', true),
  ('Manager Mode', 'Leading while being the only one in the room.', false),
  ('Navigating the Room', 'Microaggressions, politics, and staying whole.', false),
  ('Wins Only', 'Drop your wins here. Big and small. All of them count.', false)
on conflict do nothing;

-- ============================================================
-- VILLAGE MEMBERSHIPS
-- ============================================================
create table if not exists village_memberships (
  user_id uuid references profiles(id) on delete cascade not null,
  room_id uuid references village_rooms(id) on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (user_id, room_id)
);

-- ============================================================
-- VILLAGE MESSAGES
-- ============================================================
create table if not exists village_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references village_rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists village_messages_room_id_created_at on village_messages (room_id, created_at asc);

-- ============================================================
-- FRIDAY REFLECTIONS (placeholder)
-- ============================================================
create table if not exists friday_reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  content text,
  wins text[] default '{}',
  week_of date,
  created_at timestamptz default now()
);

create index if not exists friday_reflections_user_id on friday_reflections (user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: users can only read/update their own
alter table profiles enable row level security;
create policy "profiles: own read" on profiles for select using (auth.uid() = id);
create policy "profiles: own update" on profiles for update using (auth.uid() = id);

-- Check-ins: users can only read/write their own
alter table check_ins enable row level security;
create policy "check_ins: own read" on check_ins for select using (auth.uid() = user_id);
create policy "check_ins: own insert" on check_ins for insert with check (auth.uid() = user_id);

-- Goals: users can only read/write their own
alter table goals enable row level security;
create policy "goals: own read" on goals for select using (auth.uid() = user_id);
create policy "goals: own insert" on goals for insert with check (auth.uid() = user_id);
create policy "goals: own update" on goals for update using (auth.uid() = user_id);
create policy "goals: own delete" on goals for delete using (auth.uid() = user_id);

-- Village rooms: all authenticated users can read
alter table village_rooms enable row level security;
create policy "village_rooms: auth read" on village_rooms for select using (auth.role() = 'authenticated');

-- Village memberships: own read/write
alter table village_memberships enable row level security;
create policy "memberships: own read" on village_memberships for select using (auth.uid() = user_id);
create policy "memberships: own insert" on village_memberships for insert with check (auth.uid() = user_id);
create policy "memberships: own delete" on village_memberships for delete using (auth.uid() = user_id);

-- Village messages: members can read/write room messages
alter table village_messages enable row level security;
create policy "messages: member read" on village_messages for select
  using (
    exists (
      select 1 from village_memberships
      where village_memberships.room_id = village_messages.room_id
      and village_memberships.user_id = auth.uid()
    )
  );
create policy "messages: member insert" on village_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from village_memberships
      where village_memberships.room_id = village_messages.room_id
      and village_memberships.user_id = auth.uid()
    )
  );

-- Friday reflections: own read/write
alter table friday_reflections enable row level security;
create policy "reflections: own read" on friday_reflections for select using (auth.uid() = user_id);
create policy "reflections: own insert" on friday_reflections for insert with check (auth.uid() = user_id);
create policy "reflections: own update" on friday_reflections for update using (auth.uid() = user_id);

-- Enable realtime for village messages
alter publication supabase_realtime add table village_messages;
