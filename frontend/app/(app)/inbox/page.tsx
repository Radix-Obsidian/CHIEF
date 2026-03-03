"use client";

import { useCallback, useEffect, useState } from "react";
import { SwipeFeed } from "@/components/swipe-feed";
import { useRealtimeDrafts } from "@/hooks/use-realtime-drafts";
import { authedFetch } from "@/lib/api";
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

  useEffect(() => {
    const id = localStorage.getItem("chief_user_id");
    setUserId(id);
    if (id) fetchPendingDrafts(id);
  }, []);

  async function fetchPendingDrafts(uid: string) {
    try {
      const res = await authedFetch(`/api/inbox/pending?user_id=${uid}`);
      const data = await res.json();
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch pending drafts:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleRealtimeInsert = useCallback((draft: any) => {
    if (draft.status !== "pending") return;
    if (userId) fetchPendingDrafts(userId);
  }, [userId]);

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
    setDrafts((prev) => prev.filter((d) => d.thread_id !== threadId));
    try {
      await authedFetch(`/api/drafts/${threadId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, edits }),
      });
    } catch (err) {
      console.error("Swipe action failed:", err);
      if (userId) fetchPendingDrafts(userId);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="chief-pulse-bar w-32" />
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 px-6">
        <Inbox className="h-6 w-6 text-chief-text-muted" strokeWidth={2} />
        <p className="text-hig-caption text-chief-text-muted">No drafts waiting</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col px-6 pt-8">
      <header className="mb-8">
        <h1 className="text-hig-title1 font-bold text-chief-text">Inbox</h1>
        <p className="mt-1 text-hig-caption text-chief-text-muted">
          {drafts.length} pending
        </p>
      </header>

      <SwipeFeed drafts={drafts} onSwipe={handleSwipe} />
    </div>
  );
}
