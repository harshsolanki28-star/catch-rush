'use client';

import React from 'react';
import { Flame, Sparkles, Heart, Users, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col justify-between p-6 glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/10 text-white animate-fade-in">
      {/* Background Ambience / Glow circles */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#ff2d55]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#af52de]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Live Hackathon Network</span>
        </div>

        {matchCount > 0 && (
          <button
            onClick={() => {
              sound.playTap();
              onOpenVault();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff2d55]/20 border border-[#ff2d55]/40 text-xs font-bold text-[#ff2d55] hover:bg-[#ff2d55]/30 transition"
          >
            <Heart className="w-3.5 h-3.5 fill-[#ff2d55]" />
            <span>Vault ({matchCount})</span>
          </button>
        )}
      </div>

      {/* Center Hero / Title section */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <div className="relative mb-4 group cursor-pointer" onClick={() => sound.playPowerUp()}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d55] to-[#ffd700] rounded-full blur-xl opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />
          <img
            src="/assets/logo-badge.png"
            alt="Crush Rush Logo"
            className="relative w-44 h-auto drop-shadow-2xl hover:scale-105 transition-transform"
          />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white glow-pink">
          CRUSH RUSH
        </h1>

        <p className="mt-1 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#ffea00] to-[#ff9500] uppercase tracking-wider">
          Reflex-Based Speed Dating & Hookup platform
        </p>

        <p className="mt-3 text-xs text-white/70 max-w-[320px] leading-relaxed">
          Swiping is dead. We analyze your subconscious micro-reflexes, panic response, and dopamine cadence in 45 seconds to engineer real chemistry.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-[360px] text-left">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2">
            <Flame className="w-4 h-4 text-[#ff2d55] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-white">45s Dopamine Probe</p>
              <p className="text-[9px] text-white/50">Zero bios, 100% instinct</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-white">Attention Span Sync</p>
              <p className="text-[9px] text-white/50">Scores within 100 pts match</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full">
        <button
          onClick={() => {
            sound.playTap();
            onStart();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff2d55] via-[#ff375f] to-[#ff2d55] text-white font-black text-base uppercase tracking-wider shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <span>Create Dater Passport</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between w-full text-[10px] text-white/40 px-2">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-white/40" /> Grounded Lifetime Benchmark (M:3, W:2)
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-white/40" /> Verified Vercel Serverless
          </span>
        </div>
      </div>
    </div>
  );
};
