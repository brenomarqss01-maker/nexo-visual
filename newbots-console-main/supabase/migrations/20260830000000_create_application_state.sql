create extension if not exists pgcrypto with schema extensions;

create table if not exists public.application_state (
  id text primary key check (id = 'primary'),
  database jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.application_state enable row level security;
revoke all on table public.application_state from anon, authenticated;

create or replace function public.load_application_state(p_access_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if digest(coalesce(p_access_token, ''), 'sha256') <>
    decode('76f16e46ea16fa1c8f3c35ffa8f635bf2aa28d4db6b755c7dfb3a96db77216e0', 'hex') then
    raise exception 'Token de acesso inválido.' using errcode = '42501';
  end if;

  return (
    select application_state.database
    from public.application_state
    where application_state.id = 'primary'
  );
end;
$$;

create or replace function public.save_application_state(
  p_access_token text,
  p_database jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if digest(coalesce(p_access_token, ''), 'sha256') <>
    decode('76f16e46ea16fa1c8f3c35ffa8f635bf2aa28d4db6b755c7dfb3a96db77216e0', 'hex') then
    raise exception 'Token de acesso inválido.' using errcode = '42501';
  end if;

  insert into public.application_state (id, database, updated_at)
  values ('primary', p_database, now())
  on conflict (id) do update
  set database = excluded.database,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.load_application_state(text) from public;
revoke all on function public.save_application_state(text, jsonb) from public;
grant execute on function public.load_application_state(text) to anon, authenticated;
grant execute on function public.save_application_state(text, jsonb) to anon, authenticated;
