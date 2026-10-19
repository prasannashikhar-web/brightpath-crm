-- ==============================================================================
-- BRIGHTPATH CRM - PHASE 1 FULL DATABASE MIGRATION & SECURITY
-- Tables: profiles, leads, follow_ups, activities
-- Triggers: handle_new_user (auth.users), handle_updated_at
-- Security: Row Level Security (RLS) on all tables + get_current_user_role() helper
-- Optional: Initial fictional demo data
-- ==============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'counsellor' CHECK (role IN ('admin', 'manager', 'counsellor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. LEADS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  course_interest text NOT NULL,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')),
  lost_reason text,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_lost_reason CHECK (status != 'Lost' OR (lost_reason IS NOT NULL AND length(trim(lost_reason)) > 0))
);

-- ------------------------------------------------------------------------------
-- 3. FOLLOW_UPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_at timestamptz NOT NULL,
  note text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. ACTIVITIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON public.follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_status ON public.follow_ups(due_at, status);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. AUTOMATIC PROFILE CREATION ON AUTH SIGNUP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'counsellor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 8. RLS HELPER FUNCTION (PREVENTS INFINITE RECURSION)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ------------------------------------------------------------------------------
-- 9. ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 10. POLICIES: PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view team profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view team profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile details" ON public.profiles;
CREATE POLICY "Users can update own profile details"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND (role = public.get_current_user_role() OR public.get_current_user_role() = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- 11. POLICIES: LEADS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view permitted leads" ON public.leads;
CREATE POLICY "Users can view permitted leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'manager')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Authenticated users can create leads" ON public.leads;
CREATE POLICY "Authenticated users can create leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (created_by = auth.uid() OR created_by IS NULL)
  );

DROP POLICY IF EXISTS "Users can update permitted leads" ON public.leads;
CREATE POLICY "Users can update permitted leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'manager')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'manager')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Managers and admins can delete leads" ON public.leads;
CREATE POLICY "Managers and admins can delete leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'manager'));

-- ------------------------------------------------------------------------------
-- 12. POLICIES: FOLLOW_UPS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view follow-ups for accessible leads" ON public.follow_ups;
CREATE POLICY "Users can view follow-ups for accessible leads"
  ON public.follow_ups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE public.leads.id = follow_ups.lead_id
    )
  );

DROP POLICY IF EXISTS "Users can create follow-ups for accessible leads" ON public.follow_ups;
CREATE POLICY "Users can create follow-ups for accessible leads"
  ON public.follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE public.leads.id = follow_ups.lead_id
    )
  );

DROP POLICY IF EXISTS "Users can update follow-ups for accessible leads" ON public.follow_ups;
CREATE POLICY "Users can update follow-ups for accessible leads"
  ON public.follow_ups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE public.leads.id = follow_ups.lead_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE public.leads.id = follow_ups.lead_id
    )
  );

DROP POLICY IF EXISTS "Users can delete own or managed follow-ups" ON public.follow_ups;
CREATE POLICY "Users can delete own or managed follow-ups"
  ON public.follow_ups
  FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'manager')
    OR created_by = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- 13. POLICIES: ACTIVITIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view activities for accessible leads" ON public.activities;
CREATE POLICY "Users can view activities for accessible leads"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE public.leads.id = activities.lead_id
    )
  );

DROP POLICY IF EXISTS "Users can log activities for accessible leads" ON public.activities;
CREATE POLICY "Users can log activities for accessible leads"
  ON public.activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE public.leads.id = activities.lead_id
    )
  );

