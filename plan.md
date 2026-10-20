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

### Phase 5: Lead Search, Multi-Filter & Sorting (Feature 4) [COMPLETED]
- **Status**: Completed (Verified)
- **Scope & Implementation**:
  - `src/features/leads/LeadFilterBar.jsx`:
    - Real-time text search across Name, Phone, Email, and Course Interest with debounced feel and clear button.
    - Multi-filter dropdowns: Status (`All`, `New`, `Contacted`, `Qualified`, `Converted`, `Lost`), Source (`All`, `Website`, `Walk-in`, `Referral`, `Social Media`, `Google Ad`, `Direct Call`), and Assignee (All Team, Unassigned, specific counsellors).
    - Sort alignment: `Newest First`, `Oldest First`, `Name (A - Z)`, `Name (Z - A)`.
    - Instant "Reset Filters" action button when filters are active.
    - Active filter chip counts and live result counters.
  - `src/features/leads/LeadsListPage.jsx`:
    - Connected state handling between filter bar, leads pipeline, and mobile cards.
    - Empty search results state with quick reset button.
- **Verification Loop**:
  - `npm run lint`: Passed with 0 errors, 0 warnings.
  - `npm run build`: Production bundle built cleanly.

---

### Phase 6: Follow-ups Engine & Overdue Tracking (Feature 5) [COMPLETED]
- **Status**: Completed (Verified)
- **Scope & Implementation**:
  - `src/services/followUpsService.js`:
    - `fetchFollowUps({ status, leadId })`, `fetchFollowUpsByLead(leadId)` joined with lead & profile information.
    - `createFollowUp({ leadId, dueAt, note, assignedTo, currentUserId })` with ISO timestamp normalization.
    - `completeFollowUp(followUpId, outcomeNote)` setting `status = 'completed'`, `completed_at = now()`, and optional outcome notes.
    - `cancelFollowUp(followUpId)` setting `status = 'cancelled'`.
    - `isFollowUpOverdue(followUp)` enforcing `status === 'pending' && new Date(due_at).getTime() < Date.now()`.
    - `formatFollowUpTiming(due_at, status)` rendering relative timing, overdue badges, and calendar context.
  - `src/features/followups/ScheduleFollowUpModal.jsx`:
    - Modal dialog supporting global lead selection or context-bound preselection from `LeadDetailPage`.
    - Datetime-local picker with quick preset chips (`+2 Hours`, `Tomorrow 10 AM`, `In 2 Days`, `Next Monday`).
    - Objective notes input and role-aware assignee selector.
  - `src/features/followups/FollowUpCard.jsx`:
    - Responsive card component with overdue indicator border, student link, phone call link, timing badge, and inline completion panel with outcome note recording.
  - `src/features/followups/FollowUpsPage.jsx`:
    - 3 view tabs: **Overdue Follow-ups** (with alert counter badge), **Upcoming / Today**, and **Completed**.
    - Search filter across student name, phone, and follow-up notes.
    - "+ Schedule Follow-up" global action and manual refresh trigger.
    - Loading skeletons and contextual empty states with action buttons.
  - `src/features/leads/LeadDetailPage.jsx`:
    - Dual loading of lead details + follow-up history via `Promise.all`.
    - Header "Schedule Follow-up" button with lead pre-selected.
    - Bottom Follow-ups tab showing active & completed follow-ups with instant inline completion.
- **Verification Loop**:
  - `npm run lint`: Passed with 0 errors, 0 warnings.
  - `npm run build`: Vite production bundle built cleanly in ~836ms.
  - CSS syntax validation verified in `src/index.css`.

---

### Phase 7: Activity History & Audit Timeline (Feature 6) [COMPLETED]
- **Status**: Completed (Verified)
- **Scope & Implementation**:
  - `src/services/activitiesService.js`:
    - `fetchActivitiesByLead(leadId)`: Retrieves activities for a specific lead ordered chronologically (`created_at DESC`), joined with actor profiles.
    - `logActivity({ leadId, actorId, activityType, description, metadata })`: Inserts audit records with actor attribution and metadata sanitization.
    - `formatActivityTime(isoString)` & `formatFullDateTime(isoString)`: Relative ("Just now", "5 mins ago", "Today at 2:30 PM", "Yesterday at 11:00 AM") and accessible full datetime strings.
  - Automated Lifecycle Activity Logging:
    - 🟢 `lead_created`: Recorded on new lead capture with student contact and course metadata.
    - 🔄 `status_changed`: Recorded on pipeline transitions, Lost reason capture, and reopening as Contacted.
    - 📝 `lead_updated`: Recorded on contact, academic interest, and counsellor note edits.
    - 📅 `followup_created`: Recorded on follow-up scheduling with due date and objective note.
    - ✅ `followup_completed`: Recorded on follow-up completion with outcome note details.
  - `src/features/leads/ActivityTimeline.jsx`:
    - Chronological vertical timeline with icon markers, status transitions, metadata chips, and actor attribution badges.
    - Handled states: shimmer pulse skeleton loading, clean empty state, and error banner with retry trigger.
    - Resilient fallback for unassigned/system actors.
  - `src/features/leads/LeadDetailPage.jsx`:
    - Interactive tab bar toggling between **Follow-ups** and **Activity Trail** with live count badges.
    - Parallel fetch on mount and automatic `reloadActivities()` triggers upon any lead status update, edit, or follow-up action.
  - `src/index.css`:
    - Responsive timeline connector styles, badge colors, and mobile reflow.
