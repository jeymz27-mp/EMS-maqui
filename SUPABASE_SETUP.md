# 🚀 Supabase Database Integration Guide

**Employee Management System (EMS v3.0)**  
**Author:** James Maqui R. Pantas  
**Tech Stack:** Next.js 16 (React 19) + Supabase (PostgreSQL) + TypeScript + Lucide Icons  

---

## 🌟 Overview

The Employee Management System (EMS) has been enhanced to support **Supabase PostgreSQL** as its primary cloud database. The integration features:
- **Full Cloud Persistence**: Automatic CRUD synchronization for Employees, Tasks, Attendance logs, Leave requests, Announcements, and Audit activities.
- **Real-Time Replication**: Uses Supabase WebSocket channels (`supabase.channel('ems-realtime-sync')`) so changes made by managers or employees update in real time across active browser sessions without page reloads.
- **Optimistic UI Updates**: Instant interface responsiveness while mutations sync asynchronously to Supabase in the background.
- **Zero-Downtime Offline Fallback**: If Supabase credentials are not yet configured or the network is unavailable, the application gracefully continues functioning in local browser storage (`localStorage`) mode.
- **In-App Database Manager**: Configure credentials, ping test connection latency, and seed enterprise data directly inside the UI.

---

## 📋 1. Prerequisites: Create a Supabase Project

1. Visit [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **"New Project"**.
3. Choose your organization, assign a project name (e.g. `ems-maqui`), set a secure database password, and select the region closest to you.
4. Wait 1-2 minutes while Supabase provisions your PostgreSQL database.

---

## 🔑 2. Obtain Your API Credentials

In your Supabase project dashboard:
1. Navigate to **Project Settings** (gear icon at the bottom of the left sidebar).
2. Select **API** under the Configuration section.
3. Locate the following two values:
   - **Project URL**: e.g., `https://your-project-ref.supabase.co`
   - **Project API Keys &rarr; `anon` `public`**: A long string starting with `eyJhbGciOi...`

---

## 📜 3. Execute the Database Migration Schema

We have generated a PostgreSQL migration script containing all table definitions, indexes, Row Level Security (RLS) policies, realtime publications, and initial seed records:

**Schema File Location:** [`my-app/supabase/schema.sql`](./my-app/supabase/schema.sql)

### Steps to run:
1. In your Supabase dashboard, open the **SQL Editor** from the left navigation menu.
2. Click **"New Query"**.
3. Open [`my-app/supabase/schema.sql`](./my-app/supabase/schema.sql), copy its entire contents, and paste them into the SQL Editor.
4. Click **"Run"** (or press `Ctrl + Enter`).
5. You should see a success message (`Success. No rows returned` or rows affected).

### Tables Created:
| Table Name | Description | Key Features |
| :--- | :--- | :--- |
| `employees` | Staff dossiers, credentials, roles, leave quotas, documents | JSONB emergency contacts & leave balances, RLS enabled |
| `tasks` | Deliverables, assignment, priority, status, notes | FK to employees, progress % integer |
| `attendance_records` | Daily time-in / time-out punch logs | FK to employees, lateness calculation, hours tracking |
| `leave_requests` | Vacation, sick, personal leave applications | Reviewer tracking, manager remarks |
| `announcements` | Company-wide and department bulletins | Pinned status, scheduled publishing, attachments |
| `activities` | Live audit logs of system actions | Real-time broadcast channel |

---

## ⚙️ 4. Connect the Next.js Application

You can connect EMS to Supabase using either of the two methods below:

### Option A: Using `.env.local` (Recommended for Local Dev)
Open [`my-app/.env.local`](./my-app/.env.local) and paste your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*Note: Restart your Next.js dev server after modifying `.env.local`.*

### Option B: In-App Connection Modal (No Server Restart Needed)
1. Launch the EMS application in your browser (`http://localhost:3000`).
2. Click on the **Database Status Pill** in the top navigation bar (or on the Login screen, or under **Account Settings &rarr; Supabase DB**).
3. Paste your **Project URL** and **Anon Key**.
4. Click **"Test Connection"** to verify connection and latency.
5. Click **"Save & Synchronize"**. The application will instantly connect to Supabase!

---

## 🧪 5. Testing & Verification

1. **Verify Connection**:
   - The status pill in the Navbar will change to green: `Supabase (Live)`.
2. **Seed Initial Dataset** (if tables are empty):
   - In **Settings &rarr; Supabase DB** or the connection modal, click **"Seed Initial Enterprise Dataset"**.
3. **Verify Real-Time Synchronization**:
   - Open the application in two separate browser tabs or windows.
   - Punch Time In or update a task status in Window A.
   - Window B will update in real time without refreshing!
