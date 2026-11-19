const DEFAULT_MODALITIES = {
    input: ["text", "image", "pdf"],
    output: ["text"],
};
export const OPENCODE_MODEL_DEFINITIONS = {
    "antigravity-gemini-3-flash": {
        name: "Gemini 3 Flash (Antigravity)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            minimal: { thinkingLevel: "minimal" },
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "gemini-3.8-flash": {
        // Canonical Gemini 3.8 Flash entry. Routes Antigravity-first with Gemini
        // CLI fallback; the Antigravity backend only serves tier-suffixed ids
        // (gemini-3.8-flash-low/medium/high, captured from agy 1.5.7), which the
        // resolver maps automatically. `antigravity-gemini-3.8-flash` remains a
        // hidden explicit-quota alias. Medium is the agy default tier.
        name: "Gemini 3.8 Flash",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "antigravity-claude-sonnet-4-6": {
        // Context raised from 200k to 250k per the backend's fetchAvailableModels
        // response (captured from agy 1.5.7, 2026-11-12).
        name: "Claude Sonnet 4.6 (Antigravity)",
        limit: { context: 250000, output: 64000 },
        modalities: DEFAULT_MODALITIES,
    },
    "antigravity-claude-opus-4-6-thinking": {
        name: "Claude Opus 4.6 Thinking (Antigravity)",
        limit: { context: 250000, output: 64000 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingConfig: { thinkingBudget: 8192 } },
            max: { thinkingConfig: { thinkingBudget: 32768 } },
        },
    },
    "antigravity-gpt-oss-120b-medium": {
        // Advertised and served by the Antigravity backend (registry probe
        // 2026-11-19: generate returned 200 in ~0.8s, modelVersion
        // gpt-oss-120b-medium). The "-medium" suffix is part of the backend id,
        // not a selectable thinking tier, so no variants are exposed. Text-only
        // input.
        name: "GPT-OSS 120B (Antigravity)",
        limit: { context: 131072, output: 32768 },
        modalities: { input: ["text"], output: ["text"] },
    },
    "antigravity-gemini-4-hydrogen": {
        // Public-facing Gemini 4 Hydrogen entry. The backend does not yet serve
        // the bare id (a "-disabled" registry stub, 404 on generate); requests
        // are rewritten to the servable "sonar" experiment-lane id
        // gemini-4-hydrogen-sonar — see resolveAntigravityGemini4HydrogenBackend-
        // Model for what "sonar" is. The rewrite is registry-aware: once the
        // registry lists the bare id enabled (e.g. at public launch), it is sent
        // verbatim. Live on the lane since 2026-11-18 (~1.4-4.6s TTFB while 3.8
        // Flash was heavily queued). Accepts uppercase thinkingLevel strings
        // like the Gemini 3 line.
        name: "Gemini 4 Hydrogen (Antigravity)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "gemini-2.5-flash": {
        name: "Gemini 2.5 Flash (Gemini CLI)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
    },
    "gemini-3-flash-preview": {
        name: "Gemini 3 Flash Preview (Gemini CLI)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
    },
};
function modelIdFromGeminiName(name) {
    if (!name)
        return null;
    const id = name.replace(/^models\//, "").trim();
    return id || null;
}
function supportsGeminiGeneration(model) {
    const methods = model.supportedGenerationMethods ?? [];
    return methods.includes("generateContent") || methods.includes("streamGenerateContent");
}
function titleFromModelId(modelId) {
    return modelId
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function defaultLimitForModel(modelId) {
    if (modelId.includes("claude")) {
        // 250k context per the backend's fetchAvailableModels response
        // (captured from agy 1.5.7, 2026-11-12).
        return { context: 250000, output: 64000 };
    }
    return { context: 1048576, output: 65536 };
}
function defaultVariantsForModel(modelId) {
    const normalized = modelId.toLowerCase().replace(/^antigravity-/, "");
    if (normalized.includes("claude") && normalized.includes("thinking")) {
        return {
            low: { thinkingConfig: { thinkingBudget: 8192 } },
            max: { thinkingConfig: { thinkingBudget: 32768 } },
        };
    }
    if (normalized.startsWith("gemini-4")) {
        // Gemini 4 line (Carbon/Argon/Hydrogen/Neon): uppercase thinkingLevel
        // strings verified live on gemini-4-hydrogen-sonar (2026-11-18). No
        // minimal tier advertised; minThinkingBudget >= 32 suggests low is the
        // floor.
        return {
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        };
    }
    if (normalized.startsWith("gemini-3") || normalized.startsWith("gemini-2.5")) {
        if (normalized.includes("pro")) {
            return {
                low: { thinkingLevel: "low" },
                high: { thinkingLevel: "high" },
            };
        }
        if (normalized.includes("flash")) {
            // Gemini 3.8 Flash only supports low/medium/high (no minimal),
            // matching the tier-suffixed backend ids agy 1.5.7 serves.
            if (/^gemini-3\.8-flash(?:-|$)/.test(normalized)) {
                return {
                    low: { thinkingLevel: "low" },
                    medium: { thinkingLevel: "medium" },
                    high: { thinkingLevel: "high" },
                };
            }
            return {
                minimal: { thinkingLevel: "minimal" },
                low: { thinkingLevel: "low" },
                medium: { thinkingLevel: "medium" },
                high: { thinkingLevel: "high" },
            };
        }
    }
    return undefined;
}
function mergeWithStaticDefinition(modelId, discovered) {
    const existing = OPENCODE_MODEL_DEFINITIONS[modelId];
    if (!existing)
        return discovered;
    return {
        ...existing,
        ...discovered,
        limit: discovered.limit ?? existing.limit,
        modalities: discovered.modalities ?? existing.modalities,
        variants: existing.variants ?? discovered.variants,
    };
}
function antigravityModelIdFromEntry(sourceId, entry) {
    const rawId = (entry.modelName || sourceId).trim();
    if (!rawId)
        return null;
    const modelId = rawId.replace(/^models\//, "");
    return modelId.startsWith("antigravity-") ? modelId : `antigravity-${modelId}`;
}
export function modelsFromGeminiApi(models) {
    const definitions = {};
    for (const model of models) {
        if (!supportsGeminiGeneration(model))
            continue;
        const modelId = modelIdFromGeminiName(model.name) || model.baseModelId;
        if (!modelId)
            continue;
        const variants = defaultVariantsForModel(modelId);
        const discovered = {
            name: model.displayName ? `${model.displayName} (Gemini API)` : `${titleFromModelId(modelId)} (Gemini API)`,
            limit: {
                context: model.inputTokenLimit ?? defaultLimitForModel(modelId).context,
                output: model.outputTokenLimit ?? defaultLimitForModel(modelId).output,
            },
            modalities: DEFAULT_MODALITIES,
            ...(variants ? { variants } : {}),
        };
        definitions[modelId] = mergeWithStaticDefinition(modelId, discovered);
    }
    return definitions;
}
export function modelsFromAntigravityAvailableModels(models) {
    const definitions = {};
    for (const [sourceId, entry] of Object.entries(models)) {
        // Skip backend stubs: rows flagged disabled are UI placeholders backed by
        // no servable model id (verified 2026-11-18: "gemini-4-<element>-disabled"
        // rows return 404 on generation while listed), and internal helper models
        // power IDE features only. "-sonar"-suffixed rows are experiment-lane
        // duplicates of their parent model (the parent id is canonically mapped
        // to the lane by the resolver), so the lane row itself needs no catalog
        // entry.
        if (entry.disabled === true || entry.isInternal === true)
            continue;
        if (/-sonar$/i.test(sourceId))
            continue;
        const modelId = antigravityModelIdFromEntry(sourceId, entry);
        if (!modelId)
            continue;
        const variants = defaultVariantsForModel(modelId);
        const fallbackLimit = defaultLimitForModel(modelId);
        const discovered = {
            name: entry.displayName ? `${entry.displayName} (Antigravity)` : `${titleFromModelId(modelId)} (Antigravity)`,
            limit: {
                context: entry.maxTokens ?? fallbackLimit.context,
                output: entry.maxOutputTokens ?? fallbackLimit.output,
            },
            modalities: DEFAULT_MODALITIES,
            ...(variants ? { variants } : {}),
        };
        definitions[modelId] = mergeWithStaticDefinition(modelId, discovered);
    }
    return definitions;
}
export function mergeModelDefinitions(...definitions) {
    return Object.assign({}, ...definitions);
}
//# sourceMappingURL=models.js.map