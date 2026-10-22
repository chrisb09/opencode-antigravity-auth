import { Plugin } from "@opencode/plugin/tui";
import { createAutoUpdateCheckerHook } from "../src/hooks/auto-update-checker/index.js";
import { __testExports } from "../src/plugin.js";
import { ANTIGRAVITY_PROVIDER_ID } from "../src/constants.js";
import { checkAccountsQuota, type AccountQuotaResult } from "../src/plugin/quota.js";
import { loadAccounts, saveAccounts } from "../src/plugin/storage.js";

const integrationID = "antigravity";

function quotaLine(result: AccountQuotaResult): string {
  const label = result.email || `Account ${result.index + 1}`;
  if (result.status === "error") return `${label}: ${result.error ?? "quota check failed"}`;
  const groups = result.quota?.groups ?? {};
  const parts = Object.entries(groups).map(([name, group]) => {
    const fraction = group?.remainingFraction;
    const percent = typeof fraction === "number" ? `${Math.round(fraction * 100)}%` : "?";
    return `${name} ${percent}`;
  });
  return `${label}${result.disabled ? " [disabled]" : ""}: ${parts.join(", ") || "no quota data"}`;
}

export default Plugin.define({
  id: "antigravity.tui",
  setup(context) {
    const announce = (event: { data: { integrationID?: string; label?: string } }) => {
      if (event.data.integrationID !== integrationID) return;
      context.ui.toast.show({
        title: "Antigravity",
        message: event.data.label ? `Account updated: ${event.data.label}` : "Account updated",
        variant: "success",
      });
    };

    // Adapt the V1 update checker to use V2 TUI toast.
    const fakeClient = {
      tui: {
        showToast: async (options: { body: { title?: string; message: string; variant: string; duration?: number } }) => {
          context.ui.toast.show({
            title: options.body.title ?? "Antigravity",
            message: options.body.message,
            variant: options.body.variant as "info" | "warning" | "success" | "error",
            duration: options.body.duration,
          });
        },
      },
    };
    const directory = (context as any).location?.directory ?? ".";
    const updateChecker = createAutoUpdateCheckerHook(fakeClient, directory, {
      showStartupToast: true,
      autoUpdate: true,
    });

    const switchAccount = async () => {
      const client = context.client as any;
      const entries = (await client.credential.list()) as any[];
      const connections = entries.filter((entry) => entry?.integrationID === integrationID);
      if (!connections.length) {
        context.ui.toast.show({
          title: "Antigravity",
          message: "No accounts connected. Use /connect to add one.",
          variant: "info",
        });
        return;
      }
      const selected = await context.ui.dialog.select({
        title: "Antigravity accounts",
        options: connections.map((entry: any) => ({
          title: entry.label || entry.id,
          value: entry.id,
          description: entry.active ? "Active account" : "Stored account",
        })),
      });
      if (!selected) return;
      await client.credential.activate({ credentialID: selected });
      context.ui.toast.show({
        title: "Antigravity",
        message: "Active account switched",
        variant: "success",
      });
    };

    const showQuota = async () => {
      const storage = await loadAccounts();
      if (!storage?.accounts.length) {
        context.ui.toast.show({
          title: "Antigravity",
          message: "No stored accounts found.",
          variant: "info",
        });
        return;
      }
      const results = await checkAccountsQuota(storage.accounts, {} as any);
      await context.ui.dialog.alert({
        title: "Antigravity quotas",
        message: results.map(quotaLine).join("\n"),
      });
    };

    const toggleAccount = async () => {
      const storage = await loadAccounts();
      if (!storage?.accounts.length) {
        context.ui.toast.show({
          title: "Antigravity",
          message: "No stored accounts found.",
          variant: "info",
        });
        return;
      }
      const selected = await context.ui.dialog.select({
        title: "Enable or disable account",
        options: storage.accounts.map((account, index) => ({
          title: account.email || `Account ${index + 1}`,
          value: index,
          description: account.enabled === false ? "Disabled" : "Enabled",
        })),
      });
      if (selected === undefined) return;
      const account = storage.accounts[selected];
      if (!account) return;
      account.enabled = account.enabled === false;
      await saveAccounts(storage);
      context.ui.toast.show({
        title: "Antigravity",
        message: `${account.email || `Account ${selected + 1}`} ${account.enabled ? "enabled" : "disabled"}`,
        variant: "success",
      });
    };

    const verifyAccount = async () => {
      const storage = await loadAccounts();
      if (!storage?.accounts.length) {
        context.ui.toast.show({
          title: "Antigravity",
          message: "No stored accounts found.",
          variant: "info",
        });
        return;
      }
      const selected = await context.ui.dialog.select({
        title: "Verify Antigravity account",
        options: storage.accounts.map((account, index) => ({
          title: account.email || `Account ${index + 1}`,
          value: index,
          description: account.enabled === false ? "Disabled" : "Enabled",
        })),
      });
      if (selected === undefined) return;
      const account = storage.accounts[selected];
      if (!account) return;
      const result = await __testExports.verifyAccountAccess(account, {} as any, ANTIGRAVITY_PROVIDER_ID);
      await context.ui.dialog.alert({
        title: "Antigravity verification",
        message: `${account.email || `Account ${selected + 1}`}: ${result.message}${result.verifyUrl ? `\n${result.verifyUrl}` : ""}`,
      });
    };

    const verifyAllAccounts = async () => {
      const storage = await loadAccounts();
      if (!storage?.accounts.length) {
        context.ui.toast.show({
          title: "Antigravity",
          message: "No stored accounts found.",
          variant: "info",
        });
        return;
      }
      const lines: string[] = [];
      for (const [index, account] of storage.accounts.entries()) {
        const label = account.email || `Account ${index + 1}`;
        const result = await __testExports.verifyAccountAccess(account, {} as any, ANTIGRAVITY_PROVIDER_ID);
        lines.push(`${label}: ${result.message}${result.verifyUrl ? `\n${result.verifyUrl}` : ""}`);
      }
      await context.ui.dialog.alert({
        title: "Antigravity verification",
        message: lines.join("\n"),
      });
    };

    const addAccount = () => {
      context.ui.toast.show({
        title: "Antigravity",
        message: "Run /connect and choose Google Antigravity to add an account.",
        variant: "info",
      });
    };

    const menu = async () => {
      const action = await context.ui.dialog.select({
        title: "Antigravity",
        options: [
          { title: "Switch account", value: "switch", description: "Change the active account" },
          { title: "Show quotas", value: "quota", description: "Check remaining quota for all accounts" },
          { title: "Enable or disable account", value: "toggle", description: "Exclude an account from rotation" },
          { title: "Verify account access", value: "verify", description: "Test whether generation is licensed" },
          { title: "Verify all accounts", value: "verify-all", description: "Run the generation probe for every account" },
          { title: "Add account", value: "add", description: "Connect another Google account" },
        ],
      });
      if (action === "switch") await switchAccount();
      else if (action === "quota") await showQuota();
      else if (action === "toggle") await toggleAccount();
      else if (action === "verify") await verifyAccount();
      else if (action === "verify-all") await verifyAllAccounts();
      else if (action === "add") addAccount();
    };

    const stopUpdated = context.data.on("credential.updated", announce);
    const stopSwitched = context.data.on("credential.switched", announce);

    const stopSessionCreated = context.data.on("session.created", (event) => {
      updateChecker.event({ event: { type: "session.created", properties: event.data } });
    });

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "antigravity.accounts",
          title: "Antigravity accounts",
          group: "Antigravity",
          palette: true,
          slash: { name: "antigravity" },
          run: menu,
        },
        {
          id: "antigravity.switch",
          title: "Switch Antigravity account",
          group: "Antigravity",
          palette: true,
          slash: { name: "antigravity-switch" },
          run: switchAccount,
        },
        {
          id: "antigravity.quota",
          title: "Antigravity quotas",
          group: "Antigravity",
          palette: true,
          slash: { name: "antigravity-quota" },
          run: showQuota,
        },
        {
          id: "antigravity.toggle",
          title: "Enable or disable Antigravity account",
          group: "Antigravity",
          palette: true,
          slash: { name: "antigravity-toggle" },
          run: toggleAccount,
        },
        {
          id: "antigravity.verify",
          title: "Verify Antigravity account access",
          group: "Antigravity",
          palette: true,
          slash: { name: "antigravity-verify" },
          run: verifyAccount,
        },
        {
          id: "antigravity.verify-all",
          title: "Verify all Antigravity accounts",
          group: "Antigravity",
          palette: true,
          slash: { name: "antigravity-verify-all" },
          run: verifyAllAccounts,
        },
      ],
    }));

    return () => {
      stopUpdated();
      stopSwitched();
      stopSessionCreated();
    };
  },
});
