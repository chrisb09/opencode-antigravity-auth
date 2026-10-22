import { OPENCODE_MODEL_DEFINITIONS, type OpencodeModelDefinition } from "../src/plugin/config/models.js";

export const DEPRECATED_GEMINI_MODEL_IDS = new Set([
  "antigravity-gemini-3-pro",
  "antigravity-gemini-3.1-pro",
  "antigravity-gemini-3.5-flash",
  "antigravity-gemini-3.6-flash",
  "antigravity-gemini-3.7-flash",
  "gemini-2.5-pro",
  "gemini-3-pro-preview",
  "gemini-3.1-pro",
  "gemini-3.1-pro-preview-customtools",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
]);

export function v2ModelDefinitions(): Array<[string, OpencodeModelDefinition]> {
  return Object.entries(OPENCODE_MODEL_DEFINITIONS).filter(
    ([id]) => !DEPRECATED_GEMINI_MODEL_IDS.has(id),
  );
}
