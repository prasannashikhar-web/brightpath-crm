-- BrightPath CRM: Migration 003 - Fictional Demonstration Seed Data
-- Fictional student enquiries across courses and channels
-- Idempotent: checks for existing records before inserting

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
  -- Only seed if the leads table is currently empty
  IF NOT EXISTS (SELECT 1 FROM public.leads LIMIT 1) THEN

    -- 1. New Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Aarav Sharma', 'aarav.sharma@example.com', '+91 98765 43210', 'Full Stack Web Development', 'Website', 'New', 'Interested in evening weekend batches.', now() - interval '2 hours')
    RETURNING id INTO v_lead_id_1;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Priya Patel', 'priya.patel@example.com', '+91 98234 56789', 'Data Science & Machine Learning', 'Google Search', 'New', 'Inquired about Python prerequisites.', now() - interval '5 hours')
    RETURNING id INTO v_lead_id_2;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Rohan Mehta', 'rohan.mehta@example.com', '+91 91234 56780', 'Cloud Computing & DevOps', 'Social Media', 'New', 'Looking for AWS certification track.', now() - interval '1 day')
    RETURNING id INTO v_lead_id_3;

    -- 2. Contacted Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Ananya Desai', 'ananya.desai@example.com', '+91 99887 76655', 'Full Stack Web Development', 'Referral', 'Contacted', 'Spoke on phone. Shared syllabus PDF.', now() - interval '3 days')
    RETURNING id INTO v_lead_id_4;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Kabir Verma', 'kabir.v@example.com', '+91 98711 22334', 'Cybersecurity Analyst', 'Walk-in', 'Contacted', 'Walked into campus. Interested in classroom training.', now() - interval '2 days')
    RETURNING id INTO v_lead_id_5;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Neha Reddy', 'neha.reddy@example.com', '+91 97654 32109', 'Data Science & Machine Learning', 'Website', 'Contacted', 'Requested call back after 6 PM.', now() - interval '4 days')
    RETURNING id INTO v_lead_id_6;

    -- 3. Qualified Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Vikram Singhania', 'vikram.s@example.com', '+91 98450 12345', 'Cloud Computing & DevOps', 'LinkedIn', 'Qualified', 'Has 2 years IT experience. Needs Kubernetes focus.', now() - interval '5 days')
    RETURNING id INTO v_lead_id_7;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Isha Gupta', 'isha.gupta@example.com', '+91 99100 23456', 'UI/UX Design Masterclass', 'Website', 'Qualified', 'Attended demo session. Budget approved.', now() - interval '6 days')
    RETURNING id INTO v_lead_id_8;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Aditya Joshi', 'aditya.j@example.com', '+91 98901 34567', 'Full Stack Web Development', 'Referral', 'Qualified', 'Ready to join next Monday cohort.', now() - interval '1 week')
    RETURNING id INTO v_lead_id_9;

    -- 4. Converted Leads
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Sneha Iyer', 'sneha.iyer@example.com', '+91 98330 45678', 'Data Science & Machine Learning', 'Walk-in', 'Converted', 'Admission confirmed. Fee paid.', now() - interval '10 days')
    RETURNING id INTO v_lead_id_10;

    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, notes, created_at)
    VALUES ('Karan Kapoor', 'karan.k@example.com', '+91 98199 56789', 'Cloud Computing & DevOps', 'Google Search', 'Converted', 'Batch enrolled for Saturday class.', now() - interval '12 days')
    RETURNING id INTO v_lead_id_11;

    -- 5. Lost Lead
    INSERT INTO public.leads (full_name, email, phone, course_interest, source, status, lost_reason, notes, created_at)
    VALUES ('Tanvi Nair', 'tanvi.nair@example.com', '+91 98770 67890', 'Cybersecurity Analyst', 'Social Media', 'Lost', 'Relocating to another city for university degree', 'Decided to defer until next year.', now() - interval '8 days')
    RETURNING id INTO v_lead_id_12;

    -- 6. Sample Follow-ups
    -- Overdue follow-ups (due_at in past and status pending)
    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_4, now() - interval '1 day', 'Follow up on syllabus review and batch schedule.', 'pending', now() - interval '3 days');

    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_6, now() - interval '3 hours', 'Evening call back regarding scholarship inquiry.', 'pending', now() - interval '2 days');

    -- Upcoming follow-ups (due_at in future and status pending)
    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_1, now() + interval '4 hours', 'Confirm counseling appointment for weekend batch.', 'pending', now() - interval '2 hours');

    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_7, now() + interval '1 day', 'Send corporate discount quotation and syllabus.', 'pending', now() - interval '1 day');

    INSERT INTO public.follow_ups (lead_id, due_at, note, status, created_at)
    VALUES (v_lead_id_8, now() + interval '2 days', 'Final confirmation call before cohort start.', 'pending', now() - interval '2 days');

    -- Completed follow-up
    INSERT INTO public.follow_ups (lead_id, due_at, note, status, completed_at, created_at)
    VALUES (v_lead_id_10, now() - interval '4 days', 'Enrollment document collection.', 'completed', now() - interval '3 days', now() - interval '6 days');

    -- 7. Sample Initial Activities
    INSERT INTO public.activities (lead_id, activity_type, description, metadata, created_at)
    VALUES (v_lead_id_1, 'lead_created', 'Lead created via Website enquiry', '{"source": "Website"}'::jsonb, now() - interval '2 hours');

    INSERT INTO public.activities (lead_id, activity_type, description, metadata, created_at)
    VALUES (v_lead_id_4, 'status_changed', 'Status changed from New to Contacted', '{"previous": "New", "current": "Contacted"}'::jsonb, now() - interval '3 days');

    INSERT INTO public.activities (lead_id, activity_type, description, metadata, created_at)
    VALUES (v_lead_id_10, 'status_changed', 'Status changed from Qualified to Converted', '{"previous": "Qualified", "current": "Converted"}'::jsonb, now() - interval '3 days');

    RAISE NOTICE 'Demo seed data successfully inserted.';
  ELSE
    RAISE NOTICE 'Leads table already contains data. Skipping seed.';
  END IF;
END $$;
