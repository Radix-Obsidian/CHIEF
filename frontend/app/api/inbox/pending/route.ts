import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const res = await fetch(
    `${BACKEND_URL}/api/email/pending?user_id=${userId}`
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
