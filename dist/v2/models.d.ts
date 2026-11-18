import { type OpencodeModelDefinition } from "../src/plugin/config/models.js";
/**
 * Model ids kept out of the default V2 picker but still routable when
 * explicitly requested (registered with status "deprecated"), so
 * previously-configured model strings and forward-declared ids keep working.
 */
export declare const HIDDEN_MODEL_IDS: Set<string>;
export declare function v2ModelDefinitions(): Array<[string, OpencodeModelDefinition]>;
/**
 * Deprecated and prepared model ids exposed as selectable compat aliases:
 * hidden from the default picker (status "deprecated") but still routable
 * when explicitly requested, so previously-configured model strings and
 * forward-declared ids keep working.
 */
export declare function v2CompatModelDefinitions(): Array<[string, OpencodeModelDefinition]>;
//# sourceMappingURL=models.d.ts.map