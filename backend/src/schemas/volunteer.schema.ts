import { z } from "zod";

export const APPROVAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "DISAPPROVED",
  "INACTIVE",
] as const;

const trimmed = z.string().trim();
const optionalString = trimmed.optional();
const optionalPhone = z
  .union([z.literal(""), trimmed.min(7, "Number is too short").max(15, "Number is too long")])
  .optional();
const optionalEmail = z.union([z.literal(""), z.email("Improper formatting").trim().toLowerCase()]).optional();

// No defaults here because a default on the base leaks into volunteerUpdateSchema,
// where an omitted field must mean "leave it alone", not "reset it".
const volunteerBase = z.object({
  firstName: trimmed.min(1, "Cannot be empty"),
  lastName: trimmed.min(1, "Cannot be empty"),
  username: trimmed.min(1, "Cannot be empty"),
  password: z.string().min(8, "Must be at least 8 characters"),
  email: z.email("Improper formatting").trim().toLowerCase(),
  address: optionalString,
  homePhone: optionalPhone,
  workPhone: optionalPhone,
  cellPhone: optionalPhone,
  educationalBackground: optionalString,
  currentLicenses: optionalString,
  skills: z.array(trimmed),
  preferredCenters: z.array(trimmed),
  availability: optionalString,
  emergencyName: optionalString,
  emergencyHomePhone: optionalPhone,
  emergencyWorkPhone: optionalPhone,
  emergencyEmail: optionalEmail,
  emergencyAddress: optionalString,
  driversLicenseOnFile: z.boolean(),
  socialSecurityOnFile: z.boolean(),
  approvalStatus: z.enum(APPROVAL_STATUSES),
});

//applys default for volunteer creation
export const volunteerCreateSchema = volunteerBase.extend({
  skills: z.array(trimmed).default([]),
  preferredCenters: z.array(trimmed).default([]),
  driversLicenseOnFile: z.boolean().default(false),
  socialSecurityOnFile: z.boolean().default(false),
  approvalStatus: z.enum(APPROVAL_STATUSES).default("PENDING"),
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
  q: trimmed.min(1).optional(),
  status: z.enum(VOLUNTEER_FILTERS).default("DEFAULT"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type VolunteerCreateInput = z.infer<typeof volunteerCreateSchema>;
export type VolunteerUpdateInput = z.infer<typeof volunteerUpdateSchema>;
export type VolunteerQuery = z.infer<typeof volunteerQuerySchema>;