-- ------------------------------------------------------------------------------
-- 14. OPTIONAL FICTIONAL SEED DATA
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_lead_id_1 uuid;
  v_lead_id_2 uuid;
  v_lead_id_3 uuid;
  v_lead_id_4 uuid;
  v_lead_id_5 uuid;
  v_lead_id_6 uuid;
  v_lead_id_7 uuid;
  v_lead_id_8 uuid;
  v_lead_id_9 uuid;
  v_lead_id_10 uuid;
  v_lead_id_11 uuid;
  v_lead_id_12 uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.leads LIMIT 1) THEN

    -- New Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Aarav Sharma', 'aarav.sharma@example.com', '+91 98765 43210', 'Full Stack Web Development', 'Website', 'New', 'Interested in evening weekend batches.', now() - interval '2 hours')
    RETURNING id INTO v_lead_id_1;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Priya Patel', 'priya.patel@example.com', '+91 98234 56789', 'Data Science & Machine Learning', 'Google Search', 'New', 'Inquired about Python prerequisites.', now() - interval '5 hours')
    RETURNING id INTO v_lead_id_2;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Rohan Mehta', 'rohan.mehta@example.com', '+91 91234 56780', 'Cloud Computing & DevOps', 'Social Media', 'New', 'Looking for AWS certification track.', now() - interval '1 day')
    RETURNING id INTO v_lead_id_3;

    -- Contacted Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Ananya Desai', 'ananya.desai@example.com', '+91 99887 76655', 'Full Stack Web Development', 'Referral', 'Contacted', 'Spoke on phone. Shared syllabus PDF.', now() - interval '3 days')
    RETURNING id INTO v_lead_id_4;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Kabir Verma', 'kabir.v@example.com', '+91 98711 22334', 'Cybersecurity Analyst', 'Walk-in', 'Contacted', 'Walked into campus. Interested in classroom training.', now() - interval '2 days')
    RETURNING id INTO v_lead_id_5;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Neha Reddy', 'neha.reddy@example.com', '+91 97654 32109', 'Data Science & Machine Learning', 'Website', 'Contacted', 'Requested call back after 6 PM.', now() - interval '4 days')
    RETURNING id INTO v_lead_id_6;

    -- Qualified Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Vikram Singhania', 'vikram.s@example.com', '+91 98450 12345', 'Cloud Computing & DevOps', 'LinkedIn', 'Qualified', 'Has 2 years IT experience. Needs Kubernetes focus.', now() - interval '5 days')
    RETURNING id INTO v_lead_id_7;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Isha Gupta', 'isha.gupta@example.com', '+91 99100 23456', 'UI/UX Design Masterclass', 'Website', 'Qualified', 'Attended demo session. Budget approved.', now() - interval '6 days')
    RETURNING id INTO v_lead_id_8;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Aditya Joshi', 'aditya.j@example.com', '+91 98901 34567', 'Full Stack Web Development', 'Referral', 'Qualified', 'Ready to join next Monday cohort.', now() - interval '1 week')
    RETURNING id INTO v_lead_id_9;

    -- Converted Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Sneha Iyer', 'sneha.iyer@example.com', '+91 98330 45678', 'Data Science & Machine Learning', 'Walk-in', 'Converted', 'Admission confirmed. Fee paid.', now() - interval '10 days')
    RETURNING id INTO v_lead_id_10;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Karan Kapoor', 'karan.k@example.com', '+91 98199 56789', 'Cloud Computing & DevOps', 'Google Search', 'Converted', 'Batch enrolled for Saturday class.', now() - interval '12 days')
    RETURNING id INTO v_lead_id_11;

    -- Lost Lead
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, lost_reason, notes, created_at)
    VALUES ('Tanvi Nair', 'tanvi.nair@example.com', '+91 98770 67890', 'Cybersecurity Analyst', 'Social Media', 'Lost', 'Relocating to another city for university degree', 'Decided to defer until next year.', now() - interval '8 days')
    RETURNING id INTO v_lead_id_12;

    -- Sample Follow-ups
    -- Overdue
    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_4, now() - interval '1 day', 'Follow up on syllabus review and batch schedule.', 'pending', now() - interval '3 days');

    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_6, now() - interval '3 hours', 'Evening call back regarding scholarship inquiry.', 'pending', now() - interval '2 days');

    -- Upcoming
    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_1, now() + interval '4 hours', 'Confirm counseling appointment for weekend batch.', 'pending', now() - interval '2 hours');

    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_7, now() + interval '1 day', 'Send corporate discount quotation and syllabus.', 'pending', now() - interval '1 day');

    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_8, now() + interval '2 days', 'Final confirmation call before cohort start.', 'pending', now() - interval '2 days');

    -- Completed
    INSERT INTO public.follow_ups (lead_id, due_at, note, status, completed_at, created_at)
    VALUES (v_lead_id_10, now() - interval '4 days', 'Enrollment document collection.', 'completed', now() - interval '3 days', now() - interval '6 days');

    -- Sample Activities
    INSERT INTO public.activities (lead_id, activity_type, description, metadata, created_at)
    VALUES (v_lead_id_1, 'lead_created', 'Lead created via Website enquiry', '{"source": "Website"}'::jsonb, now() - interval '2 hours');

    INSERT INTO public.activities (lead_id, activity_type, description, metadata, created_at)
    VALUES (v_lead_id_4, 'status_changed', 'Status changed from New to Contacted', '{"previous": "New", "current": "Contacted"}'::jsonb, now() - interval '3 days');

    INSERT INTO public.activities (lead_id, activity_type, description, metadata, created_at)
    VALUES (v_lead_id_10, 'status_changed', 'Status changed from Qualified to Converted', '{"previous": "Qualified", "current": "Converted"}'::jsonb, now() - interval '3 days');

  END IF;
END $$;
