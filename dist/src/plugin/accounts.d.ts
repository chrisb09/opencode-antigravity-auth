import { type AccountStorageV4, type AccountMetadataV3, type RateLimitStateV3, type ModelFamily, type HeaderStyle, type CooldownReason } from "./storage";
import type { OAuthAuthDetails, RefreshParts } from "./types";
import type { AccountSelectionStrategy } from "./config/schema";
import { type Fingerprint, type FingerprintVersion } from "./fingerprint";
import type { QuotaGroup, QuotaGroupSummary } from "./quota";
export type { ModelFamily, HeaderStyle, CooldownReason } from "./storage";
export type { AccountSelectionStrategy } from "./config/schema";
export type RateLimitReason = "QUOTA_EXHAUSTED" | "RATE_LIMIT_EXCEEDED" | "MODEL_CAPACITY_EXHAUSTED" | "SERVER_ERROR" | "UNKNOWN";
export interface RateLimitBackoffResult {
    backoffMs: number;
    reason: RateLimitReason;
}
/**
 * How long a per-key rate-limit clear marker stays authoritative. After this
 * window the marker is pruned so clearedQuotaKeys cannot grow unbounded and a
 * very stale clear can no longer wipe a limit legitimately written elsewhere.
 * Comfortably longer than the debounced-save window (seconds), so multi-instance
 * syncs always observe the clear.
 */
export declare const RATE_LIMIT_CLEAR_TTL_MS: number;
export declare function parseRateLimitReason(reason: string | undefined, message: string | undefined, status?: number): RateLimitReason;
export declare function calculateBackoffMs(reason: RateLimitReason, consecutiveFailures: number, retryAfterMs?: number | null): number;
export type BaseQuotaKey = "claude" | "gemini-antigravity" | "gemini-cli";
export type QuotaKey = BaseQuotaKey | `${BaseQuotaKey}:${string}`;
export interface ManagedAccount {
    index: number;
    email?: string;
    addedAt: number;
    lastUsed: number;
    parts: RefreshParts;
    access?: string;
    expires?: number;
    enabled: boolean;
    rateLimitResetTimes: RateLimitStateV3;
    /**
     * Per-quota-key SET timestamps (key -> setAt epoch ms), recorded whenever a limit
     * is written. Lets the merge resolve conflicts by MUTATION ORDER (compare setAt vs
     * clearedAt — latest wins) instead of by writer direction. The reset time cannot
     * establish order because it is a future timestamp.
     */
    rateLimitSetTimes: Record<string, number>;
    /**
     * Per-quota-key clear markers (key -> clearedAt epoch ms). Records that a rate
     * limit for a given pool was intentionally removed in memory, so a per-key merge
     * with on-disk state can drop the stale limit instead of resurrecting it. A full
     * snapshot alone cannot distinguish "untouched" from "cleared".
     */
    clearedQuotaKeys: Record<string, number>;
    /**
     * Per-quota-key GENERATION a tombstone cleared (key -> the cleared limit's setAt).
     * A clear only supersedes a limit of that generation OR OLDER. This prevents a
     * stale process that passively expires an OLD limit (recording clearedAt=now) from
     * erasing a NEWER limit another process wrote in the meantime — the newer limit has
     * a setAt greater than what this tombstone cleared, so the limit wins.
     */
    clearedSetTimes: Record<string, number>;
    lastSwitchReason?: "rate-limit" | "initial" | "rotation";
    coolingDownUntil?: number;
    cooldownReason?: CooldownReason;
    touchedForQuota: Record<string, number>;
    consecutiveFailures?: number;
    /** Timestamp of last failure for TTL-based reset of consecutiveFailures */
    lastFailureTime?: number;
    /** Per-account device fingerprint for rate limit mitigation */
    fingerprint?: import("./fingerprint").Fingerprint;
    /** History of previous fingerprints for this account */
    fingerprintHistory?: FingerprintVersion[];
    /** Cached quota data from last checkAccountsQuota() call */
    cachedQuota?: Partial<Record<QuotaGroup, QuotaGroupSummary>>;
    cachedQuotaUpdatedAt?: number;
    verificationRequired?: boolean;
    verificationRequiredAt?: number;
    verificationRequiredReason?: string;
    verificationUrl?: string;
}
/**
 * Resolve the quota group for soft quota checks.
 *
 * When a model string is available, we can precisely determine the quota group.
 * When model is null/undefined, we fall back based on family:
 * - Claude → "claude" quota group
 * - Gemini → "gemini-pro" (conservative fallback; may misclassify flash models)
 *
 * @param family - The model family ("claude" | "gemini")
 * @param model - Optional model string for precise resolution
 * @returns The QuotaGroup to use for soft quota checks
 */
