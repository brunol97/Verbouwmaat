import { NextRequest, NextResponse } from "next/server";
import type { JsonRpcRequest, JsonRpcResponse } from "@/lib/mcp/types";
import { handleRequest } from "@/lib/mcp/server";
import { validateMcpApiKey } from "@/lib/mcp/auth";

/**
 * MCP JSON-RPC endpoint.
 *
 * Authentication: Bearer token via Authorization header.
 *   Authorization: Bearer vm_<your_api_key>
 *
 * Example request:
 *   POST /api/mcp
 *   {
 *     "jsonrpc": "2.0",
 *     "id": 1,
 *     "method": "tools/list",
 *     "params": {}
 *   }
 *
 * Example response:
 *   {
 *     "jsonrpc": "2.0",
 *     "id": 1,
 *     "result": {
 *       "tools": [...]
 *     }
 *   }
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Auth ──────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "API key ontbreekt" } },
      { status: 401 }
    );
  }

  const auth = await validateMcpApiKey(token);
  if (!auth) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Ongeldige API key" } },
      { status: 401 }
    );
  }

  // ── Parse request ─────────────────────────────────────────────────
  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Ongeldige JSON" } },
      { status: 400 }
    );
  }

  const context = {
    userId: auth.userId,
    apiKeyId: auth.apiKeyId,
  };

  // ── Handle single or batch ────────────────────────────────────────
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((req) => handleRequest(req, context))
    );
    return NextResponse.json(responses.filter(Boolean));
  }

  const response = await handleRequest(body, context);
  return NextResponse.json(response);
}

/**
 * OPTIONS handler voor CORS (als clients direct vanuit browser/agent verbinden).
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
