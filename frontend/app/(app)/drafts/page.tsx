"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { authedFetch } from "@/lib/api";

interface Draft {
  id: string;
  email_id: string;
  thread_id: string;
  subject: string;
  body: string;
  status: string;
  confidence: number | null;
  created_at: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    authedFetch(`/api/drafts?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setDrafts(Array.isArray(data) ? data : []))
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

  if (drafts.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 px-6">
        <FileText className="h-6 w-6 text-chief-text-muted" strokeWidth={2} />
        <p className="text-hig-caption text-chief-text-muted">No drafts yet</p>
      </div>
    );
  }

  return (
    <div className="px-6 pt-8">
      <h1 className="mb-6 text-hig-title1 font-bold text-chief-text">Drafts</h1>
      <div className="space-y-2">
        {drafts.map((draft) => (
          <Link
            key={draft.id}
            href={`/drafts/${draft.id}`}
            className="block rounded-chief border border-chief-border bg-chief-surface p-4 transition-colors hover:border-chief-text-muted/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-chief-text truncate">
                  {draft.subject}
                </p>
                <p className="mt-1 text-xs text-chief-text-secondary line-clamp-1">
                  {draft.body}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-chief-surface px-2 py-0.5 text-[11px] font-medium text-chief-text-muted">
                {draft.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
