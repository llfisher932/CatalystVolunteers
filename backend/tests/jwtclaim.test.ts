import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs(); // restore real env after each test
  vi.resetModules(); // clear the module cache so re-import re-runs top-level code
});

describe("SECRET loading", () => {
  it("throws when JWT_SECRET is not set", async () => {
    vi.stubEnv("JWT_SECRET", ""); // force it empty → falsy → should throw

    await expect(import("../src/jwtclaim.js")).rejects.toThrow("JWT_SECRET is not set");
  });

  it("loads the secret when JWT_SECRET is set", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value");

    const mod = await import("../src/jwtclaim.js");
    expect(mod.SECRET).toBe("test-secret-value");
  });
});
