const CATALOG_TTL_MS = 60 * 60 * 1000;
let catalog;
let antigravityCatalog;
function modelIdFromName(model) {
    const raw = (model.name ? model.name.replace(/^models\//, "") : model.baseModelId)?.trim();
    return raw || null;
}
/**
 * Records a freshly-fetched public Gemini API model list. Called as a side
 * effect of the existing model-discovery fetch — no extra network round trip.
 */
export function recordPublicGeminiApiModels(models) {
    const ids = new Set();
    for (const model of models) {
        const id = modelIdFromName(model);
        if (id)
            ids.add(id.toLowerCase());
    }
    if (ids.size === 0)
        return;
    catalog = { ids, fetchedAt: Date.now() };
}
/**
 * Returns the live set of public Gemini API model ids, or `undefined` when no
 * catalog has been fetched yet (cold start) or the cached one is stale.
 * Callers should fall back to static heuristics in the `undefined` case.
 */
export function getPublicGeminiApiModelIds() {
    if (!catalog)
        return undefined;
    if (Date.now() - catalog.fetchedAt > CATALOG_TTL_MS)
        return undefined;
    return catalog.ids;
}
/**
 * Records available models from the Antigravity model registry (`fetchAvailableModels`).
 * Called as a side effect of quota checks and model discovery.
 */
export function recordAntigravityAvailableModels(models) {
    if (!models || Object.keys(models).length === 0)
        return;
    antigravityCatalog = {
        models: { ...models },
        fetchedAt: Date.now(),
    };
}
/**
 * Returns the cached Antigravity available models, or `undefined` when no catalog
 * has been fetched yet or the cached one is stale.
 */
export function getCachedAntigravityAvailableModels() {
    if (!antigravityCatalog)
        return undefined;
    if (Date.now() - antigravityCatalog.fetchedAt > CATALOG_TTL_MS)
        return undefined;
    return antigravityCatalog.models;
}
export function resetPublicGeminiApiModelCatalogForTests() {
    catalog = undefined;
}
export function resetAntigravityModelCatalogForTests() {
    antigravityCatalog = undefined;
}
export function resetModelCatalogsForTests() {
    catalog = undefined;
    antigravityCatalog = undefined;
}
//# sourceMappingURL=model-catalog.js.map