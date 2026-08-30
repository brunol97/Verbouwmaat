import { createBrowserClient } from "@supabase/ssr";

// Direct env reads voor browser — met fallback als ENV object leeg is
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ekzshymcaxaeoegleoyo.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_0q6JvqaheIpvTnG0JXHWYw_VUKdrcd2";

export function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or key missing. Check env vars.");
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
}
