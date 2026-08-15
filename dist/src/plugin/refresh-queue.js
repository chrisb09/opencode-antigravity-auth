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
import { refreshAccessToken } from "./token";
import { createLogger } from "./logger";
const log = createLogger("refresh-queue");
export const DEFAULT_PROACTIVE_REFRESH_CONFIG = {
    enabled: true,
    bufferSeconds: 1800, // 30 minutes
    checkIntervalSeconds: 300, // 5 minutes
};
/**
 * Number of consecutive proactive-refresh failures before an account is put
 * into a backoff window. Prevents a revoked-but-unexpired token from retrying
 * every check cycle forever.
 */
const MAX_CONSECUTIVE_REFRESH_FAILURES = 3;
/** Base backoff window applied once an account crosses the failure threshold. */
const REFRESH_BACKOFF_BASE_MS = 15 * 60 * 1000; // 15 minutes
/** Upper bound on the escalating backoff window. */
const REFRESH_BACKOFF_MAX_MS = 6 * 60 * 60 * 1000; // 6 hours
/**
 * Proactive Token Refresh Queue
 *
 * Runs in the background and proactively refreshes tokens before they expire.
 * This ensures that user requests never block on token refresh.
 *
 * All logging is silent by default - uses structured logger with TUI integration.
 */
