"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

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
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 403) {
          setError(data.detail || "Valid referral code required");
          return;
        }
        if (data.user_id) {
          localStorage.setItem("chief_user_id", data.user_id);
          localStorage.setItem("chief_access_token", data.access_token);
          if (data.referral_code) {
            localStorage.setItem("chief_referral_code", data.referral_code);
          }
          router.push("/inbox");
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-chief-reject/10">
            <svg className="h-6 w-6 text-chief-reject" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-hig-body font-bold text-chief-text">{error}</p>
          <p className="text-[13px] text-chief-text-muted">
            Ask the person who invited you for their referral code.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-chief bg-chief-surface border border-chief-border px-6 py-2.5 text-[13px] font-medium text-chief-text transition-colors hover:border-chief-text-muted/40"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

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
