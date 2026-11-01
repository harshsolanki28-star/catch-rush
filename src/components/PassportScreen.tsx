'use client';

import React, { useState } from 'react';
import { DaterProfile, Gender, Seeking, DatingIntent } from '@/types/dating';
import { ArrowLeft, Sparkles, Instagram, Send, MessageSquare } from 'lucide-react';
import { sound } from '@/utils/audio';

interface PassportScreenProps {
  initialProfile?: DaterProfile | null;
  onConfirm: (profile: DaterProfile) => void;
  onBack: () => void;
}

const AVATARS = ['🫦', '😈', '💅', '🍸', '🚀', '🖤', '🕶️', '💀', '🔥', '👑'];

const INTENT_OPTIONS: { id: DatingIntent; label: string; icon: string }[] = [
  { id: 'down-for-whatever', label: 'Down for whatever tonight', icon: '🥂' },
  { id: 'speed-dating', label: 'Short attention span speed date', icon: '⚡' },
  { id: 'hacker-bae', label: '10x Hacker Soulmate w/ benefits', icon: '💻' },
  { id: 'high-velocity', label: 'Speedrunning tonight', icon: '📈' },
];

export const PassportScreen: React.FC<PassportScreenProps> = ({
  initialProfile,
  onConfirm,
  onBack,
}) => {
  const [handle, setHandle] = useState(initialProfile?.handle || '');
  const [name, setName] = useState(initialProfile?.name || '');
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'girl');
  const [seeking, setSeeking] = useState<Seeking>(initialProfile?.seeking || 'guys');
  const [intent, setIntent] = useState<DatingIntent>(initialProfile?.intent || 'down-for-whatever');
  const [avatar, setAvatar] = useState(initialProfile?.avatar || '🫦');
  const [contactType, setContactType] = useState<'instagram' | 'telegram' | 'discord'>(initialProfile?.contactType || 'instagram');
  const [contactValue, setContactValue] = useState(initialProfile?.contactValue || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();

    const selectedIntent = INTENT_OPTIONS.find((i) => i.id === intent);
    const benchmark = gender === 'guy' ? 3 : gender === 'girl' ? 2 : 2.5;

    const profile: DaterProfile = {
      id: initialProfile?.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      handle: handle.startsWith('@') ? handle : `@${handle.trim() || 'anon'}`,
      name: name.trim() || 'Anonymous Dater',
      gender,
      seeking,
      intent,
      intentLabel: `${selectedIntent?.label} ${selectedIntent?.icon}`,
      avatar,
      contactType,
      contactValue: contactValue.trim() || handle || 'no_contact',
      bio: bio.trim() || 'Ready to see if our reflexes sync in 45 seconds.',
      lifetimeBenchmark: benchmark,
      score: 0,
      telemetry: {
        attentionSpanCurve: 1.0,
        redFlagTolerance: 25,
        impulseControl: 0.85,
        dopamineHunger: 200,
      },
      createdAt: Date.now(),
    };

    onConfirm(profile);
  };

  return (
    <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col p-6 glass-panel rounded-2xl shadow-2xl overflow-y-auto border border-white/10 text-white animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            sound.playTap();
            onBack();
          }}
          className="p-2 rounded-full hover:bg-white/10 transition text-white/70"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-[#ffd700] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" /> Dater ID Passport
        </span>
        <div className="w-5" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Avatar Selection */}
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Select Your Vibe Avatar
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  sound.playTap();
                  setAvatar(emoji);
                }}
                className={`w-11 h-11 shrink-0 rounded-2xl text-xl flex items-center justify-center transition-all ${
                  avatar === emoji
                    ? 'bg-[#ff2d55] scale-110 shadow-lg shadow-pink-500/40 border border-white/40'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name and Handle */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              First Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium focus:outline-none focus:border-[#ff2d55] transition text-white placeholder-white/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Public Handle
            </label>
            <input
              type="text"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@maya_dev"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium focus:outline-none focus:border-[#ff2d55] transition text-white placeholder-white/30"
            />
          </div>
        </div>

        {/* Gender & Seeking */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              I am a
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full px-3 py-2 rounded-xl bg-[#141419] border border-white/10 text-xs font-medium focus:outline-none focus:border-[#ff2d55] text-white"
            >
              <option value="girl">Girl</option>
              <option value="guy">Guy</option>
              <option value="non-binary">Non-Binary</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Looking for
            </label>
            <select
              value={seeking}
              onChange={(e) => setSeeking(e.target.value as Seeking)}
              className="w-full px-3 py-2 rounded-xl bg-[#141419] border border-white/10 text-xs font-medium focus:outline-none focus:border-[#ff2d55] text-white"
            >
              <option value="guys">Guys</option>
              <option value="girls">Girls</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>
        </div>

        {/* Grounded Demographic Reality Banner */}
        <div className="p-2.5 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/25 text-[11px] text-[#ffd700] leading-snug">
          <p className="font-bold">Demographic Baseline Model:</p>
          <p className="text-[10px] text-white/70 mt-0.5">
            Young adult lifetime partner statistics anchor at a mean of <strong>3 for men</strong> and <strong>2 for women</strong>. Your matchmaking velocity index is calibrated honestly against real-world human baselines.
          </p>
        </div>

        {/* Intent Radio Group */}
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Your Vibe / Tonight Intent
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {INTENT_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => {
                  sound.playTap();
                  setIntent(opt.id);
                }}
                className={`p-2 rounded-xl text-left flex items-center justify-between text-xs font-semibold transition border ${
                  intent === opt.id
                    ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-white'
                    : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-base">{opt.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contact Unlock Channel */}
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Secret Social Contact (Unlocked on 80%+ Match)
          </label>
          <div className="flex gap-2">
            <div className="flex bg-[#141419] rounded-xl border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setContactType('instagram')}
                className={`p-1.5 rounded-lg transition ${
                  contactType === 'instagram' ? 'bg-[#ff2d55] text-white' : 'text-white/40'
                }`}
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setContactType('telegram')}
                className={`p-1.5 rounded-lg transition ${
                  contactType === 'telegram' ? 'bg-[#0088cc] text-white' : 'text-white/40'
                }`}
                title="Telegram"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setContactType('discord')}
                className={`p-1.5 rounded-lg transition ${
                  contactType === 'discord' ? 'bg-[#5865F2] text-white' : 'text-white/40'
                }`}
                title="Discord"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={contactType === 'instagram' ? 'IG handle (e.g. maya_x)' : contactType === 'telegram' ? 'Telegram @username' : 'Discord username'}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium focus:outline-none focus:border-[#ff2d55] transition text-white placeholder-white/30"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">
            Short Witty Bio
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Frontend dev. Zero tolerance for slow texters."
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium focus:outline-none focus:border-[#ff2d55] transition text-white placeholder-white/30"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff2d55] to-[#ff375f] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <span>Sync Telemetry & Enter Probe</span>
        </button>
      </form>
    </div>
  );
};
