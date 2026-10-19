# BrightPath CRM — Master Build & Phased Delivery Plan

> **Document Reference**: `BrightPath_CRM_Full_Master_Build_Prompt.docx` / `BrightPath_CRM_Antigravity_Full_Build_Prompt.docx`  
> **Target Application**: BrightPath CRM (Coaching Institute Lead & Follow-Up Management System)  
> **Core Stack**: React 19 + Vite • Supabase (PostgreSQL, Auth, RLS) • Git/GitHub • Vercel  
> **Delivery Model**: Feature-by-Feature Lifecycle (**Develop ➔ Test ➔ Verify ➔ Deploy ➔ Post-Deploy Smoke Test ➔ Next Feature**)

---

## 1. Executive Summary & Delivery Methodology

This document serves as the persistent master plan and working context for developing BrightPath CRM. Every feature is treated as an isolated, complete milestone that must be fully implemented, locally tested, database-verified, deployed to Vercel, and smoke-tested on the live URL before advancing to the next feature.

### The 5-Stage Verification Loop for Every Phase

```
[1. Develop Feature] 
       │
       ▼
[2. Local Static & Unit Tests (npm run build & lint)]
       │
       ▼
[3. Supabase Integration Verification (real data flow)]
       │
       ▼
[4. Commit, Push & Vercel Deploy]
       │
       ▼
[5. Live Smoke Test on Vercel Production URL]
       │
       ▼
[User Approval Gate] ➔ Proceed to Next Feature
```

1. **Develop**: Build the specific UI components, services, and queries for that feature alone.
2. **Local Test**: Run `npm run build` and `npm run lint` to confirm zero static or bundler regressions.
3. **Verify Locally**: Test against the real Supabase project (`cekkfwpqroqpqucqvqmp`) to confirm data flow, validation, and error states.
4. **Deploy**: Stage and commit changes to Git, push to GitHub, and trigger a Vercel deployment.
5. **Live Verification**: Perform a smoke test directly on the live Vercel URL.
6. **Approval Gate**: Stop and present the test results before advancing to the next feature.

---

## 2. Master Feature Order & Dependency Roadmap

| Phase | Feature / Milestone | Core Purpose | Dependencies |
| :---: | :--- | :--- | :--- |
| **Phase 0** | **Foundation & Routing Shell** | Set up `react-router-dom`, `lucide-react`, design system, and responsive shell | Existing React+Vite |
| **Phase 1** | **Database Schema & RLS Policies** | Create tables, constraints, triggers, indexes, and RLS policies | Supabase SQL Editor |
| **Phase 2** | **Authentication & Role Lifecycle** | Login, signup, logout, session persistence, role loading, and route guards | Phase 0, Phase 1 |
| **Phase 3** | **Lead Capture & Pipeline List** | Create new lead modal with validation, responsive leads table/cards | Phase 1, Phase 2 |
| **Phase 4** | **Lead Details, Status Pipeline & Lost Reason** | Dedicated lead detail view, status progression, mandatory lost reason | Phase 3 |
| **Phase 5** | **Lead Search, Multi-Filter & Sorting** | Search bar (name/phone/email/course), filters (status, source, assignee), reset | Phase 3, Phase 4 |
| **Phase 6** | **Follow-ups Engine & Overdue Tracking** | Schedule follow-up, overdue calculation (`due_at < now()`), complete action | Phase 3, Phase 4 |
| **Phase 7** | **Activity Audit Trail** | Timeline on lead detail view logging creations, updates, and completions | Phase 4, Phase 6 |
| **Phase 8** | **Live Executive Dashboard & KPI Metrics** | Live KPI cards (Total, New, Converted, Overdue, Rate), charts, urgent lists | Phase 3, Phase 6 |
| **Phase 9** | **Reports & Pipeline Analytics** | Source breakdown, status distribution, counsellor workload analysis | Phase 8 |
| **Phase 10** | **Hardening, Accessibility & Final Handover** | Mobile drawer audit, ARIA landmarks, README documentation, final live check | All Phases |

