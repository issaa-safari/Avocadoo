-- PLATFORM-001: Tenant data model
-- organizations, org_users, org_settings.
-- RLS is enabled immediately on creation (with zero policies yet, so every
-- table fails closed until PLATFORM-002 adds real policies) per the
-- non-negotiable: a Supabase table is open by default until RLS is enabled.

create type org_role as enum (
  'admin',
  'supervisor',
  'receiving_clerk',
  'qc_inspector',
  'palletizer',
  'viewer'
);

create table organizations (
  org_id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo_url text,
  brand_primary_color text,
  brand_secondary_color text,
  subdomain text not null unique,
  subscription_status text not null default 'active'
    check (subscription_status in ('active', 'suspended')),
  billing_email text,
  default_currency text not null default 'USD',
  default_timezone text not null default 'UTC',
  data_region text,
  created_at timestamptz not null default now()
);

alter table organizations enable row level security;

-- org_users links a Supabase Auth user to exactly one org + role.
-- user_id is the auth.users PK, not a separate sequential id.
create table org_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references organizations (org_id) on delete cascade,
  role org_role not null default 'viewer',
  email text not null,
  permissions_override_json jsonb,
  created_at timestamptz not null default now()
);

create index org_users_org_id_idx on org_users (org_id);

alter table org_users enable row level security;

-- org_settings is 1:1 with organizations.
create table org_settings (
  org_id uuid primary key references organizations (org_id) on delete cascade,
  commodity_types_enabled text[] not null default '{}',
  custom_size_grades_json jsonb,
  loss_tolerance_overrides jsonb,
  packing_units_enabled text[] not null default '{}',
  cold_room_list jsonb,
  pack_table_list jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table org_settings enable row level security;
