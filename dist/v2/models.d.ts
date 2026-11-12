import { type OpencodeModelDefinition } from "../src/plugin/config/models.js";
export declare const DEPRECATED_GEMINI_MODEL_IDS: Set<string>;
export declare function v2ModelDefinitions(): Array<[string, OpencodeModelDefinition]>;
/**
 * Deprecated model ids kept as selectable compat aliases: hidden from the
 * default picker (status "deprecated") but still routable when explicitly
 * requested, so previously-configured model strings keep working.
 */
export declare function v2CompatModelDefinitions(): Array<[string, OpencodeModelDefinition]>;
//# sourceMappingURL=models.d.ts.map