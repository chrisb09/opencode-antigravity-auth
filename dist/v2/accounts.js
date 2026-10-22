import { parseRefreshParts } from "../src/plugin/auth";
import { loadAccounts, saveAccountsReplace } from "../src/plugin/storage";
function credentialIdentity(credential, label) {
    if (credential.type !== "oauth")
        return null;
    const parts = parseRefreshParts(credential.refresh);
    if (!parts.refreshToken)
        return null;
    const metadata = credential.metadata ?? {};
    const metadataEmail = typeof metadata.email === "string" ? metadata.email : "";
    const email = metadataEmail || (label?.includes("@") ? label : "");
    return {
        email: email || undefined,
        refreshToken: parts.refreshToken,
        projectId: parts.projectId,
        managedProjectId: parts.managedProjectId,
    };
}
async function findAccountIndex(storage, identity) {
    if (identity.email) {
        const byEmail = storage.accounts.findIndex((account) => account.email === identity.email);
        if (byEmail >= 0)
            return byEmail;
    }
    return storage.accounts.findIndex((account) => account.refreshToken === identity.refreshToken);
}
export async function syncCredentialToDisk(credential, label, options = {}) {
    const identity = credentialIdentity(credential, label);
    if (!identity)
        return;
    const storage = (await loadAccounts()) ?? { version: 4, accounts: [], activeIndex: 0 };
    const index = await findAccountIndex(storage, identity);
    const now = Date.now();
    if (index >= 0) {
        const existing = storage.accounts[index];
        storage.accounts[index] = {
            ...existing,
            email: existing.email ?? identity.email,
            ...(options.replaceTokens
                ? {
                    refreshToken: identity.refreshToken,
                    projectId: identity.projectId ?? existing.projectId,
                    managedProjectId: identity.managedProjectId ?? existing.managedProjectId,
                }
                : {
                    projectId: existing.projectId ?? identity.projectId,
                    managedProjectId: existing.managedProjectId ?? identity.managedProjectId,
                }),
            lastUsed: now,
        };
    }
    else {
        storage.accounts.push({
            email: identity.email,
            refreshToken: identity.refreshToken,
            projectId: identity.projectId,
            managedProjectId: identity.managedProjectId,
            addedAt: now,
            lastUsed: now,
            enabled: true,
        });
    }
    await saveAccountsReplace(storage);
}
export async function activateCredentialOnDisk(credential, label, options = {}) {
    await syncCredentialToDisk(credential, label, options);
    const identity = credentialIdentity(credential, label);
    if (!identity)
        return;
    const storage = await loadAccounts();
    if (!storage)
        return;
    const index = await findAccountIndex(storage, identity);
    if (index < 0)
        return;
    storage.activeIndex = index;
    storage.activeIndexByFamily = { claude: index, gemini: index };
    await saveAccountsReplace(storage);
}
//# sourceMappingURL=accounts.js.map