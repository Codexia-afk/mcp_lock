import { describe, expect, it } from "vitest";
import {
  createApiKeyToken,
  createSessionToken,
  generateCsrfToken,
  hashApiKey,
  hashPassword,
  hashToken,
  verifyPassword,
} from "./auth";

describe("Auth and cryptographic utilities", () => {
  it("creates cryptographically random session and CSRF tokens", () => {
    const t1 = createSessionToken();
    const t2 = createSessionToken();
    const csrf = generateCsrfToken();
    expect(t1).toHaveLength(64);
    expect(t2).toHaveLength(64);
    expect(t1).not.toBe(t2);
    expect(csrf).toHaveLength(64);
  });

  it("hashes session tokens and API keys consistently with SHA-256", () => {
    const key = createApiKeyToken();
    expect(key).toMatch(/^mcp_lock_[0-9a-f]{48}$/);
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);

    const token = createSessionToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("hashes and verifies passwords securely using scrypt with constant-time equality", async () => {
    const password = "correct-horse-battery-staple-99";
    const hashed = hashPassword(password);
    expect(hashed).toContain(":");

    const ok = await verifyPassword(password, hashed);
    expect(ok).toBe(true);

    const wrong = await verifyPassword("incorrect-password", hashed);
    expect(wrong).toBe(false);
  });
});

