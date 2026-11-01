'use client';

import React, { useEffect, useState } from 'react';
import { sound } from '@/utils/audio';

interface CountdownScreenProps {
  onComplete: () => void;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({ onComplete }) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    sound.playCatch();
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playPowerUp();
          setTimeout(onComplete, 350);
          return 0;
        }
        sound.playCatch();
        return prev - 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col items-center justify-center p-6 bg-[#0c0c10] border border-white/10 rounded-3xl shadow-2xl text-white animate-fade-in select-none">
      <div className="absolute inset-0 bg-radial from-rose-500/10 to-transparent blur-3xl pointer-events-none" />

      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">
        45-Second Reaction Probe
      </p>

      <div className="relative flex items-center justify-center w-32 h-32 rounded-3xl border border-rose-500/20 bg-zinc-900/60 shadow-2xl shadow-rose-950/40 my-4">
        <span className="text-6xl font-black text-rose-500 tracking-tight">
          {count > 0 ? count : 'GO'}
        </span>
      </div>

      <div className="text-center max-w-[280px] mt-4">
        <h3 className="text-sm font-bold text-white">Lock in your reflexes</h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Catch <span className="text-emerald-400 font-semibold">Green Flags 🚩</span>, dodge <span className="text-rose-400 font-semibold">Toxic Red Flags 🚩</span>, grab chemistry boosters.
        </p>
      </div>
    </div>
  );
};
