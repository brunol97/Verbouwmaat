/**
 * Importeer en registreer hier alle MCP tools.
 *
 * Deze file wordt geladen zodra de MCP server een request krijgt,
 * dus alle tools moeten hier geregistreerd zijn.
 */
import { registry } from "../registry";
import { userInfoTool } from "./user-info";
import { projectTools } from "./projects";
import { posthogTools } from "./posthog";

// Registreer tools
registry.register(userInfoTool);

for (const tool of projectTools) {
  registry.register(tool);
}

for (const tool of posthogTools) {
  registry.register(tool);
}

console.log(`[MCP] ${registry.toDefinitions().length} tools geregistreerd`);