export class ProactiveRefreshQueue {
    config;
    client;
    providerId;
    accountManager = null;
    /**
     * Per-account failure tracking, keyed by a stable identifier (email or refresh
     * token) rather than array index, so it survives account list reordering.
     */
    failureTracking = new Map();
    state = {
        isRunning: false,
        intervalHandle: null,
        isRefreshing: false,
        lastCheckTime: 0,
        lastRefreshTime: 0,
        refreshCount: 0,
        errorCount: 0,
    };
    constructor(client, providerId, config) {
        this.client = client;
        this.providerId = providerId;
        this.config = {
            ...DEFAULT_PROACTIVE_REFRESH_CONFIG,
            ...config,
        };
    }
    /**
     * Set the account manager to use for refresh operations.
     * Must be called before start().
     */
    setAccountManager(manager) {
        this.accountManager = manager;
    }
    /**
     * Check if a token needs proactive refresh.
     * Returns true if the token expires within the buffer period.
     */
    needsRefresh(account) {
        if (!account.expires) {
            // No expiry set - assume it's fine
            return false;
        }
        const now = Date.now();
        const bufferMs = this.config.bufferSeconds * 1000;
        const refreshThreshold = now + bufferMs;
        return account.expires <= refreshThreshold;
    }
    /**
     * Check if a token is already expired.
     */
    isExpired(account) {
        if (!account.expires) {
            return false;
        }
        return account.expires <= Date.now();
    }
    /**
     * Get all accounts that need proactive refresh.
     */
    getAccountsNeedingRefresh() {
        if (!this.accountManager) {
            return [];
        }
        return this.accountManager.getAccounts().filter((account) => {
            // Skip disabled accounts - they shouldn't receive proactive refresh
            if (account.enabled === false) {
                return false;
            }
            // Only refresh if not already expired (let the main flow handle expired tokens)
            if (this.isExpired(account)) {
                return false;
            }
            return this.needsRefresh(account);
        });
    }
    /**
     * Derive a stable identifier for an account for failure tracking.
     * Prefers email, falls back to refresh token, then to index.
     */
    getAccountKey(account) {
        return account.email ?? account.parts?.refreshToken ?? `index:${account.index}`;
    }
    /**
     * Drop failure-tracking entries that no longer correspond to any current
     * account identity. Accounts can be removed (or churned via manager
     * replacement) after failing; without pruning, their email/token keys would
     * linger in this long-lived map forever. Cheap O(accounts + entries) set-diff.
     */
    pruneFailureTracking() {
        if (this.failureTracking.size === 0 || !this.accountManager) {
            return;
        }
        const liveKeys = new Set(this.accountManager.getAccounts().map((account) => this.getAccountKey(account)));
        for (const key of this.failureTracking.keys()) {
            if (!liveKeys.has(key)) {
                this.failureTracking.delete(key);
            }
        }
    }
    /**
     * Whether the account is currently in a proactive-refresh backoff window.
     */
    isInRefreshBackoff(account, now) {
        const state = this.failureTracking.get(this.getAccountKey(account));
        return state !== undefined && state.skipUntil > now;
    }
    /**
     * Clear failure tracking for an account after a successful refresh.
     *
     * A successful refresh may rotate the account's refresh token. For email-less
     * accounts the tracking key IS the refresh token, so the key derived after the
     * update differs from the one the failure was recorded under. Pass the
     * pre-update key so both the old and new keys are cleared and no stale entry
     * is orphaned.
     */
    recordRefreshSuccess(account, previousKey) {
        this.failureTracking.delete(this.getAccountKey(account));
        if (previousKey !== undefined) {
            this.failureTracking.delete(previousKey);
        }
    }
    /**
     * Record a failed proactive refresh. After the threshold is crossed, the
     * account is skipped for an escalating backoff window.
     */
    recordRefreshFailure(account, now) {
        const key = this.getAccountKey(account);
        const state = this.failureTracking.get(key) ?? { consecutiveFailures: 0, skipUntil: 0 };
        state.consecutiveFailures += 1;
        if (state.consecutiveFailures >= MAX_CONSECUTIVE_REFRESH_FAILURES) {
            const exponent = state.consecutiveFailures - MAX_CONSECUTIVE_REFRESH_FAILURES;
            const backoffMs = Math.min(REFRESH_BACKOFF_MAX_MS, REFRESH_BACKOFF_BASE_MS * 2 ** exponent);
            state.skipUntil = now + backoffMs;
            log.warn("Account entering proactive-refresh backoff", {
                accountIndex: account.index,
                email: account.email ?? "unknown",
                consecutiveFailures: state.consecutiveFailures,
                backoffMinutes: Math.round(backoffMs / 60000),
            });
        }
        this.failureTracking.set(key, state);
    }
    /**
     * Perform a single refresh check iteration.
     * This is called periodically by the background interval.
     */
    async runRefreshCheck() {
        if (this.state.isRefreshing) {
            // Already refreshing - skip this iteration
            return;
        }
        if (!this.accountManager) {
            return;
        }
        this.state.isRefreshing = true;
        this.state.lastCheckTime = Date.now();
        try {
            // Drop tracking for accounts that were removed since the last check.
            this.pruneFailureTracking();
            const accountsToRefresh = this.getAccountsNeedingRefresh();
            if (accountsToRefresh.length === 0) {
                return;
            }
            log.debug("Found accounts needing refresh", { count: accountsToRefresh.length });
            // Refresh accounts serially to avoid concurrent refresh storms
            for (const account of accountsToRefresh) {
                if (!this.state.isRunning) {
                    // Queue was stopped - abort
                    break;
                }
                // Skip accounts that are in a failure backoff window. This prevents a
                // revoked-but-unexpired token from being retried every cycle forever.
                if (this.isInRefreshBackoff(account, Date.now())) {
                    log.debug("Skipping account in proactive-refresh backoff", {
                        accountIndex: account.index,
                        email: account.email ?? "unknown",
                    });
                    continue;
                }
                try {
                    const auth = this.accountManager.toAuthDetails(account);
                    // Capture the tracking key BEFORE updateFromAuth, since a successful
                    // refresh can rotate the refresh token (the key for email-less accounts).
                    const keyBeforeUpdate = this.getAccountKey(account);
                    const refreshed = await this.refreshToken(auth, account);
                    if (refreshed) {
                        this.accountManager.updateFromAuth(account, refreshed);
                        this.recordRefreshSuccess(account, keyBeforeUpdate);
                        this.state.refreshCount++;
                        this.state.lastRefreshTime = Date.now();
                        // Persist the refreshed token
                        try {
                            await this.accountManager.saveToDisk();
                        }
                        catch {
                            // Non-fatal - token is refreshed in memory
                        }
                    }
                    else {
                        // A falsy result means the refresh did not succeed (e.g. a revoked
                        // token). Count it toward the backoff threshold.
                        this.state.errorCount++;
                        this.recordRefreshFailure(account, Date.now());
                        log.warn("Proactive refresh returned no token", {
                            accountIndex: account.index,
                            email: account.email ?? "unknown",
                        });
                    }
                }
                catch (error) {
                    this.state.errorCount++;
                    this.recordRefreshFailure(account, Date.now());
                    // Log but don't throw - continue with other accounts
                    log.warn("Failed to refresh account", {
                        accountIndex: account.index,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        }
        finally {
            this.state.isRefreshing = false;
        }
    }
    /**
     * Refresh a single token.
     */
    async refreshToken(auth, account) {
        const minutesUntilExpiry = account.expires
            ? Math.round((account.expires - Date.now()) / 60000)
            : "unknown";
        log.debug("Proactively refreshing token", {
            accountIndex: account.index,
            email: account.email ?? "unknown",
            minutesUntilExpiry,
        });
        return refreshAccessToken(auth, this.client, this.providerId);
    }
    /**
     * Start the background refresh queue.
     */
    start() {
        if (this.state.isRunning) {
            return;
        }
        if (!this.config.enabled) {
            log.debug("Proactive refresh disabled by config");
            return;
        }
        this.state.isRunning = true;
        const intervalMs = this.config.checkIntervalSeconds * 1000;
        log.debug("Started proactive refresh queue", {
            checkIntervalSeconds: this.config.checkIntervalSeconds,
            bufferSeconds: this.config.bufferSeconds,
        });
        // Run initial check after a short delay (let things settle)
        setTimeout(() => {
            if (this.state.isRunning) {
                this.runRefreshCheck().catch((error) => {
                    log.error("Initial check failed", {
                        error: error instanceof Error ? error.message : String(error),
                    });
                });
            }
        }, 5000);
        // Set up periodic checks
        this.state.intervalHandle = setInterval(() => {
            this.runRefreshCheck().catch((error) => {
                log.error("Check failed", {
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }, intervalMs);
    }
    /**
     * Stop the background refresh queue.
     */
    stop() {
        if (!this.state.isRunning) {
            return;
        }
        this.state.isRunning = false;
        if (this.state.intervalHandle) {
            clearInterval(this.state.intervalHandle);
            this.state.intervalHandle = null;
        }
        log.debug("Stopped proactive refresh queue", {
            refreshCount: this.state.refreshCount,
            errorCount: this.state.errorCount,
        });
    }
    /**
     * Get current queue statistics.
     */
    getStats() {
        return { ...this.state };
    }
    /**
     * Check if the queue is currently running.
     */
    isRunning() {
        return this.state.isRunning;
    }
}
/**
 * Create a proactive refresh queue instance.
 */
export function createProactiveRefreshQueue(client, providerId, config) {
    return new ProactiveRefreshQueue(client, providerId, config);
}
//# sourceMappingURL=refresh-queue.js.map