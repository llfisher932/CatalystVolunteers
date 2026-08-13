import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

import type { Response } from "supertest";

vi.mock("../../src/db.js", () => ({
  default: {
    opportunity: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Auth is verified in index.test.ts; here it's a passthrough so we can
// exercise the handlers themselves.
vi.mock("../../src/auth/auth.js", () => ({
  RequiresAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import prisma from "../../src/db.js";
import opportunitiesRouter from "../../src/routers/opportunities.router.js";
import { errorHandler } from "../../src/middleware/errors.js";

const app = express();
app.use(express.json());
app.use("/opportunities", opportunitiesRouter);
app.use(errorHandler);

const validBody = {
  title: "Weekend food bank shift",
  center: "Downtown",
};

const createArgs = () => (prisma.opportunity.create as any).mock.calls[0][0];
const updateArgs = () => (prisma.opportunity.update as any).mock.calls[0][0];
const deleteArgs = () => (prisma.opportunity.delete as any).mock.calls[0][0];
const findManyArgs = () => (prisma.opportunity.findMany as any).mock.calls[0][0];

const mockList = (rows: unknown[] = [], total = rows.length) => {
  (prisma.opportunity.findMany as any).mockResolvedValue(rows);
  (prisma.opportunity.count as any).mockResolvedValue(total);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /opportunities", () => {
  describe("no query parameters are given", () => {
    let res: Response;

    beforeEach(async () => {
      mockList([{ id: 1, title: "Food bank", center: "Downtown" }], 1);
      res = await request(app).get("/opportunities");
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });
    it("returns the rows under data", () => {
      expect(res.body.data).toHaveLength(1);
    });
    it("defaults to the last 60 days", () => {
      expect(findManyArgs().where.createdAt.gte).toBeDefined();
    });
    it("does not filter by search or center", () => {
      expect(findManyArgs().where.OR).toBeUndefined();
      expect(findManyArgs().where.center).toBeUndefined();
    });
    it("defaults to the first page of 25", () => {
      expect(res.body.pagination).toEqual({ page: 1, limit: 25, total: 1, totalPages: 1 });
    });
    it("sorts newest first", () => {
      expect(findManyArgs().orderBy).toEqual({ createdAt: "desc" });
    });
  });

  describe("the recent window", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/opportunities");
    });

    it("cuts off roughly 60 days back", () => {
      const cutoff = findManyArgs().where.createdAt.gte as Date;
      const daysBack = (Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysBack).toBeGreaterThan(59.9);
      expect(daysBack).toBeLessThan(60.1);
    });
  });

  describe("all opportunities are requested", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/opportunities?filter=ALL");
    });

    it("applies no date filter", () => {
      expect(findManyArgs().where.createdAt).toBeUndefined();
    });
  });

  describe("the filter is not a known value", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/opportunities?filter=SOMETIME");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not query the database", () => {
      expect(prisma.opportunity.findMany).not.toHaveBeenCalled();
    });
  });

  describe("a center is given", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/opportunities?center=Downtown");
    });

    it("narrows to that center", () => {
      expect(findManyArgs().where.center).toBe("Downtown");
    });
    it("keeps the date filter alongside it", () => {
      expect(findManyArgs().where.createdAt.gte).toBeDefined();
    });
  });

  describe("a search term is given", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/opportunities?q=food");
    });

    it("searches across title and description", () => {
      expect(findManyArgs().where.OR).toEqual([
        { title: { contains: "food", mode: "insensitive" } },
        { description: { contains: "food", mode: "insensitive" } },
      ]);
    });
  });

  describe("a search term and a center are given", () => {
    beforeEach(async () => {
      mockList();
      await request(app).get("/opportunities?q=food&center=Downtown&filter=ALL");
    });

    it("combines both filters", () => {
      expect(findManyArgs().where.center).toBe("Downtown");
      expect(findManyArgs().where.OR).toBeDefined();
      expect(findManyArgs().where.createdAt).toBeUndefined();
    });
  });

  describe("nothing matches the search", () => {
    let res: Response;

    beforeEach(async () => {
      mockList([], 0);
      res = await request(app).get("/opportunities?q=nothingmatchesthis");
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
      res = await request(app).get("/opportunities?page=3&limit=10");
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
      res = await request(app).get("/opportunities?limit=5000");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not query the database", () => {
      expect(prisma.opportunity.findMany).not.toHaveBeenCalled();
    });
  });

  describe("the page is not a number", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).get("/opportunities?page=abc");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
  });
});

