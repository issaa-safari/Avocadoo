-- Epic 1 — Intake & Receiving: regions, suppliers, farms, farmers, stage_photos,
-- intake_batches. RLS enabled at creation (fails closed); policies follow in
-- the next migration.
--
-- Composite FKs (org_id, x_id) instead of plain x_id references are
-- deliberate: they make it impossible at the database level for a row to
-- reference another org's supplier/farm/farmer, even if an RLS policy or
-- app-layer check were ever missed. This is on top of, not instead of, RLS.

create table regions (
  region_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name),
  unique (org_id, region_id)
);
alter table regions enable row level security;
create index regions_org_id_idx on regions (org_id);

create table suppliers (
  supplier_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz not null default now(),
  unique (org_id, supplier_id)
);
alter table suppliers enable row level security;
create index suppliers_org_id_idx on suppliers (org_id);

create table farms (
  farm_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  region_id uuid not null,
  name text not null,
  block_label text,
  geolocation jsonb,
  created_at timestamptz not null default now(),
  unique (org_id, farm_id),
  foreign key (org_id, region_id) references regions (org_id, region_id)
);
alter table farms enable row level security;
create index farms_org_id_idx on farms (org_id);
create index farms_region_id_idx on farms (region_id);

create table farmers (
  farmer_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  supplier_id uuid not null,
  farm_id uuid,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  unique (org_id, farmer_id),
  foreign key (org_id, supplier_id) references suppliers (org_id, supplier_id),
  foreign key (org_id, farm_id) references farms (org_id, farm_id)
);
alter table farmers enable row level security;
create index farmers_org_id_idx on farmers (org_id);
create index farmers_supplier_id_idx on farmers (supplier_id);

-- Cross-module evidence table (System Plan §3, Cross-Module). Built now
-- because INTAKE-001's receiving photo needs it, and QC-002/PALLET-001/
-- LOAD-001 all reuse it later rather than each inventing their own photo
-- column — that reuse is explicitly the design in the plan's ERD, not an
-- abstraction invented here.
create table stage_photos (
  photo_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  reference_type text not null,
  reference_id uuid not null,
  photo_url text not null,
  caption text,
  taken_by uuid references auth.users (id) on delete set null,
  taken_datetime timestamptz not null default now(),
  geotag jsonb
);
alter table stage_photos enable row level security;
create index stage_photos_org_id_idx on stage_photos (org_id);
create index stage_photos_reference_idx on stage_photos (reference_type, reference_id);

create table intake_batches (
  intake_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  supplier_id uuid not null,
  farmer_id uuid not null,
  farm_id uuid not null,
  harvest_date date,
  arrival_datetime timestamptz not null default now(),
  variety text,
  gross_weight_kg numeric not null check (gross_weight_kg > 0),
  bin_count int,
  field_temp_c numeric,
  transport_plate text,
  driver_name text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (org_id, supplier_id) references suppliers (org_id, supplier_id),
  foreign key (org_id, farmer_id) references farmers (org_id, farmer_id),
  foreign key (org_id, farm_id) references farms (org_id, farm_id)
);
alter table intake_batches enable row level security;
create index intake_batches_org_id_idx on intake_batches (org_id);
create index intake_batches_supplier_id_idx on intake_batches (supplier_id);
create index intake_batches_farmer_id_idx on intake_batches (farmer_id);
