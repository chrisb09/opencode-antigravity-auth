import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activateCredentialOnDisk, syncCredentialToDisk } from "./accounts";
import type { AccountStorageV4 } from "../src/plugin/storage";

let root: string;
let originalXdg: string | undefined;

function storagePath(): string {
  return join(root, "opencode", "antigravity-accounts.json");
}

async function readStorage(): Promise<AccountStorageV4> {
  return JSON.parse(await readFile(storagePath(), "utf8")) as AccountStorageV4;
}

async function writeStorage(storage: AccountStorageV4): Promise<void> {
  await mkdir(join(root, "opencode"), { recursive: true });
  await writeFile(storagePath(), JSON.stringify(storage, null, 2));
}

function credential(email: string, refresh: string, projectId?: string, managedProjectId?: string) {
  const packed = [refresh, projectId ?? "", managedProjectId ?? ""].join("|");
  return {
    type: "oauth" as const,
    methodID: "oauth" as never,
    refresh: packed,
    access: "access",
    expires: 0,
    metadata: { email },
  };
}

beforeEach(async () => {
  originalXdg = process.env.XDG_CONFIG_HOME;
  root = await mkdtemp(join(tmpdir(), "antigravity-v2-accounts-"));
  process.env.XDG_CONFIG_HOME = root;
});

afterEach(async () => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  await rm(root, { recursive: true, force: true });
});

describe("V2 credential to account-pool sync", () => {
  it("adds a credential with packed project metadata", async () => {
    await syncCredentialToDisk(credential("one@example.com", "refresh-one", "project", "managed"));

    const storage = await readStorage();
    expect(storage.accounts).toHaveLength(1);
    expect(storage.accounts[0]).toMatchObject({
      email: "one@example.com",
      refreshToken: "refresh-one",
      projectId: "project",
      managedProjectId: "managed",
      enabled: true,
    });
  });

  it("replaces tokens by email without duplicating the account when requested", async () => {
    await writeStorage({
      version: 4,
      activeIndex: 0,
      accounts: [
        {
          email: "one@example.com",
          refreshToken: "old-refresh",
          addedAt: 1,
          lastUsed: 1,
          enabled: true,
        },
      ],
    });

    await syncCredentialToDisk(credential("one@example.com", "new-refresh"), undefined, {
      replaceTokens: true,
    });

    const storage = await readStorage();
    expect(storage.accounts).toHaveLength(1);
    expect(storage.accounts[0]).toMatchObject({
      email: "one@example.com",
      refreshToken: "new-refresh",
      addedAt: 1,
    });
  });

  it("preserves the disk refresh token by default", async () => {
    await writeStorage({
      version: 4,
      activeIndex: 0,
      accounts: [
        {
          email: "one@example.com",
          refreshToken: "refreshed-by-v1",
          addedAt: 1,
          lastUsed: 1,
          enabled: true,
        },
      ],
    });

    await syncCredentialToDisk(credential("one@example.com", "stale-v2-token"));

    const storage = await readStorage();
    expect(storage.accounts).toHaveLength(1);
    expect(storage.accounts[0]?.refreshToken).toBe("refreshed-by-v1");
  });

  it("sets the active account and both family cursors", async () => {
    await writeStorage({
      version: 4,
      activeIndex: 0,
      accounts: [
        { email: "one@example.com", refreshToken: "refresh-one", addedAt: 1, lastUsed: 1 },
        { email: "two@example.com", refreshToken: "refresh-two", addedAt: 2, lastUsed: 2 },
      ],
    });

    await activateCredentialOnDisk(credential("two@example.com", "refresh-two"));

    const storage = await readStorage();
    expect(storage.activeIndex).toBe(1);
    expect(storage.activeIndexByFamily).toEqual({ claude: 1, gemini: 1 });
  });

  it("adds and activates a new credential", async () => {
    await activateCredentialOnDisk(credential("new@example.com", "refresh-new"));

    const storage = await readStorage();
    expect(storage.accounts).toHaveLength(1);
    expect(storage.activeIndex).toBe(0);
    expect(storage.accounts[0]?.email).toBe("new@example.com");
  });
});
