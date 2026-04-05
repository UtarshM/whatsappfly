# WaBiz

WhatsApp Business SaaS dashboard for Shopify stores, D2C brands, and local businesses.

## Tech Stack
- **Frontend**: Vite + React + Tailwind + Framer Motion
- **Backend**: Express (Vercel Serverless)
- **Database**: Supabase (Postgres)
- **Automation**: GitHub Actions + x-cron-secret

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor and run the schema files in `/supabase/`.
3. Copy `.env.example` to `.env` and fill in:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
4. Set `VITE_API_ADAPTER=supabase`.
5. Run `npm run dev`.

## Current Adapters

- `mock`: local browser storage, no backend needed
- `http`: custom Express backend adapter (Production)
- `supabase`: Direct Supabase Auth + Postgres integration
