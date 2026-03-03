"use client";

import { useCallback, useEffect, useState } from "react";
import { SwipeFeed } from "@/components/swipe-feed";
import { useRealtimeDrafts } from "@/hooks/use-realtime-drafts";
import { Inbox } from "lucide-react";

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

export default function InboxPage() {
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initial fetch — still needed to hydrate existing pending drafts
  useEffect(() => {
    const id = localStorage.getItem("chief_user_id");
    setUserId(id);
    if (id) fetchPendingDrafts(id);
  }, []);

  async function fetchPendingDrafts(uid: string) {
    try {
      const res = await fetch(`/api/inbox/pending?user_id=${uid}`);
      const data = await res.json();
      setDrafts(data);
    } catch (err) {
      console.error("Failed to fetch pending drafts:", err);
    } finally {
      setLoading(false);
    }
  }

  // Realtime: new draft inserted by Operator → add card to feed
  const handleRealtimeInsert = useCallback((draft: any) => {
    if (draft.status !== "pending") return;

    // Refetch pending drafts to get full shape (with original_email context)
    if (userId) fetchPendingDrafts(userId);
  }, [userId]);

  // Realtime: draft status updated (sent/rejected) → remove card
  const handleRealtimeUpdate = useCallback((draft: any) => {
    if (draft.status !== "pending") {
      setDrafts((prev) => prev.filter((d) => d.thread_id !== draft.thread_id));
    }
  }, []);

  useRealtimeDrafts({
    userId,
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
  });

  async function handleSwipe(threadId: string, approved: boolean, edits?: string) {
    // Optimistic removal
    setDrafts((prev) => prev.filter((d) => d.thread_id !== threadId));

    try {
      await fetch(`/api/drafts/${threadId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, edits }),
      });
    } catch (err) {
      console.error("Swipe action failed:", err);
      // Refetch on error to restore the card
      if (userId) fetchPendingDrafts(userId);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-full bg-white/5 p-6">
          <Inbox className="h-12 w-12 text-white/30" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-medium">All caught up</h2>
          <p className="mt-1 text-sm text-white/50">
            No drafts waiting for your approval
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-white/50">
          {drafts.length} draft{drafts.length !== 1 ? "s" : ""} ready for review
        </p>
      </header>

      <SwipeFeed drafts={drafts} onSwipe={handleSwipe} />
    </div>
  );
}
