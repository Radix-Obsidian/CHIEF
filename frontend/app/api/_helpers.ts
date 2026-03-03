import { NextRequest } from "next/server";

/**
 * Build a headers object that forwards the Authorization header
 * from the incoming request to the backend.
 */
export function forwardAuth(
  request: NextRequest,
  extra?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  return headers;
}
