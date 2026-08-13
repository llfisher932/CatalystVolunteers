import { z } from "zod";

const trimmed = z.string().trim();
const optionalString = trimmed.nullish();

// No defaults here because a default on the base leaks into opportunityUpdateSchema,
// where an omitted field must mean "leave it alone", not "reset it".
const opportunityBase = z.object({
  title: trimmed.min(1, "cannot be empty"),
  description: optionalString,
  center: trimmed.min(1, "cannot be empty"),
});

//schema for creation of an opportunity
export const opportunityCreateSchema = opportunityBase;

// Update: Base schema but everything is optional
export const opportunityUpdateSchema = opportunityBase.partial();

export const OPPORTUNITY_FILTERS = ["RECENT", "ALL"] as const;

export const opportunityQuerySchema = z.object({
  q: trimmed.min(1).optional(),
  filter: z.enum(OPPORTUNITY_FILTERS).default("RECENT"),
  center: trimmed.min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const assignVolunteersSchema = z.object({
  volunteerEmails: z.array(z.email("must be a valid email address").trim().toLowerCase()),
});

export type AssignVolunteersInput = z.infer<typeof assignVolunteersSchema>;
export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
export type OpportunityQuery = z.infer<typeof opportunityQuerySchema>;
