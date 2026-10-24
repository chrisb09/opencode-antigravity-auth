import type { Credential } from "@opencode/plugin";
import { parseRefreshParts } from "../src/plugin/auth";
import { loadAccounts, saveAccountsReplace, type AccountStorageV4 } from "../src/plugin/storage";

function credentialIdentity(credential: Credential.Value, label?: string): {
  email: string | undefined;
  refreshToken: string;
  projectId: string | undefined;
  managedProjectId: string | undefined;
} | null {
  if (credential.type !== "oauth") return null;
  const parts = parseRefreshParts(credential.refresh);
  if (!parts.refreshToken) return null;
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

async function findAccountIndex(
  storage: AccountStorageV4,
  identity: { email?: string; refreshToken: string },
): Promise<number> {
  if (identity.email) {
    const byEmail = storage.accounts.findIndex((account) => account.email === identity.email);
    if (byEmail >= 0) return byEmail;
  }
  return storage.accounts.findIndex((account) => account.refreshToken === identity.refreshToken);
}

export async function syncCredentialToDisk(
  credential: Credential.Value,
  label?: string,
  options: { replaceTokens?: boolean } = {},
): Promise<void> {
  const identity = credentialIdentity(credential, label);
  if (!identity) return;

  const storage = (await loadAccounts()) ?? { version: 4, accounts: [], activeIndex: 0 };
  const index = await findAccountIndex(storage, identity);
  const now = Date.now();

  if (index >= 0) {
    const existing = storage.accounts[index]!;
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
  } else {
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

export async function activateCredentialOnDisk(
  credential: Credential.Value,
  label?: string,
  options: { replaceTokens?: boolean } = {},
): Promise<void> {
  await syncCredentialToDisk(credential, label, options);
  const identity = credentialIdentity(credential, label);
  if (!identity) return;

  const storage = await loadAccounts();
  if (!storage) return;
  const index = await findAccountIndex(storage, identity);
  if (index < 0) return;

  storage.activeIndex = index;
  storage.activeIndexByFamily = { claude: index, gemini: index };
  await saveAccountsReplace(storage);
}

export interface CredentialConnection {
  type: string;
  id: string;
  label: string;
}

/**
 * Finds the V2 credential connection matching a disk account email. V2 OAuth
 * credentials use the account email as their connection label.
 */
export function findCredentialIDForEmail(
  connections: readonly CredentialConnection[],
  email?: string,
): string | undefined {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return undefined;

  return connections.find(
    (connection) =>
      connection.type === "credential" &&
      connection.label.trim().toLowerCase() === normalized,
  )?.id;
}