describe("POST /opportunities", () => {
  describe("required fields are missing", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).post("/opportunities").send({ title: "Food bank" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not create an opportunity", () => {
      expect(prisma.opportunity.create).not.toHaveBeenCalled();
    });
  });

  describe("the title is blank", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app)
        .post("/opportunities")
        .send({ ...validBody, title: "   " });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("names the offending field", () => {
      expect(res.body.message).toMatch(/title/);
    });
  });

  describe("unknown fields are sent", () => {
    beforeEach(async () => {
      (prisma.opportunity.create as any).mockResolvedValue({ id: 1 });

      await request(app)
        .post("/opportunities")
        .send({ ...validBody, id: 999, matches: [] });
    });

    it("strips them before reaching the database", () => {
      expect(createArgs().data).not.toHaveProperty("id");
      expect(createArgs().data).not.toHaveProperty("matches");
    });
  });

  describe("the opportunity is valid", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.opportunity.create as any).mockResolvedValue({
        id: 1,
        title: "Weekend food bank shift",
        center: "Downtown",
      });

      res = await request(app)
        .post("/opportunities")
        .send({ title: "  Weekend food bank shift  ", center: "  Downtown  ", description: "Sorting donations" });
    });

    it("returns 201", () => {
      expect(res.status).toBe(201);
    });
    it("returns the created opportunity", () => {
      expect(res.body.id).toBe(1);
    });
    it("trims the values", () => {
      expect(createArgs().data.title).toBe("Weekend food bank shift");
      expect(createArgs().data.center).toBe("Downtown");
    });
    it("passes the description through", () => {
      expect(createArgs().data.description).toBe("Sorting donations");
    });
  });

  describe("the database fails unexpectedly", () => {
    let res: Response;
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      (prisma.opportunity.create as any).mockRejectedValue(new Error("connection lost"));

      res = await request(app).post("/opportunities").send(validBody);
    });

    it("returns 500", () => {
      expect(res.status).toBe(500);
    });
    it("does not leak the internal error", () => {
      expect(res.body.message).not.toMatch(/connection lost/);
    });
  });
});

describe("PATCH /opportunities/:id", () => {
  describe("the id is not a valid number", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/opportunities/abc").send({ title: "New title" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not update anything", () => {
      expect(prisma.opportunity.update).not.toHaveBeenCalled();
    });
  });

  describe("the id is zero", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/opportunities/0").send({ title: "New title" });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
  });

  describe("no fields are sent", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/opportunities/1").send({});
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not update anything", () => {
      expect(prisma.opportunity.update).not.toHaveBeenCalled();
    });
  });

  describe("a required field is blanked out", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).patch("/opportunities/1").send({ center: "   " });
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
  });

  describe("only some fields are sent", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.opportunity.update as any).mockResolvedValue({ id: 1, center: "Northside" });

      res = await request(app).patch("/opportunities/1").send({ center: " Northside " });
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });
    it("updates only the fields that were sent", () => {
      expect(Object.keys(updateArgs().data)).toEqual(["center"]);
    });
    it("trims the value", () => {
      expect(updateArgs().data.center).toBe("Northside");
    });
    it("targets the right opportunity", () => {
      expect(updateArgs().where).toEqual({ id: 1 });
    });
  });

  describe("the opportunity does not exist", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.opportunity.update as any).mockRejectedValue({ code: "P2025" });

      res = await request(app).patch("/opportunities/999").send({ title: "New title" });
    });

    it("returns 404", () => {
      expect(res.status).toBe(404);
    });
  });
});

describe("DELETE /opportunities/:id", () => {
  describe("the id is not a valid number", () => {
    let res: Response;

    beforeEach(async () => {
      res = await request(app).delete("/opportunities/abc");
    });

    it("returns 400", () => {
      expect(res.status).toBe(400);
    });
    it("does not delete anything", () => {
      expect(prisma.opportunity.delete).not.toHaveBeenCalled();
    });
  });

  describe("the opportunity exists", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.opportunity.delete as any).mockResolvedValue({ id: 1 });

      res = await request(app).delete("/opportunities/1");
    });

    it("returns 204", () => {
      expect(res.status).toBe(204);
    });
    it("returns no body", () => {
      expect(res.body).toEqual({});
    });
    it("targets the right opportunity", () => {
      expect(deleteArgs().where).toEqual({ id: 1 });
    });
  });

  describe("the opportunity does not exist", () => {
    let res: Response;

    beforeEach(async () => {
      (prisma.opportunity.delete as any).mockRejectedValue({ code: "P2025" });

      res = await request(app).delete("/opportunities/999");
    });

    it("returns 404", () => {
      expect(res.status).toBe(404);
    });
  });
});
