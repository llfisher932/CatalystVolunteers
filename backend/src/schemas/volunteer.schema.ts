import { z } from "zod";

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "DISAPPROVED", "INACTIVE"] as const;

const trimmed = z.string().trim();
const optionalString = trimmed.nullish(); // string | null | undefined
const optionalEmail = z.email().trim().toLowerCase().nullish(); // validated email | null | undefined

// Base has NO defaults — every field is just its type/constraint
const volunteerBase = z.object({
  firstName: trimmed.min(1, "cannot be empty"),
  lastName: trimmed.min(1, "cannot be empty"),
  username: trimmed.min(1, "cannot be empty"),
  password: z.string().min(8, "must be at least 8 characters"),
  email: z.email().trim().toLowerCase(),
  address: optionalString,
  homePhone: optionalString,
  workPhone: optionalString,
  cellPhone: optionalString,
  educationalBackground: optionalString,
  currentLicenses: optionalString,
  skills: z.array(trimmed),
  availability: optionalString,
  emergencyName: optionalString,
  emergencyHomePhone: optionalString,
  emergencyWorkPhone: optionalString,
  emergencyEmail: optionalEmail,
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

export type VolunteerCreateInput = z.infer<typeof volunteerCreateSchema>;
export type VolunteerUpdateInput = z.infer<typeof volunteerUpdateSchema>;
