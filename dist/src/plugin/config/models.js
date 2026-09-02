const DEFAULT_MODALITIES = {
    input: ["text", "image", "pdf"],
    output: ["text"],
};
export const OPENCODE_MODEL_DEFINITIONS = {
    "antigravity-gemini-3-pro": {
        name: "Gemini 3 Pro (Antigravity)",
        limit: { context: 1048576, output: 65535 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingLevel: "low" },
            high: { thinkingLevel: "high" },
        },
    },
    "antigravity-gemini-3.1-pro": {
        name: "Gemini 3.1 Pro (Antigravity)",
        limit: { context: 1048576, output: 65535 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingLevel: "low" },
            high: { thinkingLevel: "high" },
        },
    },
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
    "antigravity-gemini-3.5-flash": {
        name: "Gemini 3.5 Flash (Antigravity)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            minimal: { thinkingLevel: "minimal" },
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "antigravity-gemini-3.6-flash": {
        name: "Gemini 3.6 Flash (Antigravity)",
        temperature: false,
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "antigravity-gemini-3.7-flash": {
        name: "Gemini 3.7 Flash (Antigravity)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "antigravity-gemini-3.8-flash": {
        name: "Gemini 3.8 Flash (Antigravity)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "antigravity-claude-sonnet-4-6": {
        name: "Claude Sonnet 4.6 (Antigravity)",
        limit: { context: 200000, output: 64000 },
        modalities: DEFAULT_MODALITIES,
    },
    "antigravity-claude-opus-4-6-thinking": {
        name: "Claude Opus 4.6 Thinking (Antigravity)",
        limit: { context: 200000, output: 64000 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            low: { thinkingConfig: { thinkingBudget: 8192 } },
            max: { thinkingConfig: { thinkingBudget: 32768 } },
        },
    },
    "gemini-2.5-flash": {
        name: "Gemini 2.5 Flash (Gemini CLI)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
    },
    "gemini-2.5-pro": {
        name: "Gemini 2.5 Pro (Gemini CLI)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
    },
    "gemini-3-flash-preview": {
        name: "Gemini 3 Flash Preview (Gemini CLI)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
    },
    "gemini-3.5-flash": {
        name: "Gemini 3.5 Flash (Gemini CLI)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
    },
    "gemini-3.5-flash-lite": {
        name: "Gemini 3.5 Flash-Lite (Gemini CLI)",
        temperature: false,
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            minimal: { thinkingLevel: "minimal" },
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "gemini-3.6-flash": {
        name: "Gemini 3.6 Flash (Gemini CLI)",
        temperature: false,
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "gemini-3.7-flash": {
        name: "Gemini 3.7 Flash (Gemini CLI)",
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
        name: "Gemini 3.8 Flash (Gemini CLI)",
        limit: { context: 1048576, output: 65536 },
        modalities: DEFAULT_MODALITIES,
        variants: {
            minimal: { thinkingLevel: "minimal" },
            low: { thinkingLevel: "low" },
            medium: { thinkingLevel: "medium" },
            high: { thinkingLevel: "high" },
        },
    },
    "gemini-3-pro-preview": {
        name: "Gemini 3 Pro Preview (Gemini CLI)",
        limit: { context: 1048576, output: 65535 },
        modalities: DEFAULT_MODALITIES,
    },
    "gemini-3.1-pro": {
        name: "Gemini 3.1 Pro (Gemini CLI)",
        limit: { context: 1048576, output: 65535 },
        modalities: DEFAULT_MODALITIES,
    },
    "gemini-3.1-pro-preview-customtools": {
        name: "Gemini 3.1 Pro Preview Custom Tools (Gemini CLI)",
        limit: { context: 1048576, output: 65535 },
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
        return { context: 200000, output: 64000 };
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
    if (normalized.startsWith("gemini-3") || normalized.startsWith("gemini-2.5")) {
        if (normalized.includes("pro")) {
            return {
                low: { thinkingLevel: "low" },
                high: { thinkingLevel: "high" },
            };
        }
        if (normalized.includes("flash")) {
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
        const modelId = antigravityModelIdFromEntry(sourceId, entry);
        if (!modelId)
            continue;
        const variants = defaultVariantsForModel(modelId);
        const discovered = {
            name: entry.displayName ? `${entry.displayName} (Antigravity)` : `${titleFromModelId(modelId)} (Antigravity)`,
            limit: defaultLimitForModel(modelId),
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