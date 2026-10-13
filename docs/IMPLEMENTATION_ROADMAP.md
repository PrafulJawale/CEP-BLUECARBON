# Blue Carbon Registry & MRV System - Implementation Roadmap

**Created:** 2026-10-09  
**Based on:** PROJECT_AUDIT.md findings  
**Current Phase:** Phase 0 - Stabilize Frontend

---

## Phase 0: Stabilize Existing Frontend (Week 1) ✅ IN PROGRESS

### Objectives
- Fix all TypeScript/lint errors (8 errors, 20 warnings)
- Fix broken routes (404s for referenced pages)
- Fix inconsistent demo credentials
- Remove fake statistics from landing page
- Label all simulations clearly
- Fix React Hook dependency warnings

### Tasks

#### 0.1 Fix TypeScript/Lint Errors (Day 1-2)
- [ ] Fix `no-explicit-any` in AuthContext.tsx (lines 122, 137)
- [ ] Fix `no-explicit-any` in LanguageContext.tsx (lines 63, 70)
- [ ] Fix `no-explicit-any` in PWAInstallPrompt.tsx (line 32)
- [ ] Fix `no-empty-object-type` in command.tsx (line 24)
- [ ] Fix `no-empty-object-type` in textarea.tsx (line 5)
- [ ] Fix `no-require-imports` in tailwind.config.ts (line 146)
- [ ] Fix missing React Hook dependencies in AuthContext.tsx, IoTContext.tsx, GISMapping.tsx
- [ ] Fix fast-refresh warnings (move types/constants out of context files)

#### 0.2 Fix Broken Routes (Day 2-3)
- [ ] Create `/notifications` page (referenced in Navbar)
- [ ] Create `/analytics` page (referenced in GISMapping, IoTSimulation)
- [ ] Create `/fraud-detection` page (referenced in AdminPanel, VerificationWorkflow, IoTSimulation)
- [ ] Create `/3d-visualization` page (referenced in GISMapping)
- [ ] Or remove dead links from UI

#### 0.3 Fix Demo Credentials (Day 3)
- [ ] Align Govt Officer password: code has "govt123", README says "govadmin123"
- [ ] Update README to match actual credentials
- [ ] Verify all demo accounts work

#### 0.4 Remove Fake Statistics (Day 3-4)
- [ ] LandingPage.tsx: Remove hardcoded "1,200+ Projects", "2.5M CO₂", "850+ NGOs", "15 States"
- [ ] Replace with real data from DataContext or show "No data available"
- [ ] Marketplace.tsx: Remove hardcoded "152 transactions today", "+12% price change"
- [ ] Registry.tsx: Remove fake blockchain hash generation
- [ ] GISMapping.tsx: Remove hardcoded "2,450 hectares", "24 online sensors", "8.7/10 biodiversity"

#### 0.5 Label Simulations Clearly (Day 4)
- [ ] IoTSimulation: Add prominent "SIMULATION" badge
- [ ] DataUpload: Label file upload as "simulated"
- [ ] Registry: Label blockchain hash as "simulated"
- [ ] AdminPanel: Label fraud detection as "demo data"
- [ ] Dashboard: Label carbon calculations as "estimates"

#### 0.6 Fix React Hook Dependencies (Day 4-5)
- [ ] AuthContext.tsx: Fix useEffect dependency on `user`
- [ ] IoTContext.tsx: Fix useEffect dependency on `updateSensorData`
- [ ] GISMapping.tsx: Fix useEffect dependencies on `drawMap`
- [ ] LanguageContext.tsx: Fix useEffect dependency on `language`

