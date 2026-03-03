"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SwipeCard } from "./swipe-card";
import { toast } from "sonner";

interface PendingDraft {
  thread_id: string;
  email_id: string;
  draft_subject: string;
  draft_body: string;
  importance_score: number;
  confidence: number | null;
  original_email: {
    from: string;
    subject: string;
    preview: string;
  };
}

interface SwipeFeedProps {
  drafts: PendingDraft[];
  onSwipe: (threadId: string, approved: boolean, edits?: string) => void;
}

export function SwipeFeed({ drafts, onSwipe }: SwipeFeedProps) {
  function handleSwipe(threadId: string, approved: boolean) {
    onSwipe(threadId, approved);
    if (approved) {
      toast.success("Approved — sending");
    } else {
      toast("Archived");
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-lg" style={{ minHeight: "280px" }}>
      <AnimatePresence mode="popLayout">
        {drafts.map((draft, index) => (
          <motion.div
            key={draft.thread_id}
            initial={{ scale: 0.97, opacity: 0, y: 12 }}
            animate={{
              scale: 1 - index * 0.02,
              opacity: index > 2 ? 0 : 1,
              y: index * 6,
              zIndex: drafts.length - index,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.15 },
            }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            style={{
              position: index === 0 ? "relative" : "absolute",
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: index === 0 ? "auto" : "none",
            }}
          >
            <SwipeCard
              threadId={draft.thread_id}
              draftSubject={draft.draft_subject}
              draftBody={draft.draft_body}
              importanceScore={draft.importance_score}
              originalFrom={draft.original_email.from}
              onSwipe={handleSwipe}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
