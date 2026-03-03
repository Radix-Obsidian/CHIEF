"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.push("/login");
      return;
    }

    // Exchange code for tokens via backend
    fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
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
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="mt-4 text-sm text-white/50">Connecting your Gmail...</p>
      </div>
    </div>
  );
}
