"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ImportanceBadge } from "./importance-badge";

interface SwipeCardProps {
  threadId: string;
  draftSubject: string;
  draftBody: string;
  importanceScore: number;
  originalFrom: string;
  onSwipe: (threadId: string, approved: boolean) => void;
  style?: React.CSSProperties;
}

const SWIPE_THRESHOLD = 100;

function extractDomain(from: string): string {
  const match = from.match(/@([a-zA-Z0-9.-]+)/);
  return match ? match[1] : from.split("<")[0].trim() || from;
}

export function SwipeCard({
  threadId,
  draftSubject,
  draftBody,
  importanceScore,
  originalFrom,
  onSwipe,
  style,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const approveOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const archiveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe(threadId, true);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe(threadId, false);
    }
  }

  const domain = extractDomain(originalFrom);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, ...style }}
      className="absolute inset-x-0 cursor-grab touch-pan-y will-change-transform active:cursor-grabbing"
    >
      {/* Approve overlay — swipe left */}
      <motion.div
        style={{ opacity: approveOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-chief border border-chief-accent/40 bg-chief-accent/8"
      >
        <p className="text-sm font-medium text-chief-accent tracking-chief">
          Approve&ensp;&middot;&ensp;Sent
        </p>
      </motion.div>

      {/* Archive overlay — swipe right */}
      <motion.div
        style={{ opacity: archiveOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-chief border border-chief-reject/40 bg-chief-reject/8"
      >
        <p className="text-sm font-medium text-chief-reject tracking-chief">
          Archived
        </p>
      </motion.div>

      {/* Card */}
      <div className="rounded-chief border border-chief-border bg-chief-surface p-6">
        {/* Row 1: domain + importance */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-hig-caption font-medium text-chief-text-muted uppercase tracking-widest">
            {domain}
          </span>
          <ImportanceBadge score={importanceScore} />
        </div>

        {/* Row 2: subject */}
        <p className="text-hig-body font-medium leading-snug text-chief-text">
          {draftSubject}
        </p>

        {/* Row 3: 2-line preview */}
        <p className="mt-2 text-sm leading-relaxed text-chief-text-secondary line-clamp-2">
          {draftBody}
        </p>
      </div>
    </motion.div>
  );
}
