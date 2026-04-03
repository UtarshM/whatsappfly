# Supabase Integration Guide - WhatsApp SaaS

This document provides a step-by-step guide on how to connect this project to a fresh Supabase account.

## 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **"New Project"**.
3. Select your Organization and enter a project name (e.g., `WhatsApp-SaaS`).
4. Set a secure **Database Password** (Save this, you may need it later).
5. Choose the region closest to your users.
6. Click **"Create new project"**.

## 2. Configure Environment Variables
Once the project is ready, go to **Project Settings > API** to find your keys.

Update your `.env` file in the project root with the following:

```env
# Supabase Configuration
VITE_API_ADAPTER=supabase
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

> [!IMPORTANT]
> Keep the `SUPABASE_SERVICE_ROLE_KEY` secret. It bypasses Row Level Security (RLS) and is used by the backend server for administrative tasks.

## 3. Setup Database Schema (SQL Editor)
You must execute the SQL scripts to create the necessary tables, enums, and triggers.

1. Go to **SQL Editor** in the Supabase sidebar.
2. Click **"New Query"**.
3. Open the file `supabase/schema.sql` from this project.
4. **Copy all content** from that file and paste it into the Supabase SQL editor.
5. Click **Run**.

### Required Schema Upgrades:
After running the main schema, also run the following SQL scripts in order to ensure compatibility with the latest features:
1. `supabase/inbox_leads_upgrade.sql` (For Chat & CRM)
2. `supabase/whatsapp_connection_upgrade.sql` (For Meta Auth)
3. `supabase/automation_v1_upgrade.sql` (For Chatbot Flow Engine)

## 4. Setup Storage Buckets
The project requires a storage bucket to host images and videos for WhatsApp templates.

1. Go to **Storage** in the Supabase sidebar.
2. Click **"New Bucket"**.
3. Name the bucket: `flow-assets`.
4. Set the bucket to **Public** (so WhatsApp can access the media URLs).
5. Click **Save**.

## 5. Enable Authentication
1. Go to **Authentication > Providers**.
2. Ensure **Email** is enabled.
3. (Optional) Disable **"Confirm email"** if you want to test immediately without waiting for verification emails.

## 6. Verify Connection
1. Run `npm install` to install dependencies.
2. Start the project: `npm run dev`.
3. Open `http://localhost:8081`.
4. Create a new account via the **Signup** page.
5. If successful, you should be redirected to the **Onboarding** page, and a new record will appear in your Supabase `profiles` and `workspaces` tables.

## 7. Troubleshooting
*   **404 Errors on Login:** This usually means a table (like `operational_logs` or `automation_rules`) is missing. Re-run Step 3.
*   **400 Errors on Campaigns:** This usually means a column (like `sent_count`) is missing from the `campaigns` table. Ensure you ran all upgrade scripts in Step 3.
*   **Media Upload Fails:** Ensure the `flow-assets` bucket was created and set to **Public** in Step 4.
