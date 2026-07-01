# Packhouse Traceability & Operations System — Master Plan
**Version 1.0 | Draft for Development Planning**

---

## 1. System Philosophy

- **Default output per shipment:** Packing List only.
- **On-demand output (claim-triggered):** Full 360° Traceability Report — assembled from data captured automatically at every stage, not compiled manually after the fact.
- **Secondary use of the same data:** Supplier/Farm/Region performance analytics, to proactively reduce rejects rather than only defend claims reactively.
- **Core defense principle:** Every number in a claims dispute must be independently reconstructable from immutable, timestamped records — reconciliation, photos, temperature logs, and signoffs.

---

## 2. Module Overview

| Module | Purpose | Key Output |
|---|---|---|
| A. Intake & Receiving | Log incoming batches | `intake_id` |
| B. QC Inspection | Evaluate quality pre-processing | `qc_id` |
| C. Wash/Sort/Pack | Physical transformation + mass balance | `run_id`, `box_id` |
| D. Stocking & Palletization | Group boxes into pallets | `sscc_id` |
| E. Bucket List & Dispatch | Fulfill orders, ship | `container_id`, `packing_list_id` |
| Claims & Analytics | On-demand trace reports + supplier scoring | `claim_id`, scorecards |

---

## 3. Full Schema Reference

### Module A — Intake
**`intake_batches`**
- `intake_id` (PK), `supplier_id` (FK), `farm_id` (FK), `block_id` (FK)
- `harvest_date`, `arrival_datetime`
- `variety`, `gross_weight_kg`, `bin_count`, `field_temp_c`
- `transport_plate`, `driver_name`

**`farms`** *(add region for analytics)*
- `farm_id` (PK), `region_id` (FK), `geolocation` (for future EUDR readiness)

### Module B — QC
**`qc_reports`**
- `qc_id` (PK), `intake_id` (FK)
- `brix`, `size_distribution_json`, `defect_pct_json`, `color_index`
- `disposition` (approved / hold / rejected)
- `inspector_id`, `inspection_datetime`

### Module C — Processing & Mass Balance
**`processing_runs`**
- `run_id` (PK), `intake_id` (FK)
- `wash_line_id`, `sanitizer_ppm`, `ph`, `contact_time_sec`
- `qty_received_kg`, `qty_packed_kg`, `qty_rejected_kg`

**`packed_units`**
- `box_id` (PK), `run_id` (FK)
- `packaging_type`, `net_weight_kg`, `pack_date`
- `size_grade`, `packer_id`, `packing_method` (hand/machine)
- *Note: v1 tracks at run-level, not scanned per box on the floor (see §3a). `box_id` remains internal for count/weight aggregation; no physical scan ties a sticker to this ID.*

**`box_source_intakes`** *(handles multi-farm blending)*
- `box_id` (FK), `intake_id` (FK), `contribution_pct` or `contribution_kg`

### 3a. Floor Process Constraint — No Scanning on the Line
Packers cannot scan without breaking packing rhythm; QC and palletizing also avoid scanning. **Traceability granularity is therefore the `run_id` (one farmer/supplier batch), not the individual box.** Physical segregation (one active run per table at a time) replaces digital linkage.

**Terminology (locked):**
| Term | Meaning | Created at |
|---|---|---|
| **Batch** | One farmer's delivery (`intake_id`) | Receiving |
| **Run** | One processing session against all or part of a batch (`run_id`) | Supervisor Run Control |

**Cardinality:** `intake_batches (1) ──< processing_runs (many)` — one batch can be split across multiple runs (e.g., part to hand line, part to machine line, or split across two tables). Batch-level reconciliation checks `SUM(processing_runs.qty_received_kg WHERE intake_id = X)` against `intake_batches.gross_weight_kg` once all runs against that batch are closed — this sits one layer above the existing per-run reconciliation (§4, rule 1).

**`pallet_run_contents`** *(replaces box-level `pallet_contents` as primary linkage)*
- `sscc_id` (FK), `run_id` (FK), `box_count`, `size_grade`, `total_weight_kg`

**Rule:** A pack table/line can only have one **active run** at a time (system-enforced — packed boxes cannot log without an active run selected). Run must be explicitly closed before a new one opens on that station. Stickers are pre-printed/auto-printed with human-readable text (farmer, size, run code, date) — informational only, not scanned.

