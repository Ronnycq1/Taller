# Graph Report - Taller-main  (2026-08-10)

## Corpus Check
- 36 files · ~62,714 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 214 nodes · 450 edges · 12 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App.tsx
- types.ts
- dependencies
- compilerOptions
- devDependencies
- uiSlice.ts
- LoyaltyRewardsCenter.tsx
- 2. The "Dirty Dozen" Payloads (Threat Vector Analysis)
- MaintenanceSheet.tsx
- etl_firestore_to_sql.py

## God Nodes (most connected - your core abstractions)
1. `Vehiculo` - 30 edges
2. `Mantenimiento` - 24 edges
3. `UserRole` - 22 edges
4. `RepuestoInventario` - 18 edges
5. `compilerOptions` - 16 edges
6. `useToast()` - 13 edges
7. `2. The "Dirty Dozen" Payloads (Threat Vector Analysis)` - 13 edges
8. `CitaMantenimiento` - 11 edges
9. `BalancedScorecardProps` - 8 edges
10. `db` - 8 edges

## Surprising Connections (you probably didn't know these)
- `AppContent()` --calls--> `handleFirestoreError()`  [EXTRACTED]
  src/App.tsx → src/firebase.ts
- `AppointmentsManager()` --calls--> `useToast()`  [EXTRACTED]
  src/components/AppointmentsManager.tsx → src/components/Toast.tsx
- `LoginProps` --references--> `Vehiculo`  [EXTRACTED]
  src/components/Login.tsx → src/types.ts
- `MaintenanceSheet()` --calls--> `useToast()`  [EXTRACTED]
  src/components/MaintenanceSheet.tsx → src/components/Toast.tsx
- `PublicVehicleHistory()` --calls--> `calculatePredictiveCRM()`  [EXTRACTED]
  src/components/PublicVehicleHistory.tsx → src/utils/crmPredictive.ts

## Import Cycles
- None detected.

## Communities (12 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.16
Nodes (21): AppointmentsManager(), ArchitectureGuide(), CQMotorsLogo(), CQMotorsLogoProps, InventoryManager(), Login(), PublicVehicleHistory(), RegisterAppointmentModal() (+13 more)

### Community 1 - "types.ts"
Cohesion: 0.19
Nodes (26): AppointmentsManagerProps, ArchitectureGuideProps, BalancedScorecardProps, StrategicInitiative, BitacorasManagerProps, DashboardMetrics(), DashboardMetricsProps, DashboardOverviewProps (+18 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (29): dotenv, express, express-rate-limit, firebase, @google/genai, lucide-react, motion, dependencies (+21 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): DOM, DOM.Iterable, ES2022, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules (+11 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, esbuild, vite, devDependencies, autoprefixer, esbuild, tailwindcss, tsx (+21 more)

### Community 5 - "uiSlice.ts"
Cohesion: 0.15
Nodes (13): App(), LoginProps, useAppDispatch, useAppSelector, AppDispatch, RootState, store, initialQueue (+5 more)

### Community 6 - "LoyaltyRewardsCenter.tsx"
Cohesion: 0.16
Nodes (13): AppContent(), BalancedScorecard(), LandingPage(), LoyaltyRewardsCenter(), REWARDS_CATALOG, ToastContext, ToastContextType, ToastMessage (+5 more)

### Community 7 - "2. The "Dirty Dozen" Payloads (Threat Vector Analysis)"
Cohesion: 0.12
Nodes (16): 1. Data Invariants, 2. The "Dirty Dozen" Payloads (Threat Vector Analysis), 3. The Security Verification Test Outline, Payload 10: Anonymous Administrative Access, Payload 11: Customer Phone Spoofing, Payload 12: Invalid ID Characters (Injections), Payload 1: Vehicle Plate Hijacking (Immutability Violation), Payload 2: Massive ID Resource Poisoning (Denial of Wallet) (+8 more)

### Community 8 - "MaintenanceSheet.tsx"
Cohesion: 0.25
Nodes (9): BitacorasManager(), DashboardOverview(), MaintenanceSheet(), RepuestoRequerido, TareaMantenimiento, calculatePredictiveCRM(), cleanText(), getSmartPartsForVehicle() (+1 more)

### Community 9 - "etl_firestore_to_sql.py"
Cohesion: 0.43
Nodes (6): firebase-admin, firebase-admin, extract_collection(), load_to_sql(), main(), transform_data()

## Knowledge Gaps
- **83 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `etl_firestore_to_sql.py`, `devDependencies`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `Vehiculo` connect `types.ts` to `App.tsx`, `MaintenanceSheet.tsx`, `uiSlice.ts`, `LoyaltyRewardsCenter.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `uiSlice.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._