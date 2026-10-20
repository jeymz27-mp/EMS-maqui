# ✉️ EmailJS Authentication & Default Password Setup Guide

**Employee Management System (EMS v3.0)**  
**Author:** James Maqui R. Pantas  
**Tech Stack:** Next.js 16 (React 19) + EmailJS Browser SDK + Supabase (PostgreSQL) + TypeScript  

---

## 🌟 Overview

The Employee Management System (EMS) now features **EmailJS** integration to dispatch secure, dynamic default passwords to employees' company email addresses for authentication.

### Key Capabilities:
- **Instant Default Password Generation**: Generates clean, secure default credentials (e.g., `EMS-8K2W9P`).
- **Direct Email Delivery**: Dispatches credentials straight to the employee's registered email inbox (`to_email`).
- **Database Synchronization**: Updates the employee record and sets `is_activated = true` in Supabase PostgreSQL and local storage.
- **Self-Service & Admin Dispatch**:
  - **Login Screen**: Click **"Email Default Password"** to receive an updated default password.
  - **Account Activation**: Request an email with credentials instead of manual password typing.
  - **Forgot Password**: Request a new default password directly in Step 1.
  - **Manager Employee Dossier**: Managers can dispatch credentials with one click from an employee's profile.
- **Zero-Crash Simulated Mode**: If EmailJS keys are not yet configured, the system provides simulated delivery with an **"Auto-fill Password"** button so demos and grading are never blocked.
- **In-App Email Settings**: Configure Service ID, Template ID, and Public Key or send test emails directly inside **Settings → EmailJS Service**.

---

## 📋 1. Prerequisites: Create a Free EmailJS Account

1. Visit [https://www.emailjs.com](https://www.emailjs.com) and click **"Sign Up"** (Free plan includes 200 emails/month).
2. Confirm your email address and log in to your EmailJS Dashboard.

---

## 🛠️ 2. Step-by-Step Configuration

### Step A: Add an Email Service
1. In the EmailJS dashboard, click **"Email Services"** on the left menu.
2. Click **"Add New Service"**.
3. Choose your email provider (e.g., **Gmail**, **Outlook**, or **Personal SMTP**).
4. Click **"Connect Account"**, log in to your email, and authorize EmailJS.
5. Note your **Service ID** (e.g., `service_abc123`).

### Step B: Create an Email Template
1. Click **"Email Templates"** on the left menu.
2. Click **"Create New Template"**.
3. In the template editor, configure:
   - **To Email**: `{{to_email}}`
   - **Subject**: `Your EMS Credentials - Default Password`
   - **Content Body**:
   ```html
   Hello {{to_name}},

   Your default password for the Employee Management System (EMS v3.0) is:
   {{default_password}}

   Employee ID: {{employee_id}}
   Login URL: {{system_url}}

   Please use this password and your Employee ID to log in.

   Best regards,
   EMS Administration
   ```
4. Click **"Save"**.
5. Note your **Template ID** (e.g., `template_xyz789`).

### Step C: Retrieve Your Public Key
1. Click **"Account"** (or gear icon) on the left menu.  
2. Select the **"API Keys"** tab.
3. Copy your **Public Key** (e.g., `pk_...` or a 17+ character key).

---

## 🔑 3. Adding Keys to Your App

### Configure via Environment Variables (.env.local)
Open `my-app/.env.local` and paste your keys:
```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```
Then restart your dev server (`npm run dev`). Credentials are read securely by the client-side EmailJS dispatcher.

---

## 🧪 4. Testing the Authentication Flow

1. On the **Login Screen** (`http://localhost:3000`), enter:
   - **For Employee**: `pantasjeymz@gmail.com` (or `EMP-2026-001`)
   - **For Department Manager**: `jeymzpantas@gmail.com` (or `MGR-2026-101`)
   - **Password**: The actual password stored in the database for that account (`Password123!`).
2. If an employee changes their password via **Settings → Security** or resets it, ONLY the new password saved in the database will be accepted. Default passwords will no longer work once updated.
3. In the **Employee Directory** (as Manager/Admin), administrators can click **"Email Default Password"** to dispatch fresh credentials directly to an employee's inbox via EmailJS, which simultaneously updates their record in the database.
4. Click **"Log in"** to access the dashboard!
