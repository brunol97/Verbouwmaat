#!/bin/bash
# Sync environment variables from .env.local to Vercel via CLI
# Usage: ./scripts/setup-vercel-env.sh [preview|production]

set -e

ENV=${1:-preview}

echo "🔄 Syncing environment variables from .env.local to Vercel ($ENV)..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "❌ Not logged in to Vercel. Run: vercel login"
  exit 1
fi

# Read .env.local and sync to Vercel
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^[[:space:]]*#.*$ ]] && continue
  [[ -z "${key// }" ]] && continue

  # Trim whitespace
  key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  # Remove surrounding quotes if present
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  # Skip if value is empty or placeholder
  [[ -z "$value" ]] && continue
  [[ "$value" == "sk-..." ]] && continue
  [[ "$value" == "re_..." ]] && continue
  [[ "$value" == "phc_..." ]] && continue
  [[ "$value" == "sb_publishable_..." ]] && continue
  [[ "$value" == "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9."* ]] && continue

  echo "  → $key"
  echo "$value" | vercel env add "$key" "$ENV" --yes 2>/dev/null || {
    echo "     (already exists or failed, skipping)"
  }
done < .env.local

echo ""
echo "✅ Done! Verify at Vercel Dashboard → Project → Settings → Environment Variables"
