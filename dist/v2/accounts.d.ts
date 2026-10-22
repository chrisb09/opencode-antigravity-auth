import type { Credential } from "@opencode/plugin";
export declare function syncCredentialToDisk(credential: Credential.Value, label?: string, options?: {
    replaceTokens?: boolean;
}): Promise<void>;
export declare function activateCredentialOnDisk(credential: Credential.Value, label?: string, options?: {
    replaceTokens?: boolean;
}): Promise<void>;
//# sourceMappingURL=accounts.d.ts.map