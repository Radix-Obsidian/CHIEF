"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, X } from "lucide-react";
import { ImportanceBadge } from "./importance-badge";

interface SwipeCardProps {
  threadId: string;
  draftSubject: string;
  draftBody: string;
  importanceScore: number;
  confidence: number | null;
  originalFrom: string;
  originalSubject: string;
  originalPreview: string;
  onSwipe: (threadId: string, approved: boolean) => void;
  style?: React.CSSProperties;
}

const SWIPE_THRESHOLD = 100;

export function SwipeCard({
  threadId,
  draftSubject,
  draftBody,
  importanceScore,
  confidence,
  originalFrom,
  originalSubject,
  originalPreview,
  onSwipe,
  style,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const approveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rejectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  function handleDragEnd(_: any, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe(threadId, true); // Approve
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe(threadId, false); // Reject
    }
  }

  // Extract sender name from email address
  const senderName = originalFrom.split("<")[0].trim() || originalFrom;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, ...style }}
      className="absolute inset-x-4 cursor-grab touch-pan-y active:cursor-grabbing"
    >
      {/* Approve overlay */}
      <motion.div
        style={{ opacity: approveOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-green-500 bg-green-500/10"
      >
        <div className="rounded-full bg-green-500 p-3">
          <Check className="h-8 w-8 text-white" />
        </div>
      </motion.div>

      {/* Reject overlay */}
      <motion.div
        style={{ opacity: rejectOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-red-500 bg-red-500/10"
      >
        <div className="rounded-full bg-red-500 p-3">
          <X className="h-8 w-8 text-white" />
        </div>
      </motion.div>

      {/* Card content */}
      <div className="rounded-2xl border border-white/10 bg-chief-card p-5 shadow-2xl">
        {/* Header: sender + importance */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium">{senderName}</p>
            <p className="text-sm text-white/50">{originalSubject}</p>
          </div>
          <ImportanceBadge score={importanceScore} />
        </div>

        {/* Original email preview */}
        <div className="mb-4 rounded-lg bg-white/5 p-3">
          <p className="text-xs font-medium text-white/40 uppercase">Original</p>
          <p className="mt-1 text-sm text-white/60 line-clamp-2">{originalPreview}</p>
        </div>

        {/* Draft preview */}
        <div className="rounded-lg border border-chief-accent/30 bg-chief-accent/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-chief-accent uppercase">Chief's Draft</p>
            {confidence !== null && (
              <span className="text-xs text-white/40">
                {Math.round(confidence * 100)}% confident
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium">{draftSubject}</p>
          <p className="mt-1 text-sm text-white/70 line-clamp-4">{draftBody}</p>
        </div>

        {/* Swipe hints */}
        <div className="mt-4 flex items-center justify-between text-xs text-white/30">
          <span className="flex items-center gap-1">
            <X className="h-3 w-3" /> Swipe left to reject
          </span>
          <span className="flex items-center gap-1">
            Swipe right to send <Check className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