---

## 3. Database Schema & Security Architecture

### Tables & Relationships
1. **`profiles`**
   - `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `full_name text NOT NULL`, `email text NOT NULL`
   - `role text NOT NULL DEFAULT 'counsellor' CHECK (role IN ('admin', 'manager', 'counsellor'))`
   - `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`

2. **`leads`**
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `full_name text NOT NULL`, `email text`, `phone text NOT NULL`
   - `course_interest text NOT NULL`, `source text NOT NULL`
   - `status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost'))`
   - `lost_reason text` (required when status is `'Lost'`)
   - `assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL`
   - `created_by uuid REFERENCES profiles(id) ON DELETE SET NULL`
   - `notes text`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`

3. **`follow_ups`**
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE`
   - `assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL`
   - `due_at timestamptz NOT NULL`, `note text NOT NULL`
   - `status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled'))`
   - `completed_at timestamptz`, `created_by uuid REFERENCES profiles(id) ON DELETE SET NULL`
   - `created_at timestamptz DEFAULT now()`

4. **`activities`**
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE`
   - `actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL`
   - `activity_type text NOT NULL` (`lead_created`, `status_changed`, `followup_created`, `note_added`)
   - `description text NOT NULL`, `metadata jsonb DEFAULT '{}'`
   - `created_at timestamptz DEFAULT now()`

### Security & Row Level Security (RLS) Rules
- **RLS Enabled**: Enforced on `profiles`, `leads`, `follow_ups`, and `activities`.
- **Profiles Policy**: Users can read their own profile; Managers and Admins can read all profiles (to assign leads). Users **cannot** update their own `role` column via client requests.
- **Leads Policy**: 
  - Counsellors: Can SELECT, INSERT, and UPDATE leads where `created_by = auth.uid() OR assigned_to = auth.uid()`.
  - Managers / Admins: Can SELECT, INSERT, UPDATE, and DELETE all team leads.
- **Follow-ups & Activities Policy**: Inherits lead access permissions (users access follow-ups/activities only for accessible leads).
- **Trigger**: Automatic profile creation via a `SECURITY DEFINER` function with fixed `search_path = public` on `auth.users` insert.
- **Client Key Security**: Only the `anon` key is exposed in Vite. The `service_role` key will never be placed in frontend code.

---

## 4. Detailed Phase-by-Phase Execution Plan

---

### Phase 0: Project Baseline, Routing & Design System
- **Scope**:
  - Install dependencies: `react-router-dom` and `lucide-react`.
  - Build `AppLayout` with desktop sidebar, header, and mobile toggle drawer.
  - Define routes in `App.jsx` (`/login`, `/dashboard`, `/leads`, `/leads/:id`, `/follow-ups`, `/reports`).
  - Establish design tokens in `index.css` (primary navy `#0f172a`, accent blue `#2563eb`, surfaces, borders, status badge colors).
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Test local navigation across routes.
  3. Git commit & push ➔ Vercel deployment.
  4. Live smoke test on Vercel URL.

---

### Phase 1: Supabase Database Schema, Migrations & Security (RLS)
- **Scope**:
  - Create versioned SQL migration files under `supabase/migrations/`:
    - `001_initial_schema.sql` (tables, constraints, indexes, triggers).
    - `002_rls_and_policies.sql` (Row Level Security enablement and role-based policies).
    - `003_seed_demo_data.sql` (fictional sample leads and follow-ups).
- **Verification Loop**:
  1. User applies migration in Supabase SQL Editor.
  2. Verify table structures and RLS policies via Supabase MCP tool.
  3. Commit SQL migrations to git repository.

---

