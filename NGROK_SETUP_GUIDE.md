# Ngrok & Webhook Setup Guide

To test your WhatsApp automations locally, follow these steps:

### 1. Install Ngrok
If you don't have it, install via Homebrew:
```bash
brew install ngrok/ngrok/ngrok
```

### 2. Start Ngrok
Point it to your local server port (3001):
```bash
ngrok http 3001
```
Copy the **Forwarding URL** (e.g., `https://a1b2-c3d4.ngrok-free.app`).

### 3. Update Meta Developer Portal
Go to your **Meta App Dashboard** -> **WhatsApp** -> **Configuration**:
- **Callback URL**: `https://YOUR_NGROK_URL/meta/webhook`
- **Verify Token**: `wabiz_automation_secret`

### 4. Run the Test Scripts
Once Ngrok is running and your server is active (`npm run dev`), open a new terminal and run:

**Test Lead Capture (Phase 1):**
```bash
./test_meta_lead.sh http://localhost:3001
```

**Test Link Tracking (Phase 2):**
```bash
./test_link_click.sh http://localhost:3001 join-group
```

### ⚠️ Important Reminder
Make sure you have applied the **SQL Migrations** in your Supabase SQL Editor before testing!
- `supabase/20260325_automation_flows.sql`
- `supabase/20260325_link_tracking.sql`
