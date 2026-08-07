import { z } from "zod";

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "DISAPPROVED", "INACTIVE"] as const;

const trimmed = z.string().trim();
const optionalString = trimmed.nullish(); // string | null | undefined
const optionalEmail = z.email().trim().toLowerCase().nullish(); // validated email | null | undefined

const volunteerBase = z.object({
  firstName: trimmed.min(1, "Cannot be empty"),
  lastName: trimmed.min(1, "Cannot be empty"),
  username: trimmed.min(1, "Cannot be empty"),
  password: z.string().min(8, "Must be at least 8 characters"),
  email: z.email("Improper formatting").trim().toLowerCase(),
  address: optionalString,
  homePhone: z.union( [
      z.literal( '' ),
      trimmed.min(7, "Number is too short").max(15, "Number is too long"),
  ] ),
  workPhone: z.union( [
      z.literal( '' ),
      trimmed.min(7, "Number is too short").max(15, "Number is too long"),
  ] ),
  cellPhone: z.union( [
      z.literal( '' ),
      trimmed.min(7, "Number is too short").max(15, "Number is too long"),
  ] ),
  educationalBackground: optionalString,
  currentLicenses: optionalString,
  skills: z.array(trimmed),
  availability: optionalString,
  emergencyName: optionalString,
  emergencyHomePhone: z.union( [
      z.literal( '' ),
      trimmed.min(7, "Number is too short").max(15, "Number is too long"),
  ] ),
  emergencyWorkPhone: z.union( [
      z.literal( '' ),
      trimmed.min(7, "Number is too short").max(15, "Number is too long"),
  ] ),
  emergencyEmail: z.union( [
      z.literal( '' ),
      z.email("improper formatting"),
  ] ),
  emergencyAddress: optionalString,
  driversLicenseOnFile: z.boolean(),
  socialSecurityOnFile: z.boolean(),
  approvalStatus: z.enum(APPROVAL_STATUSES),
});

// Create: apply defaults for the optional-on-input fields
export const volunteerCreateSchema = volunteerBase.extend({
  skills: z.array(trimmed).default([]),
  driversLicenseOnFile: z.boolean().default(false),
  socialSecurityOnFile: z.boolean().default(false),
  approvalStatus: z.enum(APPROVAL_STATUSES).default("PENDING"),
});

// Update: Base schema but everything is optional
export const volunteerUpdateSchema = volunteerBase.partial();

export const VOLUNTEER_FILTERS = ["DEFAULT", "ALL", ...APPROVAL_STATUSES] as const;

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
