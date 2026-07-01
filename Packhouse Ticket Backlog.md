# Packhouse Traceability — Build Backlog
**Epics → Tickets → Acceptance Criteria | Companion to the Master System Plan**

Legend: `[P0]`–`[P6]` = build phase. AC = Acceptance Criteria. Each ticket is sized to be independently testable.

---

## EPIC 0 — Multi-Tenant Foundation & Security `[P0]`
*Must ship before any module. Retrofitting tenant isolation later is a rewrite.*
*Stack: Supabase (Postgres + Auth + RLS) behind Next.js. Let Supabase handle auth, sessions, and RLS rather than hand-rolling them.*

### PLATFORM-001 — Tenant data model
- Build `organizations`, `org_users`, `org_settings` tables in Supabase.
- Add `org_id` (UUID) FK to every domain table. Link `org_users` to Supabase Auth users.
- **AC:** No domain table exists without `org_id`. `org_id` is a non-sequential UUID. Every table has the column and FK constraint.

### PLATFORM-002 — Tenant isolation via Supabase RLS
- **Enable RLS on every table** (Supabase tables are open by default until you do).
- Write RLS policies so a row is only readable/writable when its `org_id` matches the `org_id` of the authenticated user (looked up from `org_users` via `auth.uid()`).
- **AC:** A logged-in Org A user querying any table returns only Org A rows. A "penalized query" test confirms that a request without the correct session returns zero rows, not all rows. No table has RLS disabled.

### PLATFORM-003 — Auth & org routing
- Use Supabase Auth for login. Resolve the user's `org_id` server-side from the session (`auth.uid()` → `org_users.org_id`) — never from client input.
- Subdomain/custom-domain routing maps to an org for branding. MFA enabled for admin/supervisor roles.
- **AC:** Logging in as an Org A user cannot access Org B data by any tested path. Forging an `org_id` in a request has no effect. Admin login requires MFA.

### PLATFORM-004 — Branding injection
- `logo_url`, `brand_primary_color`, `brand_secondary_color` from `org_settings` applied to UI theme and all PDF templates.
- **AC:** Two orgs with different branding render their own logo/colors in UI and on a generated PDF. No hardcoded branding remains.

### PLATFORM-005 — Tenant-scoped security audit log
- `security_audit_log` table with its own RLS policy so org admins see only their own org's entries.
- **AC:** Every create/update/delete on sensitive records writes an audit row (user, action, resource, IP, timestamp). Org A admin cannot see Org B audit rows.

### PLATFORM-006 — Baseline hardening
- Confirm Supabase encryption at rest + TLS (default). Add per-tenant rate limiting at the Next.js/API layer.
- **AC:** Data at rest is encrypted (verified via Supabase config). One tenant's request flood does not degrade another tenant's response times in a load test.

---

## EPIC 1 — Intake & Receiving `[P1]`

### INTAKE-001 — Receiving entry screen
- Form: supplier, farmer (filtered by supplier), farm/block (auto), crates, gross weight, truck plate, driver, field temp, photo.
- Generates `intake_id` on save.
- **AC:** Saving creates one `intake_batches` row scoped to the org. Farmer dropdown filters by selected supplier. New batch appears in the supervisor "Open Run" list immediately.

### INTAKE-002 — Supplier/farmer master data
- CRUD for `suppliers`, `farmers`, `farms` (with `region_id`, optional geolocation).
- **AC:** A farmer must belong to a supplier. Region is required on a farm. Geolocation field accepts a coordinate/polygon (optional, for future EUDR).

### INTAKE-003 — Farmer/supplier output analytics table
- Post-processing view: total in, rejected, reject %, packed, size breakdown per farmer/supplier.
- **AC:** Table populates only after runs against a batch close. Reject attribution splits by `contribution_pct` for blended runs. Sortable by any size column.

---

## EPIC 2 — QC Inspection `[P1]`

