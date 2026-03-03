"use client";

import { useCallback, useRef, useState } from "react";

export interface PipelineEvent {
  node?: string;
  status: string;
  importance_score?: number;
  should_draft?: boolean;
  confidence?: number;
  rag_docs?: number;
  suggested_tone?: string;
  action?: string;
  message?: string;
}

interface UseAgentStreamReturn {
  /** Current pipeline stage events (most recent first) */
  events: PipelineEvent[];
  /** The latest event */
  latest: PipelineEvent | null;
  /** Whether the stream is currently active */
  streaming: boolean;
  /** Start streaming pipeline progress for an email */
  start: (emailId: string, userId: string) => void;
  /** Abort the current stream */
  stop: () => void;
}

/**
 * SSE hook for streaming LangGraph pipeline progress.
 *
 * Connects to GET /api/email/:id/stream and receives events from each
 * node's get_stream_writer() calls in real-time.
 *
 * Usage:
 *   const { events, latest, streaming, start } = useAgentStream();
 *   start(emailId, userId);
 *   // latest = { node: "scribe", status: "generating_draft" }
 */
export function useAgentStream(): UseAgentStreamReturn {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const start = useCallback(
    (emailId: string, userId: string) => {
      // Abort any existing stream
      stop();

      const controller = new AbortController();
      abortRef.current = controller;
      setEvents([]);
      setStreaming(true);

      (async () => {
        try {
          const res = await fetch(
            `/api/email/${emailId}/stream?user_id=${userId}`,
            { signal: controller.signal }
          );

          if (!res.ok || !res.body) {
            setStreaming(false);
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE frames
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              try {
                const event: PipelineEvent = JSON.parse(line.slice(6));
                setEvents((prev) => [event, ...prev]);

                if (event.status === "stream_end" || event.status === "error") {
                  setStreaming(false);
                  return;
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            console.error("Agent stream error:", err);
          }
        } finally {
          setStreaming(false);
        }
      })();
    },
    [stop]
  );

  const latest = events.length > 0 ? events[0] : null;

  return { events, latest, streaming, start, stop };
}
