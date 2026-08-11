-- Keep every NU user QR value identical to its Supabase Authentication UUID.

create or replace function public.sync_nu_user_qr_code_to_auth_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new."user_qr_code" := new."userID"::text;
  return new;
end;
$$;

drop trigger if exists nu_users_sync_qr_to_auth_id on public.nu_users;

create trigger nu_users_sync_qr_to_auth_id
before insert or update of "userID", "user_qr_code"
on public.nu_users
for each row
execute function public.sync_nu_user_qr_code_to_auth_id();

update public.nu_users
set "user_qr_code" = "userID"::text
where "userID" is not null
  and "user_qr_code" is distinct from "userID"::text;
