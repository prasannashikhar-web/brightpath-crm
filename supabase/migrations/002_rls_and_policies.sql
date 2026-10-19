-- BrightPath CRM: Migration 002 - Row Level Security & Policies
-- Security Definer helper to prevent policy recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 1. PROFILES POLICIES
-- ==============================================================================

-- Read: All authenticated users can view team member profiles (needed for assignee displays & dropdowns)
DROP POLICY IF EXISTS "Authenticated users can view team profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view team profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Update: Users can update their own profile name without elevating their role
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

-- Update: Admins can update any profile (including role changes)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- ==============================================================================
-- 2. LEADS POLICIES
-- ==============================================================================

-- Select: Counsellors see created/assigned; Managers & Admins see all leads
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

-- Insert: Authenticated users can create leads (must set created_by to own uid)
DROP POLICY IF EXISTS "Authenticated users can create leads" ON public.leads;
CREATE POLICY "Authenticated users can create leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- Update: Counsellors update own/assigned leads; Managers & Admins update any lead
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

-- Delete: Only Managers and Admins can delete leads
DROP POLICY IF EXISTS "Managers and admins can delete leads" ON public.leads;
CREATE POLICY "Managers and admins can delete leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'manager'));

-- ==============================================================================
-- 3. FOLLOW_UPS POLICIES
-- ==============================================================================

-- Select: Permitted if the user has access to the associated lead
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

-- Insert: Permitted if the user has access to the associated lead
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

-- Update: Permitted if the user has access to the associated lead
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

-- Delete: Permitted if manager/admin, or if created by the user
DROP POLICY IF EXISTS "Users can delete own or managed follow-ups" ON public.follow_ups;
CREATE POLICY "Users can delete own or managed follow-ups"
  ON public.follow_ups
  FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'manager')
    OR created_by = auth.uid()
  );

-- ==============================================================================
-- 4. ACTIVITIES POLICIES
-- ==============================================================================

-- Select: Permitted if user has access to the associated lead
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

-- Insert: Authenticated users can insert activity records for accessible leads
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
