#!/bin/bash
# Setup Supabase project linking and push migrations via CLI
# Usage: ./scripts/setup-supabase.sh

set -e

echo "🗄️  Supabase Setup via CLI"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Install with:"
  echo "   npm i -g supabase"
  exit 1
fi

# Get project ID from config or prompt
PROJECT_ID=$(grep "project_id" supabase/config.toml | head -1 | sed 's/.*= *//;s/"//g')

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id" ]; then
  read -p "Enter your Supabase project ID (e.g. ekzshymcaxaeoegleoyo): " PROJECT_ID
  sed -i "s/project_id = .*/project_id = \"$PROJECT_ID\"/" supabase/config.toml
fi

echo "Project ID: $PROJECT_ID"
echo ""

# Login check
echo "Checking Supabase login..."
if ! supabase projects list &> /dev/null; then
  echo "❌ Not logged in. Run: supabase login"
  exit 1
fi

# Link project
echo "🔗 Linking project..."
supabase link --project-ref "$PROJECT_ID"

# Push migrations
echo ""
echo "📤 Pushing migrations..."
read -p "Push migrations to $PROJECT_ID? (y/N) " CONFIRM
if [[ $CONFIRM =~ ^[Yy]$ ]]; then
  supabase db push
  echo ""
  echo "✅ Migrations pushed!"
else
  echo "Skipped. Run 'supabase db push' manually when ready."
fi

echo ""
echo "📝 Next steps:"
echo "   1. Set up Google OAuth in Supabase Dashboard → Auth → Providers → Google"
echo "   2. Update RESEND_API_KEY in Vercel env vars"
echo "   3. Test the build: npm run build"
