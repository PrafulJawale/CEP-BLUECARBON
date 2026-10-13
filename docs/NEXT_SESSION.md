# Next Session Continuation Prompt (copy-paste into a fresh OpenCode session)

---

## PROMPT START

You are resuming work on the **CEP-BLUECARBON** repo (Blue Carbon Registry & MRV, React+Vite frontend, FastAPI backend) during **Phase 3: E2E Validation & Production Hardening (COMPLETE)**.

### Step 0 — Read before editing (mandatory)
1. Read `docs/PROGRESS.md` — this is the verified state audit (written from direct inspection, not from memory).
2. Read `docs/NEXT_SESSION.md` (this file).
3. Skim `docs/IMPLEMENTATION_ROADMAP.md` and `docs/PROJECT_AUDIT.md` for context (preserve them; do not rewrite).
4. Run `git status --short` and `git branch --show-current`. **Preserve every existing change.** The working tree has ~35 modified files, untracked `backend/`, `docker-compose.yml`, `docs/`, `src/lib/api.ts`, `src/pages/CalculationManager.tsx`, and 4 placeholder pages. **Do NOT commit, push, reset, stash, clean, or discard anything.** Do not assume untracked files are disposable.

### Step 1 — Verify, don't trust (the previous session completed Phase 3 E2E validation)
Re-confirm the current implementation:
- `src/lib/api.ts` EXISTS — typed fetch client + zod schemas, exports all needed types. Includes `calculationApi`, `creditApi`, `monitoringApi`, `notificationApi` helpers.
- `src/contexts/AuthContext.tsx` is backend-backed (`/auth/login|register|logout|me|refresh`, HttpOnly cookie) — **0 tsc errors**, consumers migrated.
- `src/pages/LoginPage.tsx` / `RegisterPage.tsx` updated for `{ success, error? }` API.
- `src/contexts/DataContext.tsx` **FULLY MIGRATED** for projects, verification, calculations, credits, marketplace, monitoring, notifications — uses `/api/v1/projects`, `/api/v1/verification`, `/api/v1/calculations`, `/api/v1/credits`, `/api/v1/marketplace`, `/api/v1/monitoring`, `/api/v1/notifications`. Added `isLoading`, `error`, `refreshProjects`, `verificationReviews`, `calculations`, `backendCredits`, `monitoringObservations`, `notifications`, `unreadNotificationCount`.
- **Project interface fixed**: Uses `owner_id` (not `userId`) to match backend API. `mapBackendProjectToFrontend` maps correctly. `CalculationManager` and `getUserProjects` use `owner_id`.
- **Dev connectivity FIXED**: `vite.config.ts` has `server.proxy` for `/api/v1/*` → `http://localhost:8000` and `/api/*` → `http://localhost:8000` with rewrite. Backend CORS includes `http://localhost:8080`.
- **Register creates session**: Backend `/auth/register` returns `Token` and sets HttpOnly cookies. Frontend calls `/auth/me` after register.
- **All 44 TypeScript errors FIXED**: Role checks use backend values (`admin`, `government_officer`, etc.), `user.username` → `user.full_name`, missing imports added, IoTContext use-before-declaration fixed.
- **Backend tests**: 36/36 passing (auth register test updated for new Token response).
- **Evidence upload COMPLETE**: `DataUpload.tsx` creates project via `POST /api/v1/projects`, then uploads files via `POST /api/v1/evidence/upload?project_id=...&evidence_type=...` with multipart/form-data. Progress tracking, error handling, and refresh implemented.
- **Verification workflow COMPLETE**: `VerificationWorkflow.tsx` connects to `/api/v1/verification`:
  - Lists projects with status `submitted`, `under_review`, `changes_requested` for review
  - `POST /api/v1/verification` — create review (govt_officer/admin only)
  - `GET /api/v1/verification/project/{project_id}` — list reviews for project
  - `POST /api/v1/verification/{review_id}/decision` — submit decision (approve/reject/changes_requested) with `evidence_reviewed`, `calculation_reviewed`, `methodology_compliant` flags
  - Decision modal with Select component for decision, textarea for comments, checkboxes for review checks
  - Project status updates automatically on decision (approved/rejected/changes_requested)
  - Review history displayed with decision, checks, comments, timestamps
  - Role-based access: only admin/government_officer can create reviews and submit decisions
