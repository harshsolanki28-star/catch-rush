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
    <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col justify-between p-6 bg-[#0c0c10] border border-white/10 rounded-3xl shadow-2xl overflow-y-auto text-white animate-fade-in select-none">
      {/* Top Banner */}
      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-400 mb-2">
          <Heart className="w-3.5 h-3.5 fill-rose-500" />
          <span>Reflex Match Confirmed</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">
          IT&apos;S A MATCH! 🔥
        </h2>
        <p className="text-xs text-amber-400 font-semibold tracking-wide mt-1">
          {compatibilityPercent}% Reflex &amp; Chemistry Compatibility
        </p>
      </div>

      {/* Matched Profile Card */}
      <div className="relative z-10 p-4 rounded-2xl bg-zinc-900/90 border border-white/10 my-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-3xl shadow-lg shadow-rose-950/50 border border-white/10">
            {matchedProfile.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white truncate">{matchedProfile.name}</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                ±{matchResult.scoreDelta} pt spread
              </span>
            </div>
            <p className="text-xs text-rose-400 font-medium">{matchedProfile.handle}</p>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{matchedProfile.intentLabel}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-300 italic mt-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5 leading-relaxed">
          &ldquo;{matchedProfile.bio}&rdquo;
        </p>

        {/* Contact handle reveal */}
        <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-white/10">
          <div className="flex items-center gap-2">
            {matchedProfile.contactType === 'instagram' ? (
              <Instagram className="w-4 h-4 text-rose-400" />
            ) : matchedProfile.contactType === 'telegram' ? (
              <Send className="w-4 h-4 text-sky-400" />
            ) : (
              <MessageSquare className="w-4 h-4 text-indigo-400" />
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
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline"
            >
              Open Link ↗
            </a>
          )}
        </div>
      </div>

      {/* Compatibility Breakdown */}
      <div className="relative z-10 p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-2.5">
        <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Compatibility Breakdown
        </p>

        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
            <span>Attention Span Sync</span>
            <span className="font-bold text-white">{attentionSync}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${attentionSync}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
            <span>Red Flag Reflex</span>
            <span className="font-bold text-white">{toxicityResilience}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${toxicityResilience}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
            <span>Late-Night Rhythm Sync</span>
            <span className="font-bold text-white">{impulseSync}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${impulseSync}%` }} />
          </div>
        </div>
      </div>

      {/* Suggested Icebreaker Box */}
      <div className="relative z-10 mt-3 p-3 rounded-2xl bg-zinc-900/80 border border-white/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
            Smart Icebreaker
          </span>
          <button
            onClick={handleCopyIcebreaker}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition font-medium"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-zinc-200 leading-relaxed font-normal">
          &ldquo;{icebreaker}&rdquo;
        </p>
      </div>

      {/* Actions */}
      <div className="relative z-10 flex gap-2 mt-4">
        <button
          onClick={handleCopyIcebreaker}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/40 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-1.5"
        >
          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Icebreaker Copied!' : 'Copy DM Icebreaker'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            onPlayAgain();
          }}
          className="py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1 border border-white/5"
          title="Play another round"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Again</span>
        </button>
      </div>
    </div>
  );
};
