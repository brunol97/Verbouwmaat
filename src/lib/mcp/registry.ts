import type { McpTool, McpToolDefinition } from "./types";
import { zodToJsonSchema } from "./schema-to-json";

/**
 * Centrale registry waar alle MCP tools geregistreerd worden.
 *
 * Usage:
 *   import { registry } from "@/lib/mcp/registry";
 *   import { myTool } from "./tools/my-tool";
 *
 *   registry.register(myTool);
 */
class ToolRegistry {
  private tools = new Map<string, McpTool>();

  register(tool: McpTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is al geregistreerd`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  list(): McpTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Genereer MCP tool definities (JSON Schema) voor de protocol handshake.
   */
  toDefinitions(): McpToolDefinition[] {
    return this.list().map((tool) => {
      const schema = zodToJsonSchema(tool.parameters);
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: "object",
          properties: schema.properties ?? {},
          required: schema.required ?? [],
        },
      };
    });
  }
}

export const registry = new ToolRegistry();
