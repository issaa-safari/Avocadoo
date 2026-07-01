# CLAUDE.md — Packhouse Traceability Platform

Project context and working agreement for building this system in Claude Code. Read this first, then the three reference docs alongside it.

## What this is
A multi-tenant SaaS platform for agricultural exporters (starting with avocados) that tracks fruit from farm intake through packing, palletizing, cold storage, and container dispatch. Its core purpose is **defending against consignee quality/weight claims** with full backward *and* forward traceability, and **supplier performance analytics** to cut high-reject suppliers. Sold to multiple exporter organizations, each with isolated data and their own branding. **Every customer gets the full feature set — no tiered features.**

## Reference documents (in this repo)
- `Packhouse_Traceability_System_Plan.md` — the "why/what": philosophy, full schema, business rules, edge cases, compliance, build phases.
- `Packhouse_Ticket_Backlog.md` — the "build it": 9 epics, ~35 tickets, acceptance criteria. Build in phase order (P0 first).
- `Packhouse_Wireframes.md` — ASCII layouts for every screen.
- `Packhouse_ERD.mermaid` — entity-relationship diagram of the full schema.

## The single most important constraint
**Traceability is at the RUN level, not the box level.** The packhouse floor cannot scan individual boxes — it breaks packing rhythm. One farmer's delivery = a `batch` (`intake_id`); one processing session = a `run` (`run_id`); one batch can spawn many runs. Pallets link to runs via `pallet_run_contents`, not to individual boxes. **Do not add per-box scanning as a "fix" — it is a deliberate, non-negotiable constraint.** Physical segregation (one active run per table) is what keeps data clean.

## Non-negotiable security rules (build these in Phase 0, first)
- Every table has `org_id` (UUID). Every query is scoped by `org_id`.
- `org_id` is resolved server-side from the Supabase auth session — **never** from a client header or parameter.
- **Supabase Row-Level Security policies on every table**, keyed to `org_id`, as the primary isolation mechanism (defense-in-depth on top of app-layer checks). Enable RLS on every table at creation — a table without an RLS policy in Supabase is open by default, so this is the #1 thing to verify.
- All PKs and `org_id` are non-sequential UUIDs (never guessable/sequential).
- A test must deliberately query without the correct session and confirm it returns **zero rows, not all rows** ("penalized query" test).
- Audit logs are tenant-scoped and visible to org admins for their own org.
- MFA for admin/supervisor roles (Supabase supports this). Encryption at rest + TLS in transit (Supabase provides both by default).

## Stack (locked — chosen for a non-technical builder using Claude Code)
One language across the whole app, and the hardest security work handled by managed tools rather than hand-rolled.

- **Database + Auth + Security:** **Supabase** (managed PostgreSQL 15+ with built-in authentication and Row-Level Security). This is deliberate: multi-tenant data isolation is the highest-risk part of this build, and Supabase provides RLS, user auth, and per-user policies as first-class features instead of custom code. Use Supabase RLS policies keyed to `org_id` as the primary isolation mechanism.
- **Framework:** **Next.js (TypeScript, React)** — frontend and backend (API routes / server actions) in one framework, one language. Server-side code resolves the user's `org_id` from the Supabase session, never from client input.
- **Hosting:** **Vercel** (deploys Next.js with minimal configuration).
- **Offline-first floor screens:** local capture + sync-on-reconnect; use Supabase's client libraries with a local queue for the four floor screens.
- **PDF/Excel:** one shared generation service each, reused across all modules.

### Important note for a non-technical builder
The multi-tenant isolation layer (one exporter must never see another's data) is security-critical and hard to verify alone. Strongly consider having an experienced developer build/review **Phase 0** specifically, then take over module-by-module work with Claude Code on the safe foundation. Supabase reduces this risk substantially but does not eliminate the need for careful review of RLS policies.

## Build order (strict)
1. **P0** — Multi-tenant foundation + security (Epic 0). Nothing else until this is solid.
2. **P1** — Intake, QC, Runs, Mass-balance reconciliation, Supplier returns (Epics 1–3).
3. **P2** — Palletization, cold storage, bucket list, packing list, container loading (Epics 4–5).
4. **P3** — Universal export, Org Admin + Super-Admin dashboards (Epic 8 subset).
5. **P4** — Claims engine: backward trace, forward trace (recall), PDF report (Epic 6).
6. **P5** — Analytics: supplier scorecards, time-in-stage (Epic 7).
7. **P6** — RBAC enforcement, system audit log, offline-first, receiving-side confirmation portal.

## Domain rules that trip people up
- **Mass balance:** `Received = Packed + Rejected + AllowableLoss`, reconciled per run, rolled up per batch. Flagged runs can't palletize without a documented reason or audited override.
- **Rejected fruit** is returned to the supplier (not reworked) — must resolve to a `supplier_returns` record with signoff before a run closes.
- **Blended pallets/runs:** attribute rejects and origin by `contribution_pct` — never blame one farmer for another's fruit.
- **FEFO, not FIFO,** for bucket-list picking (remaining shelf life first, pack date tiebreaker).
- **Immutability:** packing lists, reconciliation records, and claim snapshots are versioned, never overwritten. Corrections = new linked records.
- **Photos mandatory** on QC reject and at seal/loading.
- **Claim reports are on-demand**, not per-shipment. Default dispatch output is the packing list only. A claim freezes a trace snapshot that must regenerate identically.

## Compliance to keep in mind
GlobalG.A.P. (esp. the postharvest PHA standard, v2 due 2026), BRCGS, FSMA, and EUDR geolocation readiness for EU-bound fruit. Structure QC dispositions to map to Major/Minor Must categories.

## Working agreement for Claude Code
- Start every ticket by confirming which phase/epic it belongs to and its acceptance criteria from the backlog.
- Write the tenant-isolation test alongside the feature, not after.
- Prefer small, testable PRs mapped 1:1 to backlog tickets.
- When a requirement here conflicts with an instinct to "improve" it (e.g. box scanning), follow this doc — the constraints are deliberate and hard-won.
- Flag any open item (see the plan's "Open Items" section) rather than silently deciding it.
