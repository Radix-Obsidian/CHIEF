"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2 } from "lucide-react";
import { authedFetch } from "@/lib/api";
import { VoiceCalibration } from "@/components/voice-calibration";

export default function SettingsPage() {
  const [threshold, setThreshold] = useState(5);
  const [autoDraft, setAutoDraft] = useState(true);
  const [toneStrictness, setToneStrictness] = useState(70);
  const [voiceProfile, setVoiceProfile] = useState<Record<string, any> | null>(
    null
  );
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    setReferralCode(localStorage.getItem("chief_referral_code"));

    authedFetch(`/api/settings?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setThreshold(data.importance_threshold || 5);
        setAutoDraft(data.auto_draft ?? true);
        setToneStrictness(data.tone_strictness ?? 70);
        setVoiceProfile(data.voice_profile || null);
      })
      .catch(console.error);
  }, []);

  async function saveSettings() {
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    await authedFetch(`/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        importance_threshold: threshold,
        auto_draft: autoDraft,
        tone_strictness: toneStrictness,
      }),
    });

    toast.success("Settings saved");
  }

  const rangeProgress = ((threshold - 1) / 9) * 100;

  return (
    <div className="px-6 pt-8 pb-8">
      <h1 className="mb-8 text-hig-title1 font-bold text-chief-text">Settings</h1>

      <div className="space-y-10 max-w-2xl">
        {/* ── General ── */}
        <section className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-chief-text-muted">
            General
          </p>

          {/* Auto-draft toggle */}
          <div className="flex items-center justify-between rounded-chief border border-chief-border bg-chief-surface p-4">
            <div>
              <p className="text-sm font-medium text-chief-text">
                Auto-draft replies
              </p>
              <p className="mt-0.5 text-xs text-chief-text-muted">
                Generate drafts for incoming emails automatically
              </p>
            </div>
            <button
              type="button"
              className="chief-toggle"
              data-active={autoDraft}
              onClick={() => setAutoDraft(!autoDraft)}
              aria-label="Toggle auto-draft"
            />
          </div>

          {/* Importance Threshold */}
          <div className="rounded-chief border border-chief-border bg-chief-surface p-4">
            <p className="text-sm font-medium text-chief-text">
              Importance threshold
            </p>
            <p className="mt-0.5 text-xs text-chief-text-muted">
              Only draft for emails at or above this score
            </p>
            <div className="mt-4 flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={10}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="flex-1"
                style={
                  {
                    "--range-progress": `${rangeProgress}%`,
                  } as React.CSSProperties
                }
              />
              <span className="w-8 text-center text-lg font-semibold tabular-nums text-chief-text">
                {threshold}
              </span>
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-chief-text-muted">
              <span>All emails</span>
              <span>VIPs only</span>
            </div>
          </div>
        </section>

        {/* ── Voice ── */}
        <VoiceCalibration
          profile={voiceProfile}
          toneStrictness={toneStrictness}
          onToneStrictnessChange={setToneStrictness}
          onProfileUpdate={setVoiceProfile}
        />

        {/* ── Referral ── */}
        {referralCode && (
          <section className="space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-chief-text-muted">
              Referral
            </p>
            <div className="rounded-chief border border-chief-border bg-chief-surface p-4">
              <p className="text-sm font-medium text-chief-text">
                Your referral code
              </p>
              <p className="mt-0.5 text-xs text-chief-text-muted">
                Share with other executives. Each referral gets their own code.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-chief border border-chief-border bg-chief-bg px-4 py-2.5 font-mono text-lg font-bold tracking-[0.2em] text-chief-text">
                  {referralCode}
                </div>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/login?ref=${referralCode}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied");
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-chief border border-chief-border bg-chief-bg text-chief-text-secondary transition-colors hover:text-chief-text"
                  aria-label="Copy referral link"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {"share" in navigator && (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: "CHIEF — Executive Email Proxy",
                        text: "I've been using CHIEF to handle my inbox. Use my referral code to get access:",
                        url: `${window.location.origin}/login?ref=${referralCode}`,
                      }).catch(() => {});
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-chief border border-chief-border bg-chief-bg text-chief-text-secondary transition-colors hover:text-chief-text"
                    aria-label="Share referral link"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Save ── */}
        <button
          onClick={saveSettings}
          className="w-full rounded-chief bg-chief-accent py-3 text-sm font-medium text-chief-bg transition hover:brightness-110"
        >
          Save
        </button>
      </div>
    </div>
  );
}
