# 🏭 Pi Software Factory

> **Codespaces-native.** Pi draait in jouw Codespace, GitHub Actions doet alleen het papierwerk.

## Concept

1. **Jij maakt een GitHub Issue** aan met het `pi-implement` label
2. **GitHub Action** genereert een context bestand (`.pi-factory/<nummer>.md`) en post instructies
3. **Jij draait Pi** in je Codespace met dat context bestand
4. **Pi implementeert** de feature binnen de tech stack
5. **Jij commit + push** (of gebruik `/commit` / `/done` commands)
6. **Vercel preview** deployt automatisch de branch
7. **Pull Request** → review → merge → productie deploy

## Diagram

```
Jij maakt Issue (template + label: pi-implement)
        │
        ▼
GitHub Action: pi-factory.yml
   ├─ Genereert .pi-factory/123.md
   ├─ Maakt feature branch
   ├─ Commit + push context
   └─ Post comment op issue met instructie
        │
        ▼
Jij opent Codespace (of lokaal)
   ├─ Pi extension "factory-helper" detecteert context
   ├─ Notificatie: "🏭 Factory context gevonden"
   └─ Run: pi --system-prompt .pi-factory/123.md
        │
        ▼
Pi implementeert feature
   ├─ Leest user story + acceptance criteria
   ├─ Codeert binnen Next.js/Supabase/PostHog stack
   ├─ Volgt architectuur principes
   └─ Gebruikt bash/write/edit tools
        │
        ▼
Jij runt /commit of /done in Pi
   ├─ /commit → git add -A → commit → push
   ├─ /done   → commit + TESTPLAN.md + push
   └─ Of handmatig: git add -A && git commit -m "..." && git push
        │
        ▼
Vercel Preview Deploy (o)
   └─ URL verschijnt automatisch in PR
        │
        ▼
Pull Request → Review → Merge naar main
        │
        ▼
Vercel Productie Deploy (p)
   └─ Notificatie via Slack/Discord (optioneel)
```

## Waarom Codespaces?

| Aspect | GitHub Actions CI | Codespace (huidig) |
|--------|-------------------|--------------------|
| Pi draait in | Container zonder TUI | Jouw ontwikkelomgeving |
| Tools beschikbaar | Beperkt | Alle tools (bash, write, edit, read) |
| Interactie | Batch / headless | Interactief, iteratief |
| Iteraties | 1 run = 1 kans | Jij kan sturen, corrigeren |
| Feedback loop | Minuten | Seconden |
| Kwaliteit | Gemiddeld | Hoog (jij bent erbij) |

## Hoe gebruik je het

### 1. Een feature aanvragen

- Ga naar **Issues → New Issue → Pi User Story**
- Vul de template in: User Story, Acceptance Criteria, extra context
- Label `pi-implement` staat al standaard aan → triggerd de factory

### 2. Wacht op context (30 seconden)

De Action maakt:
- Een feature branch: `pi-factory/123-titel-van-issue`
- Een context bestand: `.pi-factory/123.md`
- Een comment op je issue met instructies

### 3. Open Codespace en start Pi

In je Codespace terminal:

```bash
# Zorg dat je op de juiste branch zit
git fetch
git checkout pi-factory/123-titel-van-issue

# Start Pi met context
pi --system-prompt .pi-factory/123.md
```

Of, als je al in een Pi sessie zit:
```
/reload
# Pi laadt automatisch de project-local factory-helper extension
# Die toont: "🏭 Factory context gevonden: #123"
# Prompt met: implementeer issue 123
```

### 4. Pi implementeert

Pi krijgt nu:
- De volledige user story en acceptance criteria
- Strict tech stack regels (Next.js, Supabase, PostHog)
- Architectuur principes (Server Components, RLS, tracking)
- File conventies en environment awareness
- PostHog en Supabase checklists

Pi gebruikt `write`, `edit`, `bash` om de feature te bouwen.

### 5. Commit en push via Pi commands

Binnen je Pi sessie:

```
/done
```

Dit doet automatisch:
- `git add -A`
- `git commit -m "🏭 [PI-123] Implementatie + TESTPLAN"`
- Genereert `TESTPLAN.md`
- `git push origin pi-factory/123-titel-van-issue`

Of handmatig:
```bash
git add -A
git commit -m "🏭 [PI-123] Titel van issue"
git push
```

### 6. Pull Request maken

Ga naar GitHub en maak een PR van `pi-factory/123-...` → `main`.

- Vercel deployt automatisch een preview
- De `pr-testplan.yml` Action post een test checklist comment
- Review, test op preview URL, merge

---

## Environments: o vs p

### Vercel (gratis)

| Omgeving | Branch | URL | Env vars |
|----------|--------|-----|----------|
| **Preview (o)** | PR / niet-main | `*.vercel.app` (uniek per deploy) | Preview variables |
| **Productie (p)** | `main` | Custom domain of `*.vercel.app` | Production variables |

**Instellen in Vercel Dashboard:**
- Project → Settings → Environment Variables
- Zet dev Supabase keys onder **Preview**
- Zet prod Supabase keys onder **Production**

