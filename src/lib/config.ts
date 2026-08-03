/**
 * Environment-aware configuration
 * Detects preview (o) vs production (p) via Vercel env vars
 */

export const ENV = {
  // "development" | "preview" | "production"
  vercelEnv: process.env.VERCEL_ENV ?? "development",
  isProd: process.env.VERCEL_ENV === "production",
  isPreview: process.env.VERCEL_ENV === "preview",
  isDev: !process.env.VERCEL_ENV,

  // URLs
  siteUrl:
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",

  // Supabase — switch based on environment
  supabaseUrl:
    process.env.VERCEL_ENV === "production"
      ? process.env.SUPABASE_URL_PROD!
      : process.env.NEXT_PUBLIC_SUPABASE_URL!,

  supabaseAnonKey:
    process.env.VERCEL_ENV === "production"
      ? process.env.SUPABASE_ANON_KEY_PROD!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

  // PostHog — same project, different host if needed
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  posthogHost:
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
  posthogProjectId: process.env.POSTHOG_PROJECT_ID,
};

/**
 * PostHog properties om mee te sturen voor environment tracking
 */
export function getPostHogProperties() {
  return {
    environment: ENV.vercelEnv,
    vercel_url: ENV.siteUrl,
  };
}
