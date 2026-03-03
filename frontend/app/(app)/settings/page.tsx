"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mic, Sliders } from "lucide-react";

export default function SettingsPage() {
  const [threshold, setThreshold] = useState(5);
  const [autoDraft, setAutoDraft] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    fetch(`/api/settings?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setThreshold(data.importance_threshold || 5);
        setAutoDraft(data.auto_draft ?? true);
        setVoiceProfile(data.voice_profile || null);
      })
      .catch(console.error);
  }, []);

  async function saveSettings() {
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    await fetch(`/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        importance_threshold: threshold,
        auto_draft: autoDraft,
      }),
    });

    toast.success("Settings saved");
  }

  async function calibrateVoice() {
    setCalibrating(true);
    const userId = localStorage.getItem("chief_user_id");
    if (!userId) return;

    try {
      const res = await fetch(`/api/settings/calibrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const profile = await res.json();
      setVoiceProfile(profile);
      toast.success("Voice profile calibrated");
    } catch {
      toast.error("Calibration failed");
    } finally {
      setCalibrating(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="space-y-6">
        {/* Importance Threshold */}
        <div className="rounded-xl border border-white/10 bg-chief-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Sliders className="h-5 w-5 text-chief-accent" />
            <h2 className="font-medium">Importance Threshold</h2>
          </div>
          <p className="text-sm text-white/50 mb-4">
            Only generate drafts for emails scoring at or above this level
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={10}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="flex-1 accent-chief-accent"
            />
            <span className="w-10 text-center text-lg font-bold">{threshold}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/30">
            <span>All emails</span>
            <span>VIPs only</span>
          </div>
        </div>

        {/* Voice Profile */}
        <div className="rounded-xl border border-white/10 bg-chief-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Mic className="h-5 w-5 text-chief-accent" />
            <h2 className="font-medium">Voice Profile</h2>
          </div>
          <p className="text-sm text-white/50 mb-4">
            Analyze your sent emails to match your writing style
          </p>

          {voiceProfile && Object.keys(voiceProfile).length > 0 ? (
            <div className="space-y-2 mb-4 rounded-lg bg-white/5 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Greeting</span>
                <span>{voiceProfile.greeting_style}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Closing</span>
                <span>{voiceProfile.closing_style}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Formality</span>
                <span>{voiceProfile.formality_level}/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Tone</span>
                <span>{(voiceProfile.tone_descriptors || []).join(", ")}</span>
              </div>
            </div>
          ) : (
            <p className="mb-4 text-sm text-white/30 italic">
              No voice profile yet. Calibrate to improve draft quality.
            </p>
          )}

          <button
            onClick={calibrateVoice}
            disabled={calibrating}
            className="w-full rounded-lg bg-chief-accent py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {calibrating ? "Analyzing sent emails..." : "Calibrate My Voice"}
          </button>
        </div>

        {/* Save */}
        <button
          onClick={saveSettings}
          className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
