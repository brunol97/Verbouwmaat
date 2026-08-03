# Factory Implementatie Protocol

> Combinatie van de Software Factory tech stack + Matt Pocock's implementatie werkwijze.
> Gebruik dit in de Software Factory door te prompten binnen een context bestand.

## Context

Je implementeert een feature voor een AI SaaS gebouwd op:
- Next.js 15 App Router (React Server Components)
- TypeScript (strict mode)
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage)
- PostHog (product analytics)
- Vercel (Edge/Serverless)

## Implementatie Protocol (Matt Pocock stijl)

### Stap 1: Begrijp het probleem
Lees de user story en acceptance criteria volledig. Stel vragen als iets vaag is.

### Stap 2: Verken de codebase
- Check `src/app/` — welke routes bestaan er al?
- Check `src/lib/` — welke utilities zijn beschikbaar?
- Check `src/components/` — welke UI patterns worden gebruikt?
- Check `src/lib/config.ts` — hoe werkt environment switching?

### Stap 3: Maak een plan
Beschrijf kort:
1. Welke files ga je aanmaken / wijzigen?
2. Welke Supabase tabellen heb je nodig?
3. Welke PostHog events moeten worden getracked?
4. Is dit een Server Component of Client Component?

Wacht op goedkeuring van de gebruiker voordat je begint (bevestigingsprompt).

### Stap 4: Implementeer iteratief
- Begin met de data layer (Supabase schema / queries)
- Bouw dan de Server Component
- Voeg Client Component toe als interactiviteit nodig is
- Voeg Server Action toe voor mutations
- Voeg PostHog tracking toe
- Test na elke significante stap

### Stap 5: TypeScript strict checks
- Geen `any` types
- Geen `@ts-ignore`
- Alle props moeten getyped zijn
- `npx tsc --noEmit` moet slagen

### Stap 6: Build test
```bash
npm run build
```
Moet slagen zonder errors.

### Stap 7: Review jezelf
Loop door deze checklist:
- [ ] Server Component default? Client alleen voor interactiviteit?
- [ ] PostHog event op elke gebruikersactie?
- [ ] Supabase RLS policies correct?
- [ ] Error states afgehandeld?
- [ ] Mobile responsive?
- [ ] Geen nieuwe dependencies toegevoegd zonder goedkeuring?

## Specifieke regels voor deze stack

### Server Components
- Data fetching via `await` direct in de component
- Geen `useEffect` voor data loading
- Props doorgeven naar child components

### Client Components
- Alleen als er state, effects, of browser APIs nodig zijn
- Expliciet `"use client"` directive bovenaan
- Geen data fetching in useEffect (dat doet de Server Component)

### Server Actions
- Files eindigen op `actions.ts` in de route directory
- `"use server"` bovenaan
- Input validatie met TypeScript types
- Revalidate path na mutations

### PostHog Tracking
- **Client:** `getPostHogClient().capture("event_name", { ...getPostHogProperties(), extra: "data" })`
- **Server:** `getPostHogServer().capture({ distinctId: user.id, event: "event_name", properties: { ...getPostHogProperties() } })`
- Altijd `getPostHogProperties()` meegeven voor environment tagging

### Supabase
- Nieuwe tabellen = RLS policies verplicht
- Row Level Security enabled by default
- Gebruikers zien alleen eigen data (user_id = auth.uid())
- Migrations via Supabase CLI

### Environment
- Gebruik `ENV` uit `src/lib/config.ts`
- Nooit hardcoded URLs of keys
- `process.env.VERCEL_ENV` detecteert preview vs production
