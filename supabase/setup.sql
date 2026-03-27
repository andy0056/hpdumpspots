create extension if not exists pgcrypto;

create table if not exists public.reports (
  id text primary key,
  reporter text not null,
  state text not null,
  district text not null,
  area text not null,
  specific text not null default '',
  type text[] not null default '{}'::text[],
  cats text[] not null default '{}'::text[],
  sev text[] not null default '{}'::text[],
  notes text,
  lat double precision not null,
  lng double precision not null,
  digipin text,
  pluscode text,
  gmaps_link text,
  ts timestamptz not null default now()
);

create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  url text not null,
  position integer not null check (position between 1 and 6)
);

create or replace function public.normalize_location()
returns trigger as $$
begin
  new.state := initcap(trim(new.state));
  new.district := initcap(trim(new.district));
  new.area := initcap(trim(new.area));
  new.specific := initcap(trim(new.specific));
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_normalize_location on public.reports;
create trigger trg_normalize_location
before insert or update on public.reports
for each row execute function public.normalize_location();

alter table public.reports enable row level security;
alter table public.report_photos enable row level security;

drop policy if exists "public read reports" on public.reports;
create policy "public read reports"
on public.reports
for select
using (true);

drop policy if exists "public insert reports" on public.reports;
create policy "public insert reports"
on public.reports
for insert
with check (true);

drop policy if exists "public read photos" on public.report_photos;
create policy "public read photos"
on public.report_photos
for select
using (true);

drop policy if exists "public insert photos" on public.report_photos;
create policy "public insert photos"
on public.report_photos
for insert
with check (true);

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "public uploads" on storage.objects;
create policy "public uploads"
on storage.objects
for insert
with check (bucket_id = 'report-photos');

drop policy if exists "public reads" on storage.objects;
create policy "public reads"
on storage.objects
for select
using (bucket_id = 'report-photos');
