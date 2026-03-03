"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { RefreshCw, Hexagon } from "lucide-react";
import { toast } from "sonner";
import { authedFetch } from "@/lib/api";

/* ── Types ── */

interface VoiceProfile {
  greeting_style?: string;
  closing_style?: string;
  formality_level?: number;
  avg_sentence_length?: string;
  common_phrases?: string[];
  tone_descriptors?: string[];
  punctuation_style?: string;
  emoji_usage?: string;
}

interface VoiceCalibrationProps {
  profile: VoiceProfile | null;
  toneStrictness: number;
  onToneStrictnessChange: (value: number) => void;
  onProfileUpdate: (profile: VoiceProfile) => void;
}

/* ── Helpers ── */

function computeVoiceMatch(p: VoiceProfile): number {
  let s = 0;
  if (p.greeting_style) s += 14;
  if (p.closing_style) s += 14;
  if (p.formality_level) s += 14;
  const td = p.tone_descriptors?.length ?? 0;
  if (td > 0) s += 14 + Math.min(td * 3, 10);
  if ((p.common_phrases?.length ?? 0) > 0) s += 12;
  if (p.avg_sentence_length) s += 10;
  if (p.punctuation_style) s += 8;
  if (p.emoji_usage) s += 8;
  return Math.min(s, 98);
}

interface Sample {
  label: string;
  yours: string;
  chief: string;
  matches: string[];
}

function buildSamples(p: VoiceProfile, strictness: number): Sample[] {
  const g = p.greeting_style || "Hi,";
  const c = p.closing_style || "Best,";
  const strict = strictness > 50;

  return [
    {
      label: "Opening",
      yours: `${g} I wanted to follow up on the Q3 report you sent over.`,
      chief: strict
        ? `${g} I wanted to follow up on the Q3 report you sent over.`
        : `${g} Following up on the Q3 report.`,
      matches: strict ? [g, "I wanted to follow up", "Q3 report", "sent over"] : [g, "Q3 report"],
    },
    {
      label: "Body",
      yours:
        "Thanks for the quick turnaround. Let me review the numbers and circle back by EOD.",
      chief: strict
        ? "Thanks for the quick turnaround. Let me review the numbers and circle back by EOD."
        : "Thanks for the quick turnaround. I'll review and get back to you by EOD.",
      matches: strict
        ? ["Thanks for the quick turnaround", "review the numbers", "circle back", "EOD"]
        : ["Thanks for the quick turnaround", "EOD"],
    },
    {
      label: "Sign-off",
      yours: c,
      chief: c,
      matches: [c],
    },
  ];
}

/* ── Highlighted text renderer ── */

function HighlightedText({
  text,
  matches,
}: {
  text: string;
  matches: string[];
}) {
  if (!matches.length) return <>{text}</>;

  const escaped = matches.map((m) =>
    m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = matches.some(
          (m) => m.toLowerCase() === part.toLowerCase()
        );
        return isMatch ? (
          <span key={i} className="text-chief-accent">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}

/* ── Component ── */

export function VoiceCalibration({
  profile,
  toneStrictness,
  onToneStrictnessChange,
  onProfileUpdate,
}: VoiceCalibrationProps) {
  const [calibrating, setCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewKey, setPreviewKey] = useState(0);

  const voiceMatch = useMemo(
    () => (profile ? computeVoiceMatch(profile) : 0),
    [profile]
  );

  const samples = useMemo(
    () => (profile ? buildSamples(profile, toneStrictness) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, toneStrictness, previewKey]
  );

  const handleRecalibrate = useCallback(async () => {
    setCalibrating(true);
    setProgress(0);
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12, 92));
    }, 250);

    try {
      const res = await authedFetch(`/api/settings/calibrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      setProgress(100);
      onProfileUpdate(data);
      toast.success("Voice profile updated");
    } catch {
      toast.error("Calibration failed");
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setCalibrating(false);
        setProgress(0);
      }, 400);
    }
  }, [onProfileUpdate]);

  const strictnessProgress = toneStrictness;

  /* ── Empty state ── */

  if (!profile || Object.keys(profile).length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-chief-accent" />
          <h2 className="font-satoshi text-hig-title2 font-bold text-chief-text">
            Voice Calibration
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-chief border border-chief-border bg-chief-surface px-6 py-16">
          <Hexagon
            className="h-6 w-6 text-chief-text-muted"
            strokeWidth={2}
          />
          <p className="text-hig-caption text-chief-text-muted">
            Connect Gmail to build your voice profile
          </p>
        </div>
      </section>
    );
  }

  /* ── Calibrated state ── */

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-chief-accent" />
        <h2 className="font-satoshi text-hig-title2 font-bold text-chief-text">
          Voice Calibration
        </h2>
      </div>

      {/* Voice Match metric */}
      <div className="rounded-chief border border-chief-border bg-chief-surface p-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums text-chief-text">
            {voiceMatch}%
          </span>
          <span className="text-xs text-chief-text-muted">Voice Match</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-chief-border">
          <div
            className="h-full rounded-full bg-chief-accent transition-all duration-500"
            style={{ width: `${voiceMatch}%` }}
          />
        </div>
      </div>

      {/* Sample comparison cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {samples.map((sample) => (
          <div
            key={`${sample.label}-${previewKey}`}
            className="rounded-chief border border-chief-border bg-chief-surface p-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-widest text-chief-text-muted">
              {sample.label}
            </p>

            <div className="mt-3 space-y-3">
              {/* User's real email */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-chief-text-muted/60">
                  Your email
                </p>
                <p className="mt-1 text-xs leading-relaxed text-chief-text-secondary">
                  {sample.yours}
                </p>
              </div>

              {/* Chief draft */}
              <div className="border-t border-chief-border pt-3">
                <p className="text-[10px] uppercase tracking-widest text-chief-text-muted/60">
                  Chief draft
                </p>
                <p className="mt-1 text-xs leading-relaxed text-chief-text-secondary">
                  <HighlightedText
                    text={sample.chief}
                    matches={sample.matches}
                  />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tone Strictness slider */}
      <div className="rounded-chief border border-chief-border bg-chief-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-chief-text">
              Tone Strictness
            </p>
            <p className="mt-0.5 text-xs text-chief-text-muted">
              How closely drafts match your exact style
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-chief border border-chief-border px-3 py-1.5 text-[11px] font-medium text-chief-text-secondary transition-colors hover:border-chief-text-muted/40"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Preview
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            value={toneStrictness}
            onChange={(e) => onToneStrictnessChange(Number(e.target.value))}
            className="flex-1"
            style={
              {
                "--range-progress": `${strictnessProgress}%`,
              } as React.CSSProperties
            }
          />
          <span className="w-8 text-right text-xs font-medium tabular-nums text-chief-text">
            {toneStrictness}
          </span>
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-chief-text-muted">
          <span>Flexible</span>
          <span>Exact match</span>
        </div>
      </div>

      {/* Recalibrate button */}
      <button
        type="button"
        onClick={handleRecalibrate}
        disabled={calibrating}
        className="w-full rounded-chief bg-chief-accent py-3 text-sm font-medium text-chief-bg transition hover:brightness-110 disabled:opacity-50"
      >
        {calibrating ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw
              className="h-4 w-4 animate-spin"
              strokeWidth={2}
            />
            Analyzing...
          </span>
        ) : (
          "Re-calibrate from last 50 sent emails"
        )}
      </button>

      {/* Calibration progress bar */}
      {calibrating && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-chief-border">
          <div
            className="h-full rounded-full bg-chief-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </section>
  );
}
