/**
 * Importeer en registreer hier alle MCP tools.
 *
 * Deze file wordt geladen zodra de MCP server een request krijgt,
 * dus alle tools moeten hier geregistreerd zijn.
 */
import { registry } from "../registry";
import { userInfoTool } from "./user-info";
import { projectTools } from "./projects";

// Registreer tools
registry.register(userInfoTool);

for (const tool of projectTools) {
  registry.register(tool);
}

// TODO: importeer en registreer hier je eigen tools
