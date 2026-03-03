"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeDraft {
  id: string;
  user_id: string;
  email_id: string;
  thread_id: string;
  subject: string;
  body: string;
  status: string;
  confidence: number | null;
  tone: string | null;
  created_at: string;
}

interface UseRealtimeDraftsOptions {
  userId: string | null;
  onInsert?: (draft: RealtimeDraft) => void;
  onUpdate?: (draft: RealtimeDraft) => void;
}

/**
 * Subscribe to Postgres Changes on the `drafts` table via Supabase Realtime.
 * RLS filters events so each user only receives their own rows.
 *
 * Prerequisites:
 *   - Enable replication for `drafts` table in Supabase Dashboard → Database → Replication
 *   - RLS SELECT policies must exist (they already do in CHIEF)
 */
export function useRealtimeDrafts({
  userId,
  onInsert,
  onUpdate,
}: UseRealtimeDraftsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`drafts:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drafts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert?.(payload.new as RealtimeDraft);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drafts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onUpdate?.(payload.new as RealtimeDraft);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, onInsert, onUpdate]);
}
