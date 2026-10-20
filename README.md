# BrightPath CRM — Coaching & Training Lead Lifecycle System

**BrightPath CRM** is a high-performance, responsive coaching institute client and lead management platform built with **React 19**, **Vite**, and **Supabase (PostgreSQL + Row-Level Security)**.

Designed specifically for coaching academies, training institutes, and test-prep centers, it streamlines student inquiries from initial contact through qualification, structured follow-up cadences, and final enrollment.

---

## 🚀 Key Features

- **Live Executive Dashboard & KPI Metrics**: Real-time KPI cards for Total Leads, New Enquiries, Converted Students, Overdue Callbacks, and Conversion Rate. Visual pipeline stage progression and channel breakdown.
- **Lead Pipeline Management**: Full lifecycle management across five stages (`New`, `Contacted`, `Qualified`, `Converted`, `Lost`). Omni-search across student name, phone, email, and course, combined with multi-criteria filters and sorting.
- **Lead Detail & Quick Actions**: Centralized student profiles with immediate status updates, "Lost Reason" capture modal, inline counsellor notes, direct phone calling (`tel:`), and email integration.
- **Zero-Loss Follow-Up Scheduler**: Prevent lead leakage with scheduled callbacks, urgent overdue highlights, quick-time presets (*Today +2h*, *Tomorrow 10 AM*, *In 2 Days*, *Next Monday*), and outcome logging.
- **Activity Audit Trail**: Automatic, chronological event timeline recording all lead creations, stage transitions, profile edits, and follow-up completions with staff actor attribution and humanized timestamps.
- **Reports & Pipeline Analytics**: Proportional admissions funnel distribution, channel acquisition share rankings, and role-scoped counsellor workload distribution.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Admin**, **Manager**, and **Counsellor** roles enforced both at the UI layer and at the database layer via Supabase Row-Level Security (RLS).
- **Accessibility & Mobile-Ready**: WCAG 2.1 AA compliant keyboard navigation with universal `:focus-visible` rings, ARIA dialog and landmark semantics, and responsive drawer navigation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19.2 + Vite 8 |
| **Routing** | React Router 7 |
| **State & Context** | React Context API (`AuthContext`) + Custom Hooks |
| **Database & Auth** | Supabase (PostgreSQL 15+, Supabase Auth, Row-Level Security) |
| **Styling** | Vanilla CSS with semantic design tokens (no bulky utility frameworks) |
| **Icons** | Lucide React |
| **Deployment** | Vercel (with client-side SPA routing rewrites) |

---

## 📋 Role & Permission Matrix

| Feature / Action | Admin | Manager | Counsellor |
| :--- | :---: | :---: | :---: |
| **View Dashboard** | Institute-wide | Institute-wide | Assigned pipeline only |
| **View Leads Pipeline** | All leads | All leads | Assigned leads |
| **Create New Lead** | ✅ | ✅ | ✅ (auto-assigned to self) |
| **Assign / Reassign Leads** | Any team member | Any team member | Self only |
| **Edit Student Details** | ✅ | ✅ | Assigned leads only |
| **Schedule Follow-Ups** | Any team member | Any team member | Assigned leads only |
| **Complete Follow-Ups** | ✅ | ✅ | Assigned follow-ups |
| **View Activity Audit Trail** | All events | All events | Assigned lead events |
| **Reports & Workload Analytics** | Team-wide breakdown | Team-wide breakdown | Personal scorecard only |

---

## 🗄️ Database Architecture & Supabase Setup

The database schema is defined in `supabase/migrations/` and consists of 4 core tables:

### 1. `profiles`
Stores user profile information linked to `auth.users(id)`.
- `id` (uuid, primary key, references `auth.users(id)` on delete cascade)
- `full_name` (text, not null)
- `role` (text, check `role in ('admin', 'manager', 'counsellor')`, default `'counsellor'`)
- `created_at` (timestamptz, default `now()`)

### 2. `leads`
Stores student lead and admission inquiry records.
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `full_name` (text, not null)
- `phone` (text, not null)
- `email` (text)
- `course_interest` (text, not null)
- `source` (text, not null)
- `status` (text, check `status in ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')`, default `'New'`)
- `lost_reason` (text)
- `notes` (text)
- `assigned_to` (uuid, references `profiles(id)` on delete set null)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)

### 3. `follow_ups`
Stores scheduled communication tasks with prospective students.
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `lead_id` (uuid, not null, references `leads(id)` on delete cascade)
- `due_at` (timestamptz, not null)
- `note` (text, not null)
- `status` (text, check `status in ('pending', 'completed')`, default `'pending'`)
- `assigned_to` (uuid, references `profiles(id)` on delete set null)
- `completed_at` (timestamptz)
- `outcome_notes` (text)
- `created_at` (timestamptz, default `now()`)

### 4. `activities`
Stores immutable chronological audit events.
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `lead_id` (uuid, not null, references `leads(id)` on delete cascade)
- `actor_id` (uuid, references `profiles(id)` on delete set null)
- `activity_type` (text, check `activity_type in ('lead_created', 'status_changed', 'lead_updated', 'followup_created', 'followup_completed')`)
- `description` (text, not null)
- `metadata` (jsonb, default `'{}'::jsonb`)
- `created_at` (timestamptz, default `now()`)

### Database Trigger
An automated PostgreSQL function and trigger (`on_auth_user_created`) inserts a row into `public.profiles` automatically upon sign-up, taking `full_name` and `role` from user metadata.

### Row Level Security (RLS)
All 4 tables have Row Level Security enabled.
- **Counsellors** have access restricted to records where `assigned_to = auth.uid()` or unassigned pool leads.
- **Managers & Admins** have read and write permissions across all rows through security definer helper functions (`get_user_role()`).

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory (refer to `.env.example`):

```bash
# Supabase Connection Variables
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
```

> ⚠️ **SECURITY WARNING**:
> - Never include the Supabase `service_role` key in frontend code or environment files.
> - The application relies exclusively on the public anonymous (`anon`) key, with security and authorization strictly enforced by PostgreSQL Row Level Security (RLS).

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- A configured **Supabase** project

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/brightpath-crm.git
   cd brightpath-crm
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Update .env.local with your Supabase credentials
   ```

4. **Apply database migrations**:
   Run the SQL scripts in `supabase/migrations/` sequentially in the Supabase SQL Editor:
   - `001_initial_schema.sql`
   - `002_rls_and_policies.sql`
   - `003_seed_demo_data.sql` (optional for local testing)
   - `004_grant_permissions.sql` (grants table access to authenticated roles so RLS governs access)

5. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Quality Assurance & Verification

BrightPath CRM maintains a strict static verification standard:

```bash
# Run ESLint validation (0 errors, 0 warnings enforced)
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Production Deployment (Vercel)

1. Push your repository to GitHub.
2. In the **Vercel Dashboard**, select **New Project** and import the `brightpath-crm` repository.
3. In **Project Settings > Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. The included `vercel.json` ensures all deep links (`/leads/:id`, `/dashboard`, `/reports`) route cleanly to `index.html` without 404 errors:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 📄 License

BrightPath CRM is proprietary software developed for educational institute management. All rights reserved.
