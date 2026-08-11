-- QMO NU Manila Events: initial Supabase schema
-- Run with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.event_category as enum ('Training', 'Seminar', 'Workshop', 'Orientation', 'Community');
create type public.registration_status as enum ('registered', 'attended', 'cancelled', 'no_show');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  student_number text unique,
  program text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category public.event_category not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text not null,
  capacity integer not null check (capacity > 0),
  image_url text,
  image_tone text not null default 'blue' check (image_tone in ('blue', 'gold', 'teal', 'violet', 'coral')),
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_dates_valid check (ends_at is null or ends_at > starts_at)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  attended_at timestamptz,
  unique (profile_id, event_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  certificate_number text not null unique,
  download_url text,
  issued_at timestamptz not null default now(),
  unique (profile_id, event_id)
);

create index events_starts_at_idx on public.events (starts_at);
create index events_published_idx on public.events (is_published) where is_published = true;
create index registrations_profile_idx on public.registrations (profile_id);
create index registrations_event_idx on public.registrations (event_id);
create index certificates_profile_idx on public.certificates (profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, student_number, program)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'student_number',
    new.raw_user_meta_data ->> 'program'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_event_overbooking()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  seat_capacity integer;
  seats_taken integer;
begin
  select capacity into seat_capacity
  from public.events
  where id = new.event_id and is_published = true and starts_at > now()
  for update;

  if seat_capacity is null then
    raise exception 'This event is not available for registration.';
  end if;

  select count(*) into seats_taken
  from public.registrations
  where event_id = new.event_id and status in ('registered', 'attended');

  if seats_taken >= seat_capacity then
    raise exception 'This event has reached its capacity.';
  end if;

  return new;
end;
$$;

create trigger registrations_check_capacity
before insert on public.registrations
for each row execute function public.prevent_event_overbooking();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.certificates enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Authenticated users can read published events"
on public.events for select
to authenticated
using (is_published = true);

create policy "Users can read their own registrations"
on public.registrations for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "Users can register themselves"
on public.registrations for insert
to authenticated
with check ((select auth.uid()) = profile_id and status = 'registered');

create policy "Users can cancel their own registration"
on public.registrations for delete
to authenticated
using ((select auth.uid()) = profile_id and status = 'registered');

create policy "Users can read their own certificates"
on public.certificates for select
to authenticated
using ((select auth.uid()) = profile_id);

-- Add event records through the Supabase dashboard or a trusted admin backend.
-- Admin writes intentionally rely on the service role, which bypasses RLS.
