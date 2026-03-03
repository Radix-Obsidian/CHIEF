"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [demoStatus, setDemoStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = ref
      ? `/api/auth/google?ref=${encodeURIComponent(ref)}`
      : "/api/auth/google";
  };

  const handleTryDemo = async () => {
    setDemoStatus("loading");
    try {
      const res = await fetch("/api/dev/seed", { method: "POST" });
      if (!res.ok) throw new Error(`Failed (${res.status})`);

      const data = await res.json();
      localStorage.setItem("chief_user_id", data.user_id);
      localStorage.setItem("chief_access_token", data.access_token);

      router.push("/inbox");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setDemoStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-12">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image src="/logo.svg" alt="CHIEF" width={160} height={160} priority />
          <p className="mt-3 text-hig-caption text-chief-text-muted tracking-widest uppercase">
            Executive Email Proxy
          </p>
        </div>

        {/* Referral banner */}
        {ref && (
          <div className="flex items-center gap-2 rounded-chief border border-chief-accent/30 bg-chief-accent/5 px-4 py-3">
            <div className="h-2 w-2 shrink-0 rounded-full bg-chief-accent" />
            <p className="text-[13px] text-chief-text-secondary">
              You&apos;ve been referred by a trusted contact
            </p>
          </div>
        )}

        {/* Auth buttons */}
        <div className="space-y-4">
          {/* Google OAuth — primary */}
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-chief border border-chief-border bg-chief-surface px-4 py-3.5 text-hig-body font-medium text-chief-text transition-colors hover:border-chief-text-muted/40 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Connect Gmail
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-chief-border" />
            <span className="text-[11px] text-chief-text-muted uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-chief-border" />
          </div>

          {/* Try Demo — ghost/secondary */}
          <button
            onClick={handleTryDemo}
            disabled={demoStatus === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-chief border border-chief-border/50 px-4 py-3 text-[15px] font-medium text-chief-text-secondary transition-colors hover:border-chief-border hover:text-chief-text active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {demoStatus === "loading" ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-chief-accent border-t-transparent" />
                <span>Loading demo...</span>
              </>
            ) : (
              "Try Demo"
            )}
          </button>

          {/* Demo caption */}
          <p className="text-center text-[11px] text-chief-text-muted">
            Pre-loaded executive inbox — no sign-up required
          </p>

          {/* Error state */}
          {demoStatus === "error" && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-[13px] text-chief-reject">{errorMsg}</p>
              <button
                onClick={() => setDemoStatus("idle")}
                className="text-[11px] text-chief-accent"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-chief-text-muted">
          PII is stripped before processing. Raw emails are never stored.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="chief-pulse-bar w-32" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
