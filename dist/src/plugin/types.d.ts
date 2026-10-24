import type { PluginInput } from "@opencode-ai/plugin";
import type { AntigravityTokenExchangeResult } from "../antigravity/oauth";
export interface OAuthAuthDetails {
    type: "oauth";
    refresh: string;
    access?: string;
    expires?: number;
}
export interface ApiKeyAuthDetails {
    type: "api" | "api_key";
    key: string;
}
export interface NonOAuthAuthDetails {
    type: string;
    [key: string]: unknown;
}
export type AuthDetails = OAuthAuthDetails | ApiKeyAuthDetails | NonOAuthAuthDetails;
export type GetAuth = () => Promise<AuthDetails>;
export interface ProviderModel {
    cost?: Record<string, unknown>;
    [key: string]: unknown;
}
export interface Provider {
    id?: string;
    api?: string;
    npm?: string;
    models?: Record<string, ProviderModel>;
}
export interface ProviderModelsContext {
    auth?: AuthDetails;
}
export interface ProviderHook {
    id: string;
    models?: (provider: Provider, context: ProviderModelsContext) => Promise<Record<string, ProviderModel>>;
}
export interface LoaderResult {
    apiKey: string;
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
export type PluginClient = PluginInput["client"];
export interface AccountSelectionInfo {
    /** Index of the selected account in the disk account pool. */
    index: number;
    email?: string;
    family: "claude" | "gemini";
    headerStyle: string;
    model?: string | null;
}
export interface PluginContext {
    client: PluginClient;
    directory: string;
    /**
     * Optional observer for the account selected by the rotation engine.
     *
     * The V2 entrypoint uses this to mirror the selected account into OpenCode's
     * credential vault. It is advisory: failures must not affect the request.
     */
    onAccountSelected?: (info: AccountSelectionInfo) => void | Promise<void>;
}
export type AuthPrompt = {
    type: "text";
    key: string;
    message: string;
    placeholder?: string;
    validate?: (value: string) => string | undefined;
    condition?: (inputs: Record<string, string>) => boolean;
} | {
    type: "select";
    key: string;
    message: string;
    options: Array<{
        label: string;
        value: string;
        hint?: string;
    }>;
    condition?: (inputs: Record<string, string>) => boolean;
};
export type OAuthAuthorizationResult = {
    url: string;
    instructions: string;
} & ({
    method: "auto";
    callback: () => Promise<AntigravityTokenExchangeResult>;
} | {
    method: "code";
    callback: (code: string) => Promise<AntigravityTokenExchangeResult>;
});
export interface AuthMethod {
    provider?: string;
    label: string;
    type: "oauth" | "api";
    prompts?: AuthPrompt[];
    authorize?: (inputs?: Record<string, string>) => Promise<OAuthAuthorizationResult>;
}
export interface PluginEventPayload {
    event: {
        type: string;
        properties?: unknown;
    };
}
export interface PluginResult {
    auth: {
        provider: string;
        loader: (getAuth: GetAuth, provider: Provider) => Promise<LoaderResult | Record<string, unknown>>;
        methods: AuthMethod[];
    };
    event?: (payload: PluginEventPayload) => void;
    tool?: Record<string, unknown>;
    provider?: ProviderHook;
}
export interface RefreshParts {
    refreshToken: string;
    projectId?: string;
    managedProjectId?: string;
}
export interface ProjectContextResult {
    auth: OAuthAuthDetails;
    effectiveProjectId: string;
}
//# sourceMappingURL=types.d.ts.map