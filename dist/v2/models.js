import { OPENCODE_MODEL_DEFINITIONS } from "../src/plugin/config/models.js";
/**
 * Model ids kept out of the default V2 picker but still routable when
 * explicitly requested (registered with status "deprecated"), so
 * previously-configured model strings and forward-declared ids keep working.
 */
export const HIDDEN_MODEL_IDS = new Set([
    // --- Deprecated: removed from the backend or superseded by a canonical
    // entry. Hidden from the picker; old model strings keep resolving.
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
    // --- Prepared: announced next-generation models that are NOT yet servable
    // for current accounts (probe results 2026-11-18/19: the backend registry
    // listed Gemini 4 Carbon/Argon/Hydrogen/Neon as disabled placeholders
    // and returns 404 for bare ids; Claude 5.5 is not listed at all).
    // Registered hidden so explicit requests route correctly the moment the
    // backend starts serving them (e.g. on paid accounts); model discovery adds
    // visible entries automatically for V1 accounts that have them. (Gemini 4
    // Hydrogen is canonically visible and uses tier-specific backend IDs.)
    "antigravity-gemini-4-carbon",
    "antigravity-gemini-4-argon",
    "antigravity-gemini-4-neon",
    "antigravity-claude-sonnet-5-5",
    "antigravity-claude-opus-5-5-thinking",
    // Legacy direct monitor ID; never used as the canonical Hydrogen fallback.
    "antigravity-gemini-4-hydrogen-sonar",
]);
export function v2ModelDefinitions() {
    return Object.entries(OPENCODE_MODEL_DEFINITIONS).filter(([id]) => !HIDDEN_MODEL_IDS.has(id));
}
const DEFAULT_MODALITIES = { input: ["text", "image", "pdf"], output: ["text"] };
function compatDefinition(id) {
    const lower = id.toLowerCase();
    const isClaude = lower.includes("claude");
    const isGemini4 = lower.includes("gemini-4");
    const isPro = lower.includes("pro");
    const isFlash38 = lower.includes("gemini-3.8-flash");
    const variants = isClaude
        ? {
            low: { thinkingConfig: { thinkingBudget: 8192 } },
            max: { thinkingConfig: { thinkingBudget: 32768 } },
        }
        : isGemini4
            ? // Gemini 4 line: uppercase thinkingLevel strings, no minimal tier
                // (verified live on gemini-4-hydrogen-sonar, 2026-11-18).
                {
                    low: { thinkingLevel: "low" },
                    medium: { thinkingLevel: "medium" },
                    high: { thinkingLevel: "high" },
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
        name: `${id} (compat alias)`,
        limit: isClaude ? { context: 250000, output: 64000 } : { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: variants,
    };
}
/**
 * Deprecated and prepared model ids exposed as selectable compat aliases:
 * hidden from the default picker (status "deprecated") but still routable
 * when explicitly requested, so previously-configured model strings and
 * forward-declared ids keep working.
 */
export function v2CompatModelDefinitions() {
    return [...HIDDEN_MODEL_IDS].sort().map((id) => [id, compatDefinition(id)]);
}
//# sourceMappingURL=models.js.map