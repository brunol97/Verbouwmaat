# MCP Protocol Update: 2026-07-28 — Onderzoeksrapport

> **Status:** Stable release (juli 2026)  
> **Vorige versie:** 2025-11-25  
> **Onze huidige implementatie:** 2024-11-05 (hand-rolled, niet-officieel)

---

## 🔥 De Grote Veranderingen (2026-07-28)

### 1. MCP is nu volledig stateless
- **Weg:** `initialize`/`notifications/initialized` handshake
- **Nieuw:** Elke request draagt zijn eigen protocol versie en capabilities in `_meta`
- **Impact:** Onze hele JSON-RPC lifecycle handler (`initialize` → `tools/list` → `tools/call`) is obsoleet

### 2. Geen protocol-level sessions meer
- **Weg:** `Mcp-Session-Id` header
- **Nieuw:** Geen sessie-state op de server. Cross-call state gaat via expliciete handles in tool arguments
- **Impact:** Onze stateless HTTP POST aanpak was al goed, maar we moeten nu expliciet geen sessies verwachten

### 3. `server/discover` endpoint
- **Nieuw:** Servers MOETEN een `server/discover` RPC implementeren die advertises:
  - Supported protocol versions
  - Capabilities (tools, resources, prompts, etc.)
  - Server identity
- **Impact:** Dit wordt het eerste contactpunt voor clients. We moeten dit bouwen.

### 4. Multi Round-Trip Requests (MRTR)
- **Nieuw patroon:** Servers kunnen `InputRequiredResult` (`resultType: "input_required"`) teruggeven met `inputRequests` — bijv. "ik heb meer info nodig van de gebruiker"
- **Client reageert:** Retries het originele request met `inputResponses`
- **Impact:** Dit vervangt de oude server-initiated requests (`roots/list`, `sampling/createMessage`, `elicitation/create`)
- **Use case:** Een tool die eerst toestemming nodig heeft, of extra input van de gebruiker

### 5. Subscriptions via `subscriptions/listen`
- **Weg:** `resources/subscribe`/`resources/unsubscribe` + HTTP GET endpoint
- **Nieuw:** Eén `subscriptions/listen` request geeft een long-lived SSE stream voor change notifications
- **Impact:** Clients kunnen nu expliciet opt-in voor notificatie types

### 6. Alle results hebben `resultType`
- **Nieuw:** Elk resultaat heeft een verplicht `resultType` veld:
  - `"complete"` — normaal resultaat
  - `"input_required"` — MRTR tussentijds resultaat
- **Impact:** Onze tool handlers moeten nu altijd `resultType` teruggeven

### 7. Caching ingebouwd
- **Nieuw:** `ttlMs` en `cacheScope` (`"public"` / `"private"`) op list/read results
- **Impact:** Clients kunnen nu cachen. We moeten caching hints meegeven bij onze endpoints

### 8. Deprecations
- **Roots** — vervangen door tool parameters / resource URIs
- **Sampling** — clients gebruiken direct LLM provider APIs
- **Logging** — gebruik `stderr` (stdio) of OpenTelemetry
- **HTTP+SSE transport** — vervangen door Streamable HTTP
- **OAuth 2.0 Dynamic Client Registration** — vervangen door Client ID Metadata Documents

### 9. Authenticatie: OAuth 2.0 verplicht
- **Nieuw:** MCP servers zijn nu formeel **OAuth 2.0 Resource Servers**
- **Discovery:** Via `WWW-Authenticate` header of `.well-known/oauth-protected-resource`
- **Scopes:** Incrementele consent via `WWW-Authenticate` (SEP-835)
- **Impact:** Onze custom `vm_` API key systeem is niet-MCP-compliant

### 10. JSON Schema 2020-12
- **Nieuw:** Default dialect voor alle schemas
- **Impact:** Onze Zod → JSON Schema conversie moet 2020-12 output genereren

---

## 📊 Vergelijking: Onze Huidige Implementatie vs. 2026-07-28

