"use client";

import { motion } from "framer-motion";

const cards = [
  {
    domain: "acme.co",
    score: "8.4",
    scoreColor: "text-orange-400 bg-orange-400/10",
    subject: "Re: Series B term sheet — revised timeline",
    preview:
      "Thanks for the quick turnaround. I've reviewed the updated terms and...",
    rotate: -2,
    scale: 1,
    y: 0,
    zIndex: 30,
  },
  {
    domain: "stripe.com",
    score: "7.1",
    scoreColor: "text-yellow-400 bg-yellow-400/10",
    subject: "Q3 board deck — comments inline",
    preview: "Good progress on ARR. Two questions on the churn...",
    rotate: 1,
    scale: 0.95,
    y: 12,
    zIndex: 20,
  },
  {
    domain: "sequoia.com",
    score: "9.2",
    scoreColor: "text-red-400 bg-red-400/10",
    subject: "Follow-up: partnership proposal",
    preview: "Wanted to circle back on the timeline we discussed...",
    rotate: 0,
    scale: 0.9,
    y: 24,
    zIndex: 10,
  },
];

export function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 120, delay: 0.6 }}
      className="relative mx-auto w-[280px] sm:w-[300px]"
    >
      {/* Emerald glow behind phone */}
      <div className="absolute -inset-12 rounded-full bg-chief-accent/[0.08] blur-3xl" />

      {/* Phone frame */}
      <div className="relative rounded-[40px] border-2 border-chief-border bg-chief-surface p-3 shadow-2xl shadow-black/40">
        {/* Notch */}
        <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-chief-bg" />

        {/* Screen area */}
        <div className="relative h-[420px] overflow-hidden rounded-[28px] bg-chief-bg px-3 pt-4">
          {/* Status bar mock */}
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="text-[9px] font-bold tracking-widest text-chief-text-muted uppercase">
              CHIEF
            </span>
            <span className="text-[9px] text-chief-text-muted">3 pending</span>
          </div>

          {/* Card stack */}
          <div className="relative h-[320px]">
            {cards.map((card, i) => (
              <motion.div
                key={card.domain}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: card.y,
                  scale: card.scale,
                  rotate: card.rotate,
                }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                  delay: 0.8 + i * 0.15,
                }}
                className="absolute inset-x-0"
                style={{ zIndex: card.zIndex }}
              >
                <div className="rounded-xl border border-chief-border bg-chief-surface p-4 shadow-lg shadow-black/20">
                  {/* Domain + score */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium tracking-widest text-chief-text-muted uppercase">
                      {card.domain}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${card.scoreColor}`}
                    >
                      {card.score}
                    </span>
                  </div>

                  {/* Subject */}
                  <p className="text-[13px] font-medium leading-snug text-chief-text">
                    {card.subject}
                  </p>

                  {/* Preview */}
                  <p className="mt-1.5 text-[11px] leading-relaxed text-chief-text-secondary line-clamp-2">
                    {card.preview}
                  </p>

                  {/* Swipe overlays — only on top card */}
                  {i === 0 && (
                    <>
                      <motion.div
                        animate={{ opacity: [0.15, 0.3, 0.15] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                      >
                        <span className="text-[10px] font-bold tracking-widest text-chief-accent uppercase">
                          Send
                        </span>
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0.15, 0.3, 0.15] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1.5,
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <span className="text-[10px] font-bold tracking-widest text-chief-reject uppercase">
                          Archive
                        </span>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Floating animation on top card */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute inset-0"
              style={{ zIndex: 31 }}
            />
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mt-3 h-1 w-28 rounded-full bg-chief-text-muted/30" />
      </div>
    </motion.div>
  );
}
