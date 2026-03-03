/**
 * Authenticated fetch wrapper.
 * Automatically attaches the stored JWT as a Bearer token.
 */
export function authedFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem("chief_access_token");
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
