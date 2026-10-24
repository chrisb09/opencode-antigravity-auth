import type { AntigravityConfig } from "./config/schema";
/** Internal request-local pin. Never change global active credentials to pin work. */
export declare function consumeRoutingPin(input: RequestInfo, init?: RequestInit): {
    input: RequestInfo;
    init: RequestInit | undefined;
    email: string | null;
};
export declare function pinnedConfig(config: AntigravityConfig, email: string | null): AntigravityConfig;
export declare function pinnedExclusions(accounts: Array<{
    index: number;
    email?: string;
}>, email: string | null, tried: Set<number>): Set<number>;
//# sourceMappingURL=routing-pin.d.ts.map