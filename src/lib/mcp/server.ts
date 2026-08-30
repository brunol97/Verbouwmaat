import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpContext,
  McpTool,
} from "./types";
import { registry } from "./registry";

// Zorg dat alle tools geregistreerd zijn
import "./tools";

const PROTOCOL_VERSION = "2024-11-05";

/**
 * Verwerk een enkele JSON-RPC request en retourneer een response.
 */
export async function handleRequest(
  req: JsonRpcRequest,
  context: McpContext
): Promise<JsonRpcResponse> {
  const { id, method, params = {} } = req;

  try {
    switch (method) {
      case "initialize": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "verbouwmaat-mcp",
              version: "0.1.0",
            },
          },
        };
      }

      case "tools/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: registry.toDefinitions(),
          },
        };
      }

      case "tools/call": {
        const { name, arguments: args } = params as {
          name: string;
          arguments: Record<string, unknown>;
        };

        const tool = registry.get(name);
        if (!tool) {
          return jsonRpcError(id, -32602, `Tool "${name}" niet gevonden`);
        }

        const result = await executeTool(tool, args, context);
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text:
                  typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      }

      default:
        return jsonRpcError(id, -32601, `Method "${method}" niet gevonden`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return jsonRpcError(id, -32603, message);
  }
}

async function executeTool(
  tool: McpTool,
  args: Record<string, unknown>,
  context: McpContext
): Promise<unknown> {
  const parsed = tool.parameters.safeParse(args);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Validatiefout: ${issues}`);
  }
  return tool.handler(parsed.data, context);
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message },
  };
}
