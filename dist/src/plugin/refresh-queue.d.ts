/**
 * Proactive Token Refresh Queue
 *
 * Ported from LLM-API-Key-Proxy's BackgroundRefresher.
 *
 * This module provides background token refresh to ensure OAuth tokens
 * remain valid without blocking user requests. It periodically checks
 * all accounts and refreshes tokens that are approaching expiry.
 *
 * Features:
 * - Non-blocking background refresh (doesn't block requests)
 * - Configurable refresh buffer (default: 30 minutes before expiry)
 * - Configurable check interval (default: 5 minutes)
 * - Serialized refresh to prevent concurrent refresh storms
 * - Integrates with existing AccountManager and token refresh logic
 * - Silent operation: no console output, uses structured logger
 */
import type { AccountManager, ManagedAccount } from "./accounts";
import type { PluginClient } from "./types";
/** Configuration for the proactive refresh queue */
export interface ProactiveRefreshConfig {
    /** Enable proactive token refresh (default: true) */
    enabled: boolean;
    /** Seconds before expiry to trigger proactive refresh (default: 1800 = 30 minutes) */
    bufferSeconds: number;
    /** Interval between refresh checks in seconds (default: 300 = 5 minutes) */
    checkIntervalSeconds: number;
}
export declare const DEFAULT_PROACTIVE_REFRESH_CONFIG: ProactiveRefreshConfig;
/**
 * Proactive Token Refresh Queue
 *
 * Runs in the background and proactively refreshes tokens before they expire.
 * This ensures that user requests never block on token refresh.
 *
 * All logging is silent by default - uses structured logger with TUI integration.
 */
export declare class ProactiveRefreshQueue {
    private readonly config;
    private readonly client;
    private readonly providerId;
    private accountManager;
    /**
     * Per-account failure tracking, keyed by a stable identifier (email or refresh
     * token) rather than array index, so it survives account list reordering.
     */
    private readonly failureTracking;
    private state;
    constructor(client: PluginClient, providerId: string, config?: Partial<ProactiveRefreshConfig>);
    /**
     * Set the account manager to use for refresh operations.
     * Must be called before start().
     */
    setAccountManager(manager: AccountManager): void;
    /**
     * Check if a token needs proactive refresh.
     * Returns true if the token expires within the buffer period.
     */
    needsRefresh(account: ManagedAccount): boolean;
    /**
     * Check if a token is already expired.
     */
    isExpired(account: ManagedAccount): boolean;
    /**
     * Get all accounts that need proactive refresh.
     */
    getAccountsNeedingRefresh(): ManagedAccount[];
    /**
     * Derive a stable identifier for an account for failure tracking.
     * Prefers email, falls back to refresh token, then to index.
     */
    private getAccountKey;
    /**
     * Drop failure-tracking entries that no longer correspond to any current
     * account identity. Accounts can be removed (or churned via manager
     * replacement) after failing; without pruning, their email/token keys would
     * linger in this long-lived map forever. Cheap O(accounts + entries) set-diff.
     */
    private pruneFailureTracking;
    /**
     * Whether the account is currently in a proactive-refresh backoff window.
     */
    private isInRefreshBackoff;
    /**
     * Clear failure tracking for an account after a successful refresh.
     *
     * A successful refresh may rotate the account's refresh token. For email-less
     * accounts the tracking key IS the refresh token, so the key derived after the
     * update differs from the one the failure was recorded under. Pass the
     * pre-update key so both the old and new keys are cleared and no stale entry
     * is orphaned.
     */
    private recordRefreshSuccess;
    /**
     * Record a failed proactive refresh. After the threshold is crossed, the
     * account is skipped for an escalating backoff window.
     */
    private recordRefreshFailure;
    /**
     * Perform a single refresh check iteration.
     * This is called periodically by the background interval.
     */
    private runRefreshCheck;
    /**
     * Refresh a single token.
     */
    private refreshToken;
    /**
     * Start the background refresh queue.
     */
    start(): void;
    /**
     * Stop the background refresh queue.
     */
    stop(): void;
    /**
     * Get current queue statistics.
     */
    getStats(): {
        isRunning: boolean;
        isRefreshing: boolean;
        lastCheckTime: number;
        lastRefreshTime: number;
        refreshCount: number;
        errorCount: number;
    };
    /**
     * Check if the queue is currently running.
     */
    isRunning(): boolean;
}
/**
 * Create a proactive refresh queue instance.
 */
export declare function createProactiveRefreshQueue(client: PluginClient, providerId: string, config?: Partial<ProactiveRefreshConfig>): ProactiveRefreshQueue;
//# sourceMappingURL=refresh-queue.d.ts.map