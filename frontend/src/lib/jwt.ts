export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresAt = payload.exp * 1000; // exp is in seconds; Date wants ms

    return Date.now() >= expiresAt;
  } catch {
    return true; // malformed token — treat as expired
  }
}
