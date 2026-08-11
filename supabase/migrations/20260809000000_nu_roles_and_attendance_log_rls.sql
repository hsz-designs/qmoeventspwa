-- Normalize NU application roles and protect user/attendance records by role.
-- Role 1 = attendee, role 2 = admin.

update public.nu_users
set "role" = 1
where "role" is null or "role" not in (1, 2);

alter table public.nu_users
  alter column "role" set default 1,
  alter column "role" set not null;

alter table public.nu_users
  drop constraint if exists nu_users_role_check;

alter table public.nu_users
  add constraint nu_users_role_check check ("role" in (1, 2));

create or replace function public.current_nu_user_role()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select "role"
  from public.nu_users
  where "userID" = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_nu_user_role() from public;
grant execute on function public.current_nu_user_role() to authenticated;

drop policy if exists "Authenticated users can read nu_users" on public.nu_users;
drop policy if exists "Authenticated users can create nu_users" on public.nu_users;
drop policy if exists "Authenticated users can update nu_users" on public.nu_users;
drop policy if exists "Authenticated users can delete nu_users" on public.nu_users;
drop policy if exists "Users read own nu_user; admins read all" on public.nu_users;
drop policy if exists "Admins create nu_users" on public.nu_users;
drop policy if exists "Admins update nu_users" on public.nu_users;
drop policy if exists "Admins delete nu_users" on public.nu_users;

create policy "Users read own nu_user; admins read all"
on public.nu_users for select to authenticated
using (
  "userID" = (select auth.uid())
  or (select public.current_nu_user_role()) = 2
);

create policy "Admins create nu_users"
on public.nu_users for insert to authenticated
with check ((select public.current_nu_user_role()) = 2);

create policy "Admins update nu_users"
on public.nu_users for update to authenticated
using ((select public.current_nu_user_role()) = 2)
with check ((select public.current_nu_user_role()) = 2);

create policy "Admins delete nu_users"
on public.nu_users for delete to authenticated
using ((select public.current_nu_user_role()) = 2);

do $$
begin
  if to_regclass('public.nu_event_attendees_log') is not null then
    execute 'alter table public.nu_event_attendees_log enable row level security';
    execute 'drop policy if exists "Authenticated users can read nu_event_attendees_log" on public.nu_event_attendees_log';
    execute 'drop policy if exists "Authenticated users can create nu_event_attendees_log" on public.nu_event_attendees_log';
    execute 'drop policy if exists "Authenticated users can update nu_event_attendees_log" on public.nu_event_attendees_log';
    execute 'drop policy if exists "Authenticated users can delete nu_event_attendees_log" on public.nu_event_attendees_log';
    execute 'drop policy if exists "Users read own event attendance logs; admins read all" on public.nu_event_attendees_log';
    execute 'drop policy if exists "Admins create event attendance logs" on public.nu_event_attendees_log';
    execute 'drop policy if exists "Admins update event attendance logs" on public.nu_event_attendees_log';
    execute 'drop policy if exists "Admins delete event attendance logs" on public.nu_event_attendees_log';
    execute 'create policy "Users read own event attendance logs; admins read all" on public.nu_event_attendees_log for select to authenticated using ("user_id" = (select auth.uid()) or (select public.current_nu_user_role()) = 2)';
    execute 'create policy "Admins create event attendance logs" on public.nu_event_attendees_log for insert to authenticated with check ((select public.current_nu_user_role()) = 2)';
    execute 'create policy "Admins update event attendance logs" on public.nu_event_attendees_log for update to authenticated using ((select public.current_nu_user_role()) = 2) with check ((select public.current_nu_user_role()) = 2)';
    execute 'create policy "Admins delete event attendance logs" on public.nu_event_attendees_log for delete to authenticated using ((select public.current_nu_user_role()) = 2)';
  end if;
end
$$;

-- Some deployments use the shorter table name requested by the application.
-- Apply the same policies there when that table exists.
do $$
begin
  if to_regclass('public.nu_attendees_log') is not null then
    execute 'alter table public.nu_attendees_log enable row level security';
    execute 'drop policy if exists "Authenticated users can read nu_attendees_log" on public.nu_attendees_log';
    execute 'drop policy if exists "Authenticated users can create nu_attendees_log" on public.nu_attendees_log';
    execute 'drop policy if exists "Authenticated users can update nu_attendees_log" on public.nu_attendees_log';
    execute 'drop policy if exists "Authenticated users can delete nu_attendees_log" on public.nu_attendees_log';
    execute 'drop policy if exists "Users read own attendance logs; admins read all" on public.nu_attendees_log';
    execute 'drop policy if exists "Admins create attendance logs" on public.nu_attendees_log';
    execute 'drop policy if exists "Admins update attendance logs" on public.nu_attendees_log';
    execute 'drop policy if exists "Admins delete attendance logs" on public.nu_attendees_log';
    execute 'create policy "Users read own attendance logs; admins read all" on public.nu_attendees_log for select to authenticated using ("user_id" = (select auth.uid()) or (select public.current_nu_user_role()) = 2)';
    execute 'create policy "Admins create attendance logs" on public.nu_attendees_log for insert to authenticated with check ((select public.current_nu_user_role()) = 2)';
    execute 'create policy "Admins update attendance logs" on public.nu_attendees_log for update to authenticated using ((select public.current_nu_user_role()) = 2) with check ((select public.current_nu_user_role()) = 2)';
    execute 'create policy "Admins delete attendance logs" on public.nu_attendees_log for delete to authenticated using ((select public.current_nu_user_role()) = 2)';
  end if;
end
$$;