### Supabase (gratis)

| Omgeving | Project | Hoe aanmaken |
|----------|---------|--------------|
| **Preview (o)** | `jouwapp-dev` | Nieuw project in Supabase dashboard |
| **Productie (p)** | `jouwapp-prod` | Nieuw project in Supabase dashboard |

⚠️ **Free tier:** 500MB per project. Twee projecten = 2 × 500MB = 1GB totaal. Beide gratis.

De app switcht automatisch via `src/lib/config.ts` op basis van `VERCEL_ENV`.

### PostHog (gratis)

| Omgeving | Aanpak |
|----------|--------|
| **Alles** | Één project, `environment` property in events |

Filter in PostHog dashboards op:
- `properties.environment = "preview"` (o)
- `properties.environment = "production"` (p)

---

## Factory Commands (Pi extensie)

De project-local extensie `.pi/extensions/factory-helper.ts` registreert:

| Command | Wat het doet |
|---------|-------------|
| `/factory` | Toont alle klaarstaande `.pi-factory/*.md` context bestanden. Laadt geselecteerde in editor. |
| `/commit` | `git add -A` → commit met message → push naar huidige branch. Handig na Pi implementatie. |
| `/done` | Commit + genereert `TESTPLAN.md` + push. Klaar voor PR. |

De extensie laadt automatisch bij session start en toont een widget als er factory contexts klaar staan.

---

## Secrets & Configuratie

### GitHub Secrets (optioneel — alleen voor deploy notificaties)

Ga naar **Settings → Secrets and variables → Actions**:

| Secret | Waarde | Voor |
|--------|--------|------|
| `SUPABASE_URL_PROD` | Prod Supabase URL | Productie builds |
| `SUPABASE_ANON_KEY_PROD` | Prod anon key | Productie builds |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | Deploy notificaties |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | Deploy notificaties |

> **AI API keys zijn NIET nodig in GitHub Actions** — Pi draait in jouw Codespace, niet in CI.

### Vercel Environment Variables

| Variabele | Preview (o) | Production (p) |
|-----------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | dev URL | prod URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev key | prod key |
| `SUPABASE_URL_PROD` | prod URL (referentie) | prod URL |
| `SUPABASE_ANON_KEY_PROD` | prod key (referentie) | prod key |
| `NEXT_PUBLIC_POSTHOG_KEY` | zelfde | zelfde |

---

## Supabase Projecten Opzetten

### 1. Dev project (jouwapp-dev)
```bash
# In Supabase dashboard:
# - New Project → naam: jouwapp-dev
# - Settings → API → kopieer Project URL + anon key
# - Plak in Vercel Preview environment variables
```

### 2. Prod project (jouwapp-prod)
```bash
# - New Project → naam: jouwapp-prod
# - Kopieer URL + key
# - Plak in Vercel Production environment variables + GitHub Secrets
```

### 3. Schema synchronisatie
```bash
# Lokaal (in Codespace), met Supabase CLI:
supabase login
supabase link --project-ref <dev-ref>
supabase db dump -f schema.sql

supabase link --project-ref <prod-ref>
supabase db reset
supabase db push
```

---

## PostHog Setup

1. Maak één project aan op [posthog.com](https://posthog.com)
2. Kopieer project API key naar **alle** Vercel environments (zelfde key)
3. Events worden automatisch getagd met `environment` via `src/lib/config.ts`
4. Filter in PostHog:
   - Dev events: `environment = "development"`
   - Preview events: `environment = "preview"`
   - Prod events: `environment = "production"`

---

## Troubleshooting

### "Geen factory context gevonden"
- Check of `.pi-factory/` bestaat en `.md` files bevat
- Zorg dat je op de juiste branch zit (`git branch -a`)
- Run `/reload` in Pi om de factory-helper extensie te herladen

### "Pi commit faalt"
- Zorg dat `git config user.name` en `user.email` zijn gezet in Codespace
- De `/commit` command doet dit automatisch als het een Pi-factory commit is

### Vercel preview deployt niet
- Check of de branch een PR heeft (Vercel deployt branches zonder PR soms niet)
- Check Vercel Dashboard → Deployments voor errors

---

## Free Tier Limieten (realistisch)

| Service | Free Tier | Eerste limiet die je raakt |
|---------|-----------|---------------------------|
| **GitHub Codespaces** | 120 uur/maand (Pro), 60 uur (Free) | Uren per maand |
| **Vercel** | Hobby: unlimited projects, 100GB bandwidth | 60s function timeout |
| **Supabase** | 500MB per project, 2GB storage | 500MB DB per project |
| **PostHog** | 1M events/maand | 1M events |
| **GitHub Actions** | 2,000 min/maand (private), unlimited (public) | n.v.t. voor deze workflow |

Codespaces is de enige kostenpost hier. Voor intensief gebruik: $0.18/uur (2-core) of $0.36/uur (4-core). Een implementatie-sessie van 30 minuten = ~$0.10.
