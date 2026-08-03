import { createBrowserClient } from "@supabase/ssr";
import { ENV } from "@/lib/config";

export function createClient() {
  return createBrowserClient(ENV.supabaseUrl, ENV.supabaseKey);
}
