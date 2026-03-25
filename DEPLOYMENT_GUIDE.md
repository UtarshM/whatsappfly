# Deployment Guide: Moving WaBiz to a Live Subdomain

Since Phase 3 (Visual Flow Builder) is now complete, you are ready to move the application to your subdomain (e.g., `app.yourdomain.com`).

## 1. Prerequisites
- A live **Supabase** project.
- A **Meta Developer App** (WhatsApp and Marketing API enabled).
- A server or hosting platform (e.g., **Vercel** for Frontend, **Railway/Render/DigitalOcean** for Backend).

## 2. Vercel + GitHub Workflow (Recommended)
This setup allows you to deploy both the Frontend and Backend automatically when you push to GitHub.

1.  **Push to GitHub**: Push this entire project folder to a new GitHub repository.
2.  **Connect to Vercel**: 
    - Go to [Vercel](https://vercel.com), click "Add New" > "Project".
    - Import your GitHub repo.
3.  **Configure Build**: Vercel will automatically detect the Vite frontend. The [vercel.json](file:///Users/utkarshmakwana/Downloads/Whatsapppcom/vercel.json) file I've added will handle the Express backend routing.
4.  **Environment Variables**: In Vercel, go to "Settings" > "Environment Variables" and add:
    - `VITE_API_BASE_URL` = `https://your-app.vercel.app` (Your Vercel URL)
    - `VITE_API_ADAPTER` = `http`
    - `SUPABASE_URL` = `...`
    - `SUPABASE_SERVICE_ROLE_KEY` = `...`
    - `META_APP_SECRET` = `...`
    - `META_WEBHOOK_VERIFY_TOKEN` = `wabiz_automation_secret`
5.  **Hit Deploy**: Vercel will build and serve your app.

## 3. Database (Supabase) Setup
1.  Go to your Supabase SQL Editor.
2.  Run the following files in order:
    - [supabase/schema.sql](file:///Users/utkarshmakwana/Downloads/Whatsapppcom/supabase/schema.sql)
    - [supabase/20260325_link_tracking.sql](file:///Users/utkarshmakwana/Downloads/Whatsapppcom/supabase/20260325_link_tracking.sql)
    - [supabase/20260325_automation_flows.sql](file:///Users/utkarshmakwana/Downloads/Whatsapppcom/supabase/20260325_automation_flows.sql)

## 4. Frontend Deployment
1.  **Environment Variables**: Create a `.env` file in the project root (or your CI/CD) with:
    ```env
    VITE_API_BASE_URL=https://api.yourdomain.com
    VITE_API_ADAPTER=http
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
2.  **Build**: `npm run build`.
3.  **Deploy**: Upload the `dist/` folder to your frontend host (Vercel/Nginx).

## 5. Meta Webhook Configuration
1.  Go to **Meta Developer Portal** > Your App > **WhatsApp** > **Configuration**.
2.  Update the **Callback URL** to: `https://your-app.vercel.app/webhook/whatsapp`.
3.  Ensure **Verify Token** matches your settings (default is `wabiz_automation_secret`).

## 6. Automation Scheduler (Already Handled)
I have added a `crons` section to the `vercel.json`. Vercel will automatically trigger your automation engine once every minute to process pending flows.

---

**When should you do this?**
**Now.** Phases 1-3 are stable and have been tested locally. Moving to a subdomain will allow you to test real Meta Webhooks without Ngrok and start onboarding your first users.
