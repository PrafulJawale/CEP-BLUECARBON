# Blue Carbon Registry & MRV System - Project Audit

**Date:** 2026-10-09  
**Branch:** main  
**Latest Commit:** f5fef19 "Initial CEP Blue Carbon Registry project"  
**Uncommitted Changes:** 4 files modified (AuthContext.tsx, en.json, hi.json, Marketplace.tsx)

---

## 1. Repository Overview

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite 5
- **UI Components:** shadcn/ui (Radix UI primitives), Tailwind CSS
- **State Management:** React Context API (7 providers)
- **Routing:** React Router DOM v6
- **Forms:** React Hook Form + Zod
- **Internationalization:** i18next + react-i18next (4 languages)
- **Visualization:** Recharts, Three.js, Canvas-based map, GSAP animations
- **Maps:** Mapbox GL (installed but not actively used), custom Canvas map
- **PWA:** vite-plugin-pwa with Workbox

### Project Structure
```
src/
├── components/
│   ├── ui/                 # 40+ shadcn/ui components
│   ├── Navbar.tsx          # Main navigation with UX4G accessibility
│   ├── RouteGuards.tsx     # ProtectedRoute, RoleRoute
│   └── ...
├── contexts/               # 7 Context providers (all localStorage-backed)
│   ├── AuthContext.tsx     # Authentication (plaintext passwords!)
│   ├── DataContext.tsx     # Projects, credits, transactions
│   ├── IoTContext.tsx      # Sensor simulation
│   ├── NotificationContext.tsx
│   ├── LanguageContext.tsx
│   ├── GameificationContext.tsx
│   └── ForumContext.tsx
├── pages/                  # 13 page components
├── locales/                # 4 translation files (en, hi, ta, te)
├── hooks/                  # use-toast, use-mobile
└── lib/utils.ts
```

### Build & Lint Status
- **Build:** ✅ Passes (584 kB JS bundle, warning about chunk size)
- **Lint:** ❌ 8 errors, 20 warnings
  - `no-explicit-any` in multiple files
  - `no-empty-object-type` in UI components
  - `no-require-imports` in tailwind.config.ts
  - Missing React Hook dependencies
  - Fast refresh warnings (context files export non-components)

---

## 2. Feature Classification

### Legend
- **A** - Implemented and working
- **B** - Partially implemented
- **C** - Simulated/demo-only
- **D** - Broken
- **E** - Not implemented

| Feature | Classification | Notes |
|---------|----------------|-------|
| **Authentication & Authorization** |
| User registration | C | localStorage only, plaintext passwords stored |
| User login | C | localStorage only, no password hashing |
| Role-based access | B | Frontend-only guards (RouteGuards), no server enforcement |
| Session persistence | C | localStorage token, no expiry/refresh |
| Password security | D | Plaintext passwords in localStorage |
| **Project Lifecycle** |
| Project creation form | B | Form works but data only in localStorage |
| Project validation | C | Client-side only, no server validation |
| Status transitions (draft→pending→approved/rejected) | C | Simulated in DataContext, no audit trail |
| Project ownership | C | Stored as userId string, no verification |
| **Evidence & Monitoring** |
| File upload (drone/satellite/IoT) | D | Only captures filenames, no actual upload |
| File validation | E | No size/type validation |
| Evidence metadata persistence | D | Filenames stored as strings |
| Evidence review workflow | E | Not implemented |
| IoT sensor simulation | C | Random data generation, clearly labeled as simulation |
| Real IoT ingestion | E | No ingestion endpoint |
| **GIS / Geospatial** |
| Interactive map | B | Canvas-based, hardcoded sites, not data-driven |
| Project locations on map | C | Hardcoded 3 sites, not from project data |
| Layer switching | B | Works but decorative |
| Real geospatial analysis | E | No coordinate validation, no real geometry |
| Mapbox integration | E | Installed but unused |
| **Carbon Accounting / MRV** |
| Tree count calculation | D | `Math.random() * 500 + 100` - completely fake |
| Biomass calculation | D | `treeCount * 0.5` - arbitrary multiplier |
| CO₂ sequestration | D | `biomass * 1.83` - no methodology reference |
| Credit generation | D | `Math.floor(co2Sequestered)` - no methodology |
| Methodology documentation | E | None exists |
| Calculation provenance | E | No input tracking, no versioning |
| **Registry** |
| Verified project listing | B | Filters verified projects from localStorage |
| Project detail view | B | Shows data but includes fake blockchain hash |
| Search/filter | E | Not implemented |
| **Marketplace** |
| Credit listing | C | From localStorage, no eligibility checks |
| Credit purchase | C | localStorage mutation, no transaction safety |
| Duplicate purchase prevention | D | No concurrency control |
| Self-purchase prevention | E | Not checked |
| Payment integration | E | Simulated only |
| **Wallet** |
| Credit balance display | B | From localStorage data |
| Transaction history | B | From localStorage data |
| Transfer/sell actions | C | UI only, no backend |
| **Admin / Verification** |
| Admin dashboard | B | Shows stats from localStorage |
| Project approve/reject | C | Mutates localStorage, no audit trail |
| Fraud detection | D | Hardcoded fake alerts |
| Review comments | E | Not implemented |
| Resubmission workflow | E | Not implemented |
| **Community / Gamification** |
| Forum | C | localStorage only |
| Badges/achievements | C | localStorage only, conditions not checked |
| Leaderboard | D | Hardcoded fake data |
| **Internationalization** |
| 4 languages (en, hi, ta, te) | A | Working, complete translations |
| RTL support | E | Not needed for these languages |
| **PWA** |
| Service worker | A | Generated by vite-plugin-pwa |
| Install prompt | B | Component exists |
| Offline support | C | Only static assets cached |