| Aspect | Onze implementatie (2024-11-05 custom) | Officiële 2026-07-28 spec |
|---|---|---|
| **Protocol versie** | `2024-11-05` (hardcoded) | `2026-07-28` |
| **Lifecycle** | `initialize` handshake | ❌ Geen handshake, stateless |
| **Transport** | HTTP POST (custom) | Streamable HTTP (POST + SSE) |
| **Auth** | Custom `vm_` API keys | OAuth 2.0 Resource Server |
| **Discover** | Niet aanwezig | `server/discover` verplicht |
| **Tool results** | `{ content: [...] }` | `{ resultType: "complete", content: [...] }` |
| **Sessions** | Geen (accidenteel goed) | Expliciet geen sessies |
| **Subscriptions** | Niet ondersteund | `subscriptions/listen` |
| **MRTR** | Niet ondersteund | `InputRequiredResult` |
| **Caching** | Niet ondersteund | `ttlMs` + `cacheScope` |
| **Schema dialect** | Draft-07 | JSON Schema 2020-12 |
| **Batching** | Ondersteund | ❌ Verwijderd |
| **SDK** | Custom (~660 regels) | `@modelcontextprotocol/server` v2.0 |

---

## 🏗️ Officiële SDK: `@modelcontextprotocol/server` v2.0

De officiële SDK ondersteunt de 2026-07-28 spec volledig. Belangrijke API:

```ts
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "@modelcontextprotocol/server/hono";

const server = new McpServer({
  name: "verbouwmaat",
  version: "0.1.0",
});

// Tool met Zod schema — automatische StandardSchemaV1 support
server.tool(
  "create_project",
  {
    name: z.string().describe("Naam van het project"),
    description: z.string().optional(),
  },
  async (args, ctx) => {
    // ctx.http.authInfo — OAuth auth info
    // ctx.requestMeta — protocol versie, capabilities, etc.
    return {
      resultType: "complete" as const,
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
    };
  }
);

// Next.js handler (Web Standard Streams)
export const { GET, POST } = createMcpHandler({
  server,
  auth: { verifier: myOAuthVerifier },
});
```

---

## 📋 Migratieplan

### Fase 1: SDK Adoptie (1 dag)
1. Installeer `@modelcontextprotocol/server` v2.0
2. Verwijder alle custom MCP code (`src/lib/mcp/`, `src/app/api/mcp/`)
3. Bouw nieuwe endpoint met `createMcpHandler`

### Fase 2: OAuth 2.0 Opzetten (2-3 dagen)
1. Configureer Supabase Auth als OAuth Authorization Server
2. Of: gebruik een hosted OAuth provider (Auth0, Clerk, etc.)
3. Implementeer `OAuthTokenVerifier` voor de SDK
4. Migreer bestaande `api_keys` tabel naar OAuth tokens

### Fase 3: Tools Herimplementeren (1 dag)
1. Converteer elke `defineTool()` naar `server.tool()`
2. Voeg `resultType: "complete"` toe aan alle handlers
3. Voeg `ttlMs` en `cacheScope` toe waar van toepassing

### Fase 4: Discover + Subscriptions (1 dag)
1. `server/discover` wordt automatisch door de SDK afgehandeld
2. Implementeer `subscriptions/listen` voor list-change notifications

### Fase 5: Testing (1 dag)
1. Test met Claude Desktop (via stdio proxy of direct HTTP)
2. Test met Cursor (native HTTP MCP support)
3. Test backwards compatibility met oudere clients

---

## ⚠️ Risico's

1. **Breaking change voor bestaande clients** — Iemand die onze huidige MCP endpoint gebruikt, moet upgraden naar een 2026-07-28 compatible client
2. **OAuth complexiteit** — OAuth 2.0 is complexer dan een simpele API key. We moeten goed nadenken over het UX flow.
3. **Vercel + SSE** — Streamable HTTP met SSE streams werkt op Vercel, maar er zijn timeouts (max 5 minuten op Hobby, hoger op Pro). Voor langdurige tasks moeten we de Tasks extension gebruiken.

---

## 🎯 Aanbeveling

**Volledige migratie naar `@modelcontextprotocol/server` v2.0 met 2026-07-28 compliance.**

Onze huidige custom implementatie is nu officieel twee generaties achter en incompatible met moderne MCP clients. De officiële SDK biedt:
- Automatische protocol compliance
- OAuth 2.0 ingebouwd
- Type-safe tool definitie met elke StandardSchemaV1 (Zod, Valibot, etc.)
- Streaming support
- Task management
- Backwards compatibility helpers voor oudere clients

De investering is ~1 week werk voor een volledige, toekomstbestendige MCP server.