- **Calculation workflow COMPLETE**: `CalculationManager.tsx` connects to `/api/v1/calculations`:
  - Lists approved projects for calculation creation (filters by `owner_id` and status `approved`)
  - `POST /api/v1/calculations` — create calculation with methodology, input parameters, assumptions
  - `POST /api/v1/calculations/{id}/submit` — submit for review (project_developer)
  - `POST /api/v1/calculations/{id}/review` — approve/reject (govt_officer/admin)
  - Displays methodology, input parameters, calculated values (biomass, carbon stock, CO2 equivalent, annual sequestration, potential credits)
  - Role-based access: project_developer creates/submits, govt_officer/admin reviews
- **Credit issuance COMPLETE**: `CalculationManager.tsx` (admin only) connects to `/api/v1/credits/issue`:
  - `POST /api/v1/credits/issue` — issue credits from approved calculation on approved project
  - Requires approved project + approved calculation
  - Duplicate batch_id prevention enforced by backend
  - Displays issued credits with batch_id, quantity, vintage_year, methodology
- **Monitoring/IoT COMPLETE**: `IoTContext` migrated to backend `/api/v1/monitoring`:
  - `POST /api/v1/monitoring` — create observation (project_developer)
  - `GET /api/v1/monitoring/project/{project_id}` — list observations
  - `GET /api/v1/monitoring/{observation_id}` — get observation
  - `PATCH /api/v1/monitoring/{observation_id}` — update observation
  - Simulated readings still available in `IoTSimulation.tsx` but clearly labeled as simulated
- **Notifications COMPLETE**: `NotificationContext` migrated to backend `/api/v1/notifications`:
  - `GET /api/v1/notifications` — list notifications (with pagination, filters)
  - `GET /api/v1/notifications/unread-count` — get unread count
  - `GET /api/v1/notifications/{notification_id}` — get notification
  - `PATCH /api/v1/notifications/{notification_id}/read` — mark as read
  - `POST /api/v1/notifications/mark-all-read` — mark all as read
- **Loading/error states COMPLETE**: Dashboard, Registry, Marketplace, AdminPanel all consume `isLoading`, `error`, `refreshProjects` from DataContext. Skeleton loaders, error toasts, empty states, retry actions implemented.
- **Backend health check FIXED**: `app/db/init_db.py` `check_db_connection()` now uses `text("SELECT 1")` for SQLAlchemy 2.0+ compatibility. Health endpoint returns `healthy` on SQLite.
- **Project status type updated**: `Project` interface now includes `'submitted'` status to match backend.
- **ProtectedRoute FIXED**: Added `isLoading` check to `ProtectedRoute` and `RoleRoute` in `src/components/RouteGuards.tsx` to prevent premature redirect during session restoration.
- **Project owner_id mapping FIXED**: `Project` interface uses `owner_id` (matches backend), `mapBackendProjectToFrontend` maps `owner_id` correctly, `CalculationManager` and `getUserProjects` filter by `owner_id`. Dashboard shows "Projects 1" after creation.

### Step 2 — Baseline checks (run before changing anything)
```bash
npm run build                                              # PASS expected
npm run lint                                               # PASS (16 known warnings)
npx tsc --noEmit -p tsconfig.app.json                      # PASS: 0 errors
cd backend && python -m pytest app/tests/ -q               # 36 passed
npx playwright test tests/e2e.spec.ts --project=chromium   # PASS
```
Do not claim results you did not run. Do not install/upgrade dependencies unnecessarily.

### Step 3 — Next recommended tasks (Phase 3 COMPLETE — Begin Production Hardening)

**Phase 3: E2E Validation & Production Hardening (COMPLETE — Full E2E workflow verified)**

1. **Frontend test suite** — Add Vitest/RTL tests for critical paths (auth, project CRUD, evidence upload, verification, calculations, credit issuance, marketplace, monitoring, notifications). No unit test framework currently configured beyond the Playwright E2E setup.
2. **Production hardening** — Code-splitting (`manualChunks` in `vite.config.ts`), CSP headers, error boundaries, accessibility audit (WCAG 2.1 AA), bundle size optimization.
3. **Optional: Postgres migration** — Configure Docker/postgres for production deployment.

