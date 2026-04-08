-- Prezzie: Invite System Migration
-- Add invited_by column to profiles and create friends table

begin;

-- =====================================================
-- 1) Add invited_by column to profiles table
-- =====================================================
alter table public.profiles 
add column invited_by uuid references public.profiles(id) on delete set null;

-- Create index for invited_by lookups
create index if not exists idx_profiles_invited_by on public.profiles(invited_by);

-- =====================================================
-- 2) Create friends table
-- =====================================================
create table if not exists public.friends (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  
  -- Ensure no duplicate friendships
  unique(user_id, friend_id),
  
  -- Prevent self-friendship
  constraint no_self_friend check (user_id != friend_id)
);

-- Enable RLS on friends table
alter table public.friends enable row level security;

-- =====================================================
-- 3) Create RLS policies for friends table
-- =====================================================
-- Drop existing policies if they exist
drop policy if exists "friends_select_own" on public.friends;
drop policy if exists "friends_insert_own" on public.friends;
drop policy if exists "friends_delete_own" on public.friends;

-- Users can only see their own friendships
create policy "friends_select_own"
on public.friends
for select
to authenticated
using (auth.uid() = user_id);

-- Users can only insert their own friendships
create policy "friends_insert_own"
on public.friends
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can only delete their own friendships
create policy "friends_delete_own"
on public.friends
for delete
to authenticated
using (auth.uid() = user_id);

-- =====================================================
-- 4) Create index on friends table for performance
-- =====================================================
create index if not exists idx_friends_user_id on public.friends(user_id);
create index if not exists idx_friends_friend_id on public.friends(friend_id);

commit;
