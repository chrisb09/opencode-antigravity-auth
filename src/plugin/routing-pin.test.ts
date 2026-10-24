import { describe, expect, it } from "vitest";
import { consumeRoutingPin, pinnedConfig, pinnedExclusions } from "./routing-pin";
import { AntigravityConfigSchema } from "./config/schema";

describe("quota router request-local account pins", () => {
  it("strips internal headers without mutating the caller's headers", () => {
    const headers = new Headers({ "x-opencode-router-account": "Alice@Example.com", "x-opencode-router-execution": "private-id", authorization: "Bearer test" });
    const result = consumeRoutingPin("https://example.com", { headers });
    expect(result.email).toBe("alice@example.com");
    const clean = new Headers(result.init!.headers);
    expect(clean.get("x-opencode-router-account")).toBeNull();
    expect(clean.get("x-opencode-router-execution")).toBeNull();
    expect(clean.get("authorization")).toBe("Bearer test");
    expect(headers.get("x-opencode-router-account")).toBe("Alice@Example.com");
  });
  it("also strips the underlying Request headers", () => {
    const input = new Request("https://example.com", { headers: { "x-opencode-router-account": "a@example.com" } });
    const result = consumeRoutingPin(input);
    expect((result.input as Request).headers.has("x-opencode-router-account")).toBe(false);
    expect(input.headers.has("x-opencode-router-account")).toBe(true);
  });
  it("rejects invalid pins and preserves ordinary requests", () => {
    expect(() => consumeRoutingPin("https://example.com", { headers: { "x-opencode-router-account": "bad" } })).toThrow();
    const init = { headers: { accept: "application/json" } };
    expect(consumeRoutingPin("https://example.com", init).init).toBe(init);
  });
  it("pins two concurrent requests independently, including after index changes", () => {
    const accounts = [{ index: 0, email: "a@example.com" }, { index: 1, email: "b@example.com" }, { index: 2, email: "c@example.com" }];
    const tried = new Set<number>();
    expect([...pinnedExclusions(accounts, "a@example.com", tried)]).toEqual([1, 2]);
    expect([...pinnedExclusions(accounts, "b@example.com", tried)]).toEqual([0, 2]);
    expect(tried.size).toBe(0);
    expect([...pinnedExclusions(accounts.slice(1).map((a, index) => ({ ...a, index })), "b@example.com", tried)]).toEqual([1]);
    expect([...pinnedExclusions(accounts, "missing@example.com", tried)]).toEqual([0, 1, 2]);
  });
  it("disables API-key fallback only for the pinned request", () => {
    const config = AntigravityConfigSchema.parse({ agy_sdk: { api_key_fallback: true, prefer_for_gemini: true } });
    const pinned = pinnedConfig(config, "a@example.com");
    expect(pinned.agy_sdk.api_key_fallback).toBe(false);
    expect(pinned.agy_sdk.prefer_for_gemini).toBe(false);
    expect(config.agy_sdk.api_key_fallback).toBe(true);
    expect(pinnedConfig(config, null)).toBe(config);
  });
});
