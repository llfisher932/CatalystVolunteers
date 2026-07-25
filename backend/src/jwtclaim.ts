import "dotenv/config";

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is not set");
export const SECRET: string = secret;

export type JWTClaim = {
  id: number;
  name: string;
  email: string;
};
