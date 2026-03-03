"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, X } from "lucide-react";
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

      toast.success("Sent");
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

    toast("Archived");
    router.push("/inbox");
  }

  if (loading || !draft) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="chief-pulse-bar w-32" />
      </div>
    );
  }

  return (
    <div className="px-6 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-chief border border-chief-border p-2 transition-colors hover:border-chief-text-muted/40"
        >
          <ArrowLeft className="h-5 w-5 text-chief-text-secondary" strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-hig-body font-medium text-chief-text truncate">
          {draft.subject}
        </h1>
      </div>

      {/* Editable draft body */}
      <textarea
        value={editedBody}
        onChange={(e) => setEditedBody(e.target.value)}
        className="min-h-[300px] w-full resize-none rounded-chief border border-chief-border bg-chief-surface p-4 text-hig-body text-chief-text leading-relaxed tracking-chief focus:border-chief-accent focus:outline-none"
      />

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleReject}
          className="flex flex-1 items-center justify-center gap-2 rounded-chief border border-chief-border py-3 text-hig-caption font-medium text-chief-text-secondary transition-colors hover:border-chief-text-muted/40"
        >
          <X className="h-4 w-4" strokeWidth={2} />
          Archive
        </button>
        <button
          onClick={handleApprove}
          disabled={sending}
          className="flex flex-1 items-center justify-center gap-2 rounded-chief bg-chief-accent py-3 text-hig-caption font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {sending ? (
            <div className="chief-pulse-bar w-16" />
          ) : (
            <>
              <Send className="h-4 w-4" strokeWidth={2} />
              Approve & Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}
