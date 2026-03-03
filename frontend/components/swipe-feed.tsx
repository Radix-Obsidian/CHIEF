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
      toast.success("Draft approved — sending");
    } else {
      toast("Email archived", { description: "Draft rejected" });
    }
  }

  return (
    <div className="relative mx-auto min-h-[500px] w-full max-w-md">
      <AnimatePresence mode="popLayout">
        {drafts.map((draft, index) => (
          <motion.div
            key={draft.thread_id}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{
              scale: 1 - index * 0.03,
              opacity: index > 2 ? 0 : 1,
              y: index * 8,
              zIndex: drafts.length - index,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              transition: { duration: 0.2 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              confidence={draft.confidence}
              originalFrom={draft.original_email.from}
              originalSubject={draft.original_email.subject}
              originalPreview={draft.original_email.preview}
              onSwipe={handleSwipe}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
