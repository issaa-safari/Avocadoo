# Packhouse Traceability — Dashboard Wireframes
**ASCII wireframes for all screens | Companion to System Plan & Backlog**

These are layout/flow references, not visual designs. Branding (logo, colors) is injected per org from `org_settings`.

---

## FLOOR DASHBOARDS

### Receiving — New Delivery
```
┌───────────────────────────────────────────┐
│ [logo]  RECEIVING                    ⎙ Export│
├───────────────────────────────────────────┤
│ Supplier   [ Signet Co          ▾ ]        │
│ Farmer     [ John Karanja       ▾ ]        │
│ Farm/Block [ Nyeri · Block 3 (auto) ]      │
│                                             │
│ Crates     [  48 ]   Gross kg [ 1,200 ]    │
│ Truck      [ KDA123X ] Driver [ ....... ]   │
│ Field °C   [ 24 ]                          │
│ [ 📷 Photo of crates ]                      │
│                                             │
│              [  SAVE INTAKE  ]             │
├───────────────────────────────────────────┤
│ Today's intakes: 12 batches · 14,300 kg    │
└───────────────────────────────────────────┘
```

### Run Control (Supervisor) — the keystone screen
```
┌───────────────────────────────────────────┐
│ RUN CONTROL                          ⎙ Export│
├───────────────────────────────────────────┤
│ Table       Run   Farmer        Boxes  State│
│ Table 1    #47   John Karanja    84   🟢    │
│ Table 2     —      —              0   ⚪    │
│ Machine    #48   Peter Chege    210   🟢    │
├───────────────────────────────────────────┤
│ [ + OPEN RUN ]        [ CLOSE RUN #47 ]    │
│                                             │
│ Open Run →  Table [Table 2 ▾]              │
│             Batch [ #B-0312 J.Karanja ▾]   │
│             [ CONFIRM ]                     │
└───────────────────────────────────────────┘
⚠ Warning shows if a run has been open unusually long.
Closing #47 auto-runs mass-balance reconciliation.
```

### Hand-Pack Entry (per box, one tap)
```
┌───────────────────────────────────────────┐
│ TABLE 1 · Run #47 · John Karanja           │
│ Boxes this run: 84                         │
├───────────────────────────────────────────┤
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│   │ 14 │ │ 16 │ │ 18 │ │ 20 │ │ 22 │        │
│   └────┘ └────┘ └────┘ └────┘ └────┘        │
│              ┌─────────┐                    │
│              │   MIX   │                    │
│              └─────────┘                    │
│  Box weight: [ 4kg ▾ ]                     │
│  (one tap = box logged + sticker prints)    │
└───────────────────────────────────────────┘
```

### QC — Packed Box Check (active-run aware)
```
┌───────────────────────────────────────────┐
│ QC · Table 1 · Run #47 · John Karanja      │
├───────────────────────────────────────────┤
│ Defects: ☐ Pest ☐ Bruise ☐ Rot            │
│          ☐ Size mismatch ☐ Other           │
│ Disposition: (•)Approve ( )Hold ( )Reject  │
│ [ 📷 Photo ]  ← required if not Approve     │
│ Notes [ ................. ]                 │
│              [  LOG CHECK  ]               │
└───────────────────────────────────────────┘
```

### Palletizing (run-level, count-based)
```
┌───────────────────────────────────────────┐
│ PALLETIZING                          ⎙ Export│
├───────────────────────────────────────────┤
│ Pallet [ SSCC-000512 ] (new / select)      │
│ Add from run:                              │
│   Run #47 John Karanja (T1)   [ + ]        │
│   Run #48 Peter Chege (Mach)  [ + ]        │
│ ── Contents ──                             │
│   #47 · size 18 · 40 boxes · 160kg         │
│   #47 · size 20 · 30 boxes · 150kg         │
│   Total: 70 boxes / 310 kg                 │
│ [ 📷 ]            [ CLOSE PALLET ]         │
└───────────────────────────────────────────┘
Closing prints the pallet summary label (farmer/size mix).
```

