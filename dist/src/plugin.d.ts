import { type HeaderStyle } from "./constants";
import { type ModelFamily } from "./plugin/accounts";
import { type AntigravityConfig } from "./plugin/config";
import type { AgySdkCredential } from "./plugin/api-key";
import type { PluginClient, PluginContext, PluginResult } from "./plugin/types";
declare function tryFetchWithAgySdkCredentials(input: RequestInfo, init: RequestInit | undefined, credentials: AgySdkCredential[], fallbackRetryAfterMs: number): Promise<Response | null>;
declare function trackWarmupAttempt(sessionId: string): boolean;
declare function getWarmupAttemptCount(sessionId: string): number;
declare function markWarmupSuccess(sessionId: string): void;
type VerificationProbeResult = {
    status: "ok" | "blocked" | "error";
    message: string;
    verifyUrl?: string;
};
declare function verifyAccountAccess(account: {
    refreshToken: string;
    email?: string;
    projectId?: string;
    managedProjectId?: string;
}, client: PluginClient, providerId: string): Promise<VerificationProbeResult>;
declare function createSoftQuotaBlockedResponse(input: {
    accountCount: number;
    family: ModelFamily;
    threshold: number;
    waitMs: number | null;
    requestedModel?: string;
}): Response;
/**
 * Whether an endpoint is usable for the given header style. Gemini CLI models
 * only work against the production endpoint — sandbox endpoints are skipped.
 * Mirrors the skip check in the endpoint-fallback loop.
 */
declare function isEndpointUsableForHeaderStyle(endpoint: string, headerStyle: HeaderStyle): boolean;
/**
 * Whether any endpoint after `index` in ANTIGRAVITY_ENDPOINT_FALLBACKS is usable
 * for the given header style. Used to decide, after capacity retries are
 * exhausted on the current endpoint, whether trying the next endpoint can make
 * progress or whether we must switch accounts instead.
 */
declare function hasUsableEndpointAfterIndex(index: number, headerStyle: HeaderStyle): boolean;
/**
 * Compute the new numeric index for a per-account state key after the account
 * at `removedIndex` has been spliced out and subsequent indices renumbered
 * down by one (see AccountManager.removeAccount). Returns null when the entry
 * belonged to the removed account and should be dropped.
 */
declare function remapIndexAfterRemoval(index: number, removedIndex: number): number | null;
/**
 * Remap a Set of numeric account indices in place after an account removal.
 * Drops the removed index and shifts higher indices down by one so the set
 * keeps referring to the same accounts after renumbering.
 */
declare function remapIndexSetAfterRemoval(set: Set<number>, removedIndex: number): void;
/**
 * Remap all module-level per-account state after the account at `removedIndex`
 * is removed from the pool. AccountManager.removeAccount() splices the account
 * out and renumbers every subsequent account's index down by one; index-keyed
 * state here must follow suit or it silently attaches to the wrong account.
 * Also folds in the old resetAllRateLimitStateForAccount cleanup (the removed
 * account's rate-limit entries are dropped).
 */
declare function remapAccountStateAfterRemoval(removedIndex: number): void;
/**
 * Test-only hooks. NOT part of the plugin's runtime surface — exported so unit
 * tests can exercise the pure loop-escape / index-remap / warmup helpers and
 * inspect the index-keyed module state they mutate. Kept in one object to avoid
 * scattering `export` across internal helpers.
 */
export declare const loopEscapeTestHooks: {
    hasUsableEndpointAfterIndex: typeof hasUsableEndpointAfterIndex;
    isEndpointUsableForHeaderStyle: typeof isEndpointUsableForHeaderStyle;
    resolveQuotaFallbackHeaderStyle: typeof resolveQuotaFallbackHeaderStyle;
    remapIndexAfterRemoval: typeof remapIndexAfterRemoval;
    remapIndexSetAfterRemoval: typeof remapIndexSetAfterRemoval;
    remapAccountStateAfterRemoval: typeof remapAccountStateAfterRemoval;
    trackWarmupAttempt: typeof trackWarmupAttempt;
    getWarmupAttemptCount: typeof getWarmupAttemptCount;
    markWarmupSuccess: typeof markWarmupSuccess;
    MAX_WARMUP_SESSIONS: number;
    seedAccountFailure(index: number, consecutiveFailures: number): void;
    getAccountFailureCount(index: number): number | undefined;
    seedRateLimitState(index: number, quotaKey: string, consecutive429: number): void;
    getRateLimitConsecutive(index: number, quotaKey: string): number | undefined;
    resetAllInternalState(): void;
};
/**
 * Creates an Antigravity OAuth plugin for a specific provider ID.
 */
export declare const createAntigravityPlugin: (providerId: string) => ({ client, directory }: PluginContext) => Promise<PluginResult>;
export declare const AntigravityCLIOAuthPlugin: ({ client, directory }: PluginContext) => Promise<PluginResult>;
export declare const GoogleOAuthPlugin: ({ client, directory }: PluginContext) => Promise<PluginResult>;
declare function resolveQuotaFallbackHeaderStyle(input: {
    family: ModelFamily;
    headerStyle: HeaderStyle;
    alternateStyle: HeaderStyle | null;
}): HeaderStyle | null;
type HeaderRoutingDecision = {
    cliFirst: boolean;
    preferredHeaderStyle: HeaderStyle;
    explicitQuota: boolean;
    allowQuotaFallback: boolean;
};
declare function resolveHeaderRoutingDecision(urlString: string, family: ModelFamily, config: AntigravityConfig): HeaderRoutingDecision;
declare function getHeaderStyleFromUrl(urlString: string, family: ModelFamily, cliFirst?: boolean): HeaderStyle;
export declare const __testExports: {
    getHeaderStyleFromUrl: typeof getHeaderStyleFromUrl;
    createSoftQuotaBlockedResponse: typeof createSoftQuotaBlockedResponse;
    tryFetchWithAgySdkCredentials: typeof tryFetchWithAgySdkCredentials;
    verifyAccountAccess: typeof verifyAccountAccess;
    resolveHeaderRoutingDecision: typeof resolveHeaderRoutingDecision;
    resolveQuotaFallbackHeaderStyle: typeof resolveQuotaFallbackHeaderStyle;
};
export {};
//# sourceMappingURL=plugin.d.ts.map