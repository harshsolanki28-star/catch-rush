'use client';

import React from 'react';
import { Flame, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { sound } from '@/utils/audio';

interface IntroScreenProps {
  onStart: () => void;
  onOpenVault: () => void;
  matchCount: number;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  onStart,
  onOpenVault,
  matchCount,
}) => {
  return (
    <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col justify-between p-6 bg-[#0c0c10] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white animate-fade-in select-none">
      {/* Subtle Warm Ambiance */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>48 daters matching now</span>
        </div>

        {matchCount > 0 && (
          <button
            onClick={() => {
              sound.playTap();
              onOpenVault();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-400 hover:bg-rose-500/25 transition"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>Vault ({matchCount})</span>
          </button>
        )}
      </div>

      {/* Center Hero Section */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <div className="mb-5 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => sound.playPowerUp()}>
          <img
            src="/assets/crush_logo.svg"
            alt="Crush Rush Logo"
            className="w-72 h-auto drop-shadow-xl"
          />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Reflex-Based Speed Dating &amp; Hookup platform
        </p>

        <p className="mt-3 text-sm text-zinc-300 max-w-[320px] leading-relaxed">
          Swipe fatigue is real. Crush Rush tests your subconscious reflex chemistry in a high-speed 45-second round. Scores within 100 points match instantly.
        </p>

        {/* Crisp Cards */}
        <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-[340px] text-left">
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex flex-col justify-between">
            <span className="text-xl mb-1">🚩</span>
            <div>
              <p className="text-xs font-bold text-white">Green vs Red Flags</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Catch chemistry. Dodge toxic exes.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex flex-col justify-between">
            <span className="text-xl mb-1">⚡</span>
            <div>
              <p className="text-xs font-bold text-white">Instant Blind Match</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Slide straight into DMs on 80%+ sync.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full">
        <button
          onClick={() => {
            sound.playTap();
            onStart();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-rose-950/40 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <span>Create Dater Passport</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] text-zinc-500 text-center">
          Demographic baseline calibrated: lifetime average of 3 for men, 2 for women.
        </p>
      </div>
    </div>
  );
};