**`commodity_loss_tolerances`**
- `variety_id`, `max_loss_pct`, `loss_type`, `effective_date`

**`reconciliation_records`**
- `reconciliation_id` (PK), `run_id` (FK)
- `qty_received_kg` (A), `qty_packed_kg` (B), `qty_rejected_kg` (C)
- `expected_loss_kg`, `actual_loss_kg`, `variance_kg`
- `status` (within_tolerance / flagged / manager_override)
- `override_reason`, `override_by`, `override_datetime`
- `rejection_disposition` (returned_to_supplier / destroyed / donated)
- `return_confirmation_id` (FK)

**`supplier_returns`**
- `return_id` (PK), `run_id` (FK), `intake_id` (FK)
- `qty_returned_kg`, `rejection_reason_summary`
- `supplier_signoff`, `transport_plate_out`, `return_datetime`
- `photo_evidence_url`

### Module D — Palletization
**`pallets`**
- `sscc_id` (PK) — *real GS1 SSCC, not sequential*
- `cold_room_id`, `build_datetime`

*(See §3a — `pallet_run_contents` is the primary content linkage, not per-box scanning)*

**`cold_storage_logs`**
- `log_id`, `cold_room_id`, `timestamp`, `temp_c`, `humidity_pct`

**`pallet_split_log`** *(partial pallet picks)*
- `original_sscc_id`, `new_sscc_id`, `box_ids_moved[]`, `split_datetime`, `reason`

### Module E — Bucket List & Dispatch
**`exporter_orders`**
- `order_id` (PK), `consignee_id` (FK), `container_id` (FK, nullable)
- `variety_required`, `qty_required_kg`, `pack_spec`
- `required_ship_date`, `min_remaining_shelf_life_days`

**`bucket_list_items`**
- `bucket_id` (PK), `order_id` (FK), `sscc_id`/`box_id` (FK)
- `pick_priority`, `pick_status`, `age_days`, `remaining_shelf_life_days`

**`packing_lists`**
- `packing_list_id` (PK), `container_id` (FK), `order_id` (FK)
- `total_gross_weight_kg`, `total_net_weight_kg`, `total_carton_count`, `total_pallet_count`
- `status` (draft / finalized / amended), `version`

**`packing_list_lines`**
- `line_id` (PK), `packing_list_id` (FK), `sscc_id` (FK)
- `variety`, `grade`, `pack_spec`, `carton_count`, `net_weight_kg`, `gross_weight_kg`
- `pack_date_range`, `origin_summary`

**`container_loads`**
- `container_id` (PK), `packing_list_id` (FK)
- `seal_number`, `seal_photo_id` (FK)
- `container_type`, `loading_temp_set_point_c`
- `loading_temp_probe_1_c`, `loading_temp_probe_2_c`
- `loading_datetime`, `loaded_by`, `checked_by`, `pre_trip_inspection_status`

**`container_temp_logs`**
- `log_id`, `container_id` (FK), `timestamp`, `temp_c`, `humidity_pct`, `source`

**`receiving_confirmations`** *(consignee-side, closes the loop)*
- `container_id` (FK), `seal_number_at_destination`, `arrival_temp_c`
- `arrival_photos`, `condition_notes`, `confirmed_by`, `confirmed_datetime`

### Cross-Module
**`stage_photos`** *(polymorphic evidence table)*
- `photo_id` (PK), `reference_type`, `reference_id`, `photo_url`
- `caption`, `taken_by`, `taken_datetime`, `geotag`

**`claims`**
- `claim_id` (PK), `container_id` (FK), `consignee_id` (FK)
- `claim_type`, `claimed_amount`, `status`, `resolution`
- `linked_trace_report_snapshot` (frozen JSON/PDF at time of claim)

**`supplier_performance_summary`** *(scheduled aggregation)*
- `supplier_id`, `farm_id`, `region_id`, `period`
- `total_intake_kg`, `total_rejected_kg`, `reject_rate_pct`
- `top_defect_reasons`, `avg_brix`, `avg_defect_pct`, `claims_linked_count`

**`audit_log`** *(system-wide)*
- `log_id`, `table_name`, `record_id`, `field`, `old_value`, `new_value`, `changed_by`, `changed_datetime`

---

## 4. Critical Business Rules

