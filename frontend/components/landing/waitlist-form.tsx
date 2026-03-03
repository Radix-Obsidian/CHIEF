"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface WaitlistFormProps {
  className?: string;
  subtitle?: string;
}

export function WaitlistForm({
  className = "",
  subtitle = "Join 200+ founders on the waitlist. No spam.",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setStatus("submitting");

    // Simulate submission — wire to Supabase later
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chief-accent/20">
              <Check className="h-5 w-5 text-chief-accent" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-chief-text">
                You&apos;re on the list.
              </p>
              <p className="text-[13px] text-chief-text-muted">
                We&apos;ll reach out within 48 hours.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="your@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Enter your email address"
              className="h-12 flex-1 rounded-xl border border-chief-border bg-chief-surface px-4 text-[15px] text-chief-text placeholder:text-chief-text-muted/50 focus:border-chief-accent focus:outline-none focus:ring-1 focus:ring-chief-accent"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="h-12 shrink-0 rounded-xl bg-chief-accent px-6 text-[15px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {status === "submitting" ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                "Request Access"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {status !== "success" && (
        <p className="mt-3 text-[13px] text-chief-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
