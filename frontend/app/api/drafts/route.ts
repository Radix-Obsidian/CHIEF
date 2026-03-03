import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const res = await fetch(`${BACKEND_URL}/api/drafts?${searchParams.toString()}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
