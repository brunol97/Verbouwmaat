# Factory Code Review Protocol

> Matt Pocock's code-review werkwijze aangepast voor de Software Factory tech stack.

## Review Context

Je reviewt code voor een Next.js + Supabase + PostHog project.
De code is geschreven door een AI assistant (Pi) en moet worden gecontroleerd op:
- TypeScript strictheid
- Architectuur principes
- Tech stack naleving
- Kwaliteit

## Review Protocol

### 1. Types & TypeScript
- [ ] Geen `any` types gebruikt?
- [ ] Geen `@ts-ignore` comments?
- [ ] Alle functie parameters getyped?
- [ ] Return types expliciet waar nodig?
- [ ] `npx tsc --noEmit` slaagt?

### 2. Component Architectuur
- [ ] Server Components als default?
- [ ] Client components alleen met goede reden (state, effects, browser API)?
- [ ] Geen data fetching in Client Component useEffect?
- [ ] Props correct doorgegeven en getyped?
- [ ] Geen prop drilling > 2 niveaus (context of compositie overwegen)?

### 3. Data & Backend
- [ ] Server Actions gebruikt voor mutations (geen API routes zonder reden)?
- [ ] Supabase queries in Server Components?
- [ ] RLS policies aanwezig voor nieuwe tabellen?
- [ ] Input validatie in Server Actions?
- [ ] Geen secrets in client-side code?

### 4. Tracking & Analytics
- [ ] PostHog events op significante gebruikersacties?
- [ ] `getPostHogProperties()` meegegeven voor environment tagging?
- [ ] Server-side tracking bij data mutations?
- [ ] Geen PII in event properties?

### 5. UI & UX
- [ ] Tailwind classes gebruikt (geen inline styles)?
- [ ] Mobile responsive (sm:, md:, lg: breakpoints)?
- [ ] Loading states aanwezig?
- [ ] Error states afgehandeld?
- [ ] Toegankelijkheid (aria labels waar nodig)?

### 6. Performance
- [ ] Geen onnodige re-renders?
- [ ] Geen grote dependencies toegevoegd?
- [ ] Images gebruiken Next.js Image component?
- [ ] Fonts correct geladen?

### 7. Conventies
- [ ] File naming consistent (kebab-case voor routes)?
- [ ] Functie naming beschrijvend?
- [ ] Geen dead code / ongebruikte imports?
- [ ] Comments alleen waar code niet self-documenting is?

## Review Output Format

Geef je review in dit format:

```
## ✅ Goed
- [Lijst wat goed is]

## ⚠️ Verbeteringen
- [Lijst van issues met file:line referentie]

## 🚫 Blockers (moet worden gefixt)
- [Lijst van kritieke issues]

## 📊 Score
- TypeScript: X/5
- Architectuur: X/5
- Data/Backend: X/5
- Tracking: X/5
- UI/UX: X/5
- Totaal: X/5
```

## Specifieke anti-patterns voor deze stack

### ❌ Niet doen
- `useEffect(() => { fetch(...) }, [])` in een Client Component
- `const [data, setData] = useState()` voor data die van de server kan komen
- Inline styles: `style={{ color: "red" }}`
- `any` type voor API responses
- Supabase queries in Client Components zonder RLS
- Hardcoded API keys in component code
- Nieuwe frameworks toevoegen (Redux, Zustand, SWR) zonder discussie

### ✅ Wel doen
- `await supabase.from("table").select()` in Server Component
- `async function myAction(formData: FormData) { "use server" }`
- `className="text-red-500 hover:text-red-700"`
- Properly typed interfaces voor alle data structures
- `getPostHogClient().capture("event", { ...getPostHogProperties() })`
