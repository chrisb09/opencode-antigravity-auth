import { describe, expect, it } from "vitest";
import { OPENCODE_MODEL_DEFINITIONS } from "../src/plugin/config/models";
import {
  DEPRECATED_GEMINI_MODEL_IDS,
  v2CompatModelDefinitions,
  v2ModelDefinitions,
} from "./models";

describe("V2 model catalog", () => {
  it("only references ids that are either defined or intentionally removed from the catalog", () => {
    // Deprecated ids may either still exist in the catalog (hidden from V2)
    // or have been removed entirely during consolidation; they must never
    // leak into the V2 picker either way.
    for (const id of DEPRECATED_GEMINI_MODEL_IDS) {
      expect(v2ModelDefinitions().some(([mid]) => mid === id), id).toBe(false);
    }
  });

  it("hides deprecated Gemini models from V2", () => {
    const ids = v2ModelDefinitions().map(([id]) => id);
    expect(ids).toEqual([
      "antigravity-gemini-3-flash",
      "gemini-3.8-flash",
      "antigravity-claude-sonnet-4-6",
      "antigravity-claude-opus-4-6-thinking",
      "gemini-2.5-flash",
      "gemini-3-flash-preview",
    ]);
  });

  it("keeps every non-deprecated catalog entry in V2", () => {
    const v2Ids = new Set(v2ModelDefinitions().map(([id]) => id));
    for (const id of Object.keys(OPENCODE_MODEL_DEFINITIONS)) {
      if (!DEPRECATED_GEMINI_MODEL_IDS.has(id)) {
        expect(v2Ids.has(id), id).toBe(true);
      }
    }
  });

  it("exposes every deprecated id as a compat alias definition", () => {
    const compatIds = v2CompatModelDefinitions().map(([id]) => id);
    expect(compatIds).toEqual([...DEPRECATED_GEMINI_MODEL_IDS].sort());
    for (const [, definition] of v2CompatModelDefinitions()) {
      expect(definition.limit.context).toBeGreaterThan(0);
      expect(definition.limit.output).toBeGreaterThan(0);
    }
  });
});
