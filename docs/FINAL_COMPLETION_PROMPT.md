# FINAL COMPLETION PROMPT — CEP-BLUECARBON
Copy this into a fresh OpenCode session to complete the project and get it to a fully working state.

---

## PROMPT START

You are completing the **CEP-BLUECARBON** repo (Blue Carbon Registry & MRV, React+Vite frontend, FastAPI backend). The project is in **Phase 3: E2E Validation & Production Hardening** with core workflows verified. Your task: **fix the remaining 3 blockers and get the full E2E test passing**, then run final quality checks.

### Step 0 — Read before editing (mandatory)
1. Read `docs/PROGRESS.md` — verified state audit.
2. Read `docs/NEXT_SESSION.md` — context.
3. Run `git status --short` and `git branch --show-current`. **Preserve all changes.** Do NOT commit, push, reset, stash, clean, or discard.

### Step 1 — Verify current state
```bash
# Start backend (port 8000)
cd backend
Remove-Item test.db -Force -ErrorAction SilentlyContinue
$env:ENVIRONMENT="development"
python -m app.scripts.seed_demo
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn app.main:app --reload --port 8000"

# Start frontend (port 8080) in another terminal
npm run dev

# Verify health
Start-Sleep 5
curl -s http://127.0.0.1:8000/health
curl -s http://localhost:8080/api/v1/projects
```

### Step 2 — Fix the 3 remaining E2E blockers

#### Blocker 1: Decision Modal Select Component (Verification Workflow)
**File:** `tests/e2e.spec.ts` (lines ~210-230) and `src/pages/VerificationWorkflow.tsx` (lines 640-652)
**Issue:** shadcn Select component renders in Radix Portal; `[role="option"]` click intercepted by modal overlay.
**Fix:** Use Playwright's `selectOption()` on the native select or scope to the open dialog:
```typescript
// In the decision modal, after clicking "Submit Decision"
await page.waitForSelector('[role="dialog"]');
const dialog = page.locator('[role="dialog"]').first();
await dialog.locator('[role="combobox"]').click();
await dialog.locator('[role="option"]:has-text("Approved")').click();
// OR use selectOption if the underlying element is a native select
```

#### Blocker 2: Calculation Creation Needs Approved Project
**File:** `tests/e2e.spec.ts` (lines ~310-340)
**Issue:** The E2E Test Project is in "draft" status; only "approved" projects can have calculations.
**Fix:** Select the existing **Sundarbans Mangrove Restoration Phase 1** (status: approved, owned by developer) in the project Select:
```typescript
// Click "Create New" → click project Select trigger → click "Sundarbans Mangrove Restoration Phase 1"
const projectSelect = page.locator('button:has-text("Select project"), button:has-text("Sundarbans")').first();
await projectSelect.click();
await page.click('text=Sundarbans Mangrove Restoration Phase 1');
```

#### Blocker 3: Database Reset Between Test Runs
**File:** `tests/e2e.spec.ts` (add at test start or in `beforeEach`)
**Issue:** Seed data gets reviewed in previous runs; verification workflow shows "0 Projects Awaiting Review".
**Fix:** Add API call to reset database or re-seed before test:
```typescript
test.beforeEach(async ({ page }) => {
  // Reset database via API or re-seed
  await page.request.post('http://localhost:8080/api/v1/admin/reset-db').catch(() => {});
  // OR: await page.request.post('http://localhost:8080/api/v1/admin/re-seed');
  await page.goto('http://localhost:8080');
});
```
**Backend:** Add `/admin/re-seed` endpoint in `backend/app/api/v1/admin.py` that calls the seed script.

### Step 3 — Complete the E2E test flow
The test should execute this full flow without manual intervention:

1. **Login** (developer) → API login + cookie handling ✅
2. **Create project** (E2E Test Project) → HTTP 201, dashboard shows "Projects 1" ✅
3. **Verification workflow** (gov officer) → Start Review → Submit Decision (Approved) → all checks
4. **Calculation** (developer) → Create for Sundarbans (approved) → Submit for Review
5. **Calculation review** (gov officer) → Approve
6. **Credit issuance** (admin) → Issue credits via API → Verify in Registry
7. **Browser refresh** → Verify all data persists

### Step 4 — Run final quality checks (ALL must pass)
```bash
cd C:\Users\jawal\Downloads\cep\bluecarbon-registry-mrv\CEP-BLUECARBON

# Frontend
npm run build          # PASS
npm run lint           # PASS (0 errors)
npx tsc --noEmit       # PASS (0 errors)

# Backend
cd backend
python -m pytest app/tests/ -q   # 36 passed

# E2E
npx playwright test tests/e2e.spec.ts --project=chromium   # PASS (1 test)
```

### Step 5 — Update documentation
Update `docs/PROGRESS.md` and `docs/NEXT_SESSION.md` with:
- All blockers resolved
- E2E test passing
- Final status: **PROJECT COMPLETE — WORKING MODE**

---

## SUCCESS CRITERIA
The project is **done** when:
1. ✅ `npx playwright test tests/e2e.spec.ts --project=chromium` exits with **0 failures**
2. ✅ All 4 quality checks pass (build, lint, typecheck, backend tests)
3. ✅ Full E2E flow completes: login → create project → verification → calculation → credit issuance → refresh → data persists
4. ✅ No manual intervention needed; test runs headless in CI

---

## PROMPT END