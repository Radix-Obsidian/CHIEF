"use client";

import { useEffect, useState } from "react";
import { Clock, Send, Archive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

    fetch(`/api/drafts?user_id=${userId}&status=sent`)
      .then((res) => res.json())
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-full bg-white/5 p-6">
          <Clock className="h-12 w-12 text-white/30" />
        </div>
        <p className="text-sm text-white/50">No sent emails yet</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">History</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-chief-card p-4"
          >
            <div className="flex items-start gap-3">
              {item.status === "sent" || item.status === "edited_and_sent" ? (
                <Send className="mt-0.5 h-4 w-4 text-green-400" />
              ) : (
                <Archive className="mt-0.5 h-4 w-4 text-white/30" />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.subject}</p>
                <p className="mt-1 text-sm text-white/50 line-clamp-1">{item.body}</p>
                <p className="mt-2 text-xs text-white/30">
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
