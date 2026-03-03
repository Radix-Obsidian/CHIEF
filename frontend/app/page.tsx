"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Zap,
  MessageSquare,
  Mail,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  Ban,
  Lock,
  Mic,
  RefreshCw,
  History,
  Smartphone,
  Tablet,
  Monitor,
  Apple,
  Chrome,
} from "lucide-react";

import { PhoneMockup } from "@/components/landing/phone-mockup";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { VoiceComparison } from "@/components/landing/voice-comparison";

/* ── Animation presets ── */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 as const },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 as const },
};

/* ── Icon circle ── */

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chief-accent/10">
      {children}
    </div>
  );
}

/* ── CHIEF icon (reusable inline SVG) ── */

function ChiefIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
    >
      <path
        fill="#476eb9"
        d="M361.594 470.034c-1.456-42.854 3.344-75.816 37.854-105.609a106.9 106.9 0 0 1 45.919-23.433c16.278-3.875 36.1-3.584 52.779-3.53l42.132.167c16.25.069 38.327-.567 53.908.56 19.283-.737 34.337 1.812 49.11 15.457 21.979 20.3 26.375 58.587 4.699 80.729-11.823 12.123-26.939 17.681-43.699 17.616-30.187-.001-60.435-.071-90.623-.069l-27.872-.027c-2.401-.008-11.139.054-13.002-.339-.556.37-1.508.954-1.972 1.372-7.125-1.335-22.408-.236-30.409-.378-18.972-.338-37.793-.824-56.733.924-4.611.426-8.225 1.031-12.231 3.453-5.211 3.15-7.06 10.097-9.86 13.107"
      />
      <path
        fill="#e33d3c"
        d="M594.186 338.189c19.283-.737 34.337 1.812 49.11 15.457 21.979 20.3 26.375 58.587 4.699 80.729-11.823 12.123-26.939 17.681-43.699 17.616-30.187-.001-60.435-.071-90.623-.069l-27.872-.027c-2.401-.008-11.139.054-13.002-.339 2.334-3.264 12.044-12.584 15.298-15.819l28.734-28.725 36.087-36.426c8.175-8.351 16.485-17.287 25.424-24.807 4.582-3.854 10.158-4.981 15.384-7.375z"
      />
      <path
        fill="#fdc612"
        d="M472.799 451.556c.637 3.826.35 12.803.32 17.016l-.242 29.893c-.198 23.153.541 49.901-.189 72.552l.285.623.023 62.116c-.001 5.469-.158 11.062.003 16.522.515 17.404-1.963 27.063 15.426 35.742-10.622.689-21.189.427-31.777-.629-47.228-4.709-85.213-40.429-93.162-87.146-1.57-9.227-2.604-18.775-1.535-28.124-.723-3.223-.414-27.882-.401-32.515l.044-67.572c2.8-3.01 4.649-9.957 9.86-13.107 4.006-2.422 7.62-3.027 12.231-3.453 18.94-1.748 37.761-1.262 56.733-.924 8.001.142 23.284-.957 30.409.378.464-.418 1.416-1.002 1.972-1.372"
      />
      <path
        fill="#19d688"
        d="m472.688 571.017 88.418-.487c17.166-.023 44.223-1.485 60.56 2.714 41.931 10.775 53.595 66.677 22.566 95.663-15.487 14.843-30.073 16.08-50.417 16.8-7.089.471-14.867.405-22.016.301-27.714-.403-55.686.536-83.374.012-17.389-8.679-14.911-18.338-15.426-35.742-.161-5.46-.004-11.053-.003-16.522z"
      />
      <path
        fill="#12a86c"
        d="M472.973 571.64c2.941 1.842 16.971 17.225 20.618 20.83l49.694 49.842c8.65 8.662 39.844 42.383 50.53 43.395-7.089.471-14.867.405-22.016.301-27.714-.403-55.686.536-83.374.012-17.389-8.679-14.911-18.338-15.426-35.742-.161-5.46-.004-11.053-.003-16.522z"
      />
    </svg>
  );
}

