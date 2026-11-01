'use client';

import React, { useEffect, useState } from 'react';
import { MatchResult, DaterProfile } from '@/types/dating';
import { Heart, Sparkles, Copy, Check, Instagram, Send, MessageSquare, RotateCcw, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '@/utils/audio';

interface MatchRevealScreenProps {
  userProfile: DaterProfile;
  matchResult: MatchResult;
  onPlayAgain: () => void;
  onOpenVault: () => void;
}

export const MatchRevealScreen: React.FC<MatchRevealScreenProps> = ({
  userProfile,
  matchResult,
  onPlayAgain,
  onOpenVault,
}) => {
  const [copied, setCopied] = useState(false);
  const { matchedProfile, compatibilityPercent, attentionSync, toxicityResilience, impulseSync, icebreaker } = matchResult;

  useEffect(() => {
    sound.playMatchReveal();
    // Confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff2d55', '#ffd700', '#ffffff', '#af52de'],
      });
    } catch (e) {}
  }, []);

  const handleCopyIcebreaker = () => {
    sound.playTap();
    navigator.clipboard.writeText(icebreaker);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getContactLink = () => {
    const clean = matchedProfile.contactValue.replace('@', '');
    if (matchedProfile.contactType === 'instagram') {
      return `https://instagram.com/${clean}`;
    }
    if (matchedProfile.contactType === 'telegram') {
      return `https://t.me/${clean}`;
    }
    return null;
  };

  const contactLink = getContactLink();

  return (
    <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col justify-between p-5 glass-panel rounded-2xl shadow-2xl overflow-y-auto border border-pink-500/20 text-white animate-fade-in">
      {/* Top Banner */}
      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-xs font-bold text-[#ff2d55] mb-2 animate-pulse">
          <Heart className="w-3.5 h-3.5 fill-[#ff2d55]" />
          <span>Neuro-Reflex Chemistry Verified</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white glow-pink">
          IT&apos;S A MATCH! 🔥
        </h2>
        <p className="text-xs text-[#ffd700] font-semibold tracking-wide">
          {compatibilityPercent}% Dopamine Frequency Alignment
        </p>
      </div>

      {/* Matched Profile Card */}
      <div className="relative z-10 p-4 rounded-2xl glass-panel-glow border border-pink-500/30 my-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff2d55] to-[#af52de] flex items-center justify-center text-3xl shadow-lg shadow-pink-500/30 border border-white/20">
            {matchedProfile.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white truncate">{matchedProfile.name}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Δ {matchResult.scoreDelta} pts
              </span>
            </div>
            <p className="text-xs text-[#ff2d55] font-semibold">{matchedProfile.handle}</p>
            <p className="text-[11px] text-white/80 font-medium truncate mt-0.5">{matchedProfile.intentLabel}</p>
          </div>
        </div>

        <p className="text-xs text-white/70 italic mt-3 bg-white/5 p-2 rounded-xl border border-white/5">
          &ldquo;{matchedProfile.bio}&rdquo;
        </p>

        {/* Contact handle reveal */}
        <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center gap-2">
            {matchedProfile.contactType === 'instagram' ? (
              <Instagram className="w-4 h-4 text-pink-400" />
            ) : matchedProfile.contactType === 'telegram' ? (
              <Send className="w-4 h-4 text-cyan-400" />
            ) : (
              <MessageSquare className="w-4 h-4 text-purple-400" />
            )}
            <span className="text-xs font-mono font-bold text-white">
              {matchedProfile.contactValue}
            </span>
          </div>

          {contactLink && (
            <a
              href={contactLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#ffd700] hover:underline"
            >
              Open Link ↗
            </a>
          )}
        </div>
      </div>

      {/* Neuro-Audit Compatibility Breakdown */}
      <div className="relative z-10 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <p className="text-[11px] font-bold text-[#ffd700] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#ffd700]" /> Biometric Telemetry Audit
        </p>

        <div>
          <div className="flex justify-between text-[10px] text-white/80 mb-0.5">
            <span>Attention Span Sync</span>
            <span className="font-bold text-white">{attentionSync}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" style={{ width: `${attentionSync}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-white/80 mb-0.5">
            <span>Toxic Red Flag Resilience</span>
            <span className="font-bold text-white">{toxicityResilience}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full" style={{ width: `${toxicityResilience}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-white/80 mb-0.5">
            <span>Impulse Control Velocity</span>
            <span className="font-bold text-white">{impulseSync}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" style={{ width: `${impulseSync}%` }} />
          </div>
        </div>
      </div>

      {/* Suggested Icebreaker Box */}
      <div className="relative z-10 mt-3 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/25">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-[#ff2d55] uppercase tracking-wider">
            Auto-Generated Icebreaker
          </span>
          <button
            onClick={handleCopyIcebreaker}
            className="flex items-center gap-1 text-[10px] text-[#ffd700] hover:text-white transition font-semibold"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-white/90 leading-relaxed font-medium">
          &ldquo;{icebreaker}&rdquo;
        </p>
      </div>

      {/* Actions */}
      <div className="relative z-10 flex gap-2 mt-3">
        <button
          onClick={handleCopyIcebreaker}
          className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-[#ff2d55] to-[#ff375f] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-1.5"
        >
          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Icebreaker Copied!' : 'Slide Into DMs'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            onPlayAgain();
          }}
          className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1"
          title="Play another round"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Again</span>
        </button>
      </div>
    </div>
  );
};
