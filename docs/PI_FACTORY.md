# 🏭 Pi Software Factory — Codespaces Native

> **Met Matt Pocock skills integratie.** Pi draait in jouw Codespace, GitHub Actions doet het papierwerk, en Matt's werkwijze zorgt voor kwaliteit.

## Concept

1. **Jij maakt een GitHub Issue** aan met het `pi-implement` label
2. **GitHub Action** genereert een context bestand (`.pi-factory/<nummer>.md`)
3. **Jij draait Pi** in je Codespace met dat context bestand
4. **Pi implementeert** de feature — met Matt Pocock's protocol als leidraad
5. **Jij commit + push** (via `/done` of handmatig)
6. **Vercel preview** deployt automatisch
7. **Pull Request** → review (optioneel met `/review` + Matt's code-review) → merge → productie

## Diagram

```
Jij maakt Issue (template + label: pi-implement)
        │
        ▼
GitHub Action: pi-factory.yml
   ├─ Genereert .pi-factory/123.md (incl. Matt skill hints)
   ├─ Maakt feature branch
   ├─ Commit + push context
   └─ Post comment op issue met instructie
        │
        ▼
Jij in Codespace:
   git checkout pi-factory/123-...
   pi --system-prompt .pi-factory/123.md
        │
        ▼
Pi implementeert met Matt's werkwijze:
   ├─ /skill:implement (Matt's protocol)
   ├─ Begrijp → Verken → Plan → Bouw → Test → Review
   └─ Of gebruik /skill:tdd voor complexe logica
        │
        ▼
Jij runt /done in Pi
   ├─ git add -A
   ├─ Commit + TESTPLAN.md
   └─ Push
        │
        ▼
Vercel Preview Deploy (o)
        │
        ▼
PR maken → optioneel: /review (Matt code-review)
        │
        ▼
Merge naar main → Vercel Productie Deploy (p)
        │
        ▼
Notificatie (Slack/Discord — optioneel)
```

## Matt Pocock Skills Integratie

Je hebt Matt Pocock's skills geïnstalleerd (`skills add mattpocock/skills`). Deze zijn prompt templates die Pi's werkwijze structureren. De factory integreert ze op drie niveaus:

### 1. In de gegenereerde context (automatisch)
Elk `.pi-factory/<issue>.md` bevat:
```markdown
## Matt Pocock skills die je kan inzetten
- `/skill:implement` — Matt's implementatie protocol (aanbevolen)
- `/skill:tdd` — als de feature complexe logica heeft
- `/skill:code-review` — na implementatie, review je eigen code
- `/skill:to-spec` — als de acceptance criteria vaag zijn
```

### 2. Project-local factory skills (`.pi/skills/`)
We hebben twee skills aangemaakt die Matt's werkwijze combineren met onze tech stack:

| Skill | Bestand | Wanneer te gebruiken |
|-------|---------|---------------------|
| **factory-implement** | `.pi/skills/factory-implement.md` | Standaard protocol voor elke feature. Combinatie van Matt's implement + onze stack regels. |
| **factory-review** | `.pi/skills/factory-review.md` | Review template met stack-specifieke anti-patterns. |

### 3. Factory-helper extension commands
De Pi extensie `.pi/extensions/factory-helper.ts` registreert:

| Command | Wat | Matt skill |
|---------|-----|------------|
| `/factory` | Toont alle klaarstaande issues | — |
| `/implement` | Laadt context + suggestie voor `/skill:implement` | `implement` |
| `/commit` | Snelle git commit + push | — |
| `/done` | Commit + TESTPLAN.md + push (klaar voor PR) | — |
| `/review` | Review je eigen code met diff + review template | `code-review` |

## Stap-voor-stap handleiding

### 1. Een feature aanvragen

- Ga naar **Issues → New Issue → Pi User Story**
- Vul de template in: User Story, Acceptance Criteria, extra context
- Label `pi-implement` staat al standaard → triggerd de factory

### 2. Wacht op context (~30s)

De Action maakt:
- Feature branch: `pi-factory/123-titel-van-issue`
- Context bestand: `.pi-factory/123.md` (met Matt skill hints)
- Comment op issue met instructies

### 3. Open Codespace en start Pi

```bash
# Zorg dat je op de juiste branch zit
git fetch
git checkout pi-factory/123-titel-van-issue

# Start Pi met context
pi --system-prompt .pi-factory/123.md
```

Binnen Pi:
```
# Optie A — gebruik Matt's implement skill (aanbevolen)
/skill:implement
# Daarna: implementeer issue 123

# Optie B — direct implementeren
implementeer issue 123 volgens de geladen context
```

### 4. Pi implementeert met Matt's werkwijze

Pi krijgt nu:
- De volledige user story + acceptance criteria
- **Matt's implementatie protocol**: Begrijp → Verken → Plan → Bouw → Test → Review
- Strict tech stack regels (Next.js, Supabase, PostHog)
- TypeScript strict mode requirements
- File conventies en environment awareness

Pi vraagt expliciet om goedkeuring voor het plan voordat het begint (Matt's werkwijze).

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

Of stap-voor-stap:
```
/commit  # commit + push
/review  # optioneel: review je eigen code met Matt's werkwijze
```

### 6. Pull Request + optionele review

Ga naar GitHub en maak een PR van `pi-factory/123-...` → `main`.

- Vercel deployt automatisch een preview
- De `pr-testplan.yml` Action post een test checklist
- **Optioneel:** voor je merge, run in je Codespace:
  ```
  git checkout main
git pull
  git checkout pi-factory/123-...
  pi --system-prompt .pi/skills/factory-review.md
  /review
  # Review de PR diff met Matt's code-review checklist
  ```

### 7. Merge en deploy

- Merge PR → `main` → Vercel productie deploy
- PostHog events komen binnen in productie

---

## Environments: o vs p

### Vercel (gratis)

| Omgeving | Branch | URL | Env vars |
|----------|--------|-----|----------|
| **Preview (o)** | PR / niet-main | `*.vercel.app` (uniek per deploy) | Preview variables |
| **Productie (p)** | `main` | Custom domain of `*.vercel.app` | Production variables |

### Supabase (gratis)

| Omgeving | Project | Hoe aanmaken |
|----------|---------|--------------|
| **Preview (o)** | `jouwapp-dev` | Nieuw project in Supabase dashboard |
| **Productie (p)** | `jouwapp-prod` | Nieuw project in Supabase dashboard |

**Free tier:** 500MB per project. Twee projecten = 1GB totaal. Beide gratis.

De app switcht automatisch via `src/lib/config.ts` op basis van `VERCEL_ENV`.

### PostHog (gratis)

Één project. Filter op `environment` property:
- `environment: "preview"` (o)
- `environment: "production"` (p)

---

## Configuratie Checklist

### Accounts aanmaken
- [ ] Supabase: `jouwapp-dev` + `jouwapp-prod`
- [ ] PostHog: 1 project
- [ ] Vercel: 1 project gekoppeld aan GitHub repo
- [ ] GitHub repo: secrets instellen (zie hieronder)

### Vercel Environment Variables

| Variabele | Preview (o) | Production (p) |
|-----------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | dev URL | prod URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev key | prod key |
| `SUPABASE_URL_PROD` | prod URL | prod URL |
| `SUPABASE_ANON_KEY_PROD` | prod key | prod key |
| `NEXT_PUBLIC_POSTHOG_KEY` | zelfde | zelfde |

### GitHub Secrets

Ga naar **Settings → Secrets and variables → Actions**:

| Secret | Waarde |
|--------|--------|
| `SUPABASE_URL_PROD` | Prod Supabase URL |
| `SUPABASE_ANON_KEY_PROD` | Prod anon key |
| `SLACK_WEBHOOK_URL` | *(optioneel)* |
| `DISCORD_WEBHOOK_URL` | *(optioneel)* |

> AI API keys zijn **niet** nodig in GitHub Actions — Pi draait in jouw Codespace.

---

## Matt Pocock Skills — Welke wanneer?

| Skill | Wanneer | Hoe te activeren |
|-------|---------|-----------------|
| **`implement`** | **Standaard** voor elke feature implementatie | `/skill:implement` binnen Pi sessie |
| **`tdd`** | Als de feature complexe business logica heeft | `/skill:tdd` → schrijf tests eerst |
| **`code-review`** | Na implementatie, voor je PR maakt | `/skill:code-review` → review eigen output |
| **`to-spec`** | Als acceptance criteria vaag zijn | `/skill:to-spec` → break down naar specs |
| **`handoff`** | Als je werk overdraagt aan een ander | `/skill:handoff` |
| **`ask-matt`** | Als je vragen hebt over de werkwijze | `/skill:ask-matt` |

**Tip:** De `/implement` command van de factory-helper extension laadt automatisch het juiste context bestand en suggereert de juiste Matt skill.

---

## Troubleshooting

### "Geen factory context gevonden"
- Check of `.pi-factory/*.md` bestanden bestaan
- `git branch -a` → zit je op de juiste `pi-factory/*` branch?
- `/reload` in Pi om de factory-helper extensie te herladen

### "Matt's skills werken niet"
- Check installatie: `ls ~/.pi/agent/skills/` of waar je ze hebt geïnstalleerd
- De skills zijn prompt templates — ze moeten beschikbaar zijn als `/skill:<naam>`
- Als ze niet werken, gebruik het project-local `.pi/skills/factory-implement.md`

### Pi commit faalt
- `/commit` zet automatisch `user.name` en `user.email`
- Check `git status` voor conflicts

### Vercel preview deployt niet
- PR moet bestaan (Vercel deployt soms niet zonder PR)
- Check Vercel Dashboard → Deployments

---

## Free Tier Limieten

| Service | Free Tier | Eerste limiet |
|---------|-----------|---------------|
| **GitHub Codespaces** | 120 uur/maand (Pro), 60 uur (Free) | Uren per maand |
| **Vercel** | Hobby: unlimited projects, 100GB bandwidth | 60s function timeout |
| **Supabase** | 500MB per project | 500MB DB |
| **PostHog** | 1M events/maand | 1M events |
| **Matt Pocock skills** | Gratis (open source) | — |

Een implementatie-sessie van 30 minuten ≈ $0.10 (Codespaces 2-core).

---

## Bestandsoverzicht

| File | Doel |
|------|------|
| `.github/workflows/pi-factory.yml` | Genereert context + post instructie |
| `.github/workflows/pr-testplan.yml` | Post test checklist op factory PRs |
| `.github/ISSUE_TEMPLATE/pi-story.yml` | Issue template met AC + stack checklist |
| `.pi/extensions/factory-helper.ts` | Pi commands: /factory, /implement, /commit, /done, /review |
| `.pi/skills/factory-implement.md` | Project-local implementatie protocol (Matt + stack) |
| `.pi/skills/factory-review.md` | Project-local review protocol (Matt + stack) |
| `.pi-factory/*.md` | Gegenereerde context per issue |
| `src/lib/config.ts` | Environment switching (o/p) |