export declare function resolveQuotaGroup(family: ModelFamily, model?: string | null): QuotaGroup;
export declare function computeSoftQuotaCacheTtlMs(ttlConfig: "auto" | number, refreshIntervalMinutes: number): number;
/**
 * In-memory multi-account manager with sticky account selection.
 *
 * Uses the same account until it hits a rate limit (429), then switches.
 * Rate limits are tracked per-model-family (claude/gemini) so an account
 * rate-limited for Claude can still be used for Gemini.
 *
 * Source of truth for the pool is `antigravity-accounts.json`.
 */
export declare class AccountManager {
    private accounts;
    private cursor;
    private currentAccountIndexByFamily;
    private sessionOffsetApplied;
    private lastToastAccountIndex;
    private lastToastTime;
    private savePending;
    private saveTimeout;
    private savePromiseResolvers;
    private saveQueue;
    /** Tracks an in-flight disk write so flushSaveToDisk can await a write that has
     * already started (savePending is cleared before the write settles). */
    private activeSave;
    static loadFromDisk(authFallback?: OAuthAuthDetails): Promise<AccountManager>;
    constructor(authFallback?: OAuthAuthDetails, stored?: AccountStorageV4 | null);
    getAccountCount(): number;
    getTotalAccountCount(): number;
    getEnabledAccounts(): ManagedAccount[];
    getAccountsSnapshot(): ManagedAccount[];
    getCurrentAccountForFamily(family: ModelFamily): ManagedAccount | null;
    /**
     * Check if we should show an account switch toast.
     * Debounces repeated toasts for the same account.
     */
    shouldShowAccountToast(accountIndex: number, debounceMs?: number): boolean;
    markToastShown(accountIndex: number): void;
    getCurrentOrNextForFamily(family: ModelFamily, model?: string | null, strategy?: AccountSelectionStrategy, headerStyle?: HeaderStyle, pidOffsetEnabled?: boolean, softQuotaThresholdPercent?: number, softQuotaCacheTtlMs?: number, excludeIndices?: Set<number>): ManagedAccount | null;
    getNextForFamily(family: ModelFamily, model?: string | null, headerStyle?: HeaderStyle, softQuotaThresholdPercent?: number, softQuotaCacheTtlMs?: number, excludeIndices?: Set<number>): ManagedAccount | null;
    markRateLimited(account: ManagedAccount, retryAfterMs: number, family: ModelFamily, headerStyle?: HeaderStyle, model?: string | null): void;
    /**
     * Mark an account as used after a successful API request.
     * This updates the lastUsed timestamp for freshness calculations.
     * Should be called AFTER request completion, not during account selection.
     */
    markAccountUsed(accountIndex: number): void;
    markRateLimitedWithReason(account: ManagedAccount, family: ModelFamily, headerStyle: HeaderStyle, model: string | null | undefined, reason: RateLimitReason, retryAfterMs?: number | null, failureTtlMs?: number): number;
    markRequestSuccess(account: ManagedAccount): void;
    clearAllRateLimitsForFamily(family: ModelFamily, model?: string | null): void;
    shouldTryOptimisticReset(family: ModelFamily, model?: string | null): boolean;
    markAccountCoolingDown(account: ManagedAccount, cooldownMs: number, reason: CooldownReason): void;
    isAccountCoolingDown(account: ManagedAccount): boolean;
    clearAccountCooldown(account: ManagedAccount): void;
    getAccountCooldownReason(account: ManagedAccount): CooldownReason | undefined;
    markTouchedForQuota(account: ManagedAccount, quotaKey: string): void;
    isFreshForQuota(account: ManagedAccount, quotaKey: string): boolean;
    getFreshAccountsForQuota(quotaKey: string, family: ModelFamily, model?: string | null): ManagedAccount[];
    isRateLimitedForHeaderStyle(account: ManagedAccount, family: ModelFamily, headerStyle: HeaderStyle, model?: string | null): boolean;
    getAvailableHeaderStyle(account: ManagedAccount, family: ModelFamily, model?: string | null): HeaderStyle | null;
    /**
     * Check if any OTHER account has antigravity quota available for the given family/model.
     *
     * Used to determine whether to switch accounts vs fall back to gemini-cli:
     * - If true: Switch to another account (preserve antigravity priority)
     * - If false: All accounts exhausted antigravity, safe to fall back to gemini-cli
     *
     * @param currentAccountIndex - Index of the current account (will be excluded from check)
     * @param family - Model family ("gemini" or "claude")
     * @param model - Optional model name for model-specific rate limits
     * @returns true if any other enabled, non-cooling-down account has antigravity available
     */
    hasOtherAccountWithAntigravityAvailable(currentAccountIndex: number, family: ModelFamily, model?: string | null): boolean;
    setAccountEnabled(accountIndex: number, enabled: boolean): boolean;
    markAccountVerificationRequired(accountIndex: number, reason?: string, verifyUrl?: string): boolean;
    clearAccountVerificationRequired(accountIndex: number, enableAccount?: boolean): boolean;
    removeAccountByIndex(accountIndex: number): boolean;
    removeAccount(account: ManagedAccount): boolean;
    updateFromAuth(account: ManagedAccount, auth: OAuthAuthDetails): void;
    toAuthDetails(account: ManagedAccount): OAuthAuthDetails;
    getMinWaitTimeForFamily(family: ModelFamily, model?: string | null, headerStyle?: HeaderStyle, strict?: boolean): number;
    getAccounts(): ManagedAccount[];
    saveToDisk(replace?: boolean): Promise<void>;
    /**
     * Build the persisted clearedQuotaKeys map for an account. Prunes IN PLACE (so a
     * long-running process cannot accumulate markers forever): drops markers past the
     * TTL and any key that currently holds a live limit (the limit is the newer signal
     * and supersedes the clear). Returns undefined when empty so we do not bloat the
     * file with empty objects.
     */
    private serializeClearedQuotaKeys;
    /**
     * Build the persisted clearedSetTimes map (tombstone generations). Prunes IN PLACE:
     * keeps a generation only while its key is a live tombstone. Returns undefined empty.
     */
    private serializeClearedSetTimes;
    /**
     * Build the persisted rateLimitSetTimes map for an account. Prunes IN PLACE: keeps
     * a set timestamp only while its key still holds a live limit (once cleared the
     * timestamp is dead). Returns undefined when empty.
     */
    private serializeRateLimitSetTimes;
    private createStorageSnapshot;
    persistAccountRemoval(refreshToken: string): Promise<void>;
    private enqueueStorageOperation;
    private resolveSavePromises;
    requestSaveToDisk(): void;
    flushSaveToDisk(): Promise<void>;
    private executeSave;
    /**
     * Regenerate fingerprint for an account, saving the old one to history.
     * @param accountIndex - Index of the account to regenerate fingerprint for
     * @returns The new fingerprint, or null if account not found
     */
    regenerateAccountFingerprint(accountIndex: number): Fingerprint | null;
    /**
     * Restore a fingerprint from history for an account.
     * @param accountIndex - Index of the account
     * @param historyIndex - Index in the fingerprint history to restore from (0 = most recent)
     * @returns The restored fingerprint, or null if account/history not found
     */
    restoreAccountFingerprint(accountIndex: number, historyIndex: number): Fingerprint | null;
    /**
     * Get fingerprint history for an account.
     * @param accountIndex - Index of the account
     * @returns Array of fingerprint versions, or empty array if not found
     */
    getAccountFingerprintHistory(accountIndex: number): FingerprintVersion[];
    updateQuotaCache(accountIndex: number, quotaGroups: Partial<Record<QuotaGroup, QuotaGroupSummary>>): void;
    isAccountOverSoftQuota(account: ManagedAccount, family: ModelFamily, thresholdPercent: number, cacheTtlMs: number, model?: string | null, headerStyle?: HeaderStyle): boolean;
    getAccountsForQuotaCheck(): AccountMetadataV3[];
    getOldestQuotaCacheAge(): number | null;
    areAllAccountsOverSoftQuota(family: ModelFamily, thresholdPercent: number, cacheTtlMs: number, model?: string | null, headerStyle?: HeaderStyle): boolean;
    /**
     * Get minimum wait time until any account's soft quota resets.
     * Returns 0 if any account is available (not over threshold).
     * Returns the minimum resetTime across all over-threshold accounts.
     * Returns null if no resetTime data is available.
     */
    getMinWaitTimeForSoftQuota(family: ModelFamily, thresholdPercent: number, cacheTtlMs: number, model?: string | null, headerStyle?: HeaderStyle): number | null;
}
//# sourceMappingURL=accounts.d.ts.map