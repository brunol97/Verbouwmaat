import { z } from "zod";
import { defineTool } from "../types";

/**
 * Tool: haal informatie op over de geauthenticeerde gebruiker.
 */
export const userInfoTool = defineTool({
  name: "get_current_user",
  description: "Haal de huidige ingelogde gebruiker op inclusief user ID.",
  parameters: z.object({}),

  async handler(_args, context) {
    // TODO: verrijk met echte user data uit Supabase indien nodig
    return {
      user_id: context.userId,
      api_key_id: context.apiKeyId,
    };
  },
});
