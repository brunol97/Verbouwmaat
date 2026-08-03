# 🏭 Pi Software Factory

## Concept
1. Je maakt een GitHub Issue aan met het `pi-implement` label
2. De GitHub Action `pi-factory.yml` triggered automatisch
3. De Action maakt een feature branch + PR scaffold
4. Een Pi context prompt wordt gegenereerd op basis van de issue
5. Preview deploy wordt automatisch aangemaakt door Vercel
6. Notificatie wordt gestuurd met testinstructies

## Hoe gebruik je het

### 1. Issue aanmaken
- Klik "New Issue" → kies "Pi User Story"
- Vul User Story, Acceptance Criteria en extra context in
- Label `pi-implement` wordt automatisch toegevoegd

### 2. Pi laat het implementeren
Er zijn twee realistische modi:

#### Modus A: Pi in CI (autonoom — experimenteel)
De workflow draait Pi in een headless container met de issue als prompt. Pi gebruikt `write`, `edit`, en `bash` tools om code te wijzigen. Dit vereist:
- API keys als GitHub Secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- Pi geïnstalleerd in de runner (`npm i -g @earendil-works/pi-coding-agent`)
- Non-interactieve mode (`--print` of `--json`)

**Op dit moment is Pi primair ontworpen voor interactief gebruik.** Volledig autonome CI-runs zijn mogelijk maar vereisen tuning.

#### Modus B: Pi context genereren (aanbevolen)
De workflow:
1. Genereert `.pi-factory-context.md` met issue + stack conventies
2. Maakt feature branch en lege PR
3. Post comment op issue: "Draai Pi met dit context bestand"
4. Jij draait lokaal: `pi -e .pi/context.md --system-prompt .pi-factory-context.md`
5. Pi commit en pusht naar de branch
6. PR wordt automatisch geüpdatet

### 3. Review & Merge
- Vercel preview URL is zichtbaar in de PR
- Test volgens het automatisch gegenereerde testplan
- PostHog events checken in dev project
- Merge naar main → productie deploy via Vercel

## Environments (o = preview, p = productie)

### Vercel
| Omgeving | Branch | URL | Env vars |
|----------|--------|-----|----------|
| **Preview (o)** | PR / niet-main | `*.vercel.app` (uniek per deploy) | Preview variables |
| **Productie (p)** | `main` | Custom domain of `*.vercel.app` | Production variables |

### Supabase
| Omgeving | Project | Hoe aanmaken |
|----------|---------|--------------|
| **Preview (o)** | `jouwapp-dev` | Apart project in Supabase dashboard |
| **Productie (p)** | `jouwapp-prod` | Apart project in Supabase dashboard |

⚠️ **Supabase free tier:** 500MB per project. Twee projecten = 2 × 500MB = 1GB totaal. Gratis.

### PostHog
| Omgeving | Aanpak |
|----------|--------|
| **Alles** | Één project, `environment` property in events |

Je kan filteren op `environment: preview` vs `environment: production` in PostHog dashboards.

## Secrets die je moet configureren in GitHub

Ga naar **Settings → Secrets and variables → Actions**:

| Secret | Waarde | Voor |
|--------|--------|------|
| `SUPABASE_URL_PROD` | Productie Supabase URL | Prod database |
| `SUPABASE_ANON_KEY_PROD` | Productie anon key | Prod database |
| `OPENAI_API_KEY` | OpenAI API key | Pi CI runs |
| `ANTHROPIC_API_KEY` | Anthropic API key | Pi CI runs |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | Deploy notificaties |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | Deploy notificaties |

## Configuratie in Vercel

Ga naar **Project Settings → Environment Variables**:

### Production
- `NEXT_PUBLIC_SUPABASE_URL` → prod URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → prod key
- `SUPABASE_URL_PROD` → prod URL
- `SUPABASE_ANON_KEY_PROD` → prod key

### Preview
- `NEXT_PUBLIC_SUPABASE_URL` → dev URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → dev key
- `SUPABASE_URL_PROD` → prod URL (voor referentie)
- `SUPABASE_ANON_KEY_PROD` → prod key (voor referentie)

## Supabase projecten opzetten

### 1. Dev project aanmaken
```bash
# Maak project aan in Supabase dashboard (gratis)
# Kies een naam: jouwapp-dev
# Kopieer URL en anon key naar Vercel Preview env vars
```

### 2. Prod project aanmaken
```bash
# Maak tweede project aan: jouwapp-prod
# Kopieer URL en anon key naar Vercel Production env vars + GitHub Secrets
```

### 3. Database sync (handmatig)
```bash
# Lokaal, met Supabase CLI:
supabase link --project-ref <dev-ref>
supabase db dump -f schema.sql

supabase link --project-ref <prod-ref>
supabase db reset
supabase db push
```

## PostHog setup

1. Maak één project aan op [posthog.com](https://posthog.com)
2. Kopieer project API key naar Vercel (alle environments)
3. Events worden automatisch getagd met `environment` property via `src/lib/config.ts`

## Testplan workflow

Elke Pi-factory PR bevat een `TESTPLAN.md` met:
1. Preview deploy URL
2. Acceptance criteria checklist
3. PostHog event verificatie
4. Mobiele responsive check
5. Error state check

Na merge wordt automatisch een deploy notificatie gestuurd.