**For each feature:**
- Use actual backend endpoints and schemas from `src/lib/api.ts`.
- Preserve existing component interfaces where practical.
- Add loading, error, and empty states.
- Refresh state after successful mutations.
- Avoid duplicate submissions and stale data.
- Respect backend authorization.
- Do not fabricate measurements, carbon calculations, credits, purchases, or verification results.
- Do not show success messages when a request fails.
- Do not assume an endpoint exists; inspect the backend first.
- Do not claim tests/builds pass unless you ran them in this session.

Keep localStorage only for suitable UI preferences such as theme, language, and sidebar state. Do not remove existing data keys or UI features blindly.

If a backend feature is not implemented, document it and represent it honestly rather than pretending it works.

### Safety rules (hard constraints)
- Never commit, push, reset, clean, stash, or discard changes.
- Never delete databases or print/commit secrets (reference env var names like `SECRET_KEY`, `DATABASE_URL` only; see `backend/.env.example`).
- Do not rewrite the app or start unrelated features (no blockchain/payments/external services).
- Do not modify application code merely to make a check pass; fix root causes.
- Do not claim tests/builds pass unless you ran them in this session.
- Docker is NOT available in this environment; backend tests run on SQLite already.
- Frontend tests (Vitest/RTL) require separate configuration; Playwright E2E tests (`tests/e2e.spec.ts`) require Vite dev server running on port 8080.

### Known environment facts
- PowerShell shell (no `head`/`find`/heredocs; use `Select-Object`, `;` chaining).
- Backend: `cd backend && python -m pytest app/tests/ -v`; seed: `ENVIRONMENT=development python -m app.scripts.seed_demo` (idempotent).
- Backend server needs a DB (Docker absent): use available local Postgres or a SQLite `DATABASE_URL` override.
- Frontend scripts: `npm run dev` (port 8080), `npm run build`, `npm run lint`; no `test` script exists.

### Success criterion for Phase 3 (MET):
- ✅ `npx playwright test tests/e2e.spec.ts --project=chromium` exits with **0 failures**
- ✅ All 4 quality checks pass (build, lint, typecheck, backend tests)
- ✅ Full E2E flow completes: login → create project → verification → calculation → credit issuance → refresh → data persists
- ✅ No manual intervention needed; test runs headless in CI

## PROMPT END

---

## Quick reference: what exists vs what's missing

| Piece | State |
|-------|-------|
| `src/lib/api.ts` | Done |
| AuthContext backend auth | Done |
| Login/Register pages | Done (+ en/hi locale keys) |
| Role/username migration across UI | Done — 0 tsc errors |
| Dev proxy/CORS/env | Done — `/api/v1/*` proxied to `:8000`, CORS includes `:8080` |
| Register session cookie | Done — backend sets cookies on register |
| DataContext → backend (projects) | Done — list, create, approve, reject |
| DataContext → backend (verification) | Done — create review, list reviews, submit decision |
| DataContext → backend (calculations) | Done — create, submit, review |
| DataContext → backend (credits) | Done — issue credits (admin) |
| DataContext → backend (marketplace) | Done — list credits, purchase |
| DataContext → backend (monitoring) | Done — create, list, get, update observations |
| DataContext → backend (notifications) | Done — list, unread count, get, mark read, mark all read |
| Evidence upload → backend | **DONE** — `DataUpload.tsx` → `/api/v1/projects` + `/api/v1/evidence/upload` |
| Verification workflow → backend | **DONE** — `VerificationWorkflow.tsx` → `/api/v1/verification` |
| Calculation workflow → backend | **DONE** — `CalculationManager.tsx` → `/api/v1/calculations` |
| Credit issuance → backend | **DONE** — `CalculationManager.tsx` (admin) → `/api/v1/credits/issue` |
| Monitoring/IoT → backend | **DONE** — `IoTContext` → `/api/v1/monitoring` |
| Notifications → backend | **DONE** — `NotificationContext` → `/api/v1/notifications` |
| Loading/error states | **DONE** — Dashboard, Registry, Marketplace, AdminPanel |
| Project owner_id mapping | **DONE** — Fixed `owner_id` vs `userId` mismatch |
| ProtectedRoute fix | **DONE** — Added `isLoading` check |
| Frontend tests | **COMPLETE** — Playwright E2E tests pass; full E2E workflow verified |
| Backend tests | 36/36 passing |
| Backend health on SQLite | **DONE** — fixed `check_db_connection()` |
| ProtectedRoute fix | **DONE** — Added `isLoading` check to `ProtectedRoute` and `RoleRoute` |

(End of file - total ~200 lines)