### QC-001 — QC logging screen (active-run aware)
- Header shows active run for the station. Defect checklist, disposition (approve/hold/reject), notes.
- **AC:** Disposition of hold/reject **cannot submit without a photo**. Each log increments a tally against the active `run_id`. No free-text required for a normal approve.

### QC-002 — QC photo capture
- Multi-photo capture tied to `stage_photos` (`reference_type='qc_report'`).
- **AC:** Photos attach to the correct run/QC record and appear in the trace report. Reject with zero photos is blocked client- and server-side.

---

## EPIC 3 — Processing, Runs & Mass Balance `[P1]`

### RUN-001 — Supervisor Run Control
- Open run (against a batch + table), view active runs, close run.
- **AC:** A table cannot have two active runs. Opening requires selecting an existing `intake_id`. Packed-box logging is blocked when no run is active on that station.

### RUN-002 — Hand-pack size entry (no scan)
- Big size-grade buttons; one tap = one box logged + sticker auto-print. Weight from scale or standard preset.
- **AC:** A size tap creates a `packed_units` row against the active run with `size_grade` and `packer_id`. Print job fires; a print failure queues the job but does not block packing.

### RUN-003 — Machine-line intake
- Capture machine output boxes by size (auto-sorted), method = `machine`.
- **AC:** Machine run records size breakdown. Method field distinguishes hand vs machine on every box.

### RECON-001 — Per-run mass-balance auto-check
- On run close: compute A = B + C + D against commodity tolerance; flag if out of tolerance.
- **AC:** Flagged run cannot proceed to palletization without documented reject reason or a manager override with mandatory reason. All records immutable; corrections create linked new records.

### RECON-002 — Supplier return tracking
- Rejected qty must resolve to a `supplier_returns` record (qty, reason, signoff, photo) before run closes.
- **AC:** Unresolved rejection auto-flags after configurable window. Run close is blocked until rejected qty is matched to a return record.

### RECON-003 — Batch-level reconciliation rollup
- Sum of run `qty_received_kg` for a batch reconciles against batch gross weight once all runs closed.
- **AC:** A batch with a residual mismatch beyond tolerance is flagged after its last run closes.

---

## EPIC 4 — Palletization & Cold Storage `[P2]`

### PALLET-001 — Pallet build (run-level, no scan)
- Add runs to a pallet by count; auto-compute weight; supports multi-run pallets.
- **AC:** `pallet_run_contents` records one line per run on the pallet. A mixed pallet shows correct per-run contribution. Closing prints the pallet summary label (farmer/supplier + size breakdown).

### PALLET-002 — Pallet split logging
- Partial pallet pick creates `pallet_split_log` preserving lineage.
- **AC:** Splitting a pallet keeps both fragments traceable to the same source runs. Trace query returns intact lineage after a split.

### COLD-001 — Cold room temperature logging
- Manual or feed-based `cold_storage_logs` per cold room.
- **AC:** Temperature history is queryable by cold room and time range and appears in the trace report as a series.

---

## EPIC 5 — Bucket List & Dispatch `[P2]`

### BUCKET-001 — FEFO bucket-list generation
- Generate pick list for an order; sort by remaining shelf life, pack date tiebreaker; exclude non-approved/insufficient-shelf-life stock.
- **AC:** Stock below the order's `min_remaining_shelf_life_days` is excluded and logged as skipped. A short order flags the manager and suggests substitutes/pipeline ETA.

### PACK-001 — Packing list generation & finalize
- Aggregate pallet contents into `packing_list_lines` grouped by variety/grade/spec; finalize locks + versions.
- **AC:** Finalize is blocked if `total_net_weight` ≠ sum of pallet contents. Post-finalize edits create a new version, never overwrite. Multi-origin pallets show aggregated origin %.

### LOAD-001 — Container loading & seal
- Capture seal number + seal photo, dual sign-off, loading temps (multi-probe).
- **AC:** Seal number and photo are required to complete loading. Two sign-off users recorded. Loading temps stored per probe.

