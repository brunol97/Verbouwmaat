import posthog from "posthog-js";
import { PostHog } from "posthog-js";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (typeof window === "undefined") {
    throw new Error("PostHog client should only be used in the browser");
  }

  if (!posthogClient) {
    posthogClient = posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      capture_pageview: false, // We handle this manually for Next.js App Router
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    }) as PostHog;
  }

  return posthogClient;
}
