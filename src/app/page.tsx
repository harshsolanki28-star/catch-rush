'use client';

import React, { useState, useEffect } from 'react';
import { DaterProfile, MatchResult, TelemetryData } from '@/types/dating';
import { IntroScreen } from '@/components/IntroScreen';
import { PassportScreen } from '@/components/PassportScreen';
import { CountdownScreen } from '@/components/CountdownScreen';
import { GameCanvas } from '@/components/GameCanvas';
import { MatchRevealScreen } from '@/components/MatchRevealScreen';
import { MatchVaultModal } from '@/components/MatchVaultModal';

type AppScreen = 'INTRO' | 'PASSPORT' | 'COUNTDOWN' | 'GAME' | 'MATCH_REVEAL';

const STORAGE_KEYS = {
  PROFILE: 'crush_rush_user_profile',
  MATCHES: 'crush_rush_matches',
};

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('INTRO');
  const [userProfile, setUserProfile] = useState<DaterProfile | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchVault, setMatchVault] = useState<MatchResult[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [activeDaterCount, setActiveDaterCount] = useState(48);
  const [isMatching, setIsMatching] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
      const savedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
      if (savedMatches) {
        setMatchVault(JSON.parse(savedMatches));
      }
    } catch (e) {}

    // Fetch live active daters count from serverless API
    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (data.activeCount) {
          setActiveDaterCount(data.activeCount);
        }
      })
      .catch(() => {});
  }, []);

  const handlePassportConfirmed = (profile: DaterProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {}
    setScreen('COUNTDOWN');
  };

  const handleGameOver = async (score: number, telemetry: TelemetryData) => {
    if (!userProfile) return;

    const updatedProfile: DaterProfile = {
      ...userProfile,
      score,
      telemetry,
    };
    setUserProfile(updatedProfile);
    setIsMatching(true);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (!res.ok) throw new Error('Match failed');
      const result: MatchResult = await res.json();
      setMatchResult(result);

      // Append to match vault
      const updatedVault = [result, ...matchVault.filter((m) => m.matchedProfile.id !== result.matchedProfile.id)];
      setMatchVault(updatedVault);
      try {
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updatedVault));
      } catch (e) {}

      setScreen('MATCH_REVEAL');
    } catch (err) {
      console.error(err);
      // Fallback local match in case offline
      const fallbackResult: MatchResult = {
        matchedProfile: {
          id: 'fallback-match',
          handle: '@chloe_glitch',
          name: 'Chloe',
          gender: 'girl',
          seeking: 'everyone',
          intent: 'speed-dating',
          intentLabel: 'Short attention span speed date ⚡',
          avatar: '💅',
          contactType: 'instagram',
          contactValue: 'chloeglitch.exe',
          bio: 'ADHD visual artist. If we vibe in 45s, let us skip the awkward small talk.',
          lifetimeBenchmark: 2,
          score: score - 20,
          telemetry,
          createdAt: Date.now(),
        },
        scoreDelta: 20,
        compatibilityPercent: 92,
        attentionSync: 95,
        toxicityResilience: 89,
        impulseSync: 91,
        icebreaker: `Our Crush Rush reflexes just synced at 92% with identical rhythm! Drinks at the lounge? 🍸`,
        matchedAt: Date.now(),
      };
      setMatchResult(fallbackResult);
      setScreen('MATCH_REVEAL');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-2 sm:p-4 bg-[#0b0b0e] overflow-hidden select-none">
      {/* Background Ambient Gradients */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#ff2d55]/15 via-[#af52de]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Screen Router */}
      <div className="relative w-full max-w-[450px] h-[92vh] max-h-[820px] flex items-center justify-center">
        {screen === 'INTRO' && (
          <IntroScreen
            onStart={() => setScreen(userProfile ? 'COUNTDOWN' : 'PASSPORT')}
            onOpenVault={() => setIsVaultOpen(true)}
            matchCount={matchVault.length}
          />
        )}

        {screen === 'PASSPORT' && (
          <PassportScreen
            initialProfile={userProfile}
            onConfirm={handlePassportConfirmed}
            onBack={() => setScreen('INTRO')}
          />
        )}

        {screen === 'COUNTDOWN' && (
          <CountdownScreen onComplete={() => setScreen('GAME')} />
        )}

        {screen === 'GAME' && (
          <GameCanvas
            onGameOver={handleGameOver}
            activeDaterCount={activeDaterCount}
          />
        )}

        {screen === 'MATCH_REVEAL' && matchResult && userProfile && (
          <MatchRevealScreen
            userProfile={userProfile}
            matchResult={matchResult}
            onPlayAgain={() => setScreen('COUNTDOWN')}
            onOpenVault={() => setIsVaultOpen(true)}
          />
        )}

        {/* Loading Match Overlay */}
        {isMatching && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md rounded-3xl animate-fade-in p-6 text-center">
            <div className="w-12 h-12 rounded-full border-3 border-rose-500 border-t-transparent animate-spin mb-4" />
            <h3 className="text-base font-bold text-white">Finding Your Reflex Match</h3>
            <p className="text-xs text-zinc-400 mt-1">Comparing reaction rhythm and score spread within 100 points...</p>
          </div>
        )}

        {/* Match Vault Modal */}
        {isVaultOpen && (
          <MatchVaultModal
            matches={matchVault}
            onClose={() => setIsVaultOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
