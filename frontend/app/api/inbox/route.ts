import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("pending") !== null ? "/api/email/pending" : "/api/email/feed";

  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "pending") params.set(key, value);
  });

  const res = await fetch(`${BACKEND_URL}${path}?${params.toString()}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
