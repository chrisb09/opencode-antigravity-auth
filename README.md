# Antigravity Auth for OpenCode

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

Google OAuth for **Antigravity** (Google's agentic IDE) and the legacy Gemini CLI, so OpenCode can use your own Google plan's quota and model catalog — including **Gemini 4 Hydrogen**, **Gemini 3.8 Flash**, **Gemini 3 Flash** and **Claude** — with multi-account rotation.

> **Fork notice** — this is [@chrisb09](https://github.com/chrisb09)'s fork of [NoeFabris/opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth). It tracks the live `agy` (Antigravity CLI) wire protocol and the backend's current request gates. See [Fork differences](#fork-differences). Pre-built `dist/` artifacts are committed, so the fork works directly from GitHub with no build step.

---

<details open>
<summary><b>⚠️ Terms of Service Warning — Read Before Installing</b></summary>

> [!CAUTION]
> Using this plugin (and any proxy for Antigravity) violates Google's Terms of Service. Users have reported Google accounts being **banned** or **shadow-banned** (restricted access without notification).
>
> **By using this plugin you acknowledge:**
> - This is an unofficial tool, not endorsed by Google
> - Your account may be suspended or permanently banned
> - You assume all risks associated with using this plugin

</details>

---

## What you get

- **Antigravity model access** — Gemini 4 Hydrogen, Gemini 3.8 Flash, Gemini 3 Flash, plus the remaining Claude 4.6 generation
- **Multi-account rotation** — add several Google accounts; the plugin rotates on rate limits, with per-account quota tracking
- **Thinking levels** — `low`/`medium`/`high` for Gemini, thinking budgets for Claude, selectable per request as variants
- **Dynamic model discovery** — models and context limits are read from the backend's own registry (`fetchAvailableModels`), with bundled definitions as fallback
- **Google Search grounding** — `google_search` tool for Gemini models
- **Session recovery** — automatic recovery from tool errors, empty responses and interrupted turns
- **Gemini API key path** — optional `GEMINI_API_KEY` / Cloud Project routing for Gemini models, usable as fallback capacity or opt-in primary
- **Works alongside other plugins** — including `@tarquinen/opencode-dcp` and `oh-my-opencode` (see [Plugin compatibility](#plugin-compatibility))

## Requirements

- OpenCode (V1 or V2 — both supported from this checkout)
- Node.js 20+
- A Google account with Antigravity access (free tier works; paid tiers unlock additional models)

---

## Install

### Option A — this fork from GitHub

Add the plugin to `~/.config/opencode/opencode.json` (V1):

```json
{
  "plugin": ["github:chrisb09/opencode-antigravity-auth"]
}
```

Or use V2 — see [OpenCode V2](#opencode-v2).

### Option B — local checkout

```jsonc
// V1: ~/.config/opencode/opencode.json
{ "plugin": ["/absolute/path/to/opencode-antigravity-auth"] }

// V2: ~/.config/opencode/opencode.jsonc
{ "plugins": ["/absolute/path/to/opencode-antigravity-auth/v2"] }
```

### Option C — npm

```json
{
  "plugin": ["opencode-antigravity-auth@latest"]
}
```

> npm publishes upstream `NoeFabris/opencode-antigravity-auth`, which does **not** include this fork's fixes. Use Option A or B to get them. Bleeding edge is `opencode-antigravity-auth@beta`.

### Then log in

```bash
opencode auth login
```

Choose **Google** → **OAuth with Google (Antigravity)**. The browser flow finishes automatically on `localhost`; on headless or containerized machines you can paste the redirect URL / authorization code instead.

### Then run

```bash
opencode run "Hello" --model=google/gemini-3.8-flash --variant=high
```

Model IDs differ by OpenCode generation — `google/...` on V1, `antigravity/...` on V2. See [Models](#models).

<details>
<summary><b>Install with an LLM agent</b></summary>

Paste into any coding agent:

```
Install the opencode-antigravity-auth plugin by following
https://raw.githubusercontent.com/chrisb09/opencode-antigravity-auth/main/README.md
```

Then log in with `opencode auth login` and verify with:

```bash
opencode run "Hello" --model=google/gemini-3.8-flash
```

</details>

---

## OpenCode V2

This package supports OpenCode V1 and V2 from one checkout. V1 uses the package root and the `google/...` model namespace; V2 uses `v2/` and the `antigravity/...` namespace.

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-antigravity-auth/v2"]
}
```

### V2 TUI

Add the package root to `~/.config/opencode/cli.json`:

```json
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "plugins": ["/absolute/path/to/opencode-antigravity-auth"]
}
```

| Command | Purpose |
| --- | --- |
| `/antigravity` | Account menu |
| `/antigravity-switch` | Switch the active account |
| `/antigravity-quota` | Show live quota for every account |
| `/antigravity-toggle` | Enable or disable an account |
| `/antigravity-verify` | Run a generation probe for one account |
| `/antigravity-verify-all` | Run a generation probe for every account |

`/antigravity-verify*` is the fastest way to diagnose a failing account: it makes a real request and reports the actual backend status instead of a cached quota number.

---

## Models

### Current catalog

The visible catalog is deliberately small. Everything else is either discovery-provided for your account or a hidden alias (below).

| Model | Variants | Context | Notes |
|-------|----------|---------|-------|
| `gemini-3.8-flash` | `low`, `medium`, `high` (`medium` default) | 1,048,576 | Canonical Gemini 3.8 Flash. Antigravity-first with Gemini CLI fallback. The backend serves tier-suffixed ids (`gemini-3.8-flash-low/medium/high`) and the plugin maps them automatically. `gemini-flash-latest` aliases here. |
| `antigravity-gemini-4-hydrogen` | `low`, `medium`, `high` (`medium` default) | 1,048,576 | Gemini 4 Hydrogen. Served today from Google's `sonar` experiment lane; the plugin switches to the bare public id automatically once the backend announces it. |
| `antigravity-gemini-3-flash` | `minimal`, `low`, `medium`, `high` | 1,048,576 | Gemini 3 Flash with thinking |
| `gemini-2.5-flash` | — | 1,048,576 | Gemini CLI quota (the backend maps it to Gemini 3.5 Flash-Lite) |
| `gemini-3-flash-preview` | — | 1,048,576 | Gemini CLI quota |

> **Model discovery** — on by default. Any enabled model in your account's backend registry is added automatically, with the backend's own context/output limits, e.g. `gpt-oss-120b-medium` for accounts that have it. Disabled placeholder rows and internal helper models are filtered out.

### Hidden and prepared models

These are routable when requested explicitly, but hidden from the default picker:

| Id | Status | Why |
|----|--------|-----|
| `antigravity-claude-sonnet-4-6` | Deprecated | Hidden from the picker; still fully served. The 4.6 generation is being rotated out. |
| `antigravity-claude-opus-4-6-thinking` | Deprecated | Same, with `low`/`max` thinking budgets. |
| `antigravity-gemini-4-carbon`, `-argon`, `-neon` | Prepared | Announced by the backend only as disabled placeholders. They route the moment your account can serve them. |
| `antigravity-claude-sonnet-5-5`, `antigravity-claude-opus-5-5-thinking` | Prepared | Not in the current registry. Ready for paid accounts / the 5.5 rollout. |
| `antigravity-gemini-4-hydrogen-sonar` | Compat alias | Direct reference to the experiment-lane id behind `antigravity-gemini-4-hydrogen`. |
| `antigravity-gemini-3.8-flash` | Compat alias | Pins the request to Antigravity quota (no Gemini CLI fallback). |
| `gemini-3.8-flash-{minimal,low,medium,high}`, `gemini-flash-latest` | Aliases | `minimal` maps to `low`; the rest map to the canonical entry. |
| `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-2.5-pro`, `gemini-3-pro-preview`, `gemini-3.1-pro`, … | Legacy | Existing configs keep resolving; pruned from the picker. |

### Choosing thinking levels

```bash
opencode run "Hello" --model=google/gemini-3.8-flash --variant=high
```

- **Gemini 3.x / 4.x** use `thinkingLevel` strings. `minimal` exists only where the backend advertises it (Gemini 3 Flash); 3.8 Flash and Gemini 4 use `low`/`medium`/`high`.
- **Claude thinking models** use numeric budgets: `low` = 8,192 and `max` = 32,768 tokens.

Details: [docs/MODEL-VARIANTS.md](docs/MODEL-VARIANTS.md).

### Routing behavior

- **Antigravity-first (default)** — Gemini models consume Antigravity quota across your OAuth accounts.
- **`antigravity-` prefix** — pins the request to Antigravity quota, disabling the Gemini CLI fallback.
- **`cli_first: true`** — legacy mode: Gemini models use Gemini CLI quota first.
- **`agy_sdk`** — API keys / Cloud Projects route Gemini through the public Gemini API; they can also serve as fallback capacity when OAuth quotas are exhausted.
- **Claude and image models** always use Antigravity.
- Model names are rewritten per target API automatically (e.g. `antigravity-gemini-3-flash` → `gemini-3-flash-preview` for the CLI).

### Full model configuration (V1, copy-paste)

Only needed if your OpenCode version does not load plugin models dynamically. `opencode auth login` → **Configure models in opencode.json** can also write this for you.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["github:chrisb09/opencode-antigravity-auth"],
  "provider": {
    "google": {
      "models": {
        "gemini-3.8-flash": {
          "name": "Gemini 3.8 Flash",
          "limit": { "context": 1048576, "output": 65536 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "variants": {
            "low": { "thinkingLevel": "low" },
            "medium": { "thinkingLevel": "medium" },
            "high": { "thinkingLevel": "high" }
          }
        },
        "antigravity-gemini-4-hydrogen": {
          "name": "Gemini 4 Hydrogen (Antigravity)",
          "limit": { "context": 1048576, "output": 65536 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "variants": {
            "low": { "thinkingLevel": "low" },
            "medium": { "thinkingLevel": "medium" },
            "high": { "thinkingLevel": "high" }
          }
        },
        "antigravity-gemini-3-flash": {
          "name": "Gemini 3 Flash (Antigravity)",
          "limit": { "context": 1048576, "output": 65536 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "variants": {
            "minimal": { "thinkingLevel": "minimal" },
            "low": { "thinkingLevel": "low" },
            "medium": { "thinkingLevel": "medium" },
            "high": { "thinkingLevel": "high" }
          }
        },
        "antigravity-claude-sonnet-4-6": {
          "name": "Claude Sonnet 4.6 (Antigravity)",
          "limit": { "context": 250000, "output": 64000 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] }
        },
        "antigravity-claude-opus-4-6-thinking": {
          "name": "Claude Opus 4.6 Thinking (Antigravity)",
          "limit": { "context": 250000, "output": 64000 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
          "variants": {
            "low": { "thinkingConfig": { "thinkingBudget": 8192 } },
            "max": { "thinkingConfig": { "thinkingBudget": 32768 } }
          }
        },
        "gemini-2.5-flash": {
          "name": "Gemini 2.5 Flash (Gemini CLI)",
          "limit": { "context": 1048576, "output": 65536 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] }
        },
        "gemini-3-flash-preview": {
          "name": "Gemini 3 Flash Preview (Gemini CLI)",
          "limit": { "context": 1048576, "output": 65536 },
          "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] }
        }
      }
    }
  }
}
```

---

## Multi-account setup

Run `opencode auth login` again to add more Google accounts. The plugin rotates between them when one is rate-limited.

The login menu also offers:

| Option | Purpose |
| --- | --- |
| **Add account** | Start another Google OAuth login |
| **Check quotas** | Show remaining quota per account |
| **Verify one account** / **Verify all accounts** | Make a real request per account and report the backend status |
| **Configure models in opencode.json** | Write the model definitions into `opencode.json` |
| *Select an account* | Switch to it, or open its details to enable/disable it or remove it |

Quotas are split by model group: **Gemini models** (5-hour and weekly windows) and **Claude/GPT models** (5-hour and weekly windows). Exhausting one group leaves the other usable.

For load balancing, quota pools and account storage, see [docs/MULTI-ACCOUNT.md](docs/MULTI-ACCOUNT.md).

---

## Configuration

Optional settings live in `~/.config/opencode/antigravity.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/chrisb09/opencode-antigravity-auth/main/assets/antigravity.schema.json"
}
```

Defaults work for most setups.

### Model behavior

| Option | Default | What it does |
|--------|---------|--------------|
| `keep_thinking` | `false` | Preserve Claude thinking across turns. May reduce model stability. |
| `session_recovery` | `true` | Auto-recover from tool errors |
| `auto_resume` | `true` | Recover interrupted turns automatically |
| `cli_first` | `false` | Route Gemini models through legacy Gemini CLI quota first |
| `quota_fallback` | `false` | Allow falling back between quota pools on exhaustion |
| `agy_sdk.enabled` | `true` | Enable the Gemini API key / Cloud Project route for Gemini |
| `agy_sdk.prefer_for_gemini` | `false` | Prefer API keys over OAuth for Gemini models |
| `agy_sdk.api_key_fallback` | `true` | Use API keys when OAuth quotas are unavailable |
| `model_discovery.enabled` | `true` | Load models and limits from the backend registry |
| `claude_tool_hardening` | `true` | Normalize Claude tool schemas/ids |

### Account rotation

| Option | Default | What it does |
|--------|---------|--------------|
| `account_selection_strategy` | `"hybrid"` | `hybrid` = health + token bucket + LRU freshness; `sticky` = same account until rate-limited (best prompt cache); `round-robin` = rotate on every request |
| `pid_offset_enabled` | `false` | Distribute parallel sessions/agents across different starting accounts |
| `switch_on_first_rate_limit` | `true` | Switch accounts on the first 429 instead of retrying the same account |

| Your setup | Recommended |
|------------|-------------|
| 1 account | `"account_selection_strategy": "sticky"` |
| 2–5 accounts | Default (`hybrid`) |
| 5+ accounts | `"account_selection_strategy": "round-robin"` |
| Parallel agents | Add `"pid_offset_enabled": true` |

### Quota protection

| Option | Default | What it does |
|--------|---------|--------------|
| `soft_quota_threshold_percent` | `90` | Skip an account above this usage. Set `100` to disable. |
| `quota_refresh_interval_minutes` | `15` | Refresh quota cache after successful requests when older than this. `0` disables. |
| `soft_quota_cache_ttl_minutes` | `"auto"` | Cache freshness; `"auto"` = max(2 × refresh interval, 10 min). Unknown/stale cache is allowed (fail-open). |

### Rate-limit scheduling

| Option | Default | What it does |
|--------|---------|--------------|
| `scheduling_mode` | `"cache_first"` | `cache_first` = wait for the same account (preserves prompt cache); `balance` = switch immediately; `performance_first` = round-robin |
| `max_cache_first_wait_seconds` | `60` | Max wait in `cache_first` before switching |
| `max_rate_limit_wait_seconds` | `300` | Give up when the earliest reset is further away than this |
| `failure_ttl_seconds` | `3600` | Expire old failure counts |

### App behavior

| Option | Default | What it does |
|--------|---------|--------------|
| `quiet_mode` | `false` | Hide toast notifications |
| `toast_scope` | `"root_only"` | `root_only` or `all` sessions |
| `debug` | `false` | File logging in `~/.config/opencode/antigravity-logs/` |
| `debug_tui` | `false` | Show debug output in the TUI log panel |
| `auto_update` | `true` | Auto-update the plugin |

### Environment variables

```bash
OPENCODE_CONFIG_DIR=/path/to/config        # custom config directory
OPENCODE_ANTIGRAVITY_DEBUG=1               # debug file logging (2 = verbose)
OPENCODE_ANTIGRAVITY_DEBUG_TUI=1           # TUI log panel
OPENCODE_ANTIGRAVITY_LOG_DIR=/path         # custom log directory
OPENCODE_ANTIGRAVITY_KEEP_THINKING=1       # override keep_thinking
OPENCODE_ANTIGRAVITY_QUIET=1               # override quiet_mode
OPENCODE_ANTIGRAVITY_TOAST_SCOPE=all       # override toast_scope
OPENCODE_ANTIGRAVITY_SCHEDULING_MODE=balance
OPENCODE_ANTIGRAVITY_ACCOUNT_SELECTION_STRATEGY=sticky
OPENCODE_ANTIGRAVITY_PID_OFFSET_ENABLED=1
GEMINI_API_KEY=your-key                    # Gemini API key route
```

### Gemini API keys / Cloud Projects

```json
{
  "agy_sdk": {
    "api_key_fallback": true,
    "prefer_for_gemini": false,
    "cloud_projects": [
      { "label": "primary", "project_id": "my-project", "api_key": "..." },
      { "label": "backup", "project_id": "my-backup-project", "api_key": "..." }
    ]
  }
}
```

Keys stay local and are sent as the `x-goog-api-key` header, never in the URL. Do not commit `antigravity.json` with real keys.

For every option, see [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

---

## Troubleshooting

### "Forbidden" or an instant `429 RESOURCE_EXHAUSTED`

As of **2026-11-18** the Antigravity backend gates requests from non-genuine clients and dresses the rejection up as a quota error. The plugin returns `Forbidden` because the real 429 is masked by a follow-up 403 from the enterprise endpoint (`SUBSCRIPTION_REQUIRED #3501`).

Two gates are known:

1. **CLI version gate** — the backend rejects stale `agy` User-Agents. The plugin pins the current one (`1.5.11`); when `agy` auto-updates, the pin must be refreshed in `src/constants.ts`.
2. **systemInstruction content scan** — a system prompt naming a third-party agent harness ("OpenCode") is rejected instantly. The plugin sends the genuine `agy` system instruction and relocates the OpenCode prompt into the first user turn.

Both are already fixed here. If you hit this pattern:

- Update to the latest commit of this fork (older builds or upstream npm do not carry the fix).
- Make sure your `agy`/plugin version pairing is current if you build locally.
- Confirm it is not real quota: `/antigravity-quota` (V2) or **Check quotas** in `opencode auth login`.

### "Model not found"

If models do not appear, your OpenCode version may require static definitions:

```json
{ "provider": { "google": { "npm": "@ai-sdk/google", "models": { } } } }
```

or run **Configure models in opencode.json** from `opencode auth login`.

### Model needs verification

The plugin can require a one-time generation probe after a new login or a suspicious account state:

```bash
opencode auth login   # → Verify one account / Verify all accounts
```

In V2 use `/antigravity-verify` or `/antigravity-verify-all`.

### Gemini 3 / 4 tool errors: `Unknown name "parameters"`

Usually a schema from an MCP server that strict protobuf validation rejects. Disable MCP servers one by one, or ensure the `google` provider uses `"npm": "@ai-sdk/google"`.

Related: `Invalid function name must start with a letter or underscore` means an MCP tool name starts with a digit (e.g. a `1mcp_*` key) — rename the MCP key or disable that server for Antigravity models.

### "All accounts rate-limited" but quota looks available

1. Re-check with **Check quotas** / `/antigravity-quota`.
2. Delete `~/.config/opencode/antigravity-accounts.json` and run `opencode auth login` again.
3. Try `"account_selection_strategy": "sticky"`.

### OAuth callback problems

<details>
<summary><b>Safari (macOS)</b></summary>

Safari's HTTPS-Only Mode blocks the `http://localhost` callback. Use Chrome/Firefox for login, or disable HTTPS-Only Mode temporarily.

</details>

<details>
<summary><b>Port already in use</b></summary>

```bash
lsof -i :51121        # macOS/Linux
netstat -ano | findstr :51121   # Windows
```

Kill the stale process and retry `opencode auth login`.

</details>

<details>
<summary><b>Docker / WSL2 / SSH</b></summary>

The browser must reach `localhost` on the machine running OpenCode.

```bash
ssh -L 51121:localhost:51121 user@remote
```

In containers, wait for the manual URL/code flow, or forward the port.

</details>

### Configuration key: `plugin` vs `plugins`

V1 uses **`plugin`** (singular):
```json
{ "plugin": ["github:chrisb09/opencode-antigravity-auth"] }
```
V2 uses **`plugins`**:
```jsonc
{ "plugins": ["/absolute/path/to/opencode-antigravity-auth/v2"] }
```
Using the wrong key is the usual cause of "Unrecognized key".

### Reset

Most issues clear by deleting the accounts file and logging in again:

```bash
rm ~/.config/opencode/antigravity-accounts.json
opencode auth login
```

### Config locations

| File | Path |
|------|------|
| Main config (V1) | `~/.config/opencode/opencode.json` |
| Main config (V2) | `~/.config/opencode/opencode.jsonc` |
| TUI config (V2) | `~/.config/opencode/cli.json` |
| Accounts | `~/.config/opencode/antigravity-accounts.json` |
| Plugin config | `~/.config/opencode/antigravity.json` |
| Debug logs | `~/.config/opencode/antigravity-logs/` |

> `~/.config/opencode/` is used on **all platforms**, including Windows (`~` = your home directory). Do not use `%APPDATA%`. Set `OPENCODE_CONFIG_DIR` to override.

More: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## Plugin compatibility

### `@tarquinen/opencode-dcp`

DCP creates synthetic assistant messages without thinking blocks. **List this plugin before DCP:**

```json
{
  "plugin": [
    "github:chrisb09/opencode-antigravity-auth",
    "@tarquinen/opencode-dcp@latest"
  ]
}
```

### `oh-my-opencode`

Disable its built-in Google auth to avoid conflicts, and point agent models at this plugin:

```json
{
  "google_auth": false,
  "agents": {
    "frontend-ui-ux-engineer": { "model": "google/antigravity-gemini-3-flash" },
    "document-writer": { "model": "google/gemini-3.8-flash" },
    "multimodal-looker": { "model": "google/gemini-3.8-flash" }
  }
}
```

### Plugins you don't need

- **gemini-auth plugins** — this plugin already handles Google OAuth.

---

## Fork differences

Compared with upstream, this fork:

- **Mirrors the verified `agy` wire protocol** — official CLI User-Agent (currently `1.5.11, cl=1024248524`), fixed `aicode-consumers` consumer project, `requestId`/trajectory `labels` format, uppercase `thinkingLevel`, and the genuine CLI system instruction with harness headers stripped. This is what passes the 2026-11-18 backend gates.
- **Tracks the current model lineup** — Gemini 3.8 Flash consolidated into one canonical entry, Gemini 4 Hydrogen exposed via its servable experiment lane (registry-aware, self-switching when the public id goes live), Gemini 4 Carbon/Argon/Neon and Claude 5.5 prepared as hidden entries, Claude 4.6 deprecated but routable.
- **Hardens model discovery** — ignores disabled placeholder rows and internal helper models; adopts backend-reported context/output limits.
- **Supports OpenCode V2** — separate `v2/` entrypoint, `antigravity/...` namespace, TUI slash commands.
- **Commits `dist/`** — so `github:` installs work without a build step.

---

## Documentation

- [Configuration](docs/CONFIGURATION.md) — all options and defaults
- [Model Variants](docs/MODEL-VARIANTS.md) — thinking levels and variant system
- [Multi-Account](docs/MULTI-ACCOUNT.md) — rotation, quota pools, account storage
- [Troubleshooting](docs/TROUBLESHOOTING.md) — extended issue list
- [Architecture](docs/ARCHITECTURE.md) — request pipeline and internals
- [API Spec](docs/ANTIGRAVITY_API_SPEC.md) — Antigravity API reference

---

## Credits

- [opencode-gemini-auth](https://github.com/jenslys/opencode-gemini-auth) by [@jenslys](https://github.com/jenslys)
- [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)
- Upstream: [NoeFabris/opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth)

## License

MIT. See [LICENSE](LICENSE).

<details>
<summary><b>Legal</b></summary>

### Intended use

- Personal / internal development only
- Respect quotas and data handling policies
- Not for production services or bypassing intended limits

### Warning

- **Terms of Service risk** — this approach may violate AI providers' ToS
- **Account risk** — providers may suspend or ban accounts
- **No guarantees** — APIs may change without notice
- **Assumption of risk** — you assume all legal, financial and technical risk

### Disclaimer

Not affiliated with Google. "Antigravity", "Gemini", "Google Cloud" and "Google" are trademarks of Google LLC.

</details>
