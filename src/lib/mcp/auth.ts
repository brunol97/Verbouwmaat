import { createClient } from "@/lib/supabase/server";

/**
 * Valideer een MCP API key en retourneer de gebruiker + key metadata.
 *
 * Verwacht header: Authorization: Bearer vm_<key>
 *
 * De key wordt gehasht (SHA-256) en vergeleken met `api_keys.key_hash`.
 */
export async function validateMcpApiKey(key: string): Promise<{
  userId: string;
  apiKeyId: string;
} | null> {
  // Dev fallback voor lokaal testen
  if (process.env.VERCEL_ENV !== "production" && key === "vm_dev_testkey") {
    return { userId: "dev-user-id", apiKeyId: "dev-key-id" };
  }

  const keyHash = await hashKey(key);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .single();

  if (error || !data) return null;

  // Update last_used_at async (fire-and-forget)
  void (async () => {
    try {
      await supabase.rpc("touch_api_key", { key_hash_input: keyHash });
    } catch {
      // ignore errors
    }
  })();

  return { userId: data.user_id, apiKeyId: data.id };
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
