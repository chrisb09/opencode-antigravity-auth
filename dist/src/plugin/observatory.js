// Optional, process-local telemetry bridge. No Observatory dependency and no credentials sent to its server.
export function registerObservatoryAccount(headers, stableIdentity) {
    const accessToken = new Headers(headers).get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!accessToken || !stableIdentity)
        return;
    const bridge = globalThis[Symbol.for("opencode.observatory.account.v1")];
    if (typeof bridge !== "function")
        return;
    try {
        bridge(accessToken, stableIdentity);
    }
    catch { /* Telemetry cannot affect provider calls. */ }
}
//# sourceMappingURL=observatory.js.map