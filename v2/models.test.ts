import { describe, expect, it } from "vitest";
import { OPENCODE_MODEL_DEFINITIONS } from "../src/plugin/config/models";
import { DEPRECATED_GEMINI_MODEL_IDS, v2ModelDefinitions } from "./models";

describe("V2 model catalog", () => {
  it("only references real model definitions", () => {
    for (const id of DEPRECATED_GEMINI_MODEL_IDS) {
      expect(OPENCODE_MODEL_DEFINITIONS[id], id).toBeDefined();
    }
  });

  it("hides deprecated Gemini models from V2", () => {
    const ids = v2ModelDefinitions().map(([id]) => id);
    expect(ids).toEqual([
      "antigravity-gemini-3-flash",
      "antigravity-gemini-3.8-flash",
      "antigravity-claude-sonnet-4-6",
      "antigravity-claude-opus-4-6-thinking",
      "gemini-2.5-flash",
      "gemini-3-flash-preview",
      "gemini-3.8-flash",
    ]);
  });
});
