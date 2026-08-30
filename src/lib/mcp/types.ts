import { z, ZodTypeAny } from "zod";

/**
 * Een MCP-tool definitie die gekoppeld is aan een getypeerde handler.
 *
 * - name: unieke tool naam (snake_case)
 * - description: beschrijving voor het AI-model
 * - parameters: Zod schema voor input validatie
 * - handler: de daadwerkelijke business logic
 */
export interface McpTool<Params extends ZodTypeAny = ZodTypeAny> {
  name: string;
  description: string;
  parameters: Params;
  handler: (args: z.infer<Params>, context: McpContext) => Promise<unknown>;
}

/**
 * Helper om een tool te definiëren met correcte type inference.
 * Gebruik dit in plaats van direct `McpTool` typeren.
 *
 * Voorbeeld:
 *   export const myTool = defineTool({
 *     name: "do_something",
 *     parameters: z.object({ foo: z.string() }),
 *     handler: (args) => { ... } // args is automatisch getypeerd
 *   });
 */
export function defineTool<T extends ZodTypeAny>(tool: McpTool<T>): McpTool<T> {
  return tool;
}

/**
 * Context die meegegeven wordt aan elke tool handler.
 * Hierin zit de geauthenticeerde gebruiker + extra metadata.
 */
export interface McpContext {
  userId: string;
  apiKeyId: string;
  // Eventueel extra context die je handlers nodig hebben
  [key: string]: unknown;
}

/**
 * JSON-RPC 2.0 message types voor MCP communicatie
 */
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

/**
 * MCP protocol spec: tool definitie zoals een client hem ziet
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * Zod schema → JSON Schema converter helper type
 */
export type JsonSchema = {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: unknown;
  description?: string;
  enum?: unknown[];
  additionalProperties?: boolean;
  $schema?: string;
  [key: string]: unknown;
};
