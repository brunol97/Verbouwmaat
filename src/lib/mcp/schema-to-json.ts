import type { ZodTypeAny } from "zod";
import type { JsonSchema } from "./types";

/**
 * Converteer een Zod v4 schema naar JSON Schema voor MCP tool definities.
 * Gebruikt de Zod v4 interne API (_zod.def.type).
 */
export function zodToJsonSchema(schema: ZodTypeAny): JsonSchema {
  const zod = schema as unknown as {
    _zod: {
      def: {
        type: string;
        shape?: () => Record<string, ZodTypeAny>;
        innerType?: ZodTypeAny;
        element?: ZodTypeAny;
        entries?: Record<string, string>;
        values?: unknown[];
      };
    };
    shape?: Record<string, ZodTypeAny>;
    element?: ZodTypeAny;
    options?: string[];
    unwrap?: () => ZodTypeAny;
  };

  const def = zod._zod?.def;
  if (!def) return { type: "string" };

  switch (def.type) {
    case "string":
      return { type: "string" };

    case "number":
    case "int":
      return { type: "number" };

    case "boolean":
      return { type: "boolean" };

    case "enum": {
      const values = zod.options ?? Object.values(def.entries ?? {});
      return { type: "string", enum: values };
    }

    case "array": {
      const element = zod.element ?? def.element;
      return {
        type: "array",
        items: element ? zodToJsonSchema(element) : { type: "string" },
      };
    }

    case "object": {
      const shape = zod.shape ?? def.shape?.();
      if (!shape) return { type: "object" };

      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const propSchema = zodToJsonSchema(value);
        properties[key] = propSchema;

        if (!isOptional(value)) {
          required.push(key);
        }
      }

      return {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      };
    }

    case "optional":
    case "nullable": {
      const inner = zod.unwrap?.() ?? def.innerType;
      return inner ? zodToJsonSchema(inner) : { type: "string" };
    }

    case "default": {
      const inner = zod.unwrap?.() ?? def.innerType;
      return inner ? zodToJsonSchema(inner) : { type: "string" };
    }

    case "literal": {
      const val = (def as { value?: string | number | boolean }).value;
      return {
        type:
          typeof val === "boolean"
            ? "boolean"
            : typeof val === "number"
              ? "number"
              : "string",
        const: val,
      };
    }

    default:
      return { type: "string" };
  }
}

function isOptional(schema: ZodTypeAny): boolean {
  const zod = schema as unknown as {
    _zod?: { def?: { type?: string } };
    unwrap?: () => ZodTypeAny;
  };
  const type = zod._zod?.def?.type;
  return type === "optional" || type === "default";
}