### Phase 2: Authentication & Role Lifecycle (Feature 1)
- **Scope**:
  - Implement `src/services/authService.js` and `src/context/AuthContext.jsx`.
  - Implement `src/components/common/ProtectedRoute.jsx` and `RoleGuard.jsx`.
  - Build `src/features/auth/LoginPage.jsx` (Sign in & Sign up tabbed UI).
  - Add user pill in header showing user's name and role badge (`Admin`, `Manager`, or `Counsellor`) with Sign Out button.
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Verify signup creates `profiles` record defaulting to `'counsellor'`.
  3. Verify signin persists session on refresh.
  4. Verify invalid credentials display clear alerts.
  5. Commit, push, deploy to Vercel, and smoke-test live.

---

### Phase 3: Lead Capture & Pipeline List (Feature 2)
- **Scope**:
  - Implement `src/services/leadsService.js` (`fetchLeads`, `createLead`).
  - Build `src/features/leads/LeadsListPage.jsx` (responsive table and cards).
  - Build `src/features/leads/LeadFormModal.jsx` with strict field validation (Name, Phone, Email, Course, Source, Assignee).
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Create new lead in modal; verify persistence in Supabase after page reload.
  3. Verify empty, loading, and field-level validation error states.
  4. Commit, push, deploy to Vercel, and smoke-test live.

---

### Phase 4: Lead Details, Status Pipeline & Lost Reason (Feature 3) [COMPLETED]
- **Status**: Completed (Committed and Verified)
- **Scope & Confirmed Business Decisions Implemented**:
  - `src/services/leadsService.js`:
    - `fetchLeadById(id)`: Joined with `profiles` foreign keys for assignee and creator.
    - `updateLeadStatus(id, newStatus, lostReason)`: Enforces mandatory lost reason on `Lost`, clears `lost_reason` on moving to other statuses, and reopens Lost leads to `Contacted` with `lost_reason = null` persisted together.
    - `updateLeadDetails(id, formData, userRole)`: Validates form, normalizes phone numbers, restricts reassignment to managers/admins.
  - `src/features/leads/LeadDetailPage.jsx`:
    - Full dynamic detail page replacing static mock.
    - Quick actions: click-to-call (`tel:`), click-to-email (`mailto:`), and one-click copy with instant feedback.
    - Lost Alert Banner with prominent "Reopen Lead" action button (defaults to `Contacted`).
    - Handled states: skeleton shimmer loading (`DetailSkeleton.jsx`), 404 not found, invalid UUID, and network error with retry button.
  - `src/features/leads/StatusPipelineBar.jsx`:
    - Horizontal progression stepper (`New` ➔ `Contacted` ➔ `Qualified` ➔ `Converted`) + Lost trigger.
    - Supports forward and backward transitions.
    - Confirmation alert before reverting an enrolled student from `Converted` status.
  - `src/features/leads/LostReasonModal.jsx`:
    - Accessible dialog with suggested categories and custom "Other reason" explanation (&ge; 5 chars).
    - Cancelling leaves status and database unchanged.
  - `src/features/leads/EditLeadModal.jsx`:
    - Edit student contact, course, source, and counsellor notes.
    - Role-governed assignee control (read-only for Counsellor, selectable for Manager/Admin).
- **Verification Loop**:
  - `npm run lint`: Passed with 0 errors, 0 warnings.
  - `npm run build`: Production bundle built cleanly in ~915ms.
  - Database check constraints and atomic reopening to `Contacted` verified.

---

### Phase 5: Lead Search, Multi-Filter & Sorting (Feature 4)
- **Scope**:
  - Build `src/features/leads/LeadFilterBar.jsx`.
  - Real-time text search across Name, Phone, Email, and Course Interest.
  - Multi-dropdown filters: Status, Source, Assignee.
  - Reset Filters button.
  - Sorting: Newest First, Oldest First, Alphabetical.
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Verify multi-filter combination (e.g. Status = "New" AND Source = "Website").
  3. Verify text search by phone and name.
  4. Commit, push, deploy to Vercel, and smoke-test live.

---

