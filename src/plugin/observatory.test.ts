import { afterEach, describe, expect, it, vi } from "vitest";
import { registerObservatoryAccount } from "./observatory";
const key = Symbol.for("opencode.observatory.account.v1");
afterEach(() => { delete (globalThis as Record<symbol, unknown>)[key]; });
describe("selected-account Observatory bridge", () => {
  it("reports each request's actual selected bearer and stable identity", () => {
    const bridge = vi.fn(); (globalThis as Record<symbol, unknown>)[key] = bridge;
    registerObservatoryAccount({ Authorization: "Bearer token-a" }, "a@example.test");
    registerObservatoryAccount({ Authorization: "Bearer token-b" }, "b@example.test");
    registerObservatoryAccount({ Authorization: "Bearer token-c" }, "c@example.test");
    expect(bridge.mock.calls).toEqual([["token-a", "a@example.test"], ["token-b", "b@example.test"], ["token-c", "c@example.test"]]);
  });
  it("does nothing when the collector is absent or identity cannot be established", () => {
    expect(() => registerObservatoryAccount({ Authorization: "Bearer token-a" }, "a@example.test")).not.toThrow();
    const bridge = vi.fn(); (globalThis as Record<symbol, unknown>)[key] = bridge;
    registerObservatoryAccount({ "x-goog-api-key": "test-key" }, "a@example.test");
    registerObservatoryAccount({ Authorization: "Bearer token-a" }, undefined);
    expect(bridge).not.toHaveBeenCalled();
  });
  it("cannot interrupt an inference call if the telemetry callback fails", () => {
    (globalThis as Record<symbol, unknown>)[key] = () => { throw new Error("telemetry failed"); };
    expect(() => registerObservatoryAccount({ Authorization: "Bearer token-a" }, "a@example.test")).not.toThrow();
  });
});
