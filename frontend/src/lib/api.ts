// Base URL of the backend API. Defaults to the local dev server; override with
import { type VolunteerCreateInput } from "../schemas/volunteer.schema.ts";

// VITE_API_URL in a .env file if the backend runs elsewhere.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Thrown when the API responds with a non-2xx status (or is unreachable). */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Log an administrator in.
 * @returns the signed JWT to store via the auth context.
 * @throws {ApiError} 401 on invalid credentials, or another status on failure.
 */
export async function login(username: string, password: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    // Network error / server unreachable — fetch rejects before we get a status.
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? "Login failed. Please try again.");
  }

  return body.token as string;
}

export async function createVolunteer(data: VolunteerCreateInput, token: string | null) {
  const res = await fetch("http://localhost:3000/volunteers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? "Login failed. Please try again.");
  }

  return body;
}
