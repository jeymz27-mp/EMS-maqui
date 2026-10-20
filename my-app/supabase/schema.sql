-- ============================================================================
-- EMPLOYEE MANAGEMENT SYSTEM (EMS v3.0) — SUPABASE DATABASE SCHEMA
-- Author: James Maqui R. Pantas
-- Purpose: Complete PostgreSQL DDL, Indexes, RLS Policies & Enterprise Seed Data
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLES CREATION
-- ============================================================================

-- A. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    is_activated BOOLEAN DEFAULT FALSE,
    role TEXT CHECK (role IN ('employee', 'manager')) NOT NULL DEFAULT 'employee',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar TEXT,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT CHECK (status IN ('Active', 'On Leave', 'Inactive')) DEFAULT 'Active',
    phone TEXT,
    bio TEXT,
    date_joined TEXT,
    birthday TEXT,
    address TEXT,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    employment_details JSONB DEFAULT '{}'::jsonb,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    sms_recovery_phone TEXT,
    leave_balance JSONB DEFAULT '{"vacation": {"total": 15, "used": 0}, "sick": {"total": 10, "used": 0}, "personal": {"total": 5, "used": 0}, "emergency": {"total": 3, "used": 0}}'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    performance JSONB DEFAULT '[]'::jsonb,
    manager_notes TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_to_name TEXT NOT NULL,
    assigned_by_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_by_name TEXT NOT NULL,
    department TEXT NOT NULL,
    due_date TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    status TEXT CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue')) DEFAULT 'Pending',
    category TEXT CHECK (category IN ('Feature', 'Bugfix', 'Documentation', 'Review', 'Operations', 'General')) DEFAULT 'General',
    progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
    manager_notes TEXT,
    employee_notes TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

-- C. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    department TEXT NOT NULL,
    date TEXT NOT NULL,
    time_in TEXT,
    time_out TEXT,
    working_hours NUMERIC(4,2) DEFAULT 0.0,
    status TEXT CHECK (status IN ('Present', 'Late', 'Absent', 'On Leave', 'Half Day')) DEFAULT 'Present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    department TEXT NOT NULL,
    leave_type TEXT CHECK (leave_type IN ('Vacation', 'Sick', 'Personal', 'Emergency', 'Maternity/Paternity')) NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    date_requested TEXT NOT NULL,
    reviewed_by TEXT,
    reviewed_at TEXT,
    manager_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    audience TEXT NOT NULL,
    posted_by_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    posted_by_name TEXT NOT NULL,
    posted_by_role TEXT NOT NULL,
    posted_on TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    scheduled_date TEXT,
    status TEXT DEFAULT 'Published',
    attachment JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. ACTIVITIES TABLE (Real-time Audit Log)
CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('attendance', 'task', 'leave', 'announcement', 'security', 'system')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    actor TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON public.attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);

CREATE INDEX IF NOT EXISTS idx_leave_emp_status ON public.leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_status ON public.leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS with open anonymous client access for the Next.js EMS frontend
-- ============================================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Employees policies
DROP POLICY IF EXISTS "Allow public read employees" ON public.employees;
CREATE POLICY "Allow public read employees" ON public.employees FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write employees" ON public.employees;
CREATE POLICY "Allow public write employees" ON public.employees FOR ALL USING (true);

-- Tasks policies
DROP POLICY IF EXISTS "Allow public read tasks" ON public.tasks;
CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write tasks" ON public.tasks;
CREATE POLICY "Allow public write tasks" ON public.tasks FOR ALL USING (true);

-- Attendance policies
DROP POLICY IF EXISTS "Allow public read attendance" ON public.attendance_records;
CREATE POLICY "Allow public read attendance" ON public.attendance_records FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write attendance" ON public.attendance_records;
CREATE POLICY "Allow public write attendance" ON public.attendance_records FOR ALL USING (true);

