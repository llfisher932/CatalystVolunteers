// tests/index.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

import type { Response } from "supertest";

vi.mock("../src/db.js", () => ({
  default: {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import app from "../src/index.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("app wiring", () => {
  describe("unknown routes are rejected", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/this-route-does-not-exist");
    });

    it("returns 404", () => {
      expect(res.status).toBe(404);
    });
  });

  describe("CORS reflects the request origin", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/health").set("Origin", "http://example.com");
    });

    it("sets access-control-allow-origin to the caller", () => {
      expect(res.headers["access-control-allow-origin"]).toBe("http://example.com");
    });
  });

  // These verify the middleware/router are wired up, not the router's own logic.
  describe("JSON request bodies are parsed", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/users/login").send({});
    });

    it("reaches the route handler with a parsed body", () => {
      expect(res.status).toBe(400);
    });
  });

  describe("the users router is reachable", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/users/login").send({ email: "a@b.com" });
    });

    it("is mounted under /users", () => {
      expect(res.status).toBe(400);
    });
  });

  describe("the swagger docs are served", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/api-docs/");
    });

    // The body-content check may prove flaky across swagger-ui versions; adjust if needed.
    it("returns the UI at /api-docs", () => {
      expect(res.status).toBe(200);
      expect(res.text).toContain("swagger");
    });
  });

  describe("the health endpoint is live", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/health");
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });
    it("reports ok", () => {
      expect(res.body.status).toBe("ok");
    });
  });

  describe("the volunteers router is reachable", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/volunteers").send({});
    });

    // 401 rather than 404 proves the route matched and auth middleware ran
    it("is mounted under /volunteers", () => {
      expect(res.status).toBe(401);
    });
  });
});
