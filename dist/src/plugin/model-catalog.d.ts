/**
 * Live cache of the public Gemini API model catalog (`GET
 * generativelanguage.googleapis.com/v1beta/models`) and the Antigravity model
 * registry (`POST v1internal:fetchAvailableModels`), sourced from model discovery
 * and quota fetches.
 *
 * Routing decisions and dynamic model resolution use this live data to discover
 * new and updated models directly from Google's registries without requiring manual
 * plugin updates.
 */
import type { AntigravityAvailableModels, GeminiApiModel } from "./config/models";
/**
 * Records a freshly-fetched public Gemini API model list. Called as a side
 * effect of the existing model-discovery fetch — no extra network round trip.
 */
export declare function recordPublicGeminiApiModels(models: GeminiApiModel[]): void;
/**
 * Returns the live set of public Gemini API model ids, or `undefined` when no
 * catalog has been fetched yet (cold start) or the cached one is stale.
 * Callers should fall back to static heuristics in the `undefined` case.
 */
export declare function getPublicGeminiApiModelIds(): ReadonlySet<string> | undefined;
/**
 * Records available models from the Antigravity model registry (`fetchAvailableModels`).
 * Called as a side effect of quota checks and model discovery.
 */
export declare function recordAntigravityAvailableModels(models: AntigravityAvailableModels): void;
/**
 * Returns the cached Antigravity available models, or `undefined` when no catalog
 * has been fetched yet or the cached one is stale.
 */
export declare function getCachedAntigravityAvailableModels(): AntigravityAvailableModels | undefined;
export declare function resetPublicGeminiApiModelCatalogForTests(): void;
export declare function resetAntigravityModelCatalogForTests(): void;
export declare function resetModelCatalogsForTests(): void;
//# sourceMappingURL=model-catalog.d.ts.map