import { z } from "zod";

const trimmed = z.string().trim();
const optionalString = trimmed.nullish();

// No defaults here because a default on the base leaks into opportunityUpdateSchema,
// where an omitted field must mean "leave it alone", not "reset it".
const opportunityBase = z.object({
  title: trimmed.min(1, "cannot be empty"),
  description: optionalString,
  skills: z.array(trimmed),
  center: trimmed.min(1, "cannot be empty"),
});

//applies defaults for opportunity creation
export const opportunityCreateSchema = opportunityBase.extend({
  skills: z.array(trimmed).default([]),
});

// Update: Base schema but everything is optional
export const opportunityUpdateSchema = opportunityBase.partial();

export const OPPORTUNITY_FILTERS = ["RECENT", "ALL"] as const;

export const opportunityQuerySchema = z.object({
  // Search across title, description, and skills
  q: trimmed.min(1).optional(),
  filter: z.enum(OPPORTUNITY_FILTERS).default("RECENT"),
  center: trimmed.min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
export type OpportunityQuery = z.infer<typeof opportunityQuerySchema>;
