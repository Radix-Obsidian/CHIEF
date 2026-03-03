"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code) {
      router.push("/login");
      return;
    }

    fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user_id) {
          localStorage.setItem("chief_user_id", data.user_id);
          localStorage.setItem("chief_access_token", data.access_token);
          router.push("/inbox");
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="chief-pulse-bar w-32" />
      <p className="text-xs text-chief-text-muted">Connecting...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="chief-pulse-bar w-32" />
          <p className="text-xs text-chief-text-muted">Connecting...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