/* ════════════════════════════════════════════
   Landing Page
   ════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-chief-bg">
      {/* ── 1. Sticky Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-chief-border/50 bg-chief-bg/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <ChiefIcon size={28} />
            <span className="text-[17px] font-bold text-chief-text">
              CHIEF
            </span>
          </div>
          <a
            href="#waitlist"
            className="rounded-xl border border-chief-border px-5 py-2 text-[13px] font-medium text-chief-text transition-colors hover:border-chief-text-muted/40 hover:bg-chief-surface"
          >
            Get Early Access
          </a>
        </div>
      </nav>

      <main>
        {/* ── 2. Hero ── */}
        <section
          id="waitlist"
          className="relative px-6 pb-24 pt-16 sm:pb-32 sm:pt-24"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
            {/* Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6 inline-block rounded-full bg-chief-accent/10 px-4 py-1.5"
              >
                <span className="text-[12px] font-bold uppercase tracking-widest text-chief-accent">
                  Limited Early Access
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-[36px] font-bold leading-[1.08] tracking-tight text-chief-text sm:text-[48px] lg:text-[56px]"
              >
                Your email.
                <br />
                Handled.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-5 max-w-[480px] text-[17px] leading-relaxed text-chief-text-secondary"
              >
                CHIEF reads your inbox, drafts replies in your exact voice, and
                waits for your approval. Nothing sends without your swipe.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-8"
              >
                <WaitlistForm />
              </motion.div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* ── 3. Pain Points ── */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              {...fadeUp}
              className="text-center text-[24px] font-bold leading-tight text-chief-text sm:text-[28px]"
            >
              You didn&apos;t build a company to answer email.
            </motion.h2>

            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  icon: <Clock className="h-6 w-6 text-chief-accent" />,
                  title: "120 emails a day. 3 hours gone.",
                  body: "The average executive loses 28% of their workday to email. That\u2019s a thousand hours a year not spent on the decisions only you can make.",
                },
                {
                  icon: <Zap className="h-6 w-6 text-chief-accent" />,
                  title: "Context switching kills your best thinking.",
                  body: "Every reply you stop to write costs 23 minutes of refocus time. By the third interruption, the deep work is done for the day.",
                },
                {
                  icon: (
                    <MessageSquare className="h-6 w-6 text-chief-accent" />
                  ),
                  title: "Rushed replies don\u2019t sound like you.",
                  body: "Quick responses lose your tone. Recipients notice. When a founder\u2019s email reads like a chatbot wrote it, trust erodes.",
                },
              ].map((card, idx) => (
                <motion.div
                  key={card.title}
                  {...stagger}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="rounded-xl border border-chief-border bg-chief-surface p-8"
                >
                  <div className="mb-4">{card.icon}</div>
                  <h3 className="text-[18px] font-bold leading-snug text-chief-text">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-chief-text-secondary">
                    {card.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-px bg-chief-border" />
        </div>

        {/* ── 4. How It Works ── */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              {...fadeUp}
              className="text-center text-[24px] font-bold text-chief-text sm:text-[28px]"
            >
              Three steps. Two minutes. Done.
            </motion.h2>

            <div className="relative mt-14 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
              {/* Connecting line (desktop) */}
              <div className="absolute left-[16.67%] right-[16.67%] top-6 hidden h-px bg-chief-border md:block" />

              {[
                {
                  num: "01",
                  icon: <Mail className="h-6 w-6 text-chief-accent" />,
                  title: "Connect Gmail",
                  body: "One OAuth click. CHIEF scans your last 50 sent emails to learn exactly how you write. Your greeting, your sign-off, your sentence rhythm.",
                },
                {
                  num: "02",
                  icon: <Sparkles className="h-6 w-6 text-chief-accent" />,
                  title: "AI drafts in your voice",
                  body: "Incoming emails get scored for importance. The ones that matter get a draft reply that mirrors your exact tone and vocabulary. Powered by Claude Sonnet 4.",
                },
                {
                  num: "03",
                  icon: (
                    <ArrowLeftRight className="h-6 w-6 text-chief-accent" />
                  ),
                  title: "Swipe to send",
                  body: "Swipe left to approve. Swipe right to archive. Edit inline if you want. Every email requires your explicit approval before it leaves your outbox.",
                },
              ].map((step, idx) => (
                <motion.div
                  key={step.num}
                  {...stagger}
                  transition={{ duration: 0.5, delay: idx * 0.2 }}
                  className="relative text-center"
                >
                  <span className="mb-3 inline-block text-[13px] font-bold text-chief-accent">
                    {step.num}
                  </span>
                  <div className="mx-auto mb-4 flex justify-center">
                    <IconCircle>{step.icon}</IconCircle>
                  </div>
                  <h3 className="text-[18px] font-bold text-chief-text">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-chief-text-secondary">
                    {step.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-px bg-chief-border" />
        </div>

        {/* ── 5. Voice Match ── */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              {...fadeUp}
              className="text-center text-[24px] font-bold text-chief-text sm:text-[28px]"
            >
              It doesn&apos;t reply for you. It replies like you.
            </motion.h2>
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mx-auto mt-4 max-w-[560px] text-center text-[15px] leading-relaxed text-chief-text-secondary"
            >
              CHIEF analyzes your greeting style, closing phrases, sentence
              length, vocabulary, and tone from your last 50 sent emails. Then it
              matches them.
            </motion.p>
            <div className="mt-14">
              <VoiceComparison />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-px bg-chief-border" />
        </div>

        {/* ── 6. Trust & Security ── */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              {...fadeUp}
              className="text-center text-[24px] font-bold text-chief-text sm:text-[28px]"
            >
              Your email stays your email.
            </motion.h2>

            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: <ShieldCheck className="h-7 w-7 text-chief-accent" />,
                  title: "PII stripped before processing",
                  body: "Names, addresses, and phone numbers are removed before any AI model sees your email content. The raw text is never stored.",
                },
                {
                  icon: <Ban className="h-7 w-7 text-chief-accent" />,
                  title: "Zero auto-send. Period.",
                  body: "Every reply requires your explicit swipe approval. If you don\u2019t act, nothing goes out. No exceptions. No overrides. No \u201csmart send.\u201d",
                },
                {
                  icon: <Lock className="h-7 w-7 text-chief-accent" />,
                  title: "Enterprise-grade encryption",
                  body: "OAuth tokens stored in Supabase Vault. Row-level security on every table. Per-user isolation across every layer of the stack.",
                },
              ].map((pillar, idx) => (
                <motion.div
                  key={pillar.title}
                  {...stagger}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-chief-accent/10">
                    {pillar.icon}
                  </div>
                  <h3 className="text-[18px] font-bold text-chief-text">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-chief-text-secondary">
                    {pillar.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Cross-Device Sync ── */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              {...fadeUp}
              className="text-center text-[24px] font-bold text-chief-text sm:text-[28px]"
            >
              One account. Every device. Always in sync.
            </motion.h2>
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-4 max-w-[520px] text-center text-[15px] leading-relaxed text-chief-text-secondary"
            >
              Start reviewing drafts on the train. Finish at your desk. Your
              voice profile, pending approvals, and full history follow you
              everywhere.
            </motion.p>

            {/* Device illustrations */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-14 flex items-end justify-center gap-6 sm:gap-10"
            >
              {/* Phone */}
              <div className="text-center">
                <div className="mx-auto h-24 w-14 rounded-lg border border-chief-border bg-chief-surface p-1.5">
                  <div className="h-full w-full rounded-sm bg-chief-bg">
                    <div className="space-y-1 p-1">
                      <div className="h-1 rounded bg-chief-accent/40" />
                      <div className="h-1 rounded bg-chief-border" />
                      <div className="h-1 rounded bg-chief-border" />
                    </div>
                  </div>
                </div>
                <Smartphone className="mx-auto mt-2 h-4 w-4 text-chief-text-muted" />
              </div>

              <div className="mb-10 w-8 border-b border-dashed border-chief-border" />

              {/* Tablet */}
              <div className="text-center">
                <div className="mx-auto h-28 w-20 rounded-lg border border-chief-border bg-chief-surface p-1.5">
                  <div className="h-full w-full rounded-sm bg-chief-bg">
                    <div className="space-y-1.5 p-1.5">
                      <div className="h-1.5 rounded bg-chief-accent/40" />
                      <div className="h-1.5 rounded bg-chief-border" />
                      <div className="h-1.5 rounded bg-chief-border" />
                    </div>
                  </div>
                </div>
                <Tablet className="mx-auto mt-2 h-4 w-4 text-chief-text-muted" />
              </div>

              <div className="mb-10 w-8 border-b border-dashed border-chief-border" />

              {/* Desktop */}
              <div className="text-center">
                <div className="mx-auto h-24 w-36 rounded-lg border border-chief-border bg-chief-surface p-2">
                  <div className="h-full w-full rounded-sm bg-chief-bg">
                    <div className="space-y-1.5 p-2">
                      <div className="h-1.5 rounded bg-chief-accent/40" />
                      <div className="h-1.5 rounded bg-chief-border" />
                      <div className="h-1.5 rounded bg-chief-border" />
                      <div className="h-1.5 rounded bg-chief-border" />
                    </div>
                  </div>
                </div>
                <div className="mx-auto mt-0.5 h-3 w-8 rounded-b-sm bg-chief-border" />
                <Monitor className="mx-auto mt-1 h-4 w-4 text-chief-text-muted" />
              </div>
            </motion.div>

            {/* Sync features */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-8"
            >
              {[
                { icon: Mic, text: "Voice profile syncs instantly" },
                { icon: RefreshCw, text: "Drafts update in real-time" },
                { icon: History, text: "Full history on every device" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-[13px] text-chief-text-secondary"
                >
                  <Icon className="h-4 w-4 text-chief-text-muted" />
                  {text}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 8. Early Access CTA ── */}
        <section className="border-y border-chief-border bg-chief-surface px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              {...fadeUp}
              className="mb-6 inline-block rounded-full bg-chief-accent/10 px-4 py-1.5"
            >
              <span className="text-[12px] font-bold uppercase tracking-widest text-chief-accent">
                Early Access — Limited Spots
              </span>
            </motion.div>

            <motion.h2
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[24px] font-bold text-chief-text sm:text-[28px]"
            >
              Start in two minutes.
            </motion.h2>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3 text-[15px] text-chief-text-secondary"
            >
              Connect Gmail. Let CHIEF learn your voice. Review AI-drafted
              replies with a swipe. Install on any device.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <WaitlistForm subtitle="We&#39;re onboarding founders in small batches. You&#39;ll hear from us within 48 hours." />
            </motion.div>

            {/* PWA Install Preview */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16"
            >
              <h3 className="text-[18px] font-bold text-chief-text">
                How you&apos;ll install CHIEF
              </h3>

              <div className="mt-6 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
                {[
                  {
                    icon: <Apple className="h-5 w-5" />,
                    platform: "iPhone & iPad",
                    steps: [
                      "Open CHIEF in Safari",
                      "Tap the Share button",
                      "Tap \u2018Add to Home Screen\u2019",
                    ],
                  },
                  {
                    icon: <Chrome className="h-5 w-5" />,
                    platform: "Android",
                    steps: [
                      "Open CHIEF in Chrome",
                      "Tap \u2018Install app\u2019 when prompted",
                      "CHIEF appears on your home screen",
                    ],
                  },
                  {
                    icon: <Monitor className="h-5 w-5" />,
                    platform: "Mac & PC",
                    steps: [
                      "Open CHIEF in Chrome or Edge",
                      "Click the install icon in the address bar",
                      "CHIEF runs as a standalone app",
                    ],
                  },
                ].map((card) => (
                  <div
                    key={card.platform}
                    className="rounded-xl border border-chief-border bg-chief-bg p-5"
                  >
                    <div className="mb-3 flex items-center gap-2 text-chief-text">
                      {card.icon}
                      <span className="text-[15px] font-bold">
                        {card.platform}
                      </span>
                    </div>
                    <ol className="space-y-2">
                      {card.steps.map((step, i) => (
                        <li
                          key={step}
                          className="flex items-start gap-2 text-[13px] text-chief-text-secondary"
                        >
                          <span className="mt-px shrink-0 text-[12px] font-bold text-chief-accent">
                            {i + 1}.
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── 9. Footer ── */}
        <footer className="px-6 py-16">
          <div className="mx-auto max-w-6xl text-center">
            <div className="flex items-center justify-center gap-2">
              <ChiefIcon size={20} />
              <span className="text-[15px] font-bold text-chief-text">
                CHIEF
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 text-[14px] text-chief-text-muted">
              <span className="cursor-pointer transition-colors hover:text-chief-text-secondary">
                Privacy
              </span>
              <span className="text-chief-border">&middot;</span>
              <span className="cursor-pointer transition-colors hover:text-chief-text-secondary">
                Terms
              </span>
              <span className="text-chief-border">&middot;</span>
              <span className="cursor-pointer transition-colors hover:text-chief-text-secondary">
                GitHub
              </span>
            </div>

            <p className="mt-3 text-[12px] text-chief-text-muted/60">
              Built with Claude Sonnet 4
            </p>
            <p className="mt-1 text-[12px] text-chief-text-muted/40">
              &copy; 2026 CHIEF
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
