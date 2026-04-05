#!/bin/bash
# Phase 1 Test Script: Simulate a Meta Lead Webhook
# Usage: ./test_meta_lead.sh <public_url_or_localhost>

TARGET_URL=${1:-"http://localhost:3001"}
VERIFY_TOKEN="wabiz_automation_secret"

echo "🧪 Simulating Meta Lead Webhook for $TARGET_URL..."

# 1. Simulate the webhook verification (optional)
# curl -G "$TARGET_URL/meta/webhook?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=test_challenge"

# 2. Simulate a new Lead event
curl -X POST "$TARGET_URL/meta/webhook" \
     -H "Content-Type: application/json" \
     -d '{
  "object": "page",
  "entry": [
    {
      "id": "test_page_id",
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "ad_id": "test_ad_123",
            "form_id": "test_form_456",
            "leadgen_id": "test_lead_789",
            "page_id": "test_page_000",
            "created_time": 1711364400,
            "field_data": [
              { "name": "full_name", "values": ["Test User"] },
              { "name": "phone_number", "values": ["+1234567890"] },
              { "name": "email", "values": ["test@example.com"] }
            ]
          }
        }
      ]
    }
  ]
}'

echo -e "\n✅ Webhook simulated. Check your 'leads' table and 'automation_flow_runs' in Supabase!"
