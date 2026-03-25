# Implementation Fixes & Checklist

To get the Phase 1 & 2 automations actually running, you need to complete these manual steps:

### 1. Apply Database Migrations
The following SQL files must be executed in your **Supabase SQL Editor**:
- [20260325_automation_flows.sql](file:///Users/utkarshmakwana/Downloads/Whatsapppcom/supabase/20260325_automation_flows.sql) (Creates `automation_flow_runs` table)
- [20260325_link_tracking.sql](file:///Users/utkarshmakwana/Downloads/Whatsapppcom/supabase/20260325_link_tracking.sql) (Creates `link_clicks` table)

### 2. Update .env File
The backend requires the following variables which are currently missing:
```env
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
META_APP_SECRET="your-meta-app-secret"
META_WEBHOOK_VERIFY_TOKEN="your-custom-verify-token"
```
*Note: The `SUPABASE_SERVICE_ROLE_KEY` is required because the backend needs admin access to update tags and flow states independently of the logged-in user.*

### 3. Set up the Flow "Sweep" (Cron Job)
The system uses a "Sweep" mechanism to process delayed messages (like the 2-hour wait). You need to hit this endpoint once every minute or 5 minutes:
- **Endpoint**: `POST {{ROOT_URL}}/automation/process-flows`
- **Auth**: Must include a valid `Bearer` token from a logged-in session in the header.

### 4. Meta Webhook URL
Your Meta App must be configured to send webhooks to:
- **URL**: `https://your-public-url.com/meta/webhook`
- **Verify Token**: Must match the `META_WEBHOOK_VERIFY_TOKEN` in your `.env`.

### 5. WhatsApp Templates
The "send_message" step in [flowEngine.ts](file:///Users/utkarshmakwana/Downloads/Whatsapppcom/server/flowEngine.ts) currently tries to send a template named **`welcome_lead`**. 
- You must have this template **Approved** in your Meta Business Manager.
- Or, change the code to use **`send_interactive`** (buttons) or **`send_text`** (session messages) to avoid the template requirement.
