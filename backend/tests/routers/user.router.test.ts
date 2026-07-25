// tests/routers/user.router.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

import type { Response } from "supertest";

// Mock the db to prevent actual database calls during tests
vi.mock("../../src/db.js", () => ({
  default: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "../../src/db.js";
import userRouter from "../../src/routers/user.router.js";
import { errorHandler } from "../../src/middleware/errors.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use(errorHandler);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /users/register", () => {
  describe("when the password is too short", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/users/register").send({ name: "Jane", username: "jdoe", password: "short" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("includes a helpful error message", () => {
      expect(res.body.message).toMatch(/at least 8/);
    });
    it("does not create a user", () => {
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("when the username is too short", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app)
        .post("/users/register")
        .send({ name: "Jane", username: "jd", password: "longEnough123" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("includes a helpful error message", () => {
      expect(res.body.message).toMatch(/at least 3/);
    });
    it("does not create a user", () => {
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("when the name is missing", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/users/register").send({ username: "jdoe", password: "longEnough123" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("includes a helpful error message", () => {
      expect(res.body.message).toMatch(/name/i);
    });
    it("does not create a user", () => {
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("when the username already exists", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.user.create as any).mockRejectedValue({ code: "P2002" });

      res = await request(app)
        .post("/users/register")
        .send({ name: "Jane", username: "jdoe", password: "longEnough123" });
    });

    it("returns 409", () => {
      expect(res.status).toBe(409);
    });
    it("reports the username as already taken", () => {
      expect(res.body.message).toMatch(/already in use/i);
    });
    it("attempted to create the user", () => {
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the input is valid", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.user.create as any).mockResolvedValue({
        id: 1,
        name: "Jane",
        username: "jdoe",
      });

      res = await request(app)
        .post("/users/register")
        .send({ name: "Jane", username: "jdoe", password: "longEnough123" });
    });

    it("returns 201", () => {
      expect(res.status).toBe(201);
    });
    it("returns the created user without the password", () => {
      expect(res.body).toEqual({ id: 1, name: "Jane", username: "jdoe" });
    });
    it("created exactly one user", () => {
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });
    it("lowercases the username", () => {
      const { data } = (prisma.user.create as any).mock.calls[0][0];
      expect(data.username).toBe("jdoe");
    });
  });
});

describe("POST /users/login", () => {
  describe("when the password is missing", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/users/login").send({ username: "jdoe" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not look up a user", () => {
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("when the user is not found", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      res = await request(app).post("/users/login").send({ username: "nobody", password: "whatever123" });
    });

    it("returns 401", () => {
      expect(res.status).toBe(401);
    });
    it("does not return a token", () => {
      expect(res.body.token).toBeUndefined();
    });
  });

  describe("when the password is wrong", () => {
    let res: Response;

    beforeEach(async () => {
      const bcrypt = await import("bcrypt");
      const realHash = await bcrypt.default.hash("correct-password", 4);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 1,
        name: "Jane",
        username: "jdoe",
        password: realHash,
      });

      res = await request(app).post("/users/login").send({ username: "jdoe", password: "wrong-password" });
    });

    it("returns 401", () => {
      expect(res.status).toBe(401);
    });
    it("does not return a token", () => {
      expect(res.body.token).toBeUndefined();
    });
  });

  describe("when the credentials are valid", () => {
    let res: Response;

    beforeEach(async () => {
      const bcrypt = await import("bcrypt");
      const realHash = await bcrypt.default.hash("correct-password", 4);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 1,
        name: "Jane",
        username: "jdoe",
        password: realHash,
      });

      res = await request(app).post("/users/login").send({ username: "jdoe", password: "correct-password" });
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });
    it("returns a token", () => {
      expect(res.body.token).toBeDefined();
    });
  });
});
