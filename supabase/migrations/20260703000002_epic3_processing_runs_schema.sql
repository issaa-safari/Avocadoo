-- Epic 3 — Processing, Runs & Mass Balance: processing_runs, packed_units.
-- station is free text for now (matches org_settings.pack_table_list being
-- unstructured jsonb) rather than a separate normalized table — introducing
-- one is easy later if a real need for structured station config appears.
--
-- The partial unique index is the actual enforcement of the RUN-001 rule
-- "a table cannot have two active runs" — not just app-layer validation.

create table processing_runs (
  run_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  intake_id uuid not null,
  station text not null,
  packing_method text not null check (packing_method in ('hand', 'machine')),
  status text not null default 'active' check (status in ('active', 'closed')),
  qty_received_kg numeric not null check (qty_received_kg > 0),
  qty_packed_kg numeric,
  qty_rejected_kg numeric,
  opened_by uuid references auth.users (id) on delete set null,
  closed_by uuid references auth.users (id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (org_id, run_id),
  foreign key (org_id, intake_id) references intake_batches (org_id, intake_id)
);
alter table processing_runs enable row level security;
create index processing_runs_org_id_idx on processing_runs (org_id);
create index processing_runs_intake_id_idx on processing_runs (intake_id);
create unique index processing_runs_one_active_per_station
  on processing_runs (org_id, station)
  where status = 'active';

create table packed_units (
  box_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  run_id uuid not null,
  size_grade text not null,
  net_weight_kg numeric not null check (net_weight_kg > 0),
  box_count int not null default 1 check (box_count > 0),
  packing_method text not null check (packing_method in ('hand', 'machine')),
  packer_id uuid references auth.users (id) on delete set null,
  pack_date date not null default current_date,
  created_at timestamptz not null default now(),
  foreign key (org_id, run_id) references processing_runs (org_id, run_id)
);
alter table packed_units enable row level security;
create index packed_units_org_id_idx on packed_units (org_id);
create index packed_units_run_id_idx on packed_units (run_id);
