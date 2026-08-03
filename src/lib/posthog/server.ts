import { PostHog } from "posthog-node";

let posthogServer: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!posthogServer) {
    posthogServer = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        flushAt: 1,
        flushInterval: 0,
      }
    );
  }
  return posthogServer;
}