-- Leave requests policies
DROP POLICY IF EXISTS "Allow public read leave" ON public.leave_requests;
CREATE POLICY "Allow public read leave" ON public.leave_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write leave" ON public.leave_requests;
CREATE POLICY "Allow public write leave" ON public.leave_requests FOR ALL USING (true);

-- Announcements policies
DROP POLICY IF EXISTS "Allow public read announcements" ON public.announcements;
CREATE POLICY "Allow public read announcements" ON public.announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write announcements" ON public.announcements;
CREATE POLICY "Allow public write announcements" ON public.announcements FOR ALL USING (true);

-- Activities policies
DROP POLICY IF EXISTS "Allow public read activities" ON public.activities;
CREATE POLICY "Allow public read activities" ON public.activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public write activities" ON public.activities;
CREATE POLICY "Allow public write activities" ON public.activities FOR ALL USING (true);

-- ============================================================================
-- 5. ENABLE REAL-TIME REPLICATION
-- Allows browser clients to instantly receive live notifications & changes
-- ============================================================================
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY['employees', 'tasks', 'attendance_records', 'leave_requests', 'announcements', 'activities'];
BEGIN
  -- Create publication if not yet created
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables only if they are not already members of the publication
  FOREACH tbl IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 6. ENTERPRISE INITIAL SEED DATA
-- ============================================================================

