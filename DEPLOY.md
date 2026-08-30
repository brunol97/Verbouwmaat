# 🚀 Deploy Setup — Dual Pipeline (Dev + Prod)

Twee volledig gescheiden deploy pipelines:

| Branch | Supabase | Vercel | Doel |
|--------|----------|--------|------|
| `dev` | `ekzshymcaxaeoegleoyo` (dev) | Preview URL | Ontwikkelen & testen |
| `main` | `yzcwmaihkxfubtqatynt` (prod) | Productie URL | Live productie |

---

## Quick Start

```bash
# 1. GitHub secrets (eenmalig — lokaal draaien, niet in Codespace)
gh secret set SUPABASE_ACCESS_TOKEN --repo brunol97/Verbouwmaat
gh secret set SUPABASE_DB_PASSWORD --repo brunol97/Verbouwmaat
gh secret set SUPABASE_PROJECT_ID_DEV --repo brunol97/Verbouwmaat
gh secret set SUPABASE_PROJECT_ID_PROD --repo brunol97/Verbouwmaat

# 2. Vercel env vars per omgeving
./scripts/setup-vercel-env.sh preview   # dev branch
./scripts/setup-vercel-env.sh production # main branch

# 3. Push naar dev → auto deploy naar dev
#    Push naar main → auto deploy naar productie
```

---

## 1. Git Workflow

```bash
# Dagelijks ontwikkelen op dev branch
git checkout dev
git add . && git commit -m "feat: nieuwe feature"
git push origin dev
# → Automatische deploy naar dev omgeving

# Klaar voor productie
git checkout main
git merge dev
git push origin main
# → Automatische deploy naar productie omgeving
```

---

## 2. GitHub Secrets (via `gh` CLI, lokaal)

```bash
# Supabase Access Token (generiek voor alle projects)
echo "sbp_xxx" | gh secret set SUPABASE_ACCESS_TOKEN --repo brunol97/Verbouwmaat

# Supabase DB passwords (per project)
echo "dev_db_password" | gh secret set SUPABASE_DB_PASSWORD --repo brunol97/Verbouwmaat
echo "prod_db_password" | gh secret set SUPABASE_DB_PASSWORD_PROD --repo brunol97/Verbouwmaat

# Supabase Project IDs
echo "ekzshymcaxaeoegleoyo" | gh secret set SUPABASE_PROJECT_ID_DEV --repo brunol97/Verbouwmaat
echo "yzcwmaihkxfubtqatynt" | gh secret set SUPABASE_PROJECT_ID_PROD --repo brunol97/Verbouwmaat

# Vercel (optioneel — alleen als je de CLI workflow gebruikt)
echo "vercel_token" | gh secret set VERCEL_TOKEN --repo brunol97/Verbouwmaat
echo "team_lrBo3mgSHIjDbZ3ggPoGtgML" | gh secret set VERCEL_ORG_ID --repo brunol97/Verbouwmaat
echo "prj_Oyi56zstouXvfJT8krjZx1zVZns9" | gh secret set VERCEL_PROJECT_ID --repo brunol97/Verbouwmaat
```

**Waar haal je deze waardes?**

