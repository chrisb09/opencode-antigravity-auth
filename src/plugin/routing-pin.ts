import type { AntigravityConfig } from "./config/schema";

/** Internal request-local pin. Never change global active credentials to pin work. */
export function consumeRoutingPin(input: RequestInfo, init?: RequestInit): {
  input: RequestInfo; init: RequestInit | undefined; email: string | null;
} {
  const headers = new Headers(init?.headers ?? (typeof input !== "string" && "headers" in input ? input.headers : undefined));
  const pin = headers.get("x-opencode-router-account");
  if (!pin) return { input, init, email: null };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pin)) throw new Error("Invalid routed Antigravity account pin");
  const internal: string[] = [];
  headers.forEach((_value, name) => { if (name.startsWith("x-opencode-router-")) internal.push(name); });
  for (const name of internal) headers.delete(name);
  const cleanInput = typeof input !== "string" && "headers" in input ? new Request(input, { headers }) : input;
  return { input: cleanInput, init: { ...init, headers }, email: pin.toLowerCase() };
}

export function pinnedConfig(config: AntigravityConfig, email: string | null): AntigravityConfig {
  return email ? { ...config, agy_sdk: { ...config.agy_sdk, api_key_fallback: false, prefer_for_gemini: false } } : config;
}

export function pinnedExclusions(accounts: Array<{ index: number; email?: string }>, email: string | null, tried: Set<number>): Set<number> {
  const result = new Set(tried);
  if (email) for (const account of accounts) if (account.email?.toLowerCase() !== email) result.add(account.index);
  return result;
}
