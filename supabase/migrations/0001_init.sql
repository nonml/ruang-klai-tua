-- Civic Info Hub TH - minimal schema (MVP)
-- Requires: pgcrypto (gen_random_uuid)

create extension if not exists pgcrypto;

-- reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  school_name text,
  category text not null,
  severity text not null check (severity in ('LOW','MEDIUM','HIGH')),
  note text,
  lat double precision not null,
  lng double precision not null,
  observed_at timestamptz not null,
  status text not null check (status in ('PENDING','VERIFIED','HELD','HIDDEN')) default 'PENDING',
  risk_score double precision,
  risk_reasons text[],

  confirm_count int not null default 0,
  flag_count int not null default 0
);

-- Simple RPC for MVP: confirm / flag
create or replace function public.confirm_report(report_id uuid)
returns public.reports
language plpgsql
as $$
declare
  r public.reports;
begin
  update public.reports
    set confirm_count = confirm_count + 1,
        status = case when (confirm_count + 1) >= 2 and status = 'PENDING' then 'VERIFIED' else status end
    where id = report_id
    returning * into r;

  return r;
end;
$$;

create or replace function public.flag_report(report_id uuid)
returns public.reports
language plpgsql
as $$
declare
  r public.reports;
begin
  update public.reports
    set flag_count = flag_count + 1,
        status = case when (flag_count + 1) >= 3 then 'HIDDEN' else status end
    where id = report_id
    returning * into r;

  return r;
end;
$$;

-- RLS: MVP note
-- For quick local dev, you can disable RLS. For production, implement auth-based policies.
alter table public.reports enable row level security;

-- Public read: allow select on non-hidden (MVP). Tighten later.
create policy "public_read_reports"
on public.reports
for select
using (status <> 'HIDDEN');

-- Public insert: allow for now (MVP). Replace with auth + rate limit.
create policy "public_insert_reports"
on public.reports
for insert
with check (true);

-- Block update/delete by default (only via RPC in MVP)
