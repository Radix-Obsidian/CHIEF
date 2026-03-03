import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const auth = request.headers.get("authorization");
  const res = await fetch(
    `${BACKEND_URL}/api/drafts/${id}?${searchParams.toString()}`,
    { headers: auth ? { Authorization: auth } : {} }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const auth = request.headers.get("authorization");
  // Check if this is an approve/reject action
  const res = await fetch(`${BACKEND_URL}/api/drafts/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const authPut = request.headers.get("authorization");
  const res = await fetch(`${BACKEND_URL}/api/drafts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(authPut ? { Authorization: authPut } : {}) },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
