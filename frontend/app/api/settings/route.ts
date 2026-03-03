import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const auth = request.headers.get("authorization");
  const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
    headers: auth ? { Authorization: auth } : {},
  });
  const data = await res.json();

  return NextResponse.json(
    {
      importance_threshold: data.settings?.importance_threshold || 5,
      auto_draft: data.settings?.auto_draft ?? true,
      voice_profile: data.voice_profile || {},
    },
    { status: res.status }
  );
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { user_id, ...settings } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const auth = request.headers.get("authorization");
  const res = await fetch(`${BACKEND_URL}/api/users/${user_id}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
    body: JSON.stringify(settings),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
