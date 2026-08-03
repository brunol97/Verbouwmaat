# AI SaaS Starter

Hello world scaffold with **Next.js**, **Supabase**, **Vercel**, and **PostHog**.

## What's included

| Tool | Role | Location |
|------|------|----------|
| **Next.js 15** (App Router) | Framework + API routes | `src/app/` |
| **Supabase** | Database + Auth | `src/lib/supabase/` |
| **PostHog** | Product analytics | `src/lib/posthog/` + `src/components/PostHogProvider.tsx` |
| **Vercel** | Hosting / Edge | `vercel.json` |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

- **Supabase**: Create a project at [supabase.com](https://supabase.com), then copy the URL and anon key from Project Settings → API.
- **PostHog**: Create a project at [posthog.com](https://posthog.com), then copy the project API key from Project Settings.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or push to GitHub and import the repo on [vercel.com](https://vercel.com).

## Project structure

```
src/
  app/
    layout.tsx        # Root layout with PostHog provider
    page.tsx          # Hello world home page
    globals.css       # Tailwind base styles
  lib/
    supabase/
      client.ts       # Browser Supabase client
      server.ts       # Server Supabase client (RSC / API routes)
      middleware.ts   # Session refresh middleware
    posthog/
      client.ts       # Browser PostHog client
      server.ts       # Server PostHog client (RSC / API routes)
  components/
    PostHogProvider.tsx  # Pageview tracking wrapper
  middleware.ts        # Next.js middleware (auth session refresh)
```

## Next steps

1. Add Supabase Auth UI (or Clerk) for sign-in/sign-up
2. Add a database table and generate types: `npm run db:types`
3. Add AI SDK for streaming chat: `npm i ai @ai-sdk/openai`
4. Configure `vercel.json` env vars for production secrets
