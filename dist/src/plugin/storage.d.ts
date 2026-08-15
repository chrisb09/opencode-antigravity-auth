import type { HeaderStyle } from "../constants";
/**
 * Files/directories that should be gitignored in the config directory.
 * These contain sensitive data or machine-specific state.
 */
export declare const GITIGNORE_ENTRIES: string[];
/**
 * Ensures a .gitignore file exists in the config directory with entries
 * for sensitive files. Creates the file if missing, or appends missing
 * entries if it already exists.
 */
export declare function ensureGitignore(configDir: string): Promise<void>;
/**
 * Synchronous version of ensureGitignore for use in sync code paths.
 */
export declare function ensureGitignoreSync(configDir: string): void;
export type ModelFamily = "claude" | "gemini";
export type { HeaderStyle };
export interface RateLimitState {
    claude?: number;
    gemini?: number;
}
export interface RateLimitStateV3 {
    claude?: number;
    "gemini-antigravity"?: number;
    "gemini-cli"?: number;
    [key: string]: number | undefined;
}
export interface AccountMetadataV1 {
    email?: string;
    refreshToken: string;
    projectId?: string;
    managedProjectId?: string;
    addedAt: number;
    lastUsed: number;
    isRateLimited?: boolean;
    rateLimitResetTime?: number;
    lastSwitchReason?: "rate-limit" | "initial" | "rotation";
}
export interface AccountStorageV1 {
    version: 1;
    accounts: AccountMetadataV1[];
    activeIndex: number;
}
export interface AccountMetadata {
    email?: string;
    refreshToken: string;
    projectId?: string;
    managedProjectId?: string;
    addedAt: number;
    lastUsed: number;
    lastSwitchReason?: "rate-limit" | "initial" | "rotation";
    rateLimitResetTimes?: RateLimitState;
}
export interface AccountStorage {
    version: 2;
    accounts: AccountMetadata[];
    activeIndex: number;
}
export type CooldownReason = "auth-failure" | "network-error" | "project-error" | "validation-required";
export interface AccountMetadataV3 {
    email?: string;
    refreshToken: string;
    projectId?: string;
    managedProjectId?: string;
    addedAt: number;
    lastUsed: number;
    enabled?: boolean;
    lastSwitchReason?: "rate-limit" | "initial" | "rotation";
    rateLimitResetTimes?: RateLimitStateV3;
    /**
     * Per-quota-key SET timestamps (key -> setAt epoch ms). Lets mergeAccountStorage
     * order a limit against a clear (compare setAt vs clearedAt) so the LATEST mutation
     * wins regardless of which writer's snapshot arrives last.
     */
    rateLimitSetTimes?: Record<string, number>;
    /**
     * Per-quota-key clear markers (key -> clearedAt epoch ms). Lets mergeAccountStorage
     * distinguish "this pool's limit was intentionally cleared" from "this writer never
     * touched this pool", so a clear is not silently resurrected from on-disk state.
     */
    clearedQuotaKeys?: Record<string, number>;
    /**
     * Per-quota-key GENERATION each tombstone cleared (key -> the cleared limit's setAt).
     * A tombstone only supersedes a limit of that generation or older, so a stale process
     * that passively expires an OLD limit cannot erase a NEWER limit written elsewhere.
     */
    clearedSetTimes?: Record<string, number>;
    coolingDownUntil?: number;
    cooldownReason?: CooldownReason;
    /** Per-account device fingerprint for rate limit mitigation */
    fingerprint?: import("./fingerprint").Fingerprint;
    fingerprintHistory?: import("./fingerprint").FingerprintVersion[];
    /** Set when Google asks the user to verify this account before requests can continue. */
    verificationRequired?: boolean;
    verificationRequiredAt?: number;
    verificationRequiredReason?: string;
    verificationUrl?: string;
    /** Cached soft quota data */
    cachedQuota?: Record<string, {
        remainingFraction?: number;
        resetTime?: string;
        modelCount: number;
    }>;
    cachedQuotaUpdatedAt?: number;
}
export interface AccountStorageV3 {
    version: 3;
    accounts: AccountMetadataV3[];
    activeIndex: number;
    activeIndexByFamily?: {
        claude?: number;
        gemini?: number;
    };
}
export interface AccountStorageV4 {
    version: 4;
    accounts: AccountMetadataV3[];
    activeIndex: number;
    deletedRefreshTokenHashes?: string[];
    activeIndexByFamily?: {
        claude?: number;
        gemini?: number;
    };
}
/**
 * Gets the config directory path, with the following precedence:
 * 1. OPENCODE_CONFIG_DIR env var (if set)
 * 2. ~/.config/opencode (all platforms, including Windows)
 *
 * On Windows, also checks for legacy %APPDATA%\opencode path for migration.
 */
declare function getConfigDir(): string;
export declare function getStoragePath(): string;
/**
 * Gets the config directory path. Exported for use by other modules.
 */
export { getConfigDir };
export declare function deduplicateAccountsByEmail<T extends {
    email?: string;
    lastUsed?: number;
    addedAt?: number;
}>(accounts: T[]): T[];
export declare function migrateV2ToV3(v2: AccountStorage): AccountStorageV3;
export declare function migrateV3ToV4(v3: AccountStorageV3): AccountStorageV4;
export declare function loadAccounts(): Promise<AccountStorageV4 | null>;
export declare function saveAccounts(storage: AccountStorageV4): Promise<void>;
/**
 * Save accounts storage by replacing the entire file (no merge).
 * Use this for destructive operations like delete where we need to
 * remove accounts that would otherwise be merged back from existing storage.
 */
export declare function saveAccountsReplace(storage: AccountStorageV4): Promise<void>;
export declare function removeAccountFromStorage(refreshToken: string): Promise<void>;
export declare function clearAccounts(): Promise<void>;
//# sourceMappingURL=storage.d.ts.map