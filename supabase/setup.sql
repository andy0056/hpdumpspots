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
  ts timestamptz not null default now(),
  status text not null default 'pending',
  risk_score integer not null default 0,
  risk_flags text[] not null default '{}'::text[],
  public_reporter text not null default '',
  submitter_hash text,
  ip_hash text,
  ua_hash text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.reports
  add column if not exists status text not null default 'pending',
  add column if not exists risk_score integer not null default 0,
  add column if not exists risk_flags text[] not null default '{}'::text[],
  add column if not exists public_reporter text not null default '',
  add column if not exists submitter_hash text,
  add column if not exists ip_hash text,
  add column if not exists ua_hash text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists published_at timestamptz;

alter table public.reports
  drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('pending', 'published', 'rejected'));

create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  url text,
  quarantine_path text,
  public_path text,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  position integer not null check (position between 1 and 6)
);

alter table public.report_photos
  alter column url drop not null;

alter table public.report_photos
  add column if not exists quarantine_path text,
  add column if not exists public_path text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists sha256 text;

alter table public.report_photos
  drop constraint if exists report_photos_report_id_position_key;
alter table public.report_photos
  add constraint report_photos_report_id_position_key
  unique (report_id, position);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  action text not null,
  reason text,
  reviewer text not null default 'dashboard',
  created_at timestamptz not null default now()
);

alter table public.moderation_actions
  drop constraint if exists moderation_actions_action_check;
alter table public.moderation_actions
  add constraint moderation_actions_action_check
  check (action in ('approve', 'reject'));

create table if not exists public.submission_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  outcome text not null,
  submitter_hash text,
  ip_hash text,
  ua_hash text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reports_status_created_at_idx
  on public.reports (status, created_at desc);
create index if not exists reports_district_created_at_idx
  on public.reports (district, created_at desc);
create index if not exists reports_ip_hash_created_at_idx
  on public.reports (ip_hash, created_at desc);
create index if not exists report_photos_sha256_idx
  on public.report_photos (sha256);
create index if not exists submission_events_action_ip_hash_created_at_idx
  on public.submission_events (action, ip_hash, created_at desc);

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

update public.reports
set
  status = 'published',
  public_reporter = case
    when char_length(trim(reporter)) <= 1 then trim(reporter) || '*'
    when char_length(trim(reporter)) = 2 then trim(reporter) || '*'
    else left(trim(reporter), 2) || repeat('*', least(6, char_length(trim(reporter)) - 2))
  end,
  created_at = coalesce(created_at, ts, now()),
  published_at = coalesce(published_at, ts, created_at, now())
where status = 'pending'
  and coalesce(public_reporter, '') = ''
  and submitter_hash is null
  and ip_hash is null
  and ua_hash is null;

create or replace view public.public_report_feed as
select
  r.id,
  r.public_reporter as reporter,
  r.state,
  r.district,
  r.area,
  r.specific,
  r.type,
  r.cats,
  r.sev,
  r.notes,
  r.lat,
  r.lng,
  r.digipin,
  r.pluscode,
  r.gmaps_link,
  coalesce(r.published_at, r.ts, r.created_at) as ts,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('url', rp.url, 'position', rp.position)
        order by rp.position
      )
      from public.report_photos rp
      where rp.report_id = r.id
        and rp.url is not null
    ),
    '[]'::jsonb
  ) as photos
from public.reports r
where r.status = 'published';

create or replace view public.moderation_queue as
select
  r.id,
  r.created_at,
  r.district,
  r.area,
  r.specific,
  r.notes,
  r.cats,
  r.sev,
  r.risk_score,
  r.risk_flags,
  r.public_reporter,
  r.gmaps_link,
  r.lat,
  r.lng,
  (
    select jsonb_agg(
      jsonb_build_object(
        'position', rp.position,
        'quarantine_path', rp.quarantine_path,
        'mime_type', rp.mime_type,
        'size_bytes', rp.size_bytes
      )
      order by rp.position
    )
    from public.report_photos rp
    where rp.report_id = r.id
  ) as photos
from public.reports r
where r.status = 'pending'
order by r.created_at desc;

alter table public.reports enable row level security;
alter table public.report_photos enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.submission_events enable row level security;

drop policy if exists "public read reports" on public.reports;
drop policy if exists "public insert reports" on public.reports;
drop policy if exists "public read photos" on public.report_photos;
drop policy if exists "public insert photos" on public.report_photos;

revoke all on table public.reports from anon, authenticated;
revoke all on table public.report_photos from anon, authenticated;
revoke all on table public.moderation_actions from anon, authenticated;
revoke all on table public.submission_events from anon, authenticated;

grant select on public.public_report_feed to anon, authenticated;

insert into storage.buckets (id, name, public)
values
  ('report-photos-quarantine', 'report-photos-quarantine', false),
  ('report-photos-public', 'report-photos-public', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "public uploads" on storage.objects;
drop policy if exists "public reads" on storage.objects;
drop policy if exists "public reads public photos" on storage.objects;

create policy "public reads public photos"
on storage.objects
for select
using (bucket_id = 'report-photos-public');
