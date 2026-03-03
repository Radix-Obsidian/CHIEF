"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";

interface Sample {
  label: string;
  yours: string;
  chief: string;
  matches: string[];
}

const samples: Sample[] = [
  {
    label: "Opening",
    yours:
      "Hi David, I wanted to follow up on the Q3 report you sent over.",
    chief:
      "Hi David, I wanted to follow up on the Q3 report you sent over.",
    matches: ["Hi David,", "I wanted to follow up", "Q3 report", "sent over"],
  },
  {
    label: "Body",
    yours:
      "Thanks for the quick turnaround. Let me review the numbers and circle back by EOD.",
    chief:
      "Thanks for the quick turnaround. Let me review the numbers and circle back by EOD.",
    matches: [
      "Thanks for the quick turnaround",
      "review the numbers",
      "circle back",
      "EOD",
    ],
  },
  {
    label: "Sign-off",
    yours: "Best, Sarah",
    chief: "Best, Sarah",
    matches: ["Best, Sarah"],
  },
];

function HighlightedText({
  text,
  matches,
}: {
  text: string;
  matches: string[];
}) {
  if (!matches.length) return <>{text}</>;

  const escaped = matches.map((m) =>
    m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = matches.some(
          (m) => m.toLowerCase() === part.toLowerCase()
        );
        return isMatch ? (
          <motion.span
            key={i}
            initial={{ color: "rgb(148 163 184)" }}
            whileInView={{ color: "rgb(16 185 129)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            className="font-medium"
          >
            {part}
          </motion.span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}

export function VoiceComparison() {
  return (
    <div className="space-y-8">
      {/* Voice Match metric */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-5xl font-bold tabular-nums text-chief-text sm:text-6xl"
        >
          94%
        </motion.span>
        <p className="mt-1 text-[13px] text-chief-text-muted">Voice Match</p>
        <div className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-chief-border">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "94%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full bg-chief-accent"
          />
        </div>
      </motion.div>

      {/* Comparison cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {samples.map((sample, idx) => (
          <motion.div
            key={sample.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="rounded-xl border border-chief-border bg-chief-surface p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-widest text-chief-text-muted">
              {sample.label}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-chief-text-muted/50">
                  Your email
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-chief-text-secondary">
                  {sample.yours}
                </p>
              </div>

              <div className="border-t border-chief-border pt-4">
                <p className="text-[10px] uppercase tracking-widest text-chief-text-muted/50">
                  Chief draft
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-chief-text-secondary">
                  <HighlightedText
                    text={sample.chief}
                    matches={sample.matches}
                  />
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tone Strictness slider mock */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mx-auto max-w-md text-center"
      >
        <p className="text-[13px] font-medium text-chief-text-secondary">
          Tone Strictness
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[12px] text-chief-text-muted">Flexible</span>
          <div className="relative h-1.5 flex-1 rounded-full bg-chief-border">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "75%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full rounded-full bg-chief-accent"
            />
            <motion.div
              initial={{ left: 0 }}
              whileInView={{ left: "75%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-chief-bg bg-chief-accent shadow-md shadow-chief-accent/30"
            />
          </div>
          <span className="text-[12px] text-chief-text-muted">Exact Match</span>
        </div>
        <p className="mt-3 text-[13px] text-chief-text-muted">
          Control how closely CHIEF mirrors your writing style. From natural
          paraphrase to word-for-word precision.
        </p>
      </motion.div>
    </div>
  );
}