-- EMPLOYEES
INSERT INTO public.employees (
    id, email, username, password, is_activated, role, first_name, last_name, avatar,
    position, department, status, phone, bio, date_joined, birthday, address,
    emergency_contact, employment_details, two_factor_enabled, sms_recovery_phone, leave_balance
) VALUES
(
    'EMP-2026-001',
    'pantasjeymz@gmail.com',
    'jpantas',
    'Password123!',
    true,
    'employee',
    'James Maqui',
    'Pantas',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'Senior Software Engineer',
    'IT',
    'Active',
    '+1 (555) 382-9912',
    'Full-stack software developer passionate about building intuitive user experiences, scalable cloud systems, and accessible web solutions.',
    '2024-03-15',
    '1998-05-18',
    '452 Pine Valley Road, Silicon District, CA 94025',
    '{"name": "Elena Pantas", "phone": "+1 (555) 912-4433", "relationship": "Spouse"}'::jsonb,
    '{"salary": "$92,000 / yr", "reportsTo": "Sarah Jenkins (IT Department Manager)", "workSchedule": "8:00 AM - 5:00 PM (PST)", "employmentType": "Full-Time", "officeLocation": "Headquarters - Building B, Floor 3, Desk 308"}'::jsonb,
    false,
    '+1 (555) 382-9912',
    '{"sick": {"used": 2, "total": 10}, "vacation": {"used": 4, "total": 15}, "emergency": {"used": 0, "total": 3}, "personal": {"used": 1, "total": 5}}'::jsonb
),
(
    'MGR-2026-101',
    'jeymzpantas@gmail.com',
    'sjenkins',
    'Password123!',
    true,
    'manager',
    'Sarah',
    'Jenkins',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    'IT & Engineering Department Manager',
    'IT',
    'Active',
    '+1 (555) 749-1120',
    'Department Manager overseeing IT infrastructure, enterprise application architecture, and agile engineering squads.',
    '2021-06-01',
    '1988-11-23',
    '782 Grandview Terrace, Suite 10, CA 94107',
    '{"name": "Mark Jenkins", "phone": "+1 (555) 883-2940", "relationship": "Spouse"}'::jsonb,
    '{"salary": "$135,000 / yr", "reportsTo": "VP of Technology", "workSchedule": "8:00 AM - 5:00 PM (PST)", "employmentType": "Full-Time", "officeLocation": "Headquarters - Building B, Floor 4, Exec Office 401"}'::jsonb,
    true,
    '+1 (555) 749-1120',
    '{"sick": {"used": 1, "total": 10}, "vacation": {"used": 6, "total": 20}, "emergency": {"used": 0, "total": 3}, "personal": {"used": 0, "total": 5}}'::jsonb
),
(
    'EMP-2026-002',
    'chloe.chen@company.com',
    'cchen',
    'Password123!',
    true,
    'employee',
    'Chloe',
    'Chen',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    'UI/UX Product Designer',
    'IT',
    'Active',
    '+1 (555) 293-8472',
    'Human-centered design specialist focused on design systems, Figma workflows, and micro-interactions.',
    '2024-08-01',
    '1996-09-12',
    '108 Market Street, Apt 4C, San Francisco, CA',
    '{"name": "David Chen", "phone": "+1 (555) 482-1928", "relationship": "Brother"}'::jsonb,
    '{"salary": "$88,000 / yr", "reportsTo": "Sarah Jenkins (IT Department Manager)", "workSchedule": "8:00 AM - 5:00 PM (PST)", "employmentType": "Full-Time", "officeLocation": "Headquarters - Building B, Floor 3, Studio 3"}'::jsonb,
    false,
    '+1 (555) 293-8472',
    '{"sick": {"used": 0, "total": 10}, "vacation": {"used": 2, "total": 15}, "emergency": {"used": 0, "total": 3}, "personal": {"used": 1, "total": 5}}'::jsonb
),
(
    'EMP-2026-003',
    'marcus.vance@company.com',
    'mvance',
    'Password123!',
    true,
    'employee',
    'Marcus',
    'Vance',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'DevOps & Cloud Engineer',
    'IT',
    'Active',
    '+1 (555) 601-3329',
    'Infrastructure-as-code automation and Kubernetes cluster security maintainer.',
    '2023-11-15',
    '1992-02-04',
    '92 Oakridge Lane, Oakland, CA',
    '{"name": "Cynthia Vance", "phone": "+1 (555) 302-8844", "relationship": "Parent"}'::jsonb,
    '{"salary": "$95,000 / yr", "reportsTo": "Sarah Jenkins (IT Department Manager)", "workSchedule": "8:00 AM - 5:00 PM (PST)", "employmentType": "Full-Time", "officeLocation": "Headquarters - Building B, Floor 3, Desk 312"}'::jsonb,
    true,
    '+1 (555) 601-3329',
    '{"sick": {"used": 1, "total": 10}, "vacation": {"used": 5, "total": 15}, "emergency": {"used": 1, "total": 3}, "personal": {"used": 0, "total": 5}}'::jsonb
),
(
    'EMP-2026-004',
    'alyssa.morales@company.com',
    'amorales',
    'Password123!',
    true,
    'employee',
    'Alyssa',
    'Morales',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    'QA Automation Specialist',
    'IT',
    'On Leave',
    '+1 (555) 412-8802',
    'Quality assurance advocate specializing in Cypress, Playwright, and load testing pipelines.',
    '2024-01-10',
    '1995-07-29',
    '342 Harbor View, Alameda, CA',
    '{"name": "Roberto Morales", "phone": "+1 (555) 991-3820", "relationship": "Father"}'::jsonb,
    '{"salary": "$84,000 / yr", "reportsTo": "Sarah Jenkins (IT Department Manager)", "workSchedule": "8:00 AM - 5:00 PM (PST)", "employmentType": "Full-Time", "officeLocation": "Headquarters - Building B, Floor 3, Desk 314"}'::jsonb,
    false,
    '+1 (555) 412-8802',
    '{"sick": {"used": 3, "total": 10}, "vacation": {"used": 8, "total": 15}, "emergency": {"used": 0, "total": 3}, "personal": {"used": 2, "total": 5}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    position = EXCLUDED.position,
    department = EXCLUDED.department,
    status = EXCLUDED.status;

-- TASKS
INSERT INTO public.tasks (
    id, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name,
    department, due_date, priority, status, category, progress, manager_notes, employee_notes, created_at, completed_at
) VALUES
(
    'TSK-1001',
    'Connect Supabase Postgres Database & Realtime Replication',
    'Establish Supabase connection, run migration schema, implement typed CRUD service with live websocket sync across staff clients.',
    'EMP-2026-001',
    'James Maqui Pantas',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT',
    '2026-10-25',
    'High',
    'In Progress',
    'Feature',
    75,
    'Confirm RLS policies allow authenticated updates and anon development read/writes.',
    'Schema drafted and service client implemented.',
    '2026-10-06',
    NULL
),
(
    'TSK-1002',
    'Standardize 8:00 AM Attendance Grace Period Logic',
    'Enforce official 15-minute grace window before tagging punch-in as Late, and calculate exact cumulative working hours across month-end summaries.',
    'EMP-2026-001',
    'James Maqui Pantas',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT',
    '2026-10-15',
    'Medium',
    'Pending',
    'Feature',
    20,
    'Coordinate with Marcus on DB table indexing for timestamp filtering.',
    NULL,
    '2026-10-03',
    NULL
),
(
    'TSK-1003',
    'Revamp Leave Balance Calculator and Real-time Activity Feed',
    'Connect leave type quotas (Vacation, Sick, Personal) with pending request deductions and manager approval audit log.',
    'EMP-2026-001',
    'James Maqui Pantas',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT',
    '2026-10-08',
    'Urgent',
    'In Progress',
    'Feature',
    90,
    'Make sure manager review feedback updates instantly on employee feed.',
    'Added reactive state listeners and automatic day counter.',
    '2026-09-28',
    NULL
),
(
    'TSK-1004',
    'Migrate UI Icons to Modern Lucide System & Polish Theme',
    'Review high-contrast color palette, font hierarchies, glassmorphism cards, and micro-interactions for the entire EMS suite.',
    'EMP-2026-002',
    'Chloe Chen',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT',
    '2026-10-14',
    'Medium',
    'In Progress',
    'Documentation',
    60,
    NULL,
    NULL,
    '2026-10-02',
    NULL
),
(
    'TSK-1005',
    'Configure Daily Automated Database Backup & Retention Policy',
    'Setup midnight cron snapshot routine and encrypted offsite replication for employee documents repository.',
    'EMP-2026-003',
    'Marcus Vance',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT',
    '2026-10-05',
    'High',
    'Completed',
    'Operations',
    100,
    'Verified backup integrity on staging cluster.',
    NULL,
    '2026-09-25',
    '2026-10-05'
)
ON CONFLICT (id) DO NOTHING;

-- ATTENDANCE RECORDS
INSERT INTO public.attendance_records (
    id, employee_id, employee_name, department, date, time_in, time_out, working_hours, status, notes
) VALUES
('att-today-001', 'EMP-2026-001', 'James Maqui Pantas', 'IT', '2026-10-08', '08:08 AM', NULL, 8.0, 'Present', 'Clocked in on time from Main Office'),
('att-today-002', 'MGR-2026-101', 'Sarah Jenkins', 'IT', '2026-10-08', '07:55 AM', NULL, 8.5, 'Present', 'Early arrival - management standup'),
('att-today-003', 'EMP-2026-002', 'Chloe Chen', 'IT', '2026-10-08', '08:14 AM', NULL, 8.0, 'Present', 'Clocked in within grace window'),
('att-today-004', 'EMP-2026-003', 'Marcus Vance', 'IT', '2026-10-08', '08:24 AM', NULL, 7.5, 'Late', 'Late punch: traffic delay at bridge'),
('att-today-005', 'EMP-2026-004', 'Alyssa Morales', 'IT', '2026-10-08', NULL, NULL, 0.0, 'On Leave', 'Approved medical appointment')
ON CONFLICT (id) DO NOTHING;

-- LEAVE REQUESTS
INSERT INTO public.leave_requests (
    id, employee_id, employee_name, department, leave_type, start_date, end_date, total_days, reason, status, date_requested, reviewed_by, reviewed_at, manager_notes
) VALUES
(
    'LEV-2026-101',
    'EMP-2026-001',
    'James Maqui Pantas',
    'IT',
    'Vacation',
    '2026-10-24',
    '2026-10-26',
    3,
    'Attending family wedding and visiting relatives out of state.',
    'Pending',
    '2026-10-07',
    NULL,
    NULL,
    NULL
),
(
    'LEV-2026-102',
    'EMP-2026-004',
    'Alyssa Morales',
    'IT',
    'Sick',
    '2026-10-08',
    '2026-10-08',
    1,
    'Scheduled specialist medical checkup and recovery.',
    'Approved',
    '2026-10-06',
    'Sarah Jenkins',
    '2026-10-06',
    'Approved. Hope all goes smoothly with the doctor.'
),
(
    'LEV-2026-103',
    'EMP-2026-002',
    'Chloe Chen',
    'IT',
    'Personal',
    '2026-09-18',
    '2026-09-18',
    1,
    'Attending apartment lease renewal and DMV appointment.',
    'Approved',
    '2026-09-14',
    'Sarah Jenkins',
    '2026-09-15',
    'Approved.'
)
ON CONFLICT (id) DO NOTHING;

-- ANNOUNCEMENTS
INSERT INTO public.announcements (
    id, title, message, audience, posted_by_id, posted_by_name, posted_by_role, posted_on, is_pinned, scheduled_date, status, attachment
) VALUES
(
    'ANN-001',
    'Q4 2026 All-Hands & EMS 3.0 Platform Rollout',
    'Welcome everyone to the new Employee Management System v3.0! Please ensure your profile records, 2FA security, and work schedules are verified by this Friday. We are excited for our upcoming product milestones.',
    'All Employees',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT Department Manager',
    'October 08, 2026 at 09:00 AM',
    true,
    NULL,
    'Published',
    '{"name": "EMS_3.0_Feature_Walkthrough.pdf", "size": "2.4 MB", "type": "PDF"}'::jsonb
),
(
    'ANN-002',
    'IT Department Scheduled Server Maintenance Window',
    'Our internal development sandbox and staging environments will undergo database patching this Saturday from 10:00 PM to 2:00 AM PST. Production services will remain unaffected.',
    'IT',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT Department Manager',
    'October 07, 2026 at 03:30 PM',
    false,
    NULL,
    'Published',
    NULL
),
(
    'ANN-003',
    'Upcoming Public Holiday & Office Schedule Notice',
    'Please take note that all offices will be closed on Monday, October 19, for the regional holiday. Any pending urgent tasks should be coordinated with your respective managers beforehand.',
    'All Employees',
    'MGR-2026-101',
    'Sarah Jenkins',
    'IT Department Manager',
    'October 04, 2026 at 11:15 AM',
    true,
    NULL,
    'Published',
    '{"name": "Holiday_Calendar_2026.pdf", "size": "1.1 MB", "type": "PDF"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ACTIVITIES
INSERT INTO public.activities (
    id, type, title, description, timestamp, actor
) VALUES
('act-1', 'system', 'Supabase Database Initialized', 'PostgreSQL database connected and tables initialized.', 'Just now', 'System Admin'),
('act-2', 'attendance', 'Daily Time In', 'James Maqui Pantas recorded Time In at 08:08 AM (Present)', '15m ago', 'James Maqui Pantas'),
('act-3', 'task', 'Task Progress Updated', 'James advanced "Revamp Leave Balance Calculator" to 90%', '1h ago', 'James Maqui Pantas'),
('act-4', 'leave', 'Leave Application Filed', 'James Maqui Pantas applied for 3 days Vacation leave.', '3h ago', 'James Maqui Pantas')
ON CONFLICT (id) DO NOTHING;
