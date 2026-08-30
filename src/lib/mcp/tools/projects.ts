import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { defineTool } from "../types";

/**
 * Voorbeeld: project management tools.
 *
 * Dit is een patroon dat je voor elke feature kan herhalen:
 *   1. Definieer een Zod schema voor input
 *   2. Schrijf de handler die Supabase aanroept
 *   3. Registreer in tools/index.ts
 */

export const projectTools = [
  defineTool({
    name: "list_projects",
    description:
      "Lijst alle projecten van de huidige gebruiker. Kan optioneel filteren op status.",
    parameters: z.object({
      status: z
        .enum(["actief", "afgerond", "gearchiveerd"])
        .optional()
        .describe("Filter op projectstatus"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Maximaal aantal resultaten"),
    }),

    async handler(args, context) {
      const supabase = await createClient();

      let query = supabase
        .from("projects")
        .select("id, name, status, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(args.limit);

      if (args.status) {
        query = query.eq("status", args.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Kon projecten niet ophalen: ${error.message}`);
      }

      return data ?? [];
    },
  }),

  defineTool({
    name: "create_project",
    description: "Maak een nieuw project aan voor de huidige gebruiker.",
    parameters: z.object({
      name: z.string().min(1).max(200).describe("Naam van het project"),
      description: z
        .string()
        .max(2000)
        .optional()
        .describe("Optionele beschrijving"),
    }),

    async handler(args, context) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: context.userId,
          name: args.name,
          description: args.description ?? null,
          status: "actief",
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Kon project niet aanmaken: ${error.message}`);
      }

      return data;
    },
  }),

  defineTool({
    name: "get_project",
    description: "Haal een specifiek project op inclusief details.",
    parameters: z.object({
      project_id: z.string().uuid().describe("UUID van het project"),
    }),

    async handler(args, context) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", args.project_id)
        .eq("user_id", context.userId)
        .single();

      if (error) {
        throw new Error(`Kon project niet ophalen: ${error.message}`);
      }

      return data;
    },
  }),
];