### Phase 6: Follow-ups Engine & Overdue Tracking (Feature 5)
- **Scope**:
  - Implement `src/services/followUpsService.js`.
  - Build `src/features/followups/FollowUpsPage.jsx` with tabs: **Overdue** (red badge), **Upcoming / Today**, **Completed**.
  - Build `src/features/followups/ScheduleFollowUpModal.jsx` (Lead selector, Due date/time, Note, Assignee).
  - **Overdue Rule**: Overdue only when `status = 'pending'` AND `due_at < now()`.
  - "Mark Completed" button: updates `status = 'completed'` and records `completed_at`.
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Schedule follow-up for a past time; confirm appearance in Overdue tab.
  3. Mark completed; confirm move to Completed tab with timestamp.
  4. Commit, push, deploy to Vercel, and smoke-test live.

---

### Phase 7: Activity History & Audit Timeline (Feature 6)
- **Scope**:
  - Implement `src/services/activitiesService.js`.
  - Build `src/features/leads/ActivityTimeline.jsx` embedded in `LeadDetailPage`.
  - Automatically record and display timeline items:
    - 🟢 Lead Created
    - 🔄 Status Changed
    - 📅 Follow-up Scheduled
    - ✅ Follow-up Completed
    - 💬 Counsellor Note Added
  - Humanized relative timestamps ("10 minutes ago", "Yesterday at 4:15 PM").
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Perform status change and note entry; verify chronological timeline order.
  3. Commit, push, deploy to Vercel, and smoke-test live.

---

### Phase 8: Live Executive Dashboard & KPI Metrics (Feature 7)
- **Scope**:
  - Build `src/features/dashboard/DashboardPage.jsx`.
  - **KPI Cards**: Total Leads, New Leads, Converted Leads, Overdue Follow-ups, Conversion Rate (`(Converted / Total) * 100`).
  - **Visual Breakdowns**: Status pipeline bar, Source distribution chart.
  - **Action Lists**: Urgent Overdue Follow-ups, Recent Enquiries.
  - **Reconciliation Rule**: All KPIs must reconcile 1:1 with filtered list counts.
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Cross-verify dashboard counts against `/leads` and `/follow-ups` lists.
  3. Verify division-by-zero safety when no leads exist.
  4. Commit, push, deploy to Vercel, and smoke-test live.

---

### Phase 9: Reports & Pipeline Analytics (Feature 8)
- **Scope**:
  - Build `src/features/reports/ReportsPage.jsx`.
  - Conversion Funnel visualization (New ➔ Contacted ➔ Qualified ➔ Converted).
  - Source effectiveness summary (conversion rate per channel).
  - Counsellor workload summary (assigned leads and pending follow-ups).
  - Role-scoped view (Counsellor sees personal; Manager/Admin sees team).
- **Verification Loop**:
  1. `npm run build` and `npm run lint`.
  2. Verify role-based data scoping.
  3. Commit, push, deploy to Vercel, and smoke-test live.

---

### Phase 10: Production Readiness, Accessibility, Audit & Final Handover
- **Scope**:
  - Mobile responsiveness audit (375px–768px widths, table-to-card reflow, drawer navigation).
  - Accessibility audit (keyboard tab order, visible focus rings, ARIA dialogs and labels).
  - Production security audit (zero secret leakage, verified RLS).
  - Update `README.md` with complete architecture, setup instructions, and student guide.
- **Verification Loop**:
  1. Complete end-to-end user scenario on live Vercel URL.
  2. Final `npm run build` and `npm run lint` validation.
  3. Final project handover.

---

## 5. Security & Environment Variable Rules

| Variable Name | Environment | Purpose | Sensitivity |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Local `.env.local` & Vercel | Supabase Project REST/Auth endpoint | Public (bundled in client) |
| `VITE_SUPABASE_ANON_KEY` | Local `.env.local` & Vercel | Supabase Publishable / Anonymous Key | Public (enforced by RLS) |
| *Service Role Key* | **NEVER USED** | Bypasses all Row Level Security | **STRICTLY PROHIBITED IN FRONTEND** |

- `.env.local` is excluded from Git via `.gitignore`.
- No sensitive credentials, tokens, or passwords will ever be placed in code, commit history, UI, or console logs.
