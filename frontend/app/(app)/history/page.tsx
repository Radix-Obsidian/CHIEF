"use client";

import { useEffect, useState } from "react";
import { Clock, Send, Archive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { authedFetch } from "@/lib/api";

interface HistoryItem {
  id: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    authedFetch(`/api/drafts?user_id=${userId}&status=sent`)
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="chief-pulse-bar w-32" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 px-6">
        <Clock className="h-6 w-6 text-chief-text-muted" strokeWidth={2} />
        <p className="text-hig-caption text-chief-text-muted">No sent emails yet</p>
      </div>
    );
  }

  return (
    <div className="px-6 pt-8">
      <h1 className="mb-6 text-hig-title1 font-bold text-chief-text">History</h1>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-chief border border-chief-border bg-chief-surface p-4"
          >
            <div className="flex items-start gap-3">
              {item.status === "sent" || item.status === "edited_and_sent" ? (
                <Send className="mt-0.5 h-5 w-5 shrink-0 text-chief-accent" strokeWidth={2} />
              ) : (
                <Archive className="mt-0.5 h-5 w-5 shrink-0 text-chief-text-muted" strokeWidth={2} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-chief-text truncate">
                  {item.subject}
                </p>
                <p className="mt-1 text-xs text-chief-text-secondary line-clamp-1">
                  {item.body}
                </p>
                <p className="mt-2 text-[11px] text-chief-text-muted">
                  {item.sent_at
                    ? formatDistanceToNow(new Date(item.sent_at), { addSuffix: true })
                    : formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