| Secret | Waarde | Bron |
|--------|--------|------|
| `SUPABASE_ACCESS_TOKEN` | `sbp_...` | [Supabase Dashboard](https://app.supabase.com/account/tokens) → Access Tokens |
| `SUPABASE_DB_PASSWORD` | wachtwoord | Dev project → Settings → Database → Database password |
| `SUPABASE_DB_PASSWORD_PROD` | wachtwoord | Prod project → Settings → Database → Database password |
| `SUPABASE_PROJECT_ID_DEV` | `ekzshymcaxaeoegleoyo` | Dev project URL: `https://[ID].supabase.co` |
| `SUPABASE_PROJECT_ID_PROD` | `yzcwmaihkxfubtqatynt` | Prod project URL: `https://[ID].supabase.co` |
| `VERCEL_TOKEN` | `vercel_token_...` | [Vercel Dashboard](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_...` | `cat .vercel/repo.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `prj_...` | `cat .vercel/repo.json` → `projects[0].id` |

---

## 3. Vercel Environment Variables (per omgeving)

```bash
# Dev environment (preview deploys, gebruikt bij dev branch)
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://ekzshymcaxaeoegleoyo.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview --yes

echo "sb_publishable_0q6JvqaheIpvTnG0JXHWYw_VUKdrcd2" | vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY preview --yes

# Prod environment (production deploys, gebruikt bij main branch)
echo "https://yzcwmaihkxfubtqatynt.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes

echo "sb_publishable_4j4UTmyI4A_7CY8PSPYTOA_4Daf2Li5" | vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production --yes
```

Of gebruik het script:

```bash
# Sync ALLE env vars uit .env.local naar Vercel (LET OP: je moet .env.local aanpassen voor de juiste omgeving!)
./scripts/setup-vercel-env.sh preview
./scripts/setup-vercel-env.sh production
```

---

## 4. Supabase Migrations (via CLI)

### Dev omgeving

```bash
# Link dev project
supabase link --project-ref ekzshymcaxaeoegleoyo

# Test migraties lokaal
supabase db reset

# Push naar dev
supabase db push
```

### Prod omgeving

```bash
# Link prod project
supabase link --project-ref yzcwmaihkxfubtqatynt

# ⚠️ Check eerst wat er zou gebeuren!
supabase db push --dry-run

# Push naar productie (alleen vanuit main branch!)
supabase db push
```

---

## 5. CI/CD Flow

### Push naar `dev` branch:

```
git push origin dev
    │
    ├──► Vercel Git Integration ──► Preview deploy (dev URL)
    │
    └──► GitHub Actions ──► Supabase Migrations ──► Dev DB update
```

### Push naar `main` branch:

```
git push origin main
    │
    ├──► Vercel Git Integration ──► Production deploy
    │
    └──► GitHub Actions ──► Supabase Migrations ──► Prod DB update
```

---

## 6. Supabase Auth Providers (Google OAuth)

**Dev:**
1. Google Cloud Console → OAuth 2.0 Client ID
2. Redirect URI: `https://ekzshymcaxaeoegleoyo.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Auth → Providers → Google → Client ID + Secret

**Prod:**
1. Google Cloud Console → Nieuwe OAuth 2.0 Client ID (of extra redirect URI)
2. Redirect URI: `https://yzcwmaihkxfubtqatynt.supabase.co/auth/v1/callback`
3. Supabase Dashboard (prod project) → Auth → Providers → Google

---

## 7. Resend E-mail Setup

**Dev:**
```bash
# Gebruik Resend test key (vrijwel gratis, mail vanaf @resend.dev)
echo "re_test_xxx" | vercel env add RESEND_API_KEY preview --yes
```

**Prod:**
```bash
# Gebruik Resend live key (verifieer domein: verbouwmaat.nl)
echo "re_live_xxx" | vercel env add RESEND_API_KEY production --yes
```

---

## 8. Environment Variabelen Overzicht

| Variable | Dev (`.env.local`) | Vercel Preview | Vercel Production |
|----------|-------------------|----------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | dev URL | dev URL | prod URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | dev key | dev key | prod key |
| `RESEND_API_KEY` | test key | test key | live key |
| `OPENCODE_API_KEY` / `OPENAI_API_KEY` | dev key | dev key | live key |
| `PROJECT_DOMAIN` | `verbouwmaat.nl` | `verbouwmaat.nl` | `verbouwmaat.nl` |
| `NEXT_PUBLIC_POSTHOG_KEY` | zelfde | zelfde | zelfde |

---

## 9. Troubleshooting

### Migrations falen in CI

```bash
# Check of de juiste project ID wordt gebruikt per branch
git branch  # check of je op dev of main zit
supabase projects list  # check of je aan het juiste project gelinkt bent
```

### Vercel deploy faalt

```bash
# Check of alle env vars gezet zijn
vercel env ls

# Check logs
vercel logs --all
```

### Verschillende Supabase project IDs per branch

De GitHub Action detecteert automatisch de branch en gebruikt de juiste `SUPABASE_PROJECT_ID_DEV` of `SUPABASE_PROJECT_ID_PROD`. Dit staat in `.github/workflows/supabase-migrations.yml`.
