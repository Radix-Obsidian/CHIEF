"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeEmail {
  id: string;
  user_id: string;
  gmail_id: string;
  thread_id: string;
  from_address: string;
  subject: string;
  body_preview: string;
  importance_score: number;
  importance_reason: string | null;
  has_draft: boolean;
  received_at: string;
}

interface UseRealtimeEmailsOptions {
  userId: string | null;
  onInsert?: (email: RealtimeEmail) => void;
  onUpdate?: (email: RealtimeEmail) => void;
}

/**
 * Subscribe to Postgres Changes on the `emails` table via Supabase Realtime.
 * Fires when Gatekeeper writes a new email or updates importance scores.
 *
 * Prerequisites:
 *   - Enable replication for `emails` table in Supabase Dashboard → Database → Replication
 */
export function useRealtimeEmails({
  userId,
  onInsert,
  onUpdate,
}: UseRealtimeEmailsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`emails:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emails",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert?.(payload.new as RealtimeEmail);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "emails",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onUpdate?.(payload.new as RealtimeEmail);
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
