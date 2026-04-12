# WhatsAppFly Deployment Guide: Railway & Vercel

This document provides instructions for deploying the WhatsAppFly platform using **Railway** for the backend, **Vercel** for the frontend, and **Supabase** for the database.

## Architecture
- **Frontend**: Vite + React (Hosted on Vercel at `wa.Scalezix.com`)
- **Backend**: Express.js (Hosted on Railway)
- **Database**: PostgreSQL (Managed by Supabase)
- **Caching/Locking**: Redis (Managed by Railway)

---

## 1. Prerequisites
- [GitHub Account](https://github.com) (Repository connected to Railway and Vercel)
- [Supabase Project](https://supabase.com) (PostgreSQL instance)
- [Railway Account](https://railway.app)
- [Vercel Account](https://vercel.com)
- [Meta Developer Account](https://developers.facebook.com) (WhatsApp Cloud API)

---

## 2. Database Migration (PostgreSQL)
We have migrated from SQLite to PostgreSQL. To initialize your Supabase production database:

1.  Retrieve your **Postgres Connection String** from Supabase Settings > Database.
2.  Run the following command locally:
    ```bash
    DATABASE_URL="your_supabase_connection_string" npx prisma db push
    ```

---

## 3. Backend Deployment (Railway)
1.  **Create Project**: Import your GitHub repository to Railway.
2.  **Add Redis**: Add a "Redis" database service to the same Railway project.
3.  **Environment Variables**: In your Railway backend service, set:
    - `DATABASE_URL`: Your Supabase connection string.
    - `REDIS_URL`: Railway will provide this automatically.
    - `SUPABASE_URL`: Your Supabase Project URL.
    - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key.
    - `META_APP_ID`: Your Meta App ID.
    - `META_APP_SECRET`: Your Meta App Secret.
    - `META_WEBHOOK_VERIFY_TOKEN`: A secret string for Meta webhooks.
    - `NODE_ENV`: `production`

---

## 4. Frontend Deployment (Vercel)
1.  **Import Project**: Import your GitHub repository to Vercel.
2.  **Add Subdomain**: Go to Settings > Domains and add `wa.Scalezix.com`.
3.  **Environment Variables**:
    - `VITE_API_BASE_URL`: Your Railway service URL (e.g., `https://your-service.up.railway.app`).
    - `VITE_API_ADAPTER`: `http`
    - `VITE_SUPABASE_URL`: Your Supabase Project URL.
    - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

---

## 5. Meta Webhook Setup
1.  Go to Meta Developer Portal > Your App > WhatsApp > Configuration.
2.  **Callback URL**: `https://your-railway-backend.app/webhook/whatsapp`
3.  **Verify Token**: Use the `META_WEBHOOK_VERIFY_TOKEN` you set in Railway.
4.  **Webhooks**: Subscribe to `messages` field.

---

## 6. Development Commands
- `npm run dev`: Start Vite development server.
- `npm run server:dev`: Start local Express server (requires `DATABASE_URL`).
- `npx prisma generate`: Update Prisma Client after schema changes.
