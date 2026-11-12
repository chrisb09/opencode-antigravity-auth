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
});
