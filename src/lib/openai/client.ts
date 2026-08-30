import OpenAI from "openai";

// Multi-provider AI client
// Priority: OpenCode (opencode-go) → OpenAI → demo mode

function getProviderConfig() {
  // OpenCode provider
  if (process.env.OPENCODE_API_KEY) {
    return {
      apiKey: process.env.OPENCODE_API_KEY,
      baseURL: process.env.OPENCODE_BASE_URL ?? "https://api.opencode.ai/v1",
      model: process.env.OPENCODE_MODEL ?? "gpt-4o",
      provider: "opencode" as const,
    };
  }

  // OpenAI provider
  if (process.env.OPENAI_API_KEY) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: undefined,
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      provider: "openai" as const,
    };
  }

  return null;
}

export const providerConfig = getProviderConfig();

export const openai = providerConfig
  ? new OpenAI({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseURL,
    })
  : null;

export function getVisionModel(): string {
  return providerConfig?.model ?? "gpt-4o";
}

export function getProviderName(): string {
  return providerConfig?.provider ?? "none";
}

export function isAiEnabled(): boolean {
  return openai !== null;
}
