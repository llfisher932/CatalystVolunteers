import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

import type { Response } from "supertest";

vi.mock("../../src/db.js", () => ({
  default: {
    volunteer: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      count: vi.fn(),
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

const findManyArgs = () => (prisma.volunteer.findMany as any).mock.calls[0][0];
const findUniqueArgs = () => (prisma.volunteer.findUniqueOrThrow as any).mock.calls[0][0];
const createArgs = () => (prisma.volunteer.create as any).mock.calls[0][0];
const updateArgs = () => (prisma.volunteer.update as any).mock.calls[0][0];

const mockList = (rows: unknown[] = [], total = rows.length) => {
  (prisma.volunteer.findMany as any).mockResolvedValue(rows);
  (prisma.volunteer.count as any).mockResolvedValue(total);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /volunteers", () => {
  describe("no query parameters are given", () => {
    let res: Response;

    beforeEach(async () => {
      mockList([{ id: 1, firstName: "Jane", lastName: "Doe", email: "j@e.com", approvalStatus: "PENDING" }], 1);
      res = await request(app).get("/volunteers");
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });
    it("returns the rows under data", () => {
      expect(res.body.data).toHaveLength(1);
    });
    it("defaults to the approved and pending filter", () => {
      expect(findManyArgs().where.approvalStatus).toEqual({ in: ["APPROVED", "PENDING"] });
    });
    it("does not filter by search", () => {
      expect(findManyArgs().where.OR).toBeUndefined();
    });
    it("defaults to the first page of 25", () => {
      expect(res.body.pagination).toEqual({ page: 1, limit: 25, total: 1, totalPages: 1 });
    });
    it("sorts by name", () => {
      expect(findManyArgs().orderBy).toEqual([{ lastName: "asc" }, { firstName: "asc" }]);
    });
  });

  describe("a single status is requested", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/volunteers?status=DISAPPROVED");
    });

    it("filters to just that status", () => {
      expect(findManyArgs().where.approvalStatus).toEqual({ in: ["DISAPPROVED"] });
    });
  });

  describe("all statuses are requested", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/volunteers?status=ALL");
    });

    it("applies no status filter", () => {
      expect(findManyArgs().where.approvalStatus).toBeUndefined();
    });
  });

  describe("the status is not a known value", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/volunteers?status=MAYBE");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not query the database", () => {
      expect(prisma.volunteer.findMany).not.toHaveBeenCalled();
    });
  });

  describe("a search term is given", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/volunteers?q=smith");
    });

    it("searches across name, username, email, and skills", () => {
      expect(findManyArgs().where.OR).toEqual([
        { firstName: { contains: "smith", mode: "insensitive" } },
        { lastName: { contains: "smith", mode: "insensitive" } },
        { username: { contains: "smith", mode: "insensitive" } },
        { email: { contains: "smith", mode: "insensitive" } },
        { skills: { has: "smith" } },
      ]);
    });
    it("keeps the status filter alongside the search", () => {
      expect(findManyArgs().where.approvalStatus).toEqual({ in: ["APPROVED", "PENDING"] });
    });
  });

  describe("nothing matches the search", () => {
    let res: Response;

    beforeEach(async () => {
      mockList([], 0);
      res = await request(app).get("/volunteers?q=nobodyhasthisname");
    });

    it("returns 200 rather than 404", () => {
      expect(res.status).toBe(200);
    });
    it("returns an empty list", () => {
      expect(res.body.data).toEqual([]);
    });
    it("reports zero pages", () => {
      expect(res.body.pagination.totalPages).toBe(0);
    });
  });

  describe("a later page is requested", () => {
    let res: Response;

    beforeEach(async () => {
      mockList([], 42);
      res = await request(app).get("/volunteers?page=3&limit=10");
    });

    it("skips the earlier pages", () => {
      expect(findManyArgs().skip).toBe(20);
    });
    it("takes one page worth of rows", () => {
      expect(findManyArgs().take).toBe(10);
    });
    it("reports the total page count", () => {
      expect(res.body.pagination.totalPages).toBe(5);
    });
  });

  describe("the limit exceeds the maximum", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/volunteers?limit=5000");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not query the database", () => {
      expect(prisma.volunteer.findMany).not.toHaveBeenCalled();
    });
  });

  describe("the page is not a number", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/volunteers?page=abc");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
  });

  describe("the summary list", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/volunteers");
    });

    it("selects only the summary fields", () => {
      expect(Object.keys(findManyArgs().select)).toEqual(["id", "firstName", "lastName", "email", "approvalStatus"]);
    });
    it("never selects the password", () => {
      expect(findManyArgs().select).not.toHaveProperty("password");
    });
  });
});

