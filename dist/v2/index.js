import { Credential, Integration, Model, Plugin, Provider } from "@opencode/plugin";
import { authorizeAntigravity, exchangeAntigravity } from "../src/antigravity/oauth";
import { ANTIGRAVITY_PROVIDER_ID } from "../src/constants";
import { createAntigravityPlugin } from "../src/plugin";
import { startOAuthListener } from "../src/plugin/server";
import { refreshAccessToken } from "../src/plugin/token";
import { activateCredentialOnDisk, findCredentialIDForEmail, syncCredentialToDisk, } from "./accounts.js";
import { v2ModelDefinitions } from "./models.js";
const OAUTH_METHOD_ID = "oauth";
const integrationID = Integration.ID.make("antigravity");
const providerID = Provider.ID.make("antigravity");
const methodID = Integration.MethodID.make(OAUTH_METHOD_ID);
function modelInfo(id, definition) {
    const modelID = Model.ID.make(id);
    return {
        ...Model.Info.default(providerID, modelID),
        id: modelID,
        modelID,
        name: definition.name,
        package: "aisdk:@ai-sdk/google",
        capabilities: {
            tools: true,
            input: definition.modalities?.input ?? ["text", "image", "pdf"],
            output: definition.modalities?.output ?? ["text"],
            ...(definition.temperature === false ? { temperature: false } : {}),
        },
        limit: {
            context: definition.limit?.context ?? 1_048_576,
            output: definition.limit?.output ?? 65_535,
        },
        cost: [],
        variants: Object.entries(definition.variants ?? {}).map(([variantID, settings]) => ({
            id: Model.VariantID.make(variantID),
            settings: settings,
        })),
        status: "active",
        enabled: true,
        time: { released: 0 },
    };
}
function toV1Auth(credential) {
    if (credential.type === "oauth") {
        return {
            type: "oauth",
            refresh: credential.refresh,
            access: credential.access,
            expires: credential.expires,
        };
    }
    if (credential.type === "key")
        return { type: "api", key: credential.key };
    return { type: "api", key: "" };
}
function toCredential(auth) {
    return {
        type: "oauth",
        methodID,
        refresh: auth.refresh,
        access: auth.access ?? "",
        expires: auth.expires ?? 0,
    };
}
function callbackParams(value, fallbackState) {
    const trimmed = value.trim();
    if (!trimmed)
        return { error: "Missing authorization code" };
    try {
        if (/^https?:\/\//i.test(trimmed)) {
            const url = new URL(trimmed);
            const code = url.searchParams.get("code");
            const state = url.searchParams.get("state") ?? fallbackState;
            if (!code)
                return { error: "Missing code in callback URL" };
            return { code, state };
        }
        const params = new URLSearchParams(trimmed.includes("?") ? trimmed.slice(trimmed.indexOf("?") + 1) : trimmed);
        const code = params.get("code") ?? trimmed;
        const state = params.get("state") ?? fallbackState;
        return { code, state };
    }
    catch {
        return { error: "Invalid authorization response" };
    }
}
async function exchangeCredential(code, state) {
    const result = await exchangeAntigravity(code, state);
    if (result.type === "failed")
        throw new Error(result.error);
    return {
        type: "oauth",
        methodID,
        refresh: result.refresh,
        access: result.access,
        expires: result.expires,
        metadata: {
            email: result.email ?? "",
            projectId: result.projectId,
        },
    };
}
export default Plugin.define({
    id: "antigravity",
    async setup(ctx) {
        // The shared fetch engine honors request-local quota-router account pins;
        // Pinned requests preserve the primary family cursor and do not activate a
        // global vault credential.
        const fakeClient = {
            app: { log: async () => { } },
            tui: { showToast: async () => { } },
            auth: { set: async () => { } },
            session: {
                abort: async () => { },
                messages: async () => ({ data: [] }),
                prompt: async () => ({}),
            },
        };
        const active = async () => {
            try {
                const connection = await ctx.integration.connection.active(integrationID);
                if (!connection)
                    return undefined;
                const credential = await ctx.integration.connection.resolve(connection);
                return credential ? { connection, credential } : undefined;
            }
            catch {
                return undefined;
            }
        };
        const antigravityConnections = async () => {
            try {
                const result = await ctx.integration.list();
                const integration = result.data.find((candidate) => candidate.id === integrationID);
                return (integration?.connections ?? []);
            }
            catch {
                return [];
            }
        };
        const credentialIDForEmail = async (email) => {
            if (!email)
                return undefined;
            return findCredentialIDForEmail(await antigravityConnections(), email);
        };
        let loaderPromise;
        const resetLoader = () => {
            loaderPromise = undefined;
        };
        const internalActivations = new Set();
        let lastActiveCredentialID;
        let disposed = false;
        let followQueue = Promise.resolve();
        const markInternalActivation = (credentialID) => {
            internalActivations.add(credentialID);
            const timer = setTimeout(() => internalActivations.delete(credentialID), 10_000);
            timer.unref?.();
        };
        const activateCredentialForSelection = async (selection) => {
            if (disposed)
                return;
            const credentialID = await credentialIDForEmail(selection.email);
            if (!credentialID || credentialID === lastActiveCredentialID)
                return;
            lastActiveCredentialID = credentialID;
            markInternalActivation(credentialID);
            try {
                await ctx.credential.activate({ credentialID: credentialID });
            }
            catch {
                internalActivations.delete(credentialID);
                if (lastActiveCredentialID === credentialID)
                    lastActiveCredentialID = undefined;
            }
        };
        const followSelection = (selection) => {
            if (disposed)
                return;
            followQueue = followQueue
                .then(() => activateCredentialForSelection(selection))
                .catch(() => {
                // Rotation mirroring is best-effort.
            });
        };
        const v1 = await createAntigravityPlugin(ANTIGRAVITY_PROVIDER_ID)({
            client: fakeClient,
            directory: ctx.location.directory,
            onAccountSelected: followSelection,
        });
        const loader = v1.auth.loader;
        const loaderFetch = async () => {
            if (!loaderPromise) {
                // Assign before the first await so concurrent title/prompt requests
                // share one AccountManager instead of racing to create separate pools.
                const pending = (async () => {
                    const initial = await active();
                    if (!initial)
                        throw new Error("No Antigravity login found; run /connect and choose Antigravity");
                    const getAuth = async () => {
                        const latest = await active();
                        return latest ? toV1Auth(latest.credential) : { type: "api", key: "" };
                    };
                    const result = await loader(getAuth, { id: ANTIGRAVITY_PROVIDER_ID, models: {} });
                    if (!result || typeof result.fetch !== "function") {
                        throw new Error("Antigravity authentication could not produce a provider fetch");
                    }
                    return result.fetch;
                })();
                loaderPromise = pending;
                pending.catch(() => {
                    if (loaderPromise === pending)
                        loaderPromise = undefined;
                });
            }
            return loaderPromise;
        };
        const providerFetch = async (input, init) => {
            const send = await loaderFetch();
            return send(input, init);
        };
        await ctx.integration.transform((editor) => {
            editor.update(integrationID, (integration) => {
                integration.id = integrationID;
                integration.name = "Google Antigravity";
            });
            editor.method.update({
                integrationID,
                method: { id: methodID, type: "oauth", label: "Google Antigravity" },
                authorize: async () => {
                    const authorization = await authorizeAntigravity();
                    const state = new URL(authorization.url).searchParams.get("state") ?? "";
                    let listener = null;
                    try {
                        listener = await startOAuthListener({ timeoutMs: 5 * 60 * 1000 });
                    }
                    catch {
                        listener = null;
                    }
                    if (!listener) {
                        return {
                            url: authorization.url,
                            instructions: "Open the URL, sign in, then paste the full redirect URL or authorization code.",
                            mode: "code",
                            callback: async (input) => {
                                const parsed = callbackParams(input, state);
                                if ("error" in parsed)
                                    throw new Error(parsed.error);
                                return exchangeCredential(parsed.code, parsed.state);
                            },
                        };
                    }
                    return {
                        url: authorization.url,
                        instructions: "Complete sign-in in your browser. The local callback will finish automatically.",
                        mode: "auto",
                        callback: (async () => {
                            try {
                                const callback = await listener.waitForCallback();
                                const code = callback.searchParams.get("code");
                                const callbackState = callback.searchParams.get("state") ?? state;
                                if (!code)
                                    throw new Error("Missing code in OAuth callback");
                                return await exchangeCredential(code, callbackState);
                            }
                            finally {
                                await listener.close();
                            }
                        })(),
                    };
                },
                refresh: async (credential) => {
                    const refreshed = await refreshAccessToken({
                        type: "oauth",
                        refresh: credential.refresh,
                        access: credential.access,
                        expires: credential.expires,
                    }, fakeClient, ANTIGRAVITY_PROVIDER_ID);
                    if (!refreshed)
                        throw new Error("Antigravity token refresh failed");
                    return {
                        ...credential,
                        refresh: refreshed.refresh,
                        access: refreshed.access ?? "",
                        expires: refreshed.expires ?? 0,
                    };
                },
                label: (credential) => typeof credential.metadata?.email === "string" ? credential.metadata.email : undefined,
            });
            editor.method.update({
                integrationID,
                method: { type: "key", label: "Gemini API key" },
            });
        });
        await ctx.provider.transform((editor) => {
            const info = {
                ...Provider.Info.empty(providerID),
                name: "Google Antigravity",
                activation: "enabled",
                package: "aisdk:@ai-sdk/google",
                integrationID,
            };
            editor.add({
                info,
                models: v2ModelDefinitions().map(([id, definition]) => modelInfo(id, definition)),
            });
        });
        const credentialEvents = new AbortController();
        void (async () => {
            try {
                for await (const event of ctx.event.subscribe({ signal: credentialEvents.signal })) {
                    const value = event;
                    if (value.type !== "credential.updated" && value.type !== "credential.switched")
                        continue;
                    const data = value.data ?? value.properties ?? {};
                    if (data.integrationID !== "antigravity")
                        continue;
                    const eventCredentialID = typeof data.credentialID === "string" ? data.credentialID : undefined;
                    if (value.type === "credential.switched" && eventCredentialID && internalActivations.has(eventCredentialID)) {
                        internalActivations.delete(eventCredentialID);
                        continue;
                    }
                    resetLoader();
                    const current = await active();
                    if (!current)
                        continue;
                    if (typeof current.connection?.id === "string")
                        lastActiveCredentialID = current.connection.id;
                    const label = typeof current.connection?.label === "string" ? current.connection.label : undefined;
                    if (value.type === "credential.switched") {
                        await activateCredentialOnDisk(current.credential, label);
                    }
                    else {
                        await syncCredentialToDisk(current.credential, label, { replaceTokens: true });
                    }
                }
            }
            catch {
                // The event stream is best-effort; the fetch wrapper still resolves credentials per request.
            }
        })();
        await ctx.aisdk.hook("sdk", async (event) => {
            if (event.model.providerID !== "antigravity")
                return;
            const packageName = (event.model.package ?? event.package).replace(/^aisdk:/, "");
            if (packageName !== "@ai-sdk/google")
                return;
            const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
            event.sdk = createGoogleGenerativeAI({
                apiKey: "antigravity",
                ...(typeof event.options.baseURL === "string" ? { baseURL: event.options.baseURL } : {}),
                fetch: providerFetch,
            });
        });
        const search = v1.tool?.google_search;
        if (search) {
            await ctx.tool.transform((editor) => {
                editor.add({
                    name: "google_search",
                    description: "Search the web using Google Search and analyze URLs. Returns real-time information with source citations.",
                    input: {
                        type: "object",
                        properties: {
                            query: { type: "string" },
                            urls: { type: "array", items: { type: "string" } },
                            thinking: { type: "boolean", default: true },
                        },
                        required: ["query"],
                        additionalProperties: false,
                    },
                    options: { codemode: false },
                    execute: async (input, context) => {
                        await loaderFetch();
                        const result = await search.execute({ thinking: true, ...input }, { abort: context.signal });
                        return { content: String(result) };
                    },
                });
            });
        }
        await (async () => {
            try {
                for (const connection of await antigravityConnections()) {
                    if (connection.type !== "credential")
                        continue;
                    try {
                        const credential = await ctx.integration.connection.resolve(connection);
                        if (credential)
                            await syncCredentialToDisk(credential, connection.label);
                    }
                    catch {
                        // One unreadable credential must not block the rest of the pool.
                    }
                }
                // The vault follows the rotation engine during a session. Reuse that
                // selection on startup instead of resetting the disk cursor to the
                // user's original credential.
                const current = await active();
                if (!current)
                    return;
                const label = typeof current.connection?.label === "string" ? current.connection.label : undefined;
                await activateCredentialOnDisk(current.credential, label);
                if (typeof current.connection?.id === "string")
                    lastActiveCredentialID = current.connection.id;
            }
            catch {
                // Account-pool sync is best-effort; requests still work through the V1 loader.
            }
        })();
        return () => {
            disposed = true;
            credentialEvents.abort();
            resetLoader();
        };
    },
});
//# sourceMappingURL=index.js.map