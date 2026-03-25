# PetAge — Master Implementation Plan v2.0

> Synthesized from **PRD v1.0** + **TRD v1.0** + **Design Brief v1.0** + **7 Stitch screens**

---

## Source Document Summary

| Document | Key Contribution |
|---|---|
| [PRD](file:///Users/Dev/Developer/PetAge/PetAge_PRD_v1.docx) | 18 screens, 5 flows, freemium model, competitive positioning |
| [TRD](file:///Users/Dev/Developer/PetAge/PetAge_TRD_v1.docx) | Tech stack, 7 Firestore collections, 15+ API endpoints, env vars |
| [Design Brief](file:///Users/Dev/Developer/PetAge/petage_design_brief.html) | **Updated** color system, typography, component specs, motion, dark mode, brand voice |
| Stitch Project `2001344421645534913` | 7 designed screens (Home, Vaccines, Visits, Meds ×2, Weight, Premium) |

> [!IMPORTANT]
> The Design Brief **overrides** the PRD's design system in several places. The updated specs below use the Design Brief as the source of truth for all visual decisions.

---

## Design System (From Design Brief — Single Source of Truth)

### Color Palette (Updated from Design Brief §02)

| Token | Hex | Usage |
|---|---|---|
| Navy | `#0B1F3A` | Headers, dark surfaces |
| Clinical Blue | `#1C5EA8` | Primary CTA, nav active, brand anchor |
| Mid Blue | `#3B82C4` | Icons, charts, links |
| Blue Tint | `#E8F2FB` | Active nav background, highlights |
| Teal | `#0E7490` | Premium badge, PDF CTA gradient |
| Status Green | `#15803D` / bg `#DCFCE7` | Vaccine "Current" |
| Status Amber | `#B45309` / bg `#FEF3C7` | "Due Soon", Premium labels |
| Status Red | `#BE123C` / bg `#FFE4E6` | "Overdue", destructive actions |
| Surface | `#F7F9FC` | App background |
| Card White | `#FFFFFF` | Cards, modals, inputs |
| Text Primary | `#1A2540` | Body copy, headings |
| Text Secondary | `#4A5568` | Captions, metadata |
| Text Tertiary | `#8896AA` | Placeholders, inactive nav |
| Border | `#DDE4EF` | Card borders, dividers |

### Dark Mode Tokens

| Token | Hex |
|---|---|
| Background | `#0A0F1A` |
| Card | `#1A2335` |
| Elevated Surface | `#243044` |
| Primary (lightened) | `#3B82C4` |
| Status Green | `#34D399` |
| Status Amber | `#FBBF24` |
| Status Red | `#F87171` |
| Text Primary | `#E2E8F0` |
| Text Secondary | `#94A3B8` |

### Typography

| Level | Spec | Usage |
|---|---|---|
| H1 | 24px / **600** / Navy | Screen titles |
| H2 | 18px / **600** / Navy | Section headers |
| Body | 16px / 400 / Text Primary | Primary content |
| Body SM | 14px / 400 / Text Secondary | Secondary content |
| Caption | 12px / **500** / Text Tertiary | Labels, metadata |
| Mono | 13px / 400 / monospace | IDs, dates, codes |

> [!NOTE]
> Fonts: **DM Sans** (web) + **DM Serif Display** (hero/marketing headings). Mobile: SF Pro (iOS) / Roboto (Android). Weights: **400 + 600 only**. No 700.

### Component Specs

| Component | Key Specs |
|---|---|
| **Buttons** | 48px height, 10px radius. Primary: `#1C5EA8` bg, white text. Secondary: 1.5px blue border. Disabled: opacity 0.4 |
| **Cards** | White bg, 1px `#DDE4EF` border, 12px radius, **no shadow** |
| **Pet Card** | 220px wide, 52×52px avatar (50% radius), 16px radius card, 2px blue ring when active |
| **Record Rows** | 64px min height. Sort: Overdue → Due Soon → Current. Swipe left → Edit/Delete |
| **Status Pills** | 24px height, 6px radius, 500 weight. Never decorative |
| **Form Inputs** | 48px height, 10px radius, 1.5px `#C5D0E0` border, focus: 1.5px `#1C5EA8`, error: 1.5px `#BE123C` |
| **FAB** | 56×56px, 50% radius, `#1C5EA8`, shadow `0 4px 16px rgba(28,94,168,.35)` — **only element with shadow** |
| **PDF Button** | Gradient `#1C5EA8` → `#0E7490`, 12px radius, lock overlay for free users |
| **Bottom Nav** | 64px + safe area. Active: `#1C5EA8` icon + `#E8F2FB` bg. Inactive: `#8896AA` |

### Motion Spec

| Element | Timing | Detail |
|---|---|---|
| Screen transitions | 280ms ease-out | Slide-up modals, slide-right drill-down |
| Button press | scale(0.97) · 100ms | Scale down on press, spring back |
| Status badge change | 300ms | Color fade between states |
| FAB appearance | scale(0→1) + fade · 220ms | Springs in when scroll stops |
| Delete/Archive | slide-left + fade · 200ms | Swipe reveal, row collapses |
| Chart line draw | strokeDashoffset · 600ms ease-in-out | Line draws on first load |

---

## 14-Day Implementation Plan

### Phase 1 — Foundation & Infrastructure `Day 1`

**1.1 Project Setup**
- [ ] `npx create-next-app@14 petage --typescript --tailwind --app`
- [ ] `npx shadcn-ui@latest init`
- [ ] Install all TRD §3 deps: `firebase zustand react-hook-form zod date-fns recharts @react-pdf/renderer resend stripe @stripe/stripe-js @upstash/ratelimit`
- [ ] TypeScript strict mode, ESLint, Prettier
- [ ] `.env.local` with all 15 env vars (TRD §6)

**1.2 Firebase Setup**
- [ ] Create Firebase project → enable Firestore, Auth (email/password + Google), Storage
- [ ] Download config → populate env vars → Create service account JSON

**1.3 Design System Implementation**
- [ ] Tailwind config: all Design Brief §02 colors + dark mode tokens
- [ ] Configure DM Sans + DM Serif Display fonts (Google Fonts)
- [ ] Build base components per Design Brief §05 specs:
  - Button (Primary/Secondary/Ghost), Input, StatusPill, Card, FAB, BottomNav, PetCard, RecordRow

---

### Phase 2 — Authentication `Days 1–2`

- [ ] `useAuthStore` (Zustand): login, logout, user state, tier
- [ ] Firebase Auth email/password + Google SSO (v9 modular)
- [ ] Create user doc in Firestore `users` collection on signup (TRD §4 schema)
- [ ] **Screen 1** (Splash): Hero + CTA — DM Serif Display heading
- [ ] **Screen 2** (Sign Up): Email, password, confirm password, Google SSO
- [ ] **Screen 3** (Log In): Email + password, Forgot Password, Google SSO
- [ ] All forms: react-hook-form + zod. Brand voice: warm, owner-first copy
- [ ] Next.js middleware: check Firebase JWT on `/app/(dashboard)/*` routes
- [ ] Deploy to Vercel → verify auth in production before Phase 3

---

### Phase 3 — Home Screen & Pet Profiles `Days 2–3`

> Stitch ref: `af9f3b2a` — PetAge Home Dashboard (Desktop)

- [ ] **Screen 4** (Home): Horizontal scrolling pet cards (220px wide, 16px radius). Last card: "Add Pet" with dashed border. Notification dot on card if any overdue. Header: "Good morning, [name]"
- [ ] **Screen 5** (Pet Dashboard): Pet photo full-width header with name/breed/age overlay. 2×2 tile grid (Vaccines, Visits, Meds, Weight) with count badges. Activity feed (last 3 events). First-run tooltip
- [ ] **Screen 15** (Add Pet): Photo → Firebase Storage, all schema fields
- [ ] Wire `/api/pets` GET + POST + DELETE with Firestore security rules
- [ ] **Enforce 2-pet free limit server-side** — soft paywall, not hard block

---

### Phase 4 — Vaccine Tracker `Day 3`

> Stitch ref: `b4958c10` — PetAge Vaccine List (Desktop)

- [ ] **Screen 6** (Vaccine List): Sort: Overdue → Due Soon → Current → No Expiry. Red sticky "Action Required" header for overdue group. Empty state: syringe illustration. FAB bottom-right
- [ ] **Screen 7** (Add/Edit Vaccine): Freeform name, date administered, expiry date, reminder toggle (default ON, 30-day lead)
- [ ] Status calc via date-fns: `current` / `due_soon` / `overdue`
- [ ] Wire `/api/vaccines` CRUD — composite index: petId + ownerId + dateAdministered DESC

---

### Phase 5 & 6 — Vet Visits + Medications `Day 4`

> Stitch refs: `46e1d80a` (Visits) · `c0c08d14` (Meds Desktop) · `f2cc7a36` (Meds Mobile)

- [ ] **Screen 8** (Vet Visit List): Searchable, newest-first, photo thumbnails inline
- [ ] **Screen 9** (Add/Edit Visit): All fields + `<input type="file">` → Firebase Storage signed URL (1hr)
- [ ] **Screen 10** (Med List): Active meds with next-due countdown. "Mark as Given" one-tap from list row. Archive button — always dismissable. Archived section collapsible
- [ ] **Screen 11** (Add/Edit Med): Freeform name (brand OR generic OR OTC), dosage strength, frequency, start date
- [ ] Mark as Given: POST `/api/medications/[id]/mark-given` → recalculate nextDueDate, reset reminderSent

---

### Phase 7 & 8 — Weight Timeline + Premium `Day 5`

> Stitch refs: `ac68675d` (Weight) · `f579867a` (Premium Upgrade)

- [ ] **Screen 12** (Weight): Recharts LineChart, `#3B82C4` line, dot markers, no gridlines, chart line draw animation (600ms). lbs/kg toggle top-right
- [ ] **Screen 13** (Add Weight): Weight input, date picker, notes — stored internally in kg
- [ ] **Screen 14** (Health Report PDF): @react-pdf/renderer template. PDF preview card with slight tilt. Circle pet photo, name, species, DOB, vaccine table. Gradient CTA button. Lock overlay for free users
- [ ] **Screen 17** (Upgrade): 2-column comparison Free vs Premium. Navy header on Premium column. Monthly/Annual toggle — annual shows "Save 33%". CTA → Stripe. "Restore purchases" link
- [ ] Wire `/api/stripe/create-checkout` + `/api/stripe/webhook` + `/api/stripe/portal`
- [ ] Webhook: `checkout.session.completed` → tier:'premium' · `subscription.deleted` → tier:'free'

---

### Phase 9 — Notifications & Reminders `Day 6`

- [ ] `/api/cron/check-reminders`: query vaccines + meds within reminderLeadDays, batch Expo push + Resend email
- [ ] Vercel Cron: `"0 9 * * *"` daily at 09:00 UTC
- [ ] **Screen 18** (Reminder Prefs): push/email toggles per category, lead time selector (7/14/30 days)
- [ ] Upstash Redis rate limiting: register 5/hr, checkout 10/hr, receipt 5/hr, all routes 100/min
- [ ] Brand voice in notifications: "Time to give [Pet] their [Med]. Mark as given?"

---

### Phase 10 — Settings, Polish & Security `Day 7`

- [ ] **Screen 16** (Settings): Account info, subscription status, notification toggles, JSON export, logout, delete account
- [ ] Hard delete: all Firestore docs + Auth account + Storage files
- [ ] Loading skeletons, empty states with illustrations, error toasts (warm voice, never technical)
- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Create all 7 composite indexes (TRD §9)
- [ ] Implement dark mode (all 18 screens) using Design Brief §10 tokens
- [ ] Lighthouse Performance > 85 · Cross-browser: Chrome, Safari, Firefox
- [ ] Responsive: 375px / 390px / 430px / 768px / 1280px

---

### Phase 11 — Mobile App (Expo) `Days 8–11`

- [ ] Day 8: Create Expo project, install mobile deps, configure `app.json` (bundle ID: `com.petage.app`). Port auth store. Register push token
- [ ] Day 9: Home FlatList, Pet Dashboard, Vaccine/Visit/Med screens. expo-router file-based routing
- [ ] Day 10: Weight chart (react-native-svg-charts). PDF via expo-sharing. IAP via expo-in-app-purchases + `/api/iap/validate-receipt`
- [ ] Day 11: Push notification tap handler → navigate to correct screen. Full E2E on physical device

---

### Phase 12 — QA & Submission `Days 12–14`

- [ ] Day 12: Fix all bugs. Test on iPhone SE (375px) + mid-range Android (360px)
- [ ] Day 13: `eas build --platform all --profile production` → TestFlight + Play Store internal
- [ ] Day 14: App Store listing copy + keywords ("VitusVet alternative"). Submit for review

---

## Verification Checklist (12 Production Checks)

| # | Check | Method |
|---|---|---|
| 1 | Auth flow works e2e | Sign up → sign in → SSO → logout on production URL |
| 2 | 2-pet limit enforced server-side | `curl -X POST /api/pets` with 3rd pet → 403 |
| 3 | Vaccine status badges correct | Add vaccine → edit expiry to past → badge = "Overdue" |
| 4 | Vet visit photo loads | Upload 10MB JPEG → signed URL loads < 5s |
| 5 | Mark as Given recalculates | Daily med → mark given → nextDueDate = today + 1 |
| 6 | Weight chart renders | 5 entries → chart visible → lbs/kg toggle works |
| 7 | PDF premium gate | Free user → 403. Premium user → downloads PDF |
| 8 | Stripe webhook updates tier | `stripe trigger checkout.session.completed` → tier = 'premium' |
| 9 | Cron sends notifications | Manual hit with CRON_SECRET → push + email delivered |
| 10 | Cross-user security | User B query on User A's pets → permission-denied |
| 11 | Responsive layout | No overflow/clipping at 375 / 390 / 430 / 768 / 1280px |
| 12 | Crash-free rate > 99% | Sentry/Crashlytics on first 100 sessions |
