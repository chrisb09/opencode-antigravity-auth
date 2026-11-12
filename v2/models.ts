import { OPENCODE_MODEL_DEFINITIONS, type OpencodeModelDefinition } from "../src/plugin/config/models.js";

export const DEPRECATED_GEMINI_MODEL_IDS = new Set([
  "antigravity-gemini-3-pro",
  "antigravity-gemini-3.1-pro",
  "antigravity-gemini-3.5-flash",
  "antigravity-gemini-3.6-flash",
  "antigravity-gemini-3.7-flash",
  // Consolidated into the canonical gemini-3.8-flash entry; still resolvable
  // as a hidden explicit-quota alias via the antigravity- prefix.
  "antigravity-gemini-3.8-flash",
  "gemini-2.5-pro",
  "gemini-3-pro-preview",
  "gemini-3.1-pro",
  "gemini-3.1-pro-preview-customtools",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
]);

export function v2ModelDefinitions(): Array<[string, OpencodeModelDefinition]> {
  return Object.entries(OPENCODE_MODEL_DEFINITIONS).filter(
    ([id]) => !DEPRECATED_GEMINI_MODEL_IDS.has(id),
  );
}

const DEFAULT_MODALITIES = { input: ["text", "image", "pdf"], output: ["text"] } as const;

function compatDefinition(id: string): OpencodeModelDefinition {
  const lower = id.toLowerCase();
  const isClaude = lower.includes("claude");
  const isPro = lower.includes("pro");
  const isFlash38 = lower.includes("gemini-3.8-flash");
  const variants = isClaude
    ? {
        low: { thinkingConfig: { thinkingBudget: 8192 } },
        max: { thinkingConfig: { thinkingBudget: 32768 } },
      }
    : isPro
      ? { low: { thinkingLevel: "low" }, high: { thinkingLevel: "high" } }
      : isFlash38
        ? {
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
          }
        : {
            minimal: { thinkingLevel: "minimal" },
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
          };
  return {
    name: `${id} (legacy alias)`,
    limit: isClaude ? { context: 250000, output: 64000 } : { context: 1048576, output: 65536 },
    modalities: DEFAULT_MODALITIES as unknown as OpencodeModelDefinition["modalities"],
    variants: variants as unknown as OpencodeModelDefinition["variants"],
  };
}

/**
 * Deprecated model ids kept as selectable compat aliases: hidden from the
 * default picker (status "deprecated") but still routable when explicitly
 * requested, so previously-configured model strings keep working.
 */
export function v2CompatModelDefinitions(): Array<[string, OpencodeModelDefinition]> {
  return [...DEPRECATED_GEMINI_MODEL_IDS].sort().map((id) => [id, compatDefinition(id)]);
}
