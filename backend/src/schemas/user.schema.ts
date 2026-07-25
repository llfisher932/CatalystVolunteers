// src/schemas/user.schema.ts
import { z } from "zod";

const trimmed = z.string().trim();

export const userRegisterSchema = z.object({
  name: trimmed.min(1, "is required"),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, "must be at least 8 characters"),
});

export const userLoginSchema = z.object({
  // login is lenient on format — we just need both present. Wrong credentials
  // are reported as 401, not 400, so we don't format-validate the email here.

  //follows security principle of login revealing as little info as possible about why it failed
  email: trimmed.min(1, "Email and password required").toLowerCase(),
  password: z.string().min(1, "Email and password required"),
});

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
