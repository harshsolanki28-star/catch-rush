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
          setTimeout(onComplete, 400);
          return 0;
        }
        sound.playCatch();
        return prev - 1;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full max-w-[450px] max-h-[800px] flex flex-col items-center justify-center p-6 glass-panel rounded-2xl shadow-2xl border border-white/10 text-white animate-fade-in">
      <div className="absolute inset-0 bg-radial from-[#ff2d55]/15 to-transparent blur-2xl pointer-events-none" />

      <p className="text-xs font-bold text-[#ffd700] uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        Neuro-Telemetry Calibrating
      </p>

      <div className="relative flex items-center justify-center w-36 h-36 rounded-full border border-pink-500/30 bg-black/40 shadow-2xl shadow-pink-500/20 my-6">
        <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#ff2d55] glow-pink animate-pulse">
          {count > 0 ? count : 'GO!'}
        </span>
      </div>

      <div className="text-center max-w-[280px]">
        <h3 className="text-base font-bold text-white">45-Second Dopamine Probe</h3>
        <p className="text-xs text-white/60 mt-1">
          Catch <span className="text-[#ffd700] font-semibold">Green Flags</span>. Dodge <span className="text-[#ff2d55] font-semibold">Toxic Red Flags</span>. Power up your score to trigger a high-intent match.
        </p>
      </div>
    </div>
  );
};
