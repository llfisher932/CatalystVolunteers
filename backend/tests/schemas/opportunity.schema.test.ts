import { describe, it, expect } from "vitest";
import {
  opportunityCreateSchema,
  opportunityUpdateSchema,
  opportunityQuerySchema,
} from "../../src/schemas/opportunity.schema.js";

const validOpportunity = {
  title: "Weekend food bank shift",
  center: "Downtown",
};

describe("opportunityCreateSchema", () => {
  describe("a valid opportunity", () => {
    it("passes", () => {
      expect(opportunityCreateSchema.safeParse(validOpportunity).success).toBe(true);
    });

    it("trims whitespace", () => {
      const parsed = opportunityCreateSchema.parse({ title: "  Food bank  ", center: "  Downtown  " });
      expect(parsed.title).toBe("Food bank");
      expect(parsed.center).toBe("Downtown");
    });

    it("strips unknown keys so they can't reach the database", () => {
      const parsed = opportunityCreateSchema.parse({ ...validOpportunity, id: 999, matches: [] });
      expect(parsed).not.toHaveProperty("id");
      expect(parsed).not.toHaveProperty("matches");
    });
  });

  describe("required fields", () => {
    it("rejects a missing title", () => {
      expect(opportunityCreateSchema.safeParse({ center: "Downtown" }).success).toBe(false);
    });

    it("rejects an empty title", () => {
      expect(opportunityCreateSchema.safeParse({ ...validOpportunity, title: "   " }).success).toBe(false);
    });

    it("rejects a missing center", () => {
      expect(opportunityCreateSchema.safeParse({ title: "Food bank" }).success).toBe(false);
    });

    it("rejects an empty center", () => {
      expect(opportunityCreateSchema.safeParse({ ...validOpportunity, center: "" }).success).toBe(false);
    });
  });

  describe("description", () => {
    it("is optional", () => {
      expect(opportunityCreateSchema.safeParse(validOpportunity).success).toBe(true);
    });

    it("accepts a value", () => {
      const parsed = opportunityCreateSchema.parse({ ...validOpportunity, description: "  Sorting donations  " });
      expect(parsed.description).toBe("Sorting donations");
    });
  });
});

describe("opportunityUpdateSchema", () => {
  describe("partial updates", () => {
    it("allows omitting every field", () => {
      expect(opportunityUpdateSchema.safeParse({}).success).toBe(true);
    });

    it("allows updating a single field", () => {
      expect(opportunityUpdateSchema.safeParse({ center: "Northside" }).success).toBe(true);
    });

    it("leaves omitted fields absent rather than defaulting them", () => {
      const parsed = opportunityUpdateSchema.parse({ center: "Northside" });
      expect(Object.keys(parsed)).toEqual(["center"]);
    });
  });

  describe("required fields can be omitted but not blanked", () => {
    it("allows omitting the title", () => {
      expect(opportunityUpdateSchema.safeParse({ center: "Downtown" }).success).toBe(true);
    });

    it("rejects blanking out the title", () => {
      expect(opportunityUpdateSchema.safeParse({ title: "   " }).success).toBe(false);
    });

    it("rejects blanking out the center", () => {
      expect(opportunityUpdateSchema.safeParse({ center: "" }).success).toBe(false);
    });
  });

  it("strips unknown keys", () => {
    const parsed = opportunityUpdateSchema.parse({ title: "New title", id: 999 });
    expect(parsed).not.toHaveProperty("id");
  });
});

describe("opportunityQuerySchema", () => {
  describe("defaults", () => {
    it("applies them when nothing is supplied", () => {
      const parsed = opportunityQuerySchema.parse({});
      expect(parsed.filter).toBe("RECENT");
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(25);
    });
  });

  describe("coercion", () => {
    it("converts numeric query strings to numbers", () => {
      const parsed = opportunityQuerySchema.parse({ page: "3", limit: "50" });
      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(50);
    });
  });

  describe("bounds", () => {
    it("rejects a limit above the maximum", () => {
      expect(opportunityQuerySchema.safeParse({ limit: "5000" }).success).toBe(false);
    });

    it("rejects a page below one", () => {
      expect(opportunityQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    });

    it("rejects a non-numeric page", () => {
      expect(opportunityQuerySchema.safeParse({ page: "abc" }).success).toBe(false);
    });
  });

  describe("filter", () => {
    it("accepts a known value", () => {
      expect(opportunityQuerySchema.safeParse({ filter: "ALL" }).success).toBe(true);
    });

    it("rejects an unknown value", () => {
      expect(opportunityQuerySchema.safeParse({ filter: "SOMETIME" }).success).toBe(false);
    });
  });
});