1. **Mass balance:** `A (received) = B (packed) + C (rejected) + D (allowable loss)` — reconciled **per run**, rolling up to a **per-batch** check (see §3a) since one batch can span multiple runs.
2. **Rejected fruit** is returned to supplier/farmer (not reworked on-site) — must resolve to a `supplier_returns` record with signoff before a run can close.
3. **Multi-farm blending:** any box/pallet with mixed sources uses `contribution_pct` — never force a false single-origin claim.
4. **FEFO over FIFO:** bucket-list picks sort by remaining shelf life first, pack date as tiebreaker.
5. **Immutability:** `packing_lists`, `reconciliation_records`, and claim snapshots are versioned, never overwritten. Corrections create new linked records.
6. **Mandatory photo capture points:** QC rejection, supplier return handoff, container loading/seal.
7. **Seal verification:** `seal_number` (origin) vs `seal_number_at_destination` auto-flagged on mismatch.
8. **Reject attribution in analytics:** split fairly by `contribution_pct` when fruit is blended — don't penalize one supplier for another's fault.

---

## 5. API Surface (Core Endpoints)

- `GET /trace/container/{container_id}` — full lineage report (claim-triggered, deep join across all modules, cached/snapshotted on claim creation)
- `POST /bucket-list/generate` — FEFO-based pick list for an order
- `POST /packing-list/generate` — aggregate pallet contents into draft packing list
- `POST /packing-list/{id}/finalize` — lock + weight cross-check validation
- `POST /claims` — opens a claim, triggers trace report snapshot
- `GET /analytics/supplier-scorecard` — reject rates, defect trends, regional comparison

---

## 6. Known Edge Cases (Design Decisions Made)

| Edge Case | Resolution |
|---|---|
| Multi-farm blended pallet | `box_source_intakes` junction table with contribution % |
| Rejected fruit re-entering line | N/A — returned to supplier, not reworked |
| Partial pallet pick/split | `pallet_split_log` tracks lineage break |
| Shift change mid-run | Reconciliation stays per-run; shift logged separately for labor only |
| Mixed sizing on one pallet | Packing list groups by SKU (variety/grade/spec), not just by pallet |
| Seal tampering dispute | Compare origin vs destination seal number, auto-flag mismatch |
| Consignee requires box-level origin (EU/strict GG.A.P.) | Configurable packing list detail level, pulls from `box_source_intakes` |

---

## 7. Compliance Alignment

- **GlobalG.A.P. PHA** (postharvest-specific standard, v2 due 2026) — structure QC dispositions around Major/Minor Must CPCC categories.
- **BRCGS / FSMA** — audit trail (`audit_log`) and photo evidence chain support hazard/traceability audit requirements.
- **EUDR readiness** (EU-bound exporters) — `geolocation` field on `farms`/`block_id` for future deforestation-free sourcing proof.

---

## 8. Build Sequence (Recommended)

0. **Phase 0 — Multi-Tenant Foundation:** `organizations`, `org_users`, `org_settings`, tenant isolation on all tables, branding injection, auth/subdomain routing (see §10)
1. **Phase 1 — Foundation:** Modules A–C (intake, QC, mass balance/reconciliation, supplier returns)
2. **Phase 2 — Logistics:** Module D (palletization, cold storage logs), Module E (bucket list, packing list)
3. **Phase 3 — Dispatch & Evidence:** Container loading, seals, temp logs, photo capture across all stages
4. **Phase 4 — Claims Layer:** Backward trace report endpoint, forward trace (recall) endpoint, PDF template, claims case management, external shipment documents (phyto/BOL)
5. **Phase 5 — Analytics:** Supplier/farm/region scorecards, dashboards, time-in-stage (`stage_durations`) tracking
6. **Phase 6 — Hardening:** RBAC, audit log, receiving-side confirmation portal, offline-first floor capability, universal exports

---

## 10. Multi-Tenant SaaS Architecture

**Decision:** This system is a multi-tenant platform, sold to multiple exporter customers, each with isolated data and custom branding. **All customers receive the full feature set — no tiered/gated features.**

### Foundational Tables
**`organizations`**
- `org_id` (PK), `company_name`, `logo_url`, `brand_primary_color`, `brand_secondary_color`
- `subdomain` (or custom domain), `subscription_status` (active/suspended — billing gate only, not a feature gate)
- `billing_email`, `default_currency`, `default_timezone`, `created_at`

