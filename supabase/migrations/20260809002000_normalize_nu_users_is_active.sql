-- Match the production nu_users status representation: 1 = active, 0 = inactive.

alter table public.nu_users
  alter column "is_active" type bigint
  using (
    case
      when "is_active" is null then null
      when lower("is_active"::text) in ('1', 't', 'true') then 1
      else 0
    end
  );

alter table public.nu_users
  alter column "is_active" set default 1;

alter table public.nu_users
  drop constraint if exists nu_users_is_active_check;

alter table public.nu_users
  add constraint nu_users_is_active_check check ("is_active" in (0, 1));
