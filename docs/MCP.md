# MCP (Model Context Protocol) voor Verbouwmaat

Met MCP kunnen gebruikers hun eigen AI-agent (Claude, Cursor, etc.) direct koppelen aan Verbouwmaat. Elke backend-methode die we bouwen, wordt automatisch een "tool" die het AI-model kan aanroepen.

## 🚀 Quick Start

### 1. API key genereren (nog bouwen)

Gebruikers krijgen een API key in hun dashboard:
```
vm_prod_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Agent configureren

#### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "verbouwmaat": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ],
      "env": {
        "FETCH_URL": "https://jouw-app.vercel.app/api/mcp",
        "FETCH_HEADERS": "{\"Authorization\":\"Bearer vm_prod_XXX\"}"
      }
    }
  }
}
```

> ⚠️ Claude Desktop ondersteunt standaard alleen stdio/SSE MCP servers. Voor directe HTTP gebruik je een proxy of een client die HTTP-native is.

#### Cursor (settings → MCP)
Cursor heeft ingebouwde HTTP MCP ondersteuning:
```json
{
  "mcpServers": {
    "verbouwmaat": {
      "url": "https://jouw-app.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer vm_prod_XXX"
      }
    }
  }
}
```

#### Claude Code / andere HTTP clients
```bash
export MCP_API_KEY="vm_prod_XXX"
# De client doet dan POST requests naar /api/mcp
```

## 🛠️ Nieuwe tool toevoegen

Het patroon is altijd hetzelfde:

```ts
// src/lib/mcp/tools/mijn-feature.ts
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { McpTool, McpContext } from "../types";

export const mijnTool: McpTool = {
  name: "do_something",
  description: "Beschrijving voor het AI-model (be clear & concise)",
  parameters: z.object({
    foo: z.string().describe("Wat dit veld doet"),
    bar: z.number().min(0).optional().describe("Optioneel getal"),
  }),

  async handler(args, context: McpContext) {
    const supabase = await createClient();

    // Jouw business logic hier
    const { data, error } = await supabase
      .from("table")
      .select("*")
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return data;
  },
};
```

Registreer in `src/lib/mcp/tools/index.ts`:
```ts
import { mijnTool } from "./mijn-feature";
registry.register(mijnTool);
```

✅ **De tool is nu automatisch beschikbaar voor alle MCP-clients.**

## 🔐 Authenticatie & Autorisatie

- Elke request moet een `Authorization: Bearer <key>` header hebben
- API keys worden gehasht (SHA-256) opgeslagen in Supabase (`api_keys` tabel)
- De `context.userId` in handlers is de eigenaar van de key → gebruik dit voor **row-level filtering**
- Optioneel: scopes per key (`mcp`, `webhook`, `read-only`, etc.)

## 📡 Protocol Details

Onze implementatie gebruikt **JSON-RPC 2.0 over HTTP POST** (stateless).

### Ondersteunde methodes

| Methode | Beschrijving |
|---------|--------------|
| `initialize` | Protocol handshake |
| `tools/list` | Lijst alle beschikbare tools + JSON schemas |
| `tools/call` | Roep een tool aan met arguments |

### Voorbeeld request/response

**tools/list:**
```bash
curl -X POST https://jouw-app.vercel.app/api/mcp \
  -H "Authorization: Bearer vm_dev_testkey" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**tools/call:**
```bash
curl -X POST https://jouw-app.vercel.app/api/mcp \
  -H "Authorization: Bearer vm_dev_testkey" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"list_projects",
      "arguments":{"limit":5}
    }
  }'
```

## 🏗️ Toekomstige uitbreidingen

1. **SSE transport** → voor Claude Desktop compatibiliteit zonder proxy
2. **Streaming responses** → voor lange taken (bv. rapport genereren)
3. **Resources** → naast tools ook "resources" exposeren (read-only data)
4. **Prompts** → vooraf gedefinieerde prompts die de agent kan gebruiken
5. **Rate limiting** → per API key via Vercel Edge Config of Supabase
