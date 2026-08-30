import { z } from "zod";
import { defineTool } from "../types";

const POSTHOG_BASE_URL = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "240155";

async function posthogApi(path: string, options?: RequestInit) {
  if (!POSTHOG_API_KEY) {
    throw new Error("POSTHOG_API_KEY niet geconfigureerd");
  }

  const url = `${POSTHOG_BASE_URL}/api/projects/${POSTHOG_PROJECT_ID}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API error (${res.status}): ${text}`);
  }

  return res.json();
}

export const posthogTools = [
  defineTool({
    name: "posthog_query_events",
    description:
      "Query PostHog events met HogQL. Voorbeeld: SELECT event, count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY GROUP BY event",
    parameters: z.object({
      query: z.string().describe("HogQL query string"),
    }),

    async handler(args) {
      const data = await posthogApi("/query/", {
        method: "POST",
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            query: args.query,
          },
        }),
      });
      return data;
    },
  }),

  defineTool({
    name: "posthog_list_insights",
    description: "Lijst alle opgeslagen insights (trends, funnels, etc.)",
    parameters: z.object({
      search: z.string().optional().describe("Zoekterm om insights te filteren"),
      limit: z.number().min(1).max(100).default(20).describe("Maximaal aantal resultaten"),
    }),

    async handler(args) {
      const params = new URLSearchParams();
      if (args.search) params.set("search", args.search);
      params.set("limit", String(args.limit));
      return posthogApi(`/insights/?${params.toString()}`);
    },
  }),

  defineTool({
    name: "posthog_get_insight",
    description: "Haal een specifieke insight op met resultaten",
    parameters: z.object({
      insight_id: z.number().describe("ID van de insight"),
    }),

    async handler(args) {
      return posthogApi(`/insights/${args.insight_id}/`);
    },
  }),

  defineTool({
    name: "posthog_list_feature_flags",
    description: "Lijst alle feature flags in het project",
    parameters: z.object({
      active_only: z.boolean().default(false).describe("Alleen actieve flags tonen"),
    }),

    async handler(args) {
      const params = new URLSearchParams();
      if (args.active_only) params.set("active", "true");
      return posthogApi(`/feature_flags/?${params.toString()}`);
    },
  }),

  defineTool({
    name: "posthog_list_persons",
    description: "Zoek gebruikers (persons) in PostHog",
    parameters: z.object({
      search: z.string().optional().describe("Zoek op e-mail of distinct ID"),
      limit: z.number().min(1).max(100).default(20).describe("Maximaal aantal resultaten"),
    }),

    async handler(args) {
      const params = new URLSearchParams();
      if (args.search) params.set("search", args.search);
      params.set("limit", String(args.limit));
      return posthogApi(`/persons/?${params.toString()}`);
    },
  }),

  defineTool({
    name: "posthog_get_event_definitions",
    description: "Lijst alle event types die worden getracked",
    parameters: z.object({
      limit: z.number().min(1).max(100).default(50).describe("Maximaal aantal resultaten"),
    }),

    async handler(args) {
      const params = new URLSearchParams();
      params.set("limit", String(args.limit));
      return posthogApi(`/event_definitions/?${params.toString()}`);
    },
  }),

  defineTool({
    name: "posthog_capture_event",
    description:
      "Track een custom event in PostHog (server-side). Gebruik dit om belangrijke acties te loggen.",
    parameters: z.object({
      event: z.string().describe("Naam van het event, bijv. 'project_created'"),
      distinct_id: z.string().describe("Unieke identifier van de gebruiker"),
      properties: z.record(z.string(), z.any()).optional().describe("Extra properties als key-value object"),
    }),

    async handler(args) {
      const res = await fetch(`${POSTHOG_BASE_URL}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
          event: args.event,
          distinct_id: args.distinct_id,
          properties: args.properties || {},
        }),
      });

      if (!res.ok) {
        throw new Error(`PostHog capture failed: ${res.status}`);
      }
      return { success: true, event: args.event };
    },
  }),
];
