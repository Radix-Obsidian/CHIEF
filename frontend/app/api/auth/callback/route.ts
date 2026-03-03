import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// Google redirects here with ?code=...
// We forward to the client-side /callback page which handles the exchange
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const callbackUrl = new URL("/callback", request.url);
  callbackUrl.searchParams.set("code", code);
  return NextResponse.redirect(callbackUrl);
}

// The /callback page POSTs the code here for exchange via backend
export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/api/auth/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