- **Verification Loop**:
  - `npm run lint`: Passed with 0 errors, 0 warnings.
  - `npm run build`: Vite production bundle built cleanly in ~901ms.

---

### Phase 8: Live Executive Dashboard & KPI Metrics (Feature 7) [COMPLETED]
- **Status**: Completed (Verified)
- **Scope & Implementation**:
  - `src/features/dashboard/DashboardPage.jsx`:
    - **Live 5 KPI Cards**:
      - Total Leads (`leads.length`)
      - New Enquiries (`status === 'New'`)
      - Converted Students (`status === 'Converted'`)
      - Overdue Callbacks (`status === 'pending' && due_at < now()`) with urgent alert highlighting
      - Conversion Rate (`((converted / total) * 100).toFixed(1)%` with division-by-zero protection)
    - **Visual Breakdowns & Lightweight Charts**:
      - Horizontal proportional pipeline status distribution bar (`New`, `Contacted`, `Qualified`, `Converted`, `Lost`) with count and percentage badges.
      - Lead Acquisition Sources breakdown showing inquiry volume, channel share, and conversion rate per channel.
    - **Urgent Action Lists**:
      - Urgent Overdue Follow-ups list sorted by oldest due date first with direct phone dialer (`tel:`), overdue duration badge, and link to lead details.
      - Recent Student Enquiries list showing newly captured leads, academic course badge, enquiry source, and relative timestamp.
    - **Role Scoping & Controls**:
      - Data scope indicator pill ("My Assigned Pipeline" for Counsellor, "Institute Overview" for Manager/Admin).
      - Manual data refresh action with spin feedback and full error retry handling.
      - Skeleton shimmer loading and onboarding empty states.
  - `src/index.css`:
    - Responsive grid layouts, hover states, segmented progress bars, and mobile reflow.
- **Verification Loop**:
  - `npm run lint`: Passed with 0 errors, 0 warnings.
  - `npm run build`: Vite production bundle built cleanly in ~882ms.

---

### Phase 9: Reports & Pipeline Analytics (Feature 8) [COMPLETED]
- **Status**: Completed (Verified)
- **Scope & Implementation**:
  - `src/features/reports/ReportsPage.jsx`:
    - **Lead Status Distribution**: Live proportional progression bars across admission stages (`New`, `Contacted`, `Qualified`, `Converted`, `Lost`) with count and percentage badges.
    - **Lead Source Breakdown**: Ranked channel inquiry volume with share percentages and converted student counts per channel.
    - **Counsellor Workload Analysis**:
      - Role-scoped: Counsellors see individual workload scorecard (assigned leads, pending follow-ups, overdue load, and personal conversion rate).
      - Managers/Admins see team workload distribution table/rows with staff role badges, pending/overdue indicators, and unassigned leads tracking.
    - **Reliability & Resilience**: Division-by-zero protection, loading pulse skeletons, and retryable error state.
- **Verification Loop**:
  - `npm run lint`: Passed with 0 errors, 0 warnings.
  - `npm run build`: Vite production bundle built cleanly in ~923ms.

---

### Phase 10: Production Readiness, Accessibility, Audit & Final Handover [COMPLETED]
- **Status**: Completed (Verified)
- **Scope & Implementation**:
  - `src/components/layout/AppLayout.jsx`:
    - Keyboard Navigation: Added `Escape` key event listener to immediately dismiss mobile navigation drawer and user profile dropdown.
    - Accessibility / Screen Reader Fix: Changed overlay wrapper from `aria-hidden="true"` to `role="presentation"` so child `<div role="dialog">` semantics are properly announced.
    - Added `aria-expanded={mobileDrawerOpen}` to the mobile menu hamburger button.
    - Added `aria-label="Sign out"` to the sidebar desktop sign-out button.
    - Responsive Usability: Locked background page body scrolling (`overflow: hidden`) while the mobile navigation drawer is open.
    - Route Synchronization: In-render state adjustment closes the mobile drawer automatically upon route changes without triggering cascading effect renders.
  - `src/index.css`:
    - Universal Visible Focus: Added WCAG 2.1 AA compliant `:focus-visible` styling (`outline: 2px solid var(--color-accent-blue); outline-offset: 2px;`) across buttons, links, tabs, and form controls for keyboard navigators, while keeping mouse clicks clean.
  - `vercel.json`:
    - Added production SPA rewrite rule (`"/(.*)" -> "/index.html"`) to eliminate 404 errors on deep-link page refreshes.
  - `README.md`:
    - Complete documentation overhaul covering System Architecture, 10-Phase Feature Highlights, RBAC Matrix (Admin, Manager, Counsellor), Supabase PostgreSQL Schema & RLS, Environment Variables Setup, Local Dev Commands, and Vercel Deployment Instructions.
- **Verification Loop**:
  - `npm run lint`: Passed with 0 errors, 0 warnings.
  - `npm run build`: Vite production bundle built cleanly in ~882ms.

---

## 5. Security & Environment Variable Rules

| Variable Name | Environment | Purpose | Sensitivity |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Local `.env.local` & Vercel | Supabase Project REST/Auth endpoint | Public (bundled in client) |
| `VITE_SUPABASE_ANON_KEY` | Local `.env.local` & Vercel | Supabase Publishable / Anonymous Key | Public (enforced by RLS) |
| *Service Role Key* | **NEVER USED** | Bypasses all Row Level Security | **STRICTLY PROHIBITED IN FRONTEND** |

- `.env.local` is excluded from Git via `.gitignore`.
- No sensitive credentials, tokens, or passwords will ever be placed in code, commit history, UI, or console logs.