---

## 3. Critical Issues

### Security
1. **Plaintext passwords** stored in localStorage (AuthContext.tsx:54, 63, 72, 81, 90, 99)
2. **No password hashing** - passwords compared directly (AuthContext.tsx:122)
3. **Frontend-only authorization** - RoleRoute/ProtectedRoute provide no real security
4. **No CSRF protection** - No tokens, no SameSite cookies
5. **No input sanitization** - User inputs directly stored/displayed
6. **No rate limiting** - Login/register unlimited attempts

### Data Integrity
1. **All data in localStorage** - No persistence, no multi-user, no backup
2. **No database** - Cannot survive browser clear, no concurrent access
3. **Race conditions** - Credit purchase not atomic (DataContext.tsx:224-252)
4. **No audit trail** - No history of who did what when
5. **Fake calculations** - Random tree counts, arbitrary formulas (DataContext.tsx:68-81)

### Scientific Credibility
1. **No MRV methodology** - No reference to VERRA, Gold Standard, IPCC, or any standard
2. **Invented formulas** - Tree count from image count, biomass from tree count, CO₂ from biomass
3. **No units documentation** - "tons" ambiguous (metric/short), no CO₂e clarification
4. **Fake blockchain** - Random hex string labeled "Blockchain Hash" (Registry.tsx:155)
5. **No verification evidence** - Approval just flips boolean, no evidence review

### Code Quality
1. **TypeScript errors** - 8 lint errors including `any` types
2. **React Hook violations** - Missing dependencies in useEffect
3. **Context anti-pattern** - All contexts export non-components (fast refresh warnings)
4. **Large bundle** - 584 kB JS, no code splitting
5. **Hardcoded values** - Stats on landing page (1,200+ projects, 2.5M CO₂) are fake

### UX/Accessibility
1. **Broken navigation** - "Analytics", "Fraud Detection", "3D Visualization" routes don't exist
2. **Inconsistent demo credentials** - Govt Officer password is "govt123" but README says "govadmin123"
3. **Missing pages** - /notifications, /analytics, /fraud-detection, /3d-visualization referenced but not implemented
4. **No error boundaries** - Component crashes break entire app

---

## 4. Architecture Assessment

### Current Architecture (Frontend-Only)
```
Browser
  ├── React App (Vite)
  │   ├── 7 Context Providers (Auth, Data, IoT, Notifications, Language, Gamification, Forum)
  │   ├── 13 Pages
  │   └── localStorage (7 keys: users, current_user, projects, credits, transactions, sensors, sensor_data, notifications, badges, achievements, forum_posts, forum_votes)
```

### Required Architecture (Full-Stack)
```
┌─────────────────┐     HTTPS      ┌─────────────────┐
│   Frontend      │ ◄────────────► │   Backend       │
│   (React/Vite)  │   REST API     │   (FastAPI)     │
└─────────────────┘                └────────┬────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                         ┌─────────┐  ┌──────────┐  ┌────────────┐
                         │PostgreSQL│  │File Store│  │  Redis     │
                         │(Primary) │  │ (Local/  │  │  (Sessions,│
                         │          │  │  S3)     │  │  Cache)    │
                         └─────────┘  └──────────┘  └────────────┘
```

---

## 5. Priority Fixes (Immediate)

### Phase 0 - Stabilize Frontend (Week 1) ✅ COMPLETED
1. ✅ Fix TypeScript/lint errors (0 errors, 16 warnings remaining - all fast-refresh only)
2. ✅ Fix broken routes (404s for referenced pages) - Created placeholder pages for /notifications, /analytics, /fraud-detection, /3d-visualization
3. ✅ Fix inconsistent demo credentials - Govt Officer password now consistent (govadmin123)
4. ✅ Remove fake statistics from landing page - Replaced with zeros
5. ✅ Label all simulations clearly - Added "Simulated Data" badges to IoT, DataUpload, Registry, Dashboard, AdminPanel
6. ✅ Fix React Hook dependency warnings - Fixed in AuthContext, IoTContext, GISMapping

### Phase 1 - Backend Foundation (Week 2)
1. Set up FastAPI project structure
2. PostgreSQL models (User, Project, Evidence, Credit, Transaction, AuditLog)
3. Authentication (bcrypt, JWT in HttpOnly cookies)
4. API schemas (Pydantic)
5. Database migrations (Alembic)

