-- Prezzie: RLS setup voor gifts, profiles en wishlists
-- Uit te voeren in de Supabase SQL Editor

begin;

-- =====================================================
-- 1) RLS aanzetten op alle relevante tabellen
-- =====================================================
alter table public.gifts enable row level security;
alter table public.profiles enable row level security;
alter table public.wishlists enable row level security;

-- =====================================================
-- 2) Oude policies opruimen (veilig opnieuw uitvoerbaar)
-- =====================================================
drop policy if exists "gifts_select_authenticated" on public.gifts;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "wishlists_select_own" on public.wishlists;
drop policy if exists "wishlists_insert_own" on public.wishlists;
drop policy if exists "wishlists_update_own" on public.wishlists;
drop policy if exists "wishlists_delete_own" on public.wishlists;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

-- =====================================================
-- 3) gifts: iedereen die is ingelogd mag cadeaus lezen
-- =====================================================
create policy "gifts_select_authenticated"
on public.gifts
for select
to authenticated
using (true);

-- =====================================================
-- 4) profiles: gebruiker beheert alleen zijn eigen profiel
-- =====================================================
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- =====================================================
-- 5) wishlists: gebruiker ziet/beheert alleen eigen rows
-- =====================================================
create policy "wishlists_select_own"
on public.wishlists
for select
to authenticated
using (auth.uid() = user_id);

create policy "wishlists_insert_own"
on public.wishlists
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "wishlists_update_own"
on public.wishlists
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wishlists_delete_own"
on public.wishlists
for delete
to authenticated
using (auth.uid() = user_id);

-- Zorg dat dezelfde gift niet dubbel in een wishlist komt
create unique index if not exists wishlists_user_id_gift_id_key
on public.wishlists (user_id, gift_id);

-- =====================================================
-- 6) Automatisch profiel aanmaken bij nieuwe gebruiker
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, username, full_name, avatar_url)
	values (
		new.id,
		nullif(new.raw_user_meta_data->>'username', ''),
		coalesce(
			nullif(new.raw_user_meta_data->>'full_name', ''),
			nullif(new.raw_user_meta_data->>'name', '')
		),
		coalesce(
			nullif(new.raw_user_meta_data->>'avatar_url', ''),
			nullif(new.raw_user_meta_data->>'picture', '')
		)
	)
	on conflict (id) do update
	set
		updated_at = timezone('utc'::text, now()),
		username = coalesce(excluded.username, public.profiles.username),
		full_name = coalesce(excluded.full_name, public.profiles.full_name),
		avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =====================================================
-- 7) Supabase Storage bucket voor profielfoto's
-- =====================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = true;

create policy "avatars_select_public"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'avatars'
	and split_part(name, '/', 1) = auth.uid()::text
);

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
	bucket_id = 'avatars'
	and split_part(name, '/', 1) = auth.uid()::text
)
with check (
	bucket_id = 'avatars'
	and split_part(name, '/', 1) = auth.uid()::text
);

create policy "avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'avatars'
	and split_part(name, '/', 1) = auth.uid()::text
);

commit;
