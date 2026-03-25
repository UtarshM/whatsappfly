#!/bin/bash
# Phase 2 Test Script: Simulate a Link Click
# Usage: ./test_link_click.sh <public_url_or_localhost> <code_like_join-group>

TARGET_URL=${1:-"http://localhost:3001"}
LINK_CODE=${2:-"join-group"}

echo "🧪 Simulating Click on Tracked Link: $TARGET_URL/t/$LINK_CODE..."

curl -L "$TARGET_URL/t/$LINK_CODE?wid=test_workspace&cid=test_contact"

echo -e "\n✅ Click simulated. Check your 'link_clicks' table in Supabase!"
