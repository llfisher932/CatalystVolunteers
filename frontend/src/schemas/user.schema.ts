//This schema will be used by the frontend as well. This file should not be manually copied
//or edited in the frontend file. Updates should be made here and then synced with npm run sync-schemas
import { z } from "zod";

const trimmed = z.string().trim();

export const userRegisterSchema = z.object({
  name: trimmed.min(1, "is required"),
  username: trimmed.min(3, "must be at least 3 characters").toLowerCase(),
  password: z.string().min(8, "must be at least 8 characters"),
});

export const userLoginSchema = z.object({
  //follows security principle of login revealing as little info as possible about why it failed
  username: trimmed.min(1, "Username and password required").toLowerCase(),
  password: z.string().min(1, "Username and password required"),
});

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
