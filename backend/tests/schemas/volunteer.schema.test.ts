import { describe, it, expect } from "vitest";
import { volunteerCreateSchema, volunteerUpdateSchema } from "../../src/schemas/volunteer.schema.js";

const validCreate = {
  firstName: "Jane",
  lastName: "Doe",
  username: "jdoe",
  password: "longenough123",
  email: "Jane@Example.com",
};

describe("volunteerCreateSchema", () => {
  it("applies defaults for omitted optional fields", () => {
    const parsed = volunteerCreateSchema.parse(validCreate);
    expect(parsed.skills).toEqual([]);
    expect(parsed.driversLicenseOnFile).toBe(false);
    expect(parsed.socialSecurityOnFile).toBe(false);
    expect(parsed.approvalStatus).toBe("PENDING");
  });
});

describe("volunteerUpdateSchema", () => {
  it("does NOT apply defaults — omitted fields stay absent", () => {
    const parsed = volunteerUpdateSchema.parse({ address: "5 Main St" });
    expect(Object.keys(parsed)).toEqual(["address"]);
  });

  it("allows omitting a required field", () => {
    expect(volunteerUpdateSchema.safeParse({ address: "x" }).success).toBe(true);
  });

  it("rejects blanking out a required field", () => {
    expect(volunteerUpdateSchema.safeParse({ firstName: "  " }).success).toBe(false);
  });

  it("strips unknown keys", () => {
    const parsed = volunteerUpdateSchema.parse({ address: "x", id: 999, isAdmin: true });
    expect(parsed).toEqual({ address: "x" });
  });
});