### Acceptance Criteria
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` passes without warnings (or only acceptable warnings)
- [ ] All navigation links work (no 404s)
- [ ] Demo credentials in README match actual code
- [ ] No fake statistics displayed as real data
- [ ] All simulations clearly labeled
- [ ] No React Hook exhaustive-deps warnings

---

## Phase 1: Backend Foundation (Week 2)

### Objectives
- Set up FastAPI project structure
- PostgreSQL models (User, Project, Evidence, Credit, Transaction, AuditLog)
- Authentication (bcrypt, JWT in HttpOnly cookies)
- API schemas (Pydantic)
- Database migrations (Alembic)

### Tasks
- [ ] Create `backend/` directory with FastAPI structure
- [ ] Set up SQLAlchemy models with proper relationships
- [ ] Implement Alembic migrations
- [ ] Create authentication module (register, login, logout, JWT)
- [ ] Implement password hashing with bcrypt
- [ ] Create Pydantic schemas for all entities
- [ ] Set up CORS for frontend
- [ ] Create health check endpoint
- [ ] Add `.env.example` with all required variables
- [ ] Write Docker Compose for local development

### Acceptance Criteria
- [ ] Backend runs locally with `docker-compose up`
- [ ] API docs available at `/docs`
- [ ] User registration/login works via API
- [ ] Passwords are hashed (not plaintext)
- [ ] JWT tokens in HttpOnly cookies
- [ ] Database migrations work

---

## Phase 2: Persisted Project Lifecycle (Week 3)

### Objectives
- Project CRUD API
- Status transitions with validation
- Audit logging
- Connect frontend to backend API

### Tasks
- [ ] Project API endpoints (create, read, update, list)
- [ ] Project status workflow: Draft → Submitted → Under Review → Approved/Rejected/Changes Requested
- [ ] Server-side validation for all project fields
- [ ] Audit log for all status changes
- [ ] Replace DataContext with API client
- [ ] Update all pages to use backend data
- [ ] Handle loading/error states

### Acceptance Criteria
- [ ] Projects persist in PostgreSQL
- [ ] Status transitions enforced server-side
- [ ] Audit trail visible in admin panel
- [ ] Frontend works with backend API
- [ ] No localStorage for project data

---

## Phase 3: Evidence & Monitoring (Week 4)

### Objectives
- Real file upload (multipart)
- Evidence metadata persistence
- IoT ingestion endpoint (with mock adapter)

### Tasks
- [ ] File upload endpoint with validation (size, type, extensions)
- [ ] Secure file storage (local dev, S3-ready abstraction)
- [ ] Evidence metadata in database
- [ ] Evidence review workflow (admin can view/approve/reject)
- [ ] IoT data ingestion API
- [ ] Mock IoT adapter for development
- [ ] Clear labeling of simulated vs real data

### Acceptance Criteria
- [ ] Files actually upload and persist
- [ ] File metadata stored in database
- [ ] Evidence linked to projects
- [ ] IoT endpoint accepts sensor data
- [ ] Simulated data clearly labeled

---

## Phase 4: MRV Calculation Service (Week 5)

### Objectives
- Transparent calculation engine
- Methodology documentation
- Provenance tracking
- Unit tests

### Tasks
- [ ] Design calculation engine with explicit methodology
- [ ] Implement IPCC/VERRA-aligned formulas (documented as prototype)
- [ ] Track input provenance (source, timestamp, evidence)
- [ ] Version calculations
- [ ] Unit tests for calculations
- [ ] Label all outputs as "prototype estimates"
- [ ] Remove random calculations from DataContext

### Acceptance Criteria
- [ ] Calculation methodology documented in `docs/MRV_METHODOLOGY.md`
- [ ] All inputs traceable to evidence
- [ ] Results reproducible
- [ ] Unit tests pass
- [ ] Outputs clearly labeled as estimates

---

## Phase 5: Registry & Marketplace (Week 6)

### Objectives
- Credit issuance rules
- Marketplace with transaction safety
- Duplicate/oversell prevention

### Tasks
- [ ] Credit issuance only after project approval + evidence review
- [ ] Credit lifecycle: proposed → issued → listed → sold/transferred → retired
- [ ] Marketplace API with atomic transactions
- [ ] Prevent self-purchase
- [ ] Prevent overselling (database transactions)
- [ ] Transaction audit trail
- [ ] Ownership consistency

### Acceptance Criteria
- [ ] Credits only issued per defined rules
- [ ] No duplicate purchases possible
- [ ] No overselling possible
- [ ] Full transaction history
- [ ] Ownership always consistent

---

## Phase 6: GIS & Reporting (Week 7)

### Objectives
- Real map with project data
- Role-based dashboards
- Export functionality

### Tasks
- [ ] Replace Canvas map with Mapbox GL or Leaflet
- [ ] Display actual project coordinates from database
- [ ] Project boundaries/geometries when available
- [ ] Filters: ecosystem type, status, location
- [ ] Role-specific dashboards with real metrics
- [ ] Export reports (CSV/PDF)

### Acceptance Criteria
- [ ] Map shows real project locations
- [ ] Map loads without external dependency failures
- [ ] Dashboards show real data
- [ ] Exports work

---

## Phase 7: Security & Testing (Week 8)

### Objectives
- Security audit
- Integration tests
- E2E tests for critical flows

### Tasks
- [ ] Security review (OWASP Top 10)
- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection
- [ ] Integration tests for auth, projects, credits
- [ ] E2E tests: register → create project → submit → approve → list credits → purchase
- [ ] Accessibility audit (WCAG 2.1 AA)

### Acceptance Criteria
- [ ] No critical security vulnerabilities
- [ ] >60% coverage on critical paths
- [ ] E2E tests pass for main workflow
- [ ] Accessibility score >90%

---

## Phase 8: Polish & Demo (Week 9)

### Objectives
- Accessibility improvements
- Demo seeding
- Documentation

### Tasks
- [ ] Final UI polish (responsive, loading states, error states)
- [ ] Create demo seed script with realistic data
- [ ] Write comprehensive README
- [ ] Write demo guide for viva
- [ ] Write architecture documentation
- [ ] Final testing

### Acceptance Criteria
- [ ] Application runs with one command
- [ ] Demo works reliably
- [ ] All documentation complete and accurate
- [ ] Ready for college evaluation

---

## Dependency Graph

```
Phase 0 (Frontend Stabilize)
    │
    ├──→ Phase 1 (Backend Foundation)
    │       │
    │       ├──→ Phase 2 (Project Lifecycle)
    │       │       │
    │       │       ├──→ Phase 3 (Evidence & IoT)
    │       │       │       │
    │       │       │       ├──→ Phase 4 (MRV Calculations)
    │       │       │       │       │
    │       │       │       │       ├──→ Phase 5 (Registry & Marketplace)
    │       │       │       │       │       │
    │       │       │       │       │       ├──→ Phase 6 (GIS & Reporting)
    │       │       │       │       │       │       │
    │       │       │       │       │       │       ├──→ Phase 7 (Security & Testing)
    │       │       │       │       │       │       │       │
    │       │       │       │       │       │       │       └──→ Phase 8 (Polish & Demo)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Backend integration breaks frontend | API-first design, typed client, incremental migration |
| Database migration complexity | Start simple, use Alembic from day 1 |
| MRV methodology credibility | Document explicitly as prototype, cite real standards |
| Time constraints | Prioritize core workflow, defer nice-to-have |
| Windows compatibility | Test all commands in PowerShell, use cross-platform tools |

---

## Current Status

**Phase 0 - Day 1:** Starting with TypeScript/lint error fixes