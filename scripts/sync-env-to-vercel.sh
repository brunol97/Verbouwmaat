#!/bin/bash
# Sync environment variables from .env.local to Vercel
# Usage: ./scripts/sync-env-to-vercel.sh [preview|production]

set -e

ENV=${1:-preview}

echo "🔄 Syncing environment variables to Vercel ($ENV)..."

# Read .env.local and sync to Vercel
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue

  # Trim whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  # Skip if value is empty or placeholder
  [[ -z "$value" ]] && continue
  [[ "$value" == "sk-..." ]] && continue
  [[ "$value" == "re_..." ]] && continue
  [[ "$value" == "phc_..." ]] && continue
  [[ "$value" == "sb_publishable_..." ]] && continue
  [[ "$value" == "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9."* ]] && continue

  echo "  → $key"
  echo "$value" | vercel env add "$key" "$ENV" --yes 2>/dev/null || true
done < .env.local

echo "✅ Done! Check Vercel dashboard for verification."