### Phase 2 - Persisted Project Lifecycle (Week 3)
1. Project CRUD API
2. Status transitions with validation
3. Audit logging
4. Connect frontend to backend API

### Phase 3 - Evidence & Monitoring (Week 4)
1. Real file upload (multipart)
2. Evidence metadata persistence
3. IoT ingestion endpoint (with mock adapter)

### Phase 4 - MRV Calculation Service (Week 5)
1. Transparent calculation engine
2. Methodology documentation
3. Provenance tracking
4. Unit tests

### Phase 5 - Registry & Marketplace (Week 6)
1. Credit issuance rules
2. Marketplace with transaction safety
3. Duplicate/oversell prevention

### Phase 6 - GIS & Reporting (Week 7)
1. Real map with project data
2. Role-based dashboards
3. Export functionality

### Phase 7 - Security & Testing (Week 8)
1. Security audit
2. Integration tests
3. E2E tests for critical flows

### Phase 8 - Polish & Demo (Week 9)
1. Accessibility improvements
2. Demo seeding
3. Documentation

---

## 6. Uncommitted Changes Analysis

| File | Change Type | Assessment |
|------|-------------|------------|
| `src/contexts/AuthContext.tsx` | Modified | Fixed TypeScript types, React Hook deps, demo credentials |
| `src/locales/en.json` | Modified | Translation updates |
| `src/locales/hi.json` | Modified | Translation updates |
| `src/pages/Marketplace.tsx` | Modified | Removed fake stats, added dynamic avg price calculation |
| `src/pages/LandingPage.tsx` | Modified | Replaced fake stats with zeros |
| `src/pages/Registry.tsx` | Modified | Labeled blockchain hash as simulated |
| `src/pages/AdminPanel.tsx` | Modified | Labeled fraud detection as demo data |
| `src/pages/IoTSimulation.tsx` | Modified | Added "Simulated Data" badge |
| `src/pages/DataUpload.tsx` | Modified | Added "File Upload Simulated" badge |
| `src/pages/Dashboard.tsx` | Modified | Added "Estimate" badges to CO2 and credits |
| `src/pages/LoginPage.tsx` | Modified | Fixed demo credentials consistency |
| `src/components/PWAInstallPrompt.tsx` | Modified | Fixed TypeScript any type |
| `src/components/ui/command.tsx` | Modified | Fixed empty interface |
| `src/components/ui/textarea.tsx` | Modified | Fixed empty interface |
| `tailwind.config.ts` | Modified | Fixed require() import |
| `src/pages/Notifications.tsx` | New | Placeholder page for /notifications route |
| `src/pages/Analytics.tsx` | New | Placeholder page for /analytics route |
| `src/pages/FraudDetection.tsx` | New | Placeholder page for /fraud-detection route |
| `src/pages/ThreeDVisualization.tsx` | New | Placeholder page for /3d-visualization route |
| `src/App.tsx` | Modified | Added new routes |

**Status:** All Phase 0 changes are complete and ready for commit.

---

## 7. Reference Repository Comparison

The reference repository (C-6-SIH/bluecarbon-registry-mrv) appears to be the source. Current repo is a fork with:
- Some UI improvements (mobile responsiveness in GISMapping, IoTSimulation)
- Updated translations
- Modified auth credentials
- Same fundamental architecture (localStorage-only)

No significant backend or architectural improvements in current repo vs reference.

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend integration breaks frontend | High | High | API-first design, typed client, incremental migration |
| Database migration complexity | Medium | High | Start simple, use Alembic from day 1 |
| MRV methodology credibility | High | High | Document explicitly as prototype, cite real standards |
| Time constraints | High | High | Prioritize core workflow, defer nice-to-have |
| Team knowledge gaps | Medium | Medium | Document decisions, pair program |

---

## 9. Acceptance Criteria for MVP

**Must Have:**
- [ ] User registration/login with hashed passwords
- [ ] Project creation with validation (server-side)
- [ ] Project submission → review → approve/reject workflow
- [ ] Evidence upload (real files, metadata persisted)
- [ ] Transparent carbon calculation with documented methodology
- [ ] Credit issuance only after approval
- [ ] Marketplace with atomic transactions
- [ ] Audit trail for all critical actions
- [ ] Role-based access enforced on backend
- [ ] Working local dev setup (docker-compose or scripts)

**Should Have:**
- [ ] GIS map showing real project coordinates
- [ ] Role-appropriate dashboards
- [ ] Notification system
- [ ] Basic test coverage (>60% critical paths)

**Nice to Have:**
- [ ] PWA offline support
- [ ] Export reports (PDF/CSV)
- [ ] Multi-language backend messages

---

## 10. Next Steps

1. **Create `docs/IMPLEMENTATION_ROADMAP.md`** with detailed phase breakdown
2. **Fix lint/TypeScript errors** (immediate)
3. **Set up FastAPI backend** with minimal structure
4. **Implement authentication** with proper password hashing
5. **Migrate AuthContext** to use API client
6. **Add database models** and migrations
7. **Connect DataContext** to backend API