describe("GET /volunteers/:id", () => {
  describe("the volunteer exists", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.volunteer.findUniqueOrThrow as any).mockResolvedValue({
        id: 1,
        firstName: "Jane",
        matches: [],
      });

      res = await request(app).get("/volunteers/1");
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });
    it("returns the volunteer", () => {
      expect(res.body.id).toBe(1);
    });
    it("never returns the password", () => {
      expect(res.body.password).toBeUndefined();
    });
    it("omits the password from the query", () => {
      expect(findUniqueArgs().omit).toEqual({ password: true });
    });
    it("includes the matched opportunities", () => {
      expect(findUniqueArgs().include.matches.include.opportunity.select).toEqual({
        id: true,
        title: true,
        center: true,
        createdAt: true,
      });
    });
  });

  describe("the id is not a valid number", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/volunteers/abc");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not query the database", () => {
      expect(prisma.volunteer.findUniqueOrThrow).not.toHaveBeenCalled();
    });
  });

  describe("the volunteer does not exist", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.volunteer.findUniqueOrThrow as any).mockRejectedValue({ code: "P2025" });
      res = await request(app).get("/volunteers/999");
    });

    it("returns 404", () => {
      expect(res.status).toBe(404);
    });
  });
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
    it("names the offending field", () => {
      expect(res.body.message).toMatch(/email/i);
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

  describe("the approval status is not a known value", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app)
        .post("/volunteers")
        .send({ ...validBody, approvalStatus: "MAYBE" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
  });

  describe("unknown fields are sent", () => {
    beforeEach(async () => {
      (prisma.volunteer.create as any).mockResolvedValue({ id: 1 });

      await request(app)
        .post("/volunteers")
        .send({ ...validBody, id: 999, isAdmin: true });
    });

    it("strips them before reaching the database", () => {
      expect(createArgs().data).not.toHaveProperty("id");
      expect(createArgs().data).not.toHaveProperty("isAdmin");
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
        .send({ ...validBody, skills: [" cooking ", "driving"], preferredCenters: [" Downtown "] });
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
      expect(createArgs().data.password).toBe("hashed-password");
    });
    it("normalizes the email to lowercase", () => {
      expect(createArgs().data.email).toBe("jane.doe@example.com");
    });
    it("trims the skills", () => {
      expect(createArgs().data.skills).toEqual(["cooking", "driving"]);
    });
    it("trims the preferred centers", () => {
      expect(createArgs().data.preferredCenters).toEqual(["Downtown"]);
    });
    it("defaults the document flags to false", () => {
      expect(createArgs().data.driversLicenseOnFile).toBe(false);
      expect(createArgs().data.socialSecurityOnFile).toBe(false);
    });
    it("defaults the approval status to pending", () => {
      expect(createArgs().data.approvalStatus).toBe("PENDING");
    });
  });

  describe("preferred centers are omitted", () => {
    beforeEach(async () => {
      (prisma.volunteer.create as any).mockResolvedValue({ id: 1 });

      await request(app).post("/volunteers").send(validBody);
    });

    it("defaults them to an empty list", () => {
      expect(createArgs().data.preferredCenters).toEqual([]);
    });
  });

  describe("an approval status is supplied", () => {
    beforeEach(async () => {
      (prisma.volunteer.create as any).mockResolvedValue({ id: 1 });

      await request(app)
        .post("/volunteers")
        .send({ ...validBody, approvalStatus: "APPROVED" });
    });

    it("uses the supplied status", () => {
      expect(createArgs().data.approvalStatus).toBe("APPROVED");
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
      // The stack trace this prints is expected — it proves the handler logs.
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

  describe("no fields are sent", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/volunteers/1").send({});
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
      expect(Object.keys(updateArgs().data)).toEqual(["address"]);
    });
    it("trims the value", () => {
      expect(updateArgs().data.address).toBe("5 Main St");
    });
    it("targets the right volunteer", () => {
      expect(updateArgs().where).toEqual({ id: 1 });
    });
  });

  describe("preferred centers are updated", () => {
    beforeEach(async () => {
      (prisma.volunteer.update as any).mockResolvedValue({ id: 1 });

      await request(app)
        .patch("/volunteers/1")
        .send({ preferredCenters: [" Northside "] });
    });

    it("trims and stores them", () => {
      expect(updateArgs().data.preferredCenters).toEqual(["Northside"]);
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
      expect(updateArgs().data).not.toHaveProperty("password");
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
      expect(updateArgs().data.password).toBe("hashed-password");
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
