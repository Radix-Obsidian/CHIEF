"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { ImportanceBadge } from "@/components/importance-badge";

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

    fetch(`/api/drafts?user_id=${userId}`)
      .then((res) => res.json())
      .then(setDrafts)
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

  if (drafts.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-full bg-white/5 p-6">
          <FileText className="h-12 w-12 text-white/30" />
        </div>
        <p className="text-sm text-white/50">No drafts yet</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Drafts</h1>
      <div className="space-y-3">
        {drafts.map((draft) => (
          <Link
            key={draft.id}
            href={`/drafts/${draft.id}`}
            className="block rounded-xl border border-white/10 bg-chief-card p-4 transition hover:border-white/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{draft.subject}</p>
                <p className="mt-1 text-sm text-white/50 line-clamp-2">{draft.body}</p>
              </div>
              <span className="ml-3 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                {draft.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
