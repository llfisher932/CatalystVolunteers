// tests/volunteer.router.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

import type { Response } from "supertest";

vi.mock("../../src/db.js", () => ({
  default: {
    volunteer: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Auth is verified in index.test.ts; here it's a passthrough so we can
// exercise the handlers themselves.
vi.mock("../../src/auth/auth.js", () => ({
  RequiresAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mocked so tests don't pay the ~180ms cost of a real hash, and so we can
// assert the cost factor and that the plaintext never reaches the database.
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
  },
}));

import prisma from "../../src/db.js";
import bcrypt from "bcrypt";
import volunteerRouter from "../../src/routers/volunteers.router.js";
import { errorHandler } from "../../src/middleware/errors.js";

const app = express();
app.use(express.json());
app.use("/volunteers", volunteerRouter);
app.use(errorHandler);

const validBody = {
  firstName: "Jane",
  lastName: "Doe",
  username: "jdoe",
  password: "longenough123",
  email: "Jane.Doe@Example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /volunteers", () => {
  describe("required fields are missing", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/volunteers").send({ firstName: "Jane" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not create a volunteer", () => {
      expect(prisma.volunteer.create).not.toHaveBeenCalled();
    });
  });

  describe("the email is invalid", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app)
        .post("/volunteers")
        .send({ ...validBody, email: "not-an-email" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("says a valid email is required", () => {
      expect(res.body.message).toMatch(/valid email/i);
    });
  });

  describe("the password is too short", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app)
        .post("/volunteers")
        .send({ ...validBody, password: "short" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("never hashes the password", () => {
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe("skills is not an array", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app)
        .post("/volunteers")
        .send({ ...validBody, skills: "cooking" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
  });

  describe("a document flag is not a boolean", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app)
        .post("/volunteers")
        .send({ ...validBody, driversLicenseOnFile: "yes" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("names the offending field", () => {
      expect(res.body.message).toMatch(/driversLicenseOnFile/);
    });
  });

  describe("the volunteer is valid", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.volunteer.create as any).mockResolvedValue({
        id: 1,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
      });

      res = await request(app)
        .post("/volunteers")
        .send({ ...validBody, skills: [" cooking ", "driving"] });
    });

    it("returns 201", () => {
      expect(res.status).toBe(201);
    });
    it("returns the created volunteer", () => {
      expect(res.body.id).toBe(1);
    });
    it("never returns the password", () => {
      expect(res.body.password).toBeUndefined();
    });
    it("hashes the password with a cost of 12", () => {
      expect(bcrypt.hash).toHaveBeenCalledWith("longenough123", 12);
    });
    it("stores the hash, not the plaintext", () => {
      const { data } = (prisma.volunteer.create as any).mock.calls[0][0];
      expect(data.password).toBe("hashed-password");
    });
    it("normalizes the email to lowercase", () => {
      const { data } = (prisma.volunteer.create as any).mock.calls[0][0];
      expect(data.email).toBe("jane.doe@example.com");
    });
    it("trims the skills", () => {
      const { data } = (prisma.volunteer.create as any).mock.calls[0][0];
      expect(data.skills).toEqual(["cooking", "driving"]);
    });
    it("defaults the document flags to false", () => {
      const { data } = (prisma.volunteer.create as any).mock.calls[0][0];
      expect(data.driversLicenseOnFile).toBe(false);
      expect(data.socialSecurityOnFile).toBe(false);
    });
  });

  describe("the username or email is taken", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.volunteer.create as any).mockRejectedValue({
        code: "P2002",
        meta: { target: ["username"] },
      });

      res = await request(app).post("/volunteers").send(validBody);
    });

    it("returns 409", () => {
      expect(res.status).toBe(409);
    });
    it("names the conflicting field", () => {
      expect(res.body.message).toMatch(/username/);
    });
  });

  describe("the database fails unexpectedly", () => {
    let res: Response;

    beforeEach(async () => {
      //this line will throw errors in the terminal, its expected and means it is working properly.
      (prisma.volunteer.create as any).mockRejectedValue(new Error("connection lost"));

      res = await request(app).post("/volunteers").send(validBody);
    });

    it("returns 500", () => {
      expect(res.status).toBe(500);
    });
    it("does not leak the internal error", () => {
      expect(res.body.message).not.toMatch(/connection lost/);
    });
  });
});

describe("PATCH /volunteers/:id", () => {
  describe("the id is not a valid number", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/volunteers/abc").send({ firstName: "Jane" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not update anything", () => {
      expect(prisma.volunteer.update).not.toHaveBeenCalled();
    });
  });

  describe("a required field is blanked out", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/volunteers/1").send({ firstName: "   " });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("names the offending field", () => {
      expect(res.body.message).toMatch(/firstName/);
    });
  });

  describe("the approval status is not a known value", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/volunteers/1").send({ approvalStatus: "MAYBE" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("lists the valid statuses", () => {
      expect(res.body.message).toMatch(/APPROVED/);
    });
  });

  describe("only some fields are sent", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.volunteer.update as any).mockResolvedValue({ id: 1, address: "5 Main St" });

      res = await request(app).patch("/volunteers/1").send({ address: " 5 Main St " });
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });
    it("updates only the fields that were sent", () => {
      const { data } = (prisma.volunteer.update as any).mock.calls[0][0];
      expect(Object.keys(data)).toEqual(["address"]);
    });
    it("trims the value", () => {
      const { data } = (prisma.volunteer.update as any).mock.calls[0][0];
      expect(data.address).toBe("5 Main St");
    });
    it("targets the right volunteer", () => {
      const { where } = (prisma.volunteer.update as any).mock.calls[0][0];
      expect(where).toEqual({ id: 1 });
    });
  });

  describe("no password is sent", () => {
    beforeEach(async () => {
      (prisma.volunteer.update as any).mockResolvedValue({ id: 1 });

      await request(app).patch("/volunteers/1").send({ firstName: "Janet" });
    });

    it("does not hash anything", () => {
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
    it("leaves the stored password untouched", () => {
      const { data } = (prisma.volunteer.update as any).mock.calls[0][0];
      expect(data).not.toHaveProperty("password");
    });
  });

  describe("a new password is sent", () => {
    beforeEach(async () => {
      (prisma.volunteer.update as any).mockResolvedValue({ id: 1 });

      await request(app).patch("/volunteers/1").send({ password: "brandnewpassword" });
    });

    it("hashes it with a cost of 12", () => {
      expect(bcrypt.hash).toHaveBeenCalledWith("brandnewpassword", 12);
    });
    it("stores the hash, not the plaintext", () => {
      const { data } = (prisma.volunteer.update as any).mock.calls[0][0];
      expect(data.password).toBe("hashed-password");
    });
  });

  describe("the volunteer does not exist", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.volunteer.update as any).mockRejectedValue({ code: "P2025" });

      res = await request(app).patch("/volunteers/999").send({ firstName: "Jane" });
    });

    it("returns 404", () => {
      expect(res.status).toBe(404);
    });
  });

  describe("the new email is already taken", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.volunteer.update as any).mockRejectedValue({
        code: "P2002",
        meta: { target: ["email"] },
      });

      res = await request(app).patch("/volunteers/1").send({ email: "taken@example.com" });
    });

    it("returns 409", () => {
      expect(res.status).toBe(409);
    });
  });
});