### Container Loading
```
┌───────────────────────────────────────────┐
│ CONTAINER LOADING · OTPU6447194            │
├───────────────────────────────────────────┤
│ Add pallet [ scan/select SSCC ] [ + ]      │
│ Pallets loaded: 20 / 20                    │
│ Seal number  [ MEDU-88213 ]                │
│ [ 📷 Seal photo ]  ← required               │
│ Load temp  probe1 [ 5.0 ]  probe2 [ 5.2 ]  │
│ Loaded by [ auto ]  Checked by [ ....... ] │
│ Docs: [+ Phyto] [+ BOL] [+ Cert Origin]    │
│              [ COMPLETE LOADING ]          │
└───────────────────────────────────────────┘
```

---

## MANAGEMENT DASHBOARDS

### Supplier Scorecard (Analytics)
```
┌───────────────────────────────────────────┐
│ SUPPLIER ANALYTICS   [Season ▾][Region ▾] ⎙ │
├───────────────────────────────────────────┤
│ Farmer      In(kg) Rej% │14 16 18 20 22    │
│ J.Karanja   1,200   7%  │40 300 400 300 76 │
│ P.Chege     2,100  12%  │0  120 900 800 280│
│ ...                                        │
├───────────────────────────────────────────┤
│ ⚠ Flagged (>10% reject): P.Chege, M.Gitau  │
│ [ Reject-rate trend chart ]                │
└───────────────────────────────────────────┘
```

### Claims / Trace Lookup
```
┌───────────────────────────────────────────┐
│ CLAIMS & TRACEABILITY                      │
├───────────────────────────────────────────┤
│ Trace by: (•)Container ( )Farmer(forward)  │
│ [ OTPU6447194 ]           [ TRACE ]        │
├───────────────────────────────────────────┤
│ → Farms: Nyeri(40%) Kiambu(22%) Meru(38%)  │
│ → QC: all approved · avg brix 22           │
│ → Reconciliation: within tolerance         │
│ → Cold chain: unbroken (5.0–5.4°C)         │
│ → Seal: MEDU-88213 ✓ match                 │
│ [ OPEN CLAIM ]  [ EXPORT PDF ]             │
└───────────────────────────────────────────┘
```

---

## ADMIN DASHBOARDS

### Org Admin (each exporter manages their own)
```
┌───────────────────────────────────────────┐
│ ADMIN · Signet Fruit & Veg Exporters       │
├──────────────┬────────────────────────────┤
│ Branding     │ Logo  [ upload ]           │
│ Users        │ Colors [■ primary][■ sec]  │
│ Settings     │ Company details on docs... │
│ Master Data  │                            │
│ Audit Log    │ ── Users ──                │
│              │ Name        Role      ⋮    │
│              │ Issa Ali    Admin          │
│              │ (QC)        QC Inspector   │
│              │ [ + Add user ]             │
│              │                            │
│              │ ── Settings ──             │
│              │ Commodities [Avocado ✓]    │
│              │ Size grades [14 16 18 20 22]│
│              │ Loss tolerance [ 2.0 % ]   │
│              │ Cold rooms / Tables [edit] │
└──────────────┴────────────────────────────┘
```

### Platform Super-Admin (you, across all customers)
```
┌───────────────────────────────────────────┐
│ PLATFORM ADMIN                             │
├───────────────────────────────────────────┤
│ Organizations          [ + Onboard org ]   │
│ Name        Status    Users  Last active   │
│ Signet      ● Active   14     2m ago        │
│ [Org B]     ● Active    8     1h ago        │
│ [Org C]     ○ Suspended 0     30d ago       │
├───────────────────────────────────────────┤
│ Usage (no business data): batches/day,     │
│ storage, API calls, uptime p99             │
│ [ Impersonate ] (audited)  [ Billing ]     │
└───────────────────────────────────────────┘
Super-admin sees usage metrics only — never an org's
farmer/claims data except via audited impersonation.
```

---

## Consistent Patterns Across All Screens
- **Export button** (⎙) top-right on every list/table view → xlsx/pdf.
- **Active-run header** on floor screens auto-reflects the station's current run.
- **Photo required** wherever disposition ≠ approve (QC) and at seal capture (loading).
- **Org branding** (logo/colors) injected on every screen and document.
- **Offline-capable** on the four floor screens (receiving, run control, QC, palletizing).
