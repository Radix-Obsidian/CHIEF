import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * SSE proxy: forwards the backend's pipeline stream to the browser.
 * GET /api/email/:id/stream?user_id=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: emailId } = await params;
  const userId = request.nextUrl.searchParams.get("user_id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id required" }), {
      status: 400,
    });
  }

  const upstream = await fetch(
    `${BACKEND_URL}/api/email/${emailId}/stream?user_id=${userId}`,
    { cache: "no-store" }
  );

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: "Failed to connect to pipeline stream" }),
      { status: upstream.status }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