### DOC-001 — External shipment documents
- Attach phyto / BOL / cert of origin (`shipment_documents`).
- **AC:** Attached docs link to the container and appear in the claims/trace bundle. Doc type and number are required.

---

## EPIC 6 — Claims & Traceability Engine `[P4]`

### TRACE-001 — Backward trace endpoint
- `GET /trace/container/{id}` assembles full lineage (farms, QC, runs, cold chain, seal, photos).
- **AC:** Given a container ID, returns every contributing run/farmer, QC records, reconciliation status, cold-room + in-transit temps, seal match status, and linked photos — all org-scoped.

### TRACE-002 — Claim-triggered snapshot
- Opening a `claims` record freezes a trace-report snapshot.
- **AC:** The snapshot does not change if underlying data is later edited. Claim links to its frozen report.

### TRACE-003 — PDF trace report renderer
- Render the 9-section report (per master plan) as a branded PDF from the trace endpoint.
- **AC:** Regenerating from the same frozen snapshot produces an identical document. Org branding applied. Conclusion text is templated, not free-form.

### TRACE-004 — Forward trace (recall)
- `GET /trace/forward/{intake_id|farmer_id}` returns all downstream containers/consignees.
- **AC:** Given a bad batch/farmer, returns every affected shipment and consignee for recall action. Org-scoped.

---

## EPIC 7 — Analytics `[P5]`

### ANALYTICS-001 — Supplier scorecard
- Per supplier/farmer/region rollup: reject rate, defect breakdown, size distribution, claims linked, trend vs prior period.
- **AC:** Reject attribution uses `contribution_pct` for blended fruit. Threshold breaches flag for review. Filterable by date/supplier/farmer/region.

### ANALYTICS-002 — Time-in-stage tracking
- `stage_durations` derived metrics (harvest→intake→pack→cool→dispatch) with per-commodity thresholds.
- **AC:** Each stage transition computes elapsed time; threshold violations flag and surface in dashboards and the trace report.

---

## EPIC 8 — Platform-Wide Services `[P3/P6]`

### EXPORT-001 — Universal export `[P3]`
- Org-scoped `/export/{module}?format={xlsx|pdf}` across all modules.
- **AC:** Every listed module exports to both formats. Exports contain only the requesting org's data. Large exports run async with a download link.

### ADMIN-001 — Org Admin dashboard `[P3]`
- Branding, user/role management, settings (commodities, size grades, tolerances, cold rooms, tables), master data.
- **AC:** An org admin can configure all of the above for their org only. Changes are audit-logged.

### ADMIN-002 — Platform Super-Admin dashboard `[P3]`
- Org onboarding/suspension, billing status, cross-org usage/uptime metrics (no cross-org business data), audited impersonation.
- **AC:** Super-admin can create/suspend orgs and see usage metrics but cannot view an org's farmer/claims data except via explicitly audited impersonation.

### OFFLINE-001 — Offline-first floor capability `[P6]`
- Local-first capture + sync-on-reconnect for receiving/QC/run-control/palletizing.
- **AC:** Floor screens continue capturing during network loss and sync on reconnect. Run-close/reconciliation sync conflicts are flagged for supervisor review, not silently merged.

### RBAC-001 — Role-based access control `[P6]`
- Enforce role permissions across all dashboards/actions.
- **AC:** Each role can perform only its permitted actions (e.g., only supervisor/admin can override reconciliation flags or finalize packing lists). Denied actions are blocked server-side, not just hidden in UI.

### AUDIT-001 — System-wide audit trail `[P6]`
- Immutable `audit_log` capturing old→new values on sensitive changes.
- **AC:** Any edit to reconciliation, packing list, or claim records writes an audit entry. Records cannot be altered in place; corrections are new linked records.

---

## Cross-Cutting Definition of Done (applies to every ticket)
- Scoped by `org_id`; passes the penalized-query isolation test.
- Sensitive actions write to the audit log.
- Has automated tests (unit + at least one isolation/permission test where relevant).
- Any generated document/export respects org branding and data scope.
