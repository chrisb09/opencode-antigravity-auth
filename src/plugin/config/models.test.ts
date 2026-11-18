import { describe, expect, it } from "vitest";

import {
  OPENCODE_MODEL_DEFINITIONS,
  modelsFromAntigravityAvailableModels,
  modelsFromGeminiApi,
} from "./models";

const getModel = (name: string) => {
  const model = OPENCODE_MODEL_DEFINITIONS[name];
  if (!model) {
    throw new Error(`Missing model definition for ${name}`);
  }
  return model;
};

describe("OPENCODE_MODEL_DEFINITIONS", () => {
  it("includes the full set of configured models", () => {
    const modelNames = Object.keys(OPENCODE_MODEL_DEFINITIONS).sort();

    expect(modelNames).toEqual([
      "antigravity-claude-opus-4-6-thinking",
      "antigravity-claude-sonnet-4-6",
      "antigravity-gemini-3-flash",
      "antigravity-gemini-4-hydrogen-sonar",
      "gemini-2.5-flash",
      "gemini-3-flash-preview",
      "gemini-3.8-flash",
    ]);
  });

  it("defines Gemini 3 variants for Antigravity models", () => {
    expect(getModel("antigravity-gemini-3-flash").variants).toEqual({
      minimal: { thinkingLevel: "minimal" },
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });

    // Canonical 3.8 Flash entry: low/medium/high only (agy serves no minimal
    // tier for 3.8), medium default.
    expect(getModel("gemini-3.8-flash").variants).toEqual({
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
  });

  it("uses the backend-reported 250k context for Claude models", () => {
    expect(getModel("antigravity-claude-sonnet-4-6").limit).toEqual({
      context: 250000,
      output: 64000,
    });
    expect(getModel("antigravity-claude-opus-4-6-thinking").limit).toEqual({
      context: 250000,
      output: 64000,
    });
  });

  it("defines thinking budget variants for Claude thinking models", () => {
    expect(getModel("antigravity-claude-opus-4-6-thinking").variants).toEqual({
      low: { thinkingConfig: { thinkingBudget: 8192 } },
      max: { thinkingConfig: { thinkingBudget: 32768 } },
    });
  });

  it("exposes the live-verified Gemini 4 Hydrogen Sonar entry with level variants", () => {
    const model = getModel("antigravity-gemini-4-hydrogen-sonar");
    expect(model.name).toBe("Gemini 4 Hydrogen Sonar (Antigravity)");
    expect(model.limit).toEqual({ context: 1048576, output: 65536 });
    expect(model.variants).toEqual({
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
  });
});

describe("dynamic model discovery helpers", () => {
  it("converts Gemini models.list metadata into OpenCode models", () => {
    const models = modelsFromGeminiApi([
      {
        name: "models/gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        inputTokenLimit: 1000,
        outputTokenLimit: 2000,
        supportedGenerationMethods: ["generateContent"],
      },
      {
        name: "models/text-embedding-004",
        displayName: "Text Embedding 004",
        supportedGenerationMethods: ["embedContent"],
      },
    ]);

    expect(models["gemini-2.5-flash"]).toMatchObject({
      name: "Gemini 2.5 Flash (Gemini API)",
      limit: { context: 1000, output: 2000 },
      modalities: { input: ["text", "image", "pdf"], output: ["text"] },
    });
    expect(models["text-embedding-004"]).toBeUndefined();
  });

  it("keeps Gemini models.list resource names distinct from shared base aliases", () => {
    const models = modelsFromGeminiApi([
      {
        name: "models/gemini-2.5-flash-001",
        baseModelId: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash 001",
        inputTokenLimit: 1000,
        outputTokenLimit: 2000,
        supportedGenerationMethods: ["generateContent"],
      },
      {
        name: "models/gemini-2.5-flash-002",
        baseModelId: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash 002",
        inputTokenLimit: 3000,
        outputTokenLimit: 4000,
        supportedGenerationMethods: ["generateContent"],
      },
    ]);

    expect(models["gemini-2.5-flash-001"]?.limit).toEqual({ context: 1000, output: 2000 });
    expect(models["gemini-2.5-flash-002"]?.limit).toEqual({ context: 3000, output: 4000 });
  });

  it("converts Antigravity available models while preserving curated variants and inferring dynamic ones", () => {
    const models = modelsFromAntigravityAvailableModels({
      "gemini-3-flash": {
        displayName: "Gemini 3 Flash",
        modelName: "gemini-3-flash",
      },
      "gemini-3.6-flash": {
        displayName: "Gemini 3.6 Flash",
        modelName: "gemini-3.6-flash",
      },
      "gemini-3.7-flash": {
        displayName: "Gemini 3.7 Flash",
        modelName: "gemini-3.7-flash",
      },
      "gemini-3.8-flash": {
        displayName: "Gemini 3.8 Flash",
        modelName: "gemini-3.8-flash",
      },
      "gemini-3.9-flash": {
        displayName: "Gemini 3.9 Flash Preview",
        modelName: "gemini-3.9-flash",
      },
      "gemini-3.9-pro": {
        displayName: "Gemini 3.9 Pro Preview",
        modelName: "gemini-3.9-pro",
      },
      "claude-sonnet-4-6": {
        displayName: "Claude Sonnet 4.6",
      },
    });

    expect(models["antigravity-gemini-3-flash"]?.variants).toEqual({
      minimal: { thinkingLevel: "minimal" },
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
    // 3.6/3.7 are no longer curated; discovered entries infer variants.
    expect(models["antigravity-gemini-3.6-flash"]?.variants).toEqual({
      minimal: { thinkingLevel: "minimal" },
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
    expect(models["antigravity-gemini-3.7-flash"]?.variants).toEqual({
      minimal: { thinkingLevel: "minimal" },
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
    // 3.8 infers low/medium/high (no minimal tier) via defaultVariantsForModel.
    expect(models["antigravity-gemini-3.8-flash"]?.variants).toEqual({
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
    // Inferred variants for dynamically discovered models not in static table
    expect(models["antigravity-gemini-3.9-flash"]?.variants).toEqual({
      minimal: { thinkingLevel: "minimal" },
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
    expect(models["antigravity-gemini-3.9-pro"]?.variants).toEqual({
      low: { thinkingLevel: "low" },
      high: { thinkingLevel: "high" },
    });
    expect(models["antigravity-claude-sonnet-4-6"]).toMatchObject({
      name: "Claude Sonnet 4.6 (Antigravity)",
      limit: { context: 250000, output: 64000 },
    });
  });

  it("skips disabled placeholder stubs and internal helper models", () => {
    // Observed in the real fetchAvailableModels response (2026-11-18): the
    // Gemini 4 lineup is announced as "-disabled"-suffixed placeholder rows
    // that 404 on generation, alongside internal chat_*/tab_* helpers.
    const models = modelsFromAntigravityAvailableModels({
      "gemini-4-carbon-disabled": {
        displayName: "Gemini 4 Carbon",
        disabled: true,
        maxTokens: 1048576,
        maxOutputTokens: 262144,
      },
      "gemini-4-neon-disabled": {
        displayName: "Gemini 4 Neon",
        disabled: true,
      },
      chat_20706: { isInternal: true, maxTokens: 16384 },
      tab_flash_lite_preview: { isInternal: true },
      "gemini-4-hydrogen-sonar": { maxTokens: 1048576, maxOutputTokens: 65536 },
    });

    expect(models["antigravity-gemini-4-carbon-disabled"]).toBeUndefined();
    expect(models["antigravity-gemini-4-neon-disabled"]).toBeUndefined();
    expect(models["antigravity-chat_20706"]).toBeUndefined();
    expect(models["antigravity-tab_flash_lite_preview"]).toBeUndefined();
    expect(models["antigravity-gemini-4-hydrogen-sonar"]).toBeDefined();
  });

  it("uses backend-reported token limits for discovered models", () => {
    const models = modelsFromAntigravityAvailableModels({
      "gemini-4-carbon": { maxTokens: 2097152, maxOutputTokens: 262144 },
      "claude-opus-5-5": { maxTokens: 250000, maxOutputTokens: 64000 },
      "some-unknown-model": {},
    });

    expect(models["antigravity-gemini-4-carbon"]?.limit).toEqual({
      context: 2097152,
      output: 262144,
    });
    expect(models["antigravity-claude-opus-5-5"]?.limit).toEqual({
      context: 250000,
      output: 64000,
    });
    // Falls back to the per-family defaults when the row lacks limits.
    expect(models["antigravity-some-unknown-model"]?.limit).toEqual({
      context: 1048576,
      output: 65536,
    });
  });

  it("infers thinkingLevel variants for discovered Gemini 4 models", () => {
    const models = modelsFromAntigravityAvailableModels({
      "gemini-4-carbon": { displayName: "Gemini 4 Carbon" },
    });

    expect(models["antigravity-gemini-4-carbon"]?.variants).toEqual({
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
  });
});
