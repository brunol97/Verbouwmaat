#!/bin/bash
# Setup GitHub repository secrets via gh CLI
# Usage: ./scripts/setup-github-secrets.sh

set -e

REPO="brunol97/Verbouwmaat"

echo "🔐 Setting up GitHub secrets for $REPO"
echo ""
echo "You'll need:"
echo "  1. SUPABASE_ACCESS_TOKEN  → from https://app.supabase.com/account/tokens"
echo "  2. SUPABASE_DB_PASSWORD   → from Supabase Dashboard → Database Settings"
echo "  3. SUPABASE_PROJECT_ID    → your dev project ID (e.g. ekzshymcaxaeoegleoyo)"
echo ""

read -p "SUPABASE_ACCESS_TOKEN: " SUPABASE_ACCESS_TOKEN
echo "$SUPABASE_ACCESS_TOKEN" | gh secret set SUPABASE_ACCESS_TOKEN --repo "$REPO"
echo "  ✅ SUPABASE_ACCESS_TOKEN"

read -p "SUPABASE_DB_PASSWORD: " SUPABASE_DB_PASSWORD
echo "$SUPABASE_DB_PASSWORD" | gh secret set SUPABASE_DB_PASSWORD --repo "$REPO"
echo "  ✅ SUPABASE_DB_PASSWORD"

read -p "SUPABASE_PROJECT_ID (dev): " SUPABASE_PROJECT_ID
echo "$SUPABASE_PROJECT_ID" | gh secret set SUPABASE_PROJECT_ID --repo "$REPO"
echo "  ✅ SUPABASE_PROJECT_ID"

echo ""
echo "Optional secrets (press Enter to skip):"

read -p "VERCEL_TOKEN (from https://vercel.com/account/tokens): " VERCEL_TOKEN
if [ -n "$VERCEL_TOKEN" ]; then
  echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN --repo "$REPO"
  echo "  ✅ VERCEL_TOKEN"
fi

read -p "SLACK_WEBHOOK_URL: " SLACK_WEBHOOK_URL
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  echo "$SLACK_WEBHOOK_URL" | gh secret set SLACK_WEBHOOK_URL --repo "$REPO"
  echo "  ✅ SLACK_WEBHOOK_URL"
fi

echo ""
echo "✅ All secrets set! Verify at:"
echo "   https://github.com/$REPO/settings/secrets/actions"
