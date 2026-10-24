import type { Credential } from "@opencode/plugin";
export declare function syncCredentialToDisk(credential: Credential.Value, label?: string, options?: {
    replaceTokens?: boolean;
}): Promise<void>;
export declare function activateCredentialOnDisk(credential: Credential.Value, label?: string, options?: {
    replaceTokens?: boolean;
}): Promise<void>;
export interface CredentialConnection {
    type: string;
    id: string;
    label: string;
}
/**
 * Finds the V2 credential connection matching a disk account email. V2 OAuth
 * credentials use the account email as their connection label.
 */
export declare function findCredentialIDForEmail(connections: readonly CredentialConnection[], email?: string): string | undefined;
//# sourceMappingURL=accounts.d.ts.map