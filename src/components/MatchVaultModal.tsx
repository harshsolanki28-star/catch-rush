'use client';

import React from 'react';
import { MatchResult } from '@/types/dating';
import { X, Heart, Instagram, Send, MessageSquare, ExternalLink } from 'lucide-react';
import { sound } from '@/utils/audio';

interface MatchVaultModalProps {
  matches: MatchResult[];
  onClose: () => void;
}

export const MatchVaultModal: React.FC<MatchVaultModalProps> = ({ matches, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[420px] max-h-[700px] flex flex-col p-6 bg-[#0c0c10] border border-white/10 rounded-3xl shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="text-base font-bold text-white">Match Vault</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold border border-rose-500/25">
              {matches.length}
            </span>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of matches */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {matches.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs leading-relaxed">
              No matches yet. Complete a 45-second reflex run to unlock compatible daters within a 100-point spread!
            </div>
          ) : (
            matches.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between gap-3 hover:border-rose-500/30 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-xl shrink-0 shadow-md shadow-rose-950/40">
                    {m.matchedProfile.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{m.matchedProfile.name}</p>
                      <span className="text-[10px] text-emerald-400 font-bold">{m.compatibilityPercent}%</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate">{m.matchedProfile.handle} • {m.matchedProfile.intentLabel}</p>
                    <p className="text-[10px] text-amber-400 font-mono mt-0.5">{m.matchedProfile.contactValue}</p>
                  </div>
                </div>

                <a
                  href={
                    m.matchedProfile.contactType === 'instagram'
                      ? `https://instagram.com/${m.matchedProfile.contactValue.replace('@', '')}`
                      : `https://t.me/${m.matchedProfile.contactValue.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition shrink-0 border border-rose-500/25"
                  title="Contact dater"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
