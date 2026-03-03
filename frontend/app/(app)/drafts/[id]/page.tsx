"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Draft {
  id: string;
  email_id: string;
  thread_id: string;
  subject: string;
  body: string;
  status: string;
  confidence: number | null;
}

export default function DraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("chief_user_id");
    if (!userId || !params.id) return;

    fetch(`/api/drafts/${params.id}?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setDraft(data);
        setEditedBody(data.body);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleApprove() {
    if (!draft) return;
    setSending(true);

    try {
      const edits = editedBody !== draft.body ? editedBody : undefined;
      await fetch(`/api/drafts/${draft.thread_id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, edits }),
      });

      toast.success("Email sent");
      router.push("/inbox");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleReject() {
    if (!draft) return;

    await fetch(`/api/drafts/${draft.thread_id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false }),
    });

    toast("Draft rejected");
    router.push("/inbox");
  }

  if (loading || !draft) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-white/5 p-2 hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold">{draft.subject}</h1>
      </div>

      {/* Editable draft body */}
      <textarea
        value={editedBody}
        onChange={(e) => setEditedBody(e.target.value)}
        className="min-h-[300px] w-full resize-none rounded-xl border border-white/10 bg-chief-card p-4 text-sm text-white/90 focus:border-chief-accent focus:outline-none"
      />

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleReject}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
        >
          <X className="h-4 w-4" />
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={sending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-chief-approve py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {sending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {sending ? "Sending..." : "Approve & Send"}
        </button>
      </div>
    </div>
  );
}
