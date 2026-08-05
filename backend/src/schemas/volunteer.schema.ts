//This schema will be used by the frontend as well. This file should not be manually copied to
//or edited in the frontend file. Updates should be made here and then synced with npm run sync-schemas
import { z } from "zod";

export const APPROVAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "DISAPPROVED",
  "INACTIVE",
] as const;

// Error messages are written as fragments so they read correctly both on the backend,
// where the field name is prefixed ("firstName: is required"), and on the
// frontend, where they appear under a labeled input.
const trimmed = z.string().trim();
const optionalString = trimmed.nullish(); // string | null | undefined
const optionalEmail = z
  .email("must be a valid email address")
  .trim()
  .toLowerCase()
  .nullish();

// No defaults here. A default on the base leaks into volunteerUpdateSchema,
// where an omitted field must mean "leave it alone", not "reset it".
const volunteerBase = z.object({
  firstName: trimmed.min(1, "is required"),
  lastName: trimmed.min(1, "is required"),
  username: trimmed.min(1, "is required"),
  password: z.string().min(8, "must be at least 8 characters"),
  email: z.email("must be a valid email address").trim().toLowerCase(),
  address: optionalString,
  homePhone: optionalString,
  workPhone: optionalString,
  cellPhone: optionalString,
  educationalBackground: optionalString,
  currentLicenses: optionalString,
  skills: z.array(trimmed, "must be a list of skills"),
  preferredCenters: z.array(trimmed, "must be a list of center names"),
  availability: optionalString,
  emergencyName: optionalString,
  emergencyHomePhone: optionalString,
  emergencyWorkPhone: optionalString,
  emergencyEmail: optionalEmail,
  emergencyAddress: optionalString,
  driversLicenseOnFile: z.boolean("must be true or false"),
  socialSecurityOnFile: z.boolean("must be true or false"),
  approvalStatus: z.enum(APPROVAL_STATUSES, "must be a valid approval status"),
});

// Create: apply defaults for the optional-on-input fields
export const volunteerCreateSchema = volunteerBase.extend({
  skills: z.array(trimmed, "must be a list of skills").default([]),
  preferredCenters: z
    .array(trimmed, "must be a list of center names")
    .default([]),
  driversLicenseOnFile: z.boolean("must be true or false").default(false),
  socialSecurityOnFile: z.boolean("must be true or false").default(false),
  approvalStatus: z
    .enum(APPROVAL_STATUSES, "must be a valid approval status")
    .default("PENDING"),
});

// Update: Base schema but everything is optional
export const volunteerUpdateSchema = volunteerBase.partial();

export const VOLUNTEER_FILTERS = [
  "DEFAULT",
  "ALL",
  ...APPROVAL_STATUSES,
] as const;

export const volunteerQuerySchema = z.object({
  // Search across name, username, email, and skills
  q: trimmed.min(1, "cannot be empty").optional(),
  status: z
    .enum(VOLUNTEER_FILTERS, "must be a valid filter")
    .default("DEFAULT"),
  page: z.coerce
    .number("must be a number")
    .int("must be a whole number")
    .min(1, "must be at least 1")
    .default(1),
  limit: z.coerce
    .number("must be a number")
    .int("must be a whole number")
    .min(1, "must be at least 1")
    .max(100, "cannot exceed 100")
    .default(25),
});

export type VolunteerCreateInput = z.infer<typeof volunteerCreateSchema>;
export type VolunteerUpdateInput = z.infer<typeof volunteerUpdateSchema>;
export type VolunteerQuery = z.infer<typeof volunteerQuerySchema>;
