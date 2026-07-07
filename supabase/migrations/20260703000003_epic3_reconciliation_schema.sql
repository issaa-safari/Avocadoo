-- commodity_loss_tolerances: no varieties master table exists yet (variety
-- is still free text on intake_batches), so this matches that — variety is
-- text, not a FK, same as intake_batches.variety.
create table commodity_loss_tolerances (
  tolerance_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  variety text not null,
  max_loss_pct numeric not null check (max_loss_pct >= 0 and max_loss_pct <= 100),
  loss_type text,
  effective_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (org_id, variety, effective_date)
);
alter table commodity_loss_tolerances enable row level security;
create index commodity_loss_tolerances_org_id_idx on commodity_loss_tolerances (org_id);

-- One reconciliation_records row per run (RECON-001). return_confirmation_id
-- is added in a follow-up migration once supplier_returns exists below.
create table reconciliation_records (
  reconciliation_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  run_id uuid not null,
  qty_received_kg numeric not null,
  qty_packed_kg numeric not null,
  qty_rejected_kg numeric not null,
  expected_loss_kg numeric not null,
  actual_loss_kg numeric not null,
  variance_kg numeric not null,
  status text not null check (status in ('within_tolerance', 'flagged', 'manager_override')),
  override_reason text,
  override_by uuid references auth.users (id) on delete set null,
  override_datetime timestamptz,
  rejection_disposition text check (rejection_disposition in ('returned_to_supplier', 'destroyed', 'donated')),
  created_at timestamptz not null default now(),
  unique (org_id, run_id),
  foreign key (org_id, run_id) references processing_runs (org_id, run_id)
);
alter table reconciliation_records enable row level security;
create index reconciliation_records_org_id_idx on reconciliation_records (org_id);

-- RECON-002: rejected fruit is returned to the supplier, never reworked.
create table supplier_returns (
  return_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  run_id uuid not null,
  intake_id uuid not null,
  qty_returned_kg numeric not null check (qty_returned_kg > 0),
  rejection_reason_summary text not null,
  supplier_signoff text not null,
  transport_plate_out text,
  return_datetime timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  foreign key (org_id, run_id) references processing_runs (org_id, run_id),
  foreign key (org_id, intake_id) references intake_batches (org_id, intake_id)
);
alter table supplier_returns enable row level security;
create index supplier_returns_org_id_idx on supplier_returns (org_id);
create index supplier_returns_run_id_idx on supplier_returns (run_id);

alter table reconciliation_records add column return_confirmation_id uuid references supplier_returns (return_id);
