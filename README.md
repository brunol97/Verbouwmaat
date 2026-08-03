# AI SaaS Starter — 🏭 Software Factory

Hello world scaffold met **Next.js**, **Supabase**, **Vercel**, en **PostHog**. Gebouwd als een software factory: issues in GitHub → Pi implementeert → preview deploy → notificatie.

## Wat is inbegrepen

| Tool | Rol | Locatie |
|------|-----|----------|
| **Next.js 15** (App Router) | Framework + API routes | `src/app/` |
| **Supabase** | Database + Auth (dev + prod) | `src/lib/supabase/` |
| **PostHog** | Product analytics (met environment tracking) | `src/lib/posthog/` + `src/components/PostHogProvider.tsx` |
| **Vercel** | Hosting / Edge / Preview deploys | `vercel.json` |
| **Pi Software Factory** | GitHub Actions voor automatische implementatie | `.github/workflows/` |

## Quick Start

### 1. Dependencies installeren

```bash
npm install
```

### 2. Environment variables configureren

Kopieer `.env.example` naar `.env.local` en vul in:

```bash
cp .env.example .env.local
```

**Benodigde accounts aanmaken:**
- **Supabase** (×2 projecten): [supabase.com](https://supabase.com)
  - `jouwapp-dev` → vul `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `jouwapp-prod` → vul `SUPABASE_URL_PROD` + `SUPABASE_ANON_KEY_PROD`
- **PostHog** (×1 project): [posthog.com](https://posthog.com)
  - Vul `NEXT_PUBLIC_POSTHOG_KEY`
- **Vercel**: Environment vars instellen per environment (zie docs)

### 3. Lokaal draaien

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Je ziet een environment badge (lokaal/preview/productie).

### 4. Deployen naar Vercel

```bash
npm i -g vercel
vercel
```

Of push naar GitHub en importeer de repo op [vercel.com](https://vercel.com).

## 🏭 Software Factory gebruiken

### Een feature aanvragen

1. Ga naar **Issues → New Issue → Pi User Story**
2. Beschrijf de user story en acceptance criteria
3. Label `pi-implement` staat al aan — bij aanmaken triggerd de factory
4. De GitHub Action maakt automatisch een PR met testplan
5. Vercel preview URL verschijnt in de PR
6. Test, review, merge → productie deploy

### Hoe het werkt achter de schermen

```
GitHub Issue (label: pi-implement)
    │
    ▼
GitHub Action: pi-factory.yml
    ├─ Maakt feature branch
    ├─ Genereert Pi context prompt
    ├─ (Optioneel) Draait Pi in headless mode
    ├─ Maakt Pull Request + TESTPLAN.md
    └─ Post link op het originele issue
    │
    ▼
Vercel Preview Deploy (o)
    │
    ▼
Review → Merge naar main
    │
    ▼
Vercel Productie Deploy (p)
    │
    ▼
Notificatie (Slack/Discord)
```

### Environments: o vs p

| Omgeving | Branch | Supabase | Vercel |
|----------|--------|----------|--------|
| **Preview (o)** | PR / feature branch | `jouwapp-dev` | Preview URL |
| **Productie (p)** | `main` | `jouwapp-prod` | Custom domain |

PostHog gebruikt één project — je filtert op `environment` property.

## Project structuur

```
src/
  app/
    layout.tsx        # Root layout met PostHog provider
    page.tsx          # Hello world + environment badge
    globals.css       # Tailwind base styles
  lib/
    config.ts         # Environment-aware config (o/p switching)
    supabase/
      client.ts       # Browser Supabase client
      server.ts       # Server Supabase client
      middleware.ts   # Session refresh middleware
    posthog/
      client.ts       # Browser PostHog client
      server.ts       # Server PostHog client
  components/
    PostHogProvider.tsx  # Pageview tracking + environment props
  middleware.ts        # Next.js middleware (auth session refresh)
.github/
  workflows/
    pi-factory.yml     # Software factory action
    deploy-notify.yml  # Deploy notificaties
  ISSUE_TEMPLATE/
    pi-story.yml       # Issue template voor Pi features
docs/
  PI_FACTORY.md       # Uitgebreide factory documentatie
```

## Volgende stappen

1. **Supabase projecten aanmaken**: dev + prod (zie `docs/PI_FACTORY.md`)
2. **Vercel env vars**: configureer per environment
3. **GitHub Secrets**: `SUPABASE_URL_PROD`, `ANTHROPIC_API_KEY`, etc.
4. **PostHog dashboard**: filter op `environment: production`
5. **AI SDK toevoegen**: `npm i ai @ai-sdk/openai` voor streaming chat
6. **Auth UI**: `@supabase/auth-ui-react` of Clerk

## Free tier limieten (waar je als eerste tegenaan loopt)

| Service | Free Tier | Eerste limiet |
|---------|-----------|---------------|
| **Vercel** | Hobby: unlimited projects, 100GB bandwidth | 60s serverless timeout |
| **Supabase** | 500MB per project, 2GB storage | 500MB DB (×2 = 1GB totaal) |
| **PostHog** | 1M events/maand | 1M events/maand |
| **GitHub Actions** | 2,000 minuten/maand (public repos = free) | 5-min timeout per run |

---

📖 Lees `docs/PI_FACTORY.md` voor de volledige setup handleiding.
