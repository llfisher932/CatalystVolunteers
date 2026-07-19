import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("dotenv/config", () => ({})); //mock .env variables for testing

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

//these tests don't follow our conventions for other tests (beforeEach -> it -> expect) because they are extremely small.
//if the tests were written in the same style as the other tests, they would be unnecessarily verbose and hard to read.
describe("SECRET loading", () => {
  it("throws when JWT_SECRET is not set", async () => {
    vi.stubEnv("JWT_SECRET", "");
    await expect(import("../src/jwtclaim.js")).rejects.toThrow("JWT_SECRET is not set");
  });

  it("loads the secret when JWT_SECRET is set", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value");
    const mod = await import("../src/jwtclaim.js");
    expect(mod.SECRET).toBe("test-secret-value");
  });
});
