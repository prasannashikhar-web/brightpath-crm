-- BrightPath CRM: Migration 004 - Grant Schema and Table Privileges
-- Grants schema and table access to authenticated and anon roles so that
-- Row Level Security (RLS) policies can govern row access without 42501 permission denied errors.

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant Table Privileges to Authenticated, Anon, and Service Role
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.leads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.follow_ups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.activities TO anon, authenticated, service_role;

-- 3. Grant Sequence Privileges
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Grant Execution on Helper Functions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;

-- 5. Set Default Privileges for any future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