**`org_users`**
- `user_id` (PK), `org_id` (FK), `role` (admin / receiving_clerk / qc_inspector / palletizer / supervisor / viewer)
- `email`, `permissions_override_json`

**`org_settings`**
- `org_id` (FK), `commodity_types_enabled`, `custom_size_grades_json`
- `loss_tolerance_overrides`, `packing_units_enabled`, cold room list, pack table/line list

### Tenant Isolation Rule
**Every existing table gets `org_id` as a required FK.** All queries scoped by `org_id` — enforced via row-level security (DB layer) or mandatory app-layer filtering. This must be built as **Phase 0**, before any module work, since retrofitting tenant isolation onto existing single-tenant data is a major rewrite, not a migration.

### Two Admin Layers
1. **Org Admin** (each exporter manages their own): branding, user/role management, settings (commodities, size grades, tolerances, cold rooms, pack tables), supplier/farmer master data, full access to all dashboards + analytics.
2. **Platform Super-Admin** (you, across all customers): org onboarding/suspension, billing oversight, cross-org usage/uptime monitoring (no cross-org data visibility), audited impersonation mode for support.

### Branding/White-Label
`org_settings` branding fields drive: logo on all PDFs (packing list, trace report, claims report), UI color theme per `org_id` on login, custom subdomain/domain routing, document footer text (customer's own company details).

### Dev Ticket: PLATFORM-001 — Multi-tenant foundation (Phase 0)
- [ ] Add `org_id` to every table
- [ ] Enforce row-level security or app-layer tenant filtering on every query
- [ ] Build `organizations`, `org_users`, `org_settings` tables
- [ ] Auth flow: subdomain/domain routing → resolves `org_id` → scopes session
- [ ] Branding injection: logo/colors pulled per `org_id`, applied to UI theme and PDF templates

### Security Hardening (Phase 0, alongside PLATFORM-001)

**Database isolation strategy:** **Supabase** (managed PostgreSQL) with Row-Level Security keyed to `org_id` — chosen because it provides auth, sessions, and RLS as managed features rather than hand-rolled code, materially reducing the isolation-bug risk for a small/non-technical team. Shared schema + RLS is the standard, cost-effective model for this scale; revisit isolated databases only for very large/high-security "whale" tenants later. **Every Supabase table must have RLS explicitly enabled** (tables are open by default until enabled).

**Core risk to design against:** missing tenant filters causing cross-tenant data exposure. Mitigations:
- `org_id` never trusted from client headers/params — always resolved server-side from authenticated session/JWT
- No queries without a tenant filter, including for internal admin tools (explicit override only, audited)
- Non-sequential, non-guessable IDs (UUIDs) for `org_id` and all resource PKs
- `org_id` included in all queries, cache keys, and storage paths
- Automated "penalized query testing" — CI tests that intentionally omit tenant filters to confirm RLS blocks the leak

**Identity & access:** RBAC (already planned) + MFA required for admin roles at minimum; SSO/enterprise IdP integration as a near-term roadmap item once serving larger exporters.

**Encryption:** Standard encryption at rest (e.g., cloud KMS) and TLS in transit as a non-negotiable baseline. Per-tenant customer-managed keys (BYOK) deferred as a later enterprise differentiator, not a v1 requirement.

**Audit visibility:** Tenant-scoped `security_audit_log` — org admins must be able to self-serve their own audit trail (who changed what, when) without contacting the platform team. This directly supports the claims-defense use case at the org level.

**`organizations`** — add:
- `data_region` (for future data residency requirements if an exporter customer needs in-country storage)

**`security_audit_log`** (new, tenant-scoped, distinct from the internal system-wide `audit_log`)
- `log_id`, `org_id` (FK), `user_id`, `action`, `resource_type`, `resource_id`
- `ip_address`, `timestamp`
- Visible to org admins within their own org only

**Additional hardening tickets:**
- [ ] PostgreSQL RLS policies on every table, keyed to `org_id`
- [ ] MFA for admin roles; SSO roadmap item
- [ ] Encryption at rest + TLS in transit
- [ ] CI test suite for tenant-filter omission (penalized query testing)
- [ ] Per-tenant rate limiting (prevent "noisy neighbor" performance/security issues)
- [ ] Tenant-scoped `security_audit_log`, self-serve visible to org admins

---

## 12. Reporting Exports (Excel & PDF, All Stages)

Generic, org-scoped export capability applied consistently across every module — not built per-screen.

**Applies to:** Receiving/batch logs, QC inspection logs, processing run + reconciliation logs, pallet contents, packing lists, 360° trace reports, supplier scorecards.

**Format guidance:**
- **Excel (.xlsx):** data intended for further filtering/analysis (logs, reconciliation tables, scorecards) — multi-sheet where useful (summary + detail)
- **PDF:** formal documents where branding/layout matters (packing list, trace report) — pulls org logo/colors from `org_settings`

**Endpoint:** `GET /export/{module}?format={xlsx|pdf}&from={date}&to={date}&filters={...}` — always scoped by `org_id`, no cross-tenant data possible.

### Dev Ticket: EXPORT-001 — Universal export module
- [ ] Generic `/export/{module}` endpoint, org-scoped
- [ ] Shared XLSX generation service across all modules
- [ ] Shared PDF generation service, reusing the trace-report template pipeline (`TRACE-003`), branded via `org_settings`
- [ ] Consistent "Export" button component across all dashboard screens
- [ ] Large exports run as background job + downloadable link/email, not a blocking request

---

## 13. Enhancements (Round 2)

### 13.1 Box-Level Mapping Intentionally Superseded
The original spec (Module D) called for linking individual Packed Box IDs to pallets. **This is intentionally replaced by run-level tracking** (§3a) because the floor cannot scan at box level without breaking packing rhythm. `pallet_run_contents` is the correct linkage. *Do not reintroduce box scanning as a "fix" — it is a deliberate constraint, not a gap.*

### 13.2 Time-in-Stage Tracking (`stage_durations`)
Elapsed-time between stages is claims-relevant (slow cut-to-cool is a top cause of arrival rot; the reference Signet PDF cited a 4-hour cut-to-cool window).

**`stage_durations`** (derived view, per batch/run)
- `harvest → intake`, `intake → pack`, `pack → cool`, `cool → dispatch`
- Each with a configurable `threshold_hours` per commodity (in `org_settings`)
- Auto-flags violations, surfaced on dashboards and in the trace report

### 13.3 External Shipment Documents (Phyto, BOL, Cert of Origin)
Module E references phytosanitary sheets and BOL links. Add an attachment layer so external certs live alongside trace data.

**`shipment_documents`**
- `doc_id` (PK), `org_id` (FK), `container_id` (FK)
- `doc_type` (phyto / bill_of_lading / cert_of_origin / other)
- `doc_number`, `file_url`, `issue_date`, `uploaded_by`
- Appears in the claims/trace report bundle

### 13.4 Forward Traceability (Recall Scenario)
Backward trace (claim → farm) is covered. **Forward trace** (a farmer's fruit found bad → which containers/consignees received it) is the food-safety recall case — critical for FDA/BRCGS. Same data, reverse query.
- `GET /trace/forward/{intake_id}` or `/trace/forward/{farmer_id}` → all downstream runs, pallets, containers, consignees
- Higher-stakes than a commercial claim; belongs in Phase 4 alongside the backward trace engine

### 13.5 Offline-First Floor Capability
Packhouses often have spotty connectivity; floor dashboards (receiving, QC, run control, palletizing) must not stop working when the network drops.
- Local-first capture with sync-on-reconnect
- Conflict resolution on sync (last-write-wins acceptable for most floor data; flag reconciliation/run-close conflicts for supervisor review)
- Affects frontend architecture choice — decide before Phase 1 UI build

---

## 14. Open Items for Stakeholder Decision

- SSCC barcode standard adoption (GS1) vs. internal sequential IDs
- Signature capture mechanism for supplier returns (v1: photo+timestamp, v2: digital signature)
- Data logger integration for container temps (manual entry vs. IoT/carrier API feed — e.g., Sensitech/DeltaTrak)
- Role-based access control matrix (who can override reconciliation flags, finalize packing lists, etc.)
- Fixed per-station tablets vs. roaming/shared devices for QC & palletizing (affects "active run" header UX)
- Offline sync conflict-resolution policy for run-close/reconciliation events
