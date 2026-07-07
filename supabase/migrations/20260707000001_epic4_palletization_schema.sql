-- Epic 4 — Palletization & Cold Storage: cold_rooms, pallets,
-- pallet_split_log, pallet_run_contents, cold_storage_logs.
--
-- SSCC note (Open Item, plan §14): GS1 SSCC adoption vs internal IDs is an
-- undecided stakeholder question. Per the security rules the PK stays a
-- non-sequential UUID; pallet_code is a human-readable non-sequential label
-- for the floor/labels, and a nullable sscc column is reserved so real GS1
-- codes can be backfilled without a schema change once that call is made.
--
-- Split model (PALLET-002): pallet_run_contents is immutable (the plan's
-- immutability rule explicitly covers pallet contents), so a split never
-- edits the original pallet's rows. Instead it creates a pallet_split_log
-- event plus new content rows on the new pallet tagged with split_id.
-- Current contents of the original = its content rows minus rows moved out
-- via splits; both fragments keep composite-FK lineage to the same runs.

create table cold_rooms (
  cold_room_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  name text not null,
  target_temp_c numeric,
  created_at timestamptz not null default now(),
  unique (org_id, cold_room_id),
  unique (org_id, name)
);
alter table cold_rooms enable row level security;
create index cold_rooms_org_id_idx on cold_rooms (org_id);

create table pallets (
  pallet_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  pallet_code text not null default ('PLT-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  sscc text,
  status text not null default 'open' check (status in ('open', 'closed')),
  cold_room_id uuid,
  built_by uuid references auth.users (id) on delete set null,
  build_datetime timestamptz not null default now(),
  closed_at timestamptz,
  unique (org_id, pallet_id),
  unique (org_id, pallet_code),
  foreign key (org_id, cold_room_id) references cold_rooms (org_id, cold_room_id)
);
alter table pallets enable row level security;
create index pallets_org_id_idx on pallets (org_id);
create index pallets_cold_room_id_idx on pallets (cold_room_id);

create table pallet_split_log (
  split_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  original_pallet_id uuid not null,
  new_pallet_id uuid not null,
  reason text not null,
  split_by uuid references auth.users (id) on delete set null,
  split_datetime timestamptz not null default now(),
  unique (org_id, split_id),
  foreign key (org_id, original_pallet_id) references pallets (org_id, pallet_id),
  foreign key (org_id, new_pallet_id) references pallets (org_id, pallet_id),
  check (original_pallet_id <> new_pallet_id)
);
alter table pallet_split_log enable row level security;
create index pallet_split_log_org_id_idx on pallet_split_log (org_id);
create index pallet_split_log_original_idx on pallet_split_log (original_pallet_id);
create index pallet_split_log_new_idx on pallet_split_log (new_pallet_id);

create table pallet_run_contents (
  content_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  pallet_id uuid not null,
  run_id uuid not null,
  size_grade text not null,
  box_count int not null check (box_count > 0),
  total_weight_kg numeric not null check (total_weight_kg > 0),
  split_id uuid,
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (org_id, pallet_id) references pallets (org_id, pallet_id),
  foreign key (org_id, run_id) references processing_runs (org_id, run_id),
  foreign key (org_id, split_id) references pallet_split_log (org_id, split_id)
);
alter table pallet_run_contents enable row level security;
create index pallet_run_contents_org_id_idx on pallet_run_contents (org_id);
create index pallet_run_contents_pallet_id_idx on pallet_run_contents (pallet_id);
create index pallet_run_contents_run_id_idx on pallet_run_contents (run_id);
create index pallet_run_contents_split_id_idx on pallet_run_contents (split_id);

create table cold_storage_logs (
  log_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  cold_room_id uuid not null,
  temp_c numeric not null,
  humidity_pct numeric check (humidity_pct >= 0 and humidity_pct <= 100),
  source text not null default 'manual' check (source in ('manual', 'feed')),
  recorded_by uuid references auth.users (id) on delete set null,
  recorded_at timestamptz not null default now(),
  foreign key (org_id, cold_room_id) references cold_rooms (org_id, cold_room_id)
);
alter table cold_storage_logs enable row level security;
create index cold_storage_logs_org_id_idx on cold_storage_logs (org_id);
create index cold_storage_logs_room_time_idx on cold_storage_logs (cold_room_id, recorded_at);
