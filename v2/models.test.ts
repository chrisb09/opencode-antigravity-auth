import { describe, expect, it } from "vitest";
import { OPENCODE_MODEL_DEFINITIONS, type OpencodeModelDefinition } from "../src/plugin/config/models";
import {
  HIDDEN_MODEL_IDS,
  v2CompatModelDefinitions,
  v2ModelDefinitions,
} from "./models";

describe("V2 model catalog", () => {
  it("only references ids that are either defined or intentionally removed from the catalog", () => {
    // Hidden ids may either still exist in the catalog (hidden from V2's
    // active list) or have been removed entirely during consolidation; they
    // must never leak into the V2 picker either way - only as compat aliases.
    for (const id of HIDDEN_MODEL_IDS) {
      expect(v2ModelDefinitions().some(([mid]) => mid === id), id).toBe(false);
    }
  });

  it("hides deprecated Claude 4.6 and prepared Gemini 4 / Claude 5.5 ids from V2", () => {
    const ids = v2ModelDefinitions().map(([id]) => id);
    expect(ids).toEqual([
      "antigravity-gemini-3-flash",
      "gemini-3.8-flash",
      "antigravity-gemini-4-hydrogen-sonar",
      "gemini-2.5-flash",
      "gemini-3-flash-preview",
    ]);  });

  it("hides deprecated and prepared ids behind the compat mechanism", () => {
    for (const id of [
      "antigravity-claude-sonnet-4-6",
      "antigravity-claude-opus-4-6-thinking",
      "antigravity-gemini-4-carbon",
      "antigravity-gemini-4-argon",
      "antigravity-gemini-4-hydrogen",
      "antigravity-gemini-4-neon",
      "antigravity-claude-sonnet-5-5",
      "antigravity-claude-opus-5-5-thinking",
    ]) {
      expect(HIDDEN_MODEL_IDS.has(id), id).toBe(true);
    }
  });

  it("keeps every non-hidden catalog entry in V2", () => {
    const v2Ids = new Set(v2ModelDefinitions().map(([id]) => id));
    for (const id of Object.keys(OPENCODE_MODEL_DEFINITIONS)) {
      if (!HIDDEN_MODEL_IDS.has(id)) {
        expect(v2Ids.has(id), id).toBe(true);
      }
    }
  });

  it("exposes every hidden id as a compat alias definition", () => {
    const compatIds = v2CompatModelDefinitions().map(([id]) => id);
    expect(compatIds).toEqual([...HIDDEN_MODEL_IDS].sort());
    for (const [, definition] of v2CompatModelDefinitions()) {
      expect(definition.limit.context).toBeGreaterThan(0);
      expect(definition.limit.output).toBeGreaterThan(0);
    }
  });

  it("gives Gemini 4 compat aliases level variants and Claude aliases budget variants", () => {
    const compatEntry = (id: string): OpencodeModelDefinition => {
      const entry = v2CompatModelDefinitions().find(([mid]) => mid === id);
      if (!entry) throw new Error(`Missing compat definition for ${id}`);
      return entry[1];
    };
    expect(compatEntry("antigravity-gemini-4-carbon").variants).toEqual({
      low: { thinkingLevel: "low" },
      medium: { thinkingLevel: "medium" },
      high: { thinkingLevel: "high" },
    });
    expect(compatEntry("antigravity-claude-sonnet-5-5").variants).toEqual({
      low: { thinkingConfig: { thinkingBudget: 8192 } },
      max: { thinkingConfig: { thinkingBudget: 32768 } },
    });
    // Claude quotas differ from Gemini context sizes.
    expect(compatEntry("antigravity-claude-sonnet-5-5").limit).toEqual({
      context: 250000,
      output: 64000,
    });
  });
});
