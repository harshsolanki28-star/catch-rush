'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TelemetryData } from '@/types/dating';
import { sound } from '@/utils/audio';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface GameCanvasProps {
  onGameOver: (score: number, telemetry: TelemetryData) => void;
  activeDaterCount?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onGameOver,
  activeDaterCount = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [isPaused, setIsPaused] = useState(false);

  const gameStateRef = useRef({
    score: 0,
    lives: 3,
    timeLeft: 45,
    isOver: false,
    isPaused: false,
    earlyScore: 0,
    midScore: 0,
    lateScore: 0,
    closestBombGraze: 999,
    powerUpSpawnTimes: [] as number[],
    pointerJitterEvents: 0,
    pointerMoveFrames: 0,
  });

  const toggleMute = () => {
    sound.isMuted = !sound.isMuted;
    setIsMuted(sound.isMuted);
  };

  const togglePause = () => {
    const nextPaused = !gameStateRef.current.isPaused;
    gameStateRef.current.isPaused = nextPaused;
    setIsPaused(nextPaused);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;

    const WORLD_WIDTH = 450;
    const WORLD_HEIGHT = 800;
    const CATCHER_WIDTH = 115;
    const CATCHER_SPEED = 430;
    const POINTER_LERP_SPEED = 20;
    const MAX_DELTA_TIME = 0.05;

    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      const windowWidth = parent ? parent.clientWidth : window.innerWidth;
      const windowHeight = parent ? parent.clientHeight : window.innerHeight;
      const worldAspect = WORLD_WIDTH / WORLD_HEIGHT;

      let displayWidth: number;
      let displayHeight: number;

      if (windowWidth / windowHeight < worldAspect) {
        displayWidth = windowWidth;
        displayHeight = windowWidth / worldAspect;
      } else {
        displayHeight = windowHeight;
        displayWidth = windowHeight * worldAspect;
      }

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.width = Math.round(WORLD_WIDTH * dpr);
      canvas.height = Math.round(WORLD_HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Assets preloading
    const images: Record<string, HTMLImageElement> = {};
    const assetSources = {
      background: '/assets/dating_bg.svg',
      catcher: '/assets/catcher.svg',
      heart: '/assets/heart.png',
      heartEmpty: '/assets/heart-empty.png',
      clock: '/assets/clock.png',
      greenFlag: '/assets/green_flag.svg',
      redFlag: '/assets/red_flag.svg',
      attraction: '/assets/mutual_attraction.svg',
      hardToGet: '/assets/hard_to_get.svg',
      sparkleBurst: '/assets/sparkle-burst.png',
      explosion: '/assets/explosion.png',
    };

    Object.entries(assetSources).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      images[key] = img;
    });

    const catcher = {
      x: (WORLD_WIDTH - CATCHER_WIDTH) / 2,
      y: 710,
      height: 52,
    };

    const keys = { left: false, right: false };
    let isPointerDown = false;
    let pointerWorldX = WORLD_WIDTH / 2;
    let lastPointerX = pointerWorldX;

    const getScale = () => {
      const rect = canvas.getBoundingClientRect();
      return WORLD_WIDTH / rect.width;
    };

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      const rect = canvas.getBoundingClientRect();
      pointerWorldX = (e.clientX - rect.left) * getScale();
      lastPointerX = pointerWorldX;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) * getScale();
      const dx = Math.abs(currentX - lastPointerX);
      gameStateRef.current.pointerMoveFrames++;
      if (dx > 40) {
        gameStateRef.current.pointerJitterEvents++;
      }
      lastPointerX = currentX;
      pointerWorldX = currentX;
    };

    const onPointerUp = (e: PointerEvent) => {
      isPointerDown = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') {
        togglePause();
        return;
      }
      if (e.code === 'KeyM') {
        toggleMute();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    interface ActiveItem {
      name: string;
      imageKey: string;
      type: 'good' | 'bad' | 'power';
      points: number;
      effect?: string;
      duration?: number;
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      rotation: number;
      rotationSpeed: number;
      wobblePhase: number;
    }

    interface VisualFX {
      img: HTMLImageElement;
      x: number;
      y: number;
      startSize: number;
      endSize: number;
      duration: number;
      elapsed: number;
    }

    interface FloatingText {
      text: string;
      x: number;
      y: number;
      duration: number;
      elapsed: number;
      color?: string;
    }

    const activeItems: ActiveItem[] = [];
    const visualEffects: VisualFX[] = [];
    const floatingTexts: FloatingText[] = [];
    const activePowerUps: Record<string, { timer: number; maxDuration: number; iconKey: string }> = {};

    let spawnTimer = 0;
    let redFlashTimer = 0;
    let shakeTimer = 0;
    let catcherSquashTimer = 0;

    const ITEMS_DEF = [
      { name: 'green_flag', imageKey: 'greenFlag', points: 10, type: 'good' as const, width: 56, weight: 70 },
      { name: 'red_flag', imageKey: 'redFlag', points: 0, type: 'bad' as const, width: 56, weight: 30 },
      { name: 'attraction', imageKey: 'attraction', points: 0, type: 'power' as const, effect: 'double', duration: 5, width: 58, weight: 6 },
      { name: 'hard_to_get', imageKey: 'hardToGet', points: 0, type: 'power' as const, effect: 'slow', duration: 4, width: 58, weight: 6 },
    ];

    const spawnItem = () => {
      const totalWeight = ITEMS_DEF.reduce((acc, i) => acc + i.weight, 0);
      let rand = Math.random() * totalWeight;
      let def = ITEMS_DEF[0];
      for (const item of ITEMS_DEF) {
        if (rand < item.weight) {
          def = item;
          break;
        }
        rand -= item.weight;
      }

      const height = def.width;
      const x = Math.random() * (WORLD_WIDTH - def.width);
      const speed = 190 + Math.random() * 70;

      if (def.type === 'power') {
        gameStateRef.current.powerUpSpawnTimes.push(Date.now());
      }

      activeItems.push({
        name: def.name,
        imageKey: def.imageKey,
        type: def.type,
        points: def.points,
        effect: def.effect,
        duration: def.duration,
        x,
        y: -height,
        width: def.width,
        height,
        speed,
        rotation: 0,
        rotationSpeed: def.name === 'green_flag' ? (Math.random() - 0.5) * 1.5 : 0,
        wobblePhase: Math.random() * Math.PI * 2,
      });
    };

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!isRunning) return;

      let dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      if (dt > MAX_DELTA_TIME) dt = MAX_DELTA_TIME;

      // Update when not paused
      if (!gameStateRef.current.isPaused && !gameStateRef.current.isOver) {
        gameStateRef.current.timeLeft -= dt;

        if (shakeTimer > 0) shakeTimer -= dt;
        if (redFlashTimer > 0) redFlashTimer -= dt;
        if (catcherSquashTimer > 0) catcherSquashTimer -= dt;

        // Telemetry tracking
        const elapsedSec = 45 - gameStateRef.current.timeLeft;
        if (elapsedSec <= 15) {
          gameStateRef.current.earlyScore = gameStateRef.current.score;
        } else if (elapsedSec <= 30) {
          gameStateRef.current.midScore = gameStateRef.current.score - gameStateRef.current.earlyScore;
        } else {
          gameStateRef.current.lateScore = gameStateRef.current.score - (gameStateRef.current.earlyScore + gameStateRef.current.midScore);
        }

        // Difficulty ramp
        const progress = Math.min(1, Math.max(0, 1 - gameStateRef.current.timeLeft / 45));
        const currentSpawnInterval = 0.8 - progress * 0.4;
        const currentSpeedMult = 1.0 + progress * 0.4;

        // Power-ups
        for (const effect in activePowerUps) {
          activePowerUps[effect].timer -= dt;
          if (activePowerUps[effect].timer <= 0) {
            delete activePowerUps[effect];
          }
        }

        const isDouble = !!(activePowerUps['double'] && activePowerUps['double'].timer > 0);
        const isSlow = !!(activePowerUps['slow'] && activePowerUps['slow'].timer > 0);
        const slowFactor = isSlow ? 0.5 : 1.0;

        // Catcher movement
        if (keys.left) catcher.x -= CATCHER_SPEED * dt;
        if (keys.right) catcher.x += CATCHER_SPEED * dt;

        if (isPointerDown) {
          const targetX = pointerWorldX - CATCHER_WIDTH / 2;
          catcher.x += (targetX - catcher.x) * (1 - Math.exp(-POINTER_LERP_SPEED * dt));
        }

        catcher.x = Math.max(0, Math.min(WORLD_WIDTH - CATCHER_WIDTH, catcher.x));

        // Spawning
        spawnTimer += dt;
        if (spawnTimer >= currentSpawnInterval) {
          spawnTimer -= currentSpawnInterval;
          spawnItem();
        }

        // Collision logic (70% hitboxes)
        const catcherHitbox = {
          x: catcher.x + CATCHER_WIDTH * 0.15,
          y: catcher.y + catcher.height * 0.15,
          w: CATCHER_WIDTH * 0.7,
          h: catcher.height * 0.7,
        };

        for (let i = activeItems.length - 1; i >= 0; i--) {
          const item = activeItems[i];
          item.y += item.speed * currentSpeedMult * slowFactor * dt;

          let wobbleX = 0;
          if (item.name === 'green_flag') {
            item.rotation += item.rotationSpeed * slowFactor * dt;
          } else if (item.name === 'red_flag') {
            item.wobblePhase += dt * 6 * slowFactor;
            wobbleX = Math.sin(item.wobblePhase) * 9;
            item.rotation = Math.sin(item.wobblePhase) * 0.12;

            // Graze distance tracking
            const dist = Math.hypot(catcher.x + CATCHER_WIDTH / 2 - (item.x + item.width / 2 + wobbleX), catcher.y - item.y);
            if (dist < gameStateRef.current.closestBombGraze && dist > 40) {
              gameStateRef.current.closestBombGraze = Math.round(dist);
            }
          }

          if (item.y > WORLD_HEIGHT) {
            activeItems.splice(i, 1);
            continue;
          }

          const visualX = item.x + wobbleX;
          const itemHitbox = {
            x: visualX + item.width * 0.15,
            y: item.y + item.height * 0.15,
            w: item.width * 0.7,
            h: item.height * 0.7,
          };

          const overlap =
            catcherHitbox.x < itemHitbox.x + itemHitbox.w &&
            catcherHitbox.x + catcherHitbox.w > itemHitbox.x &&
            catcherHitbox.y < itemHitbox.y + itemHitbox.h &&
            catcherHitbox.y + catcherHitbox.h > itemHitbox.y;

          if (overlap) {
            catcherSquashTimer = 0.1;
            const cx = visualX + item.width / 2;
            const cy = item.y + item.height / 2;

            if (item.type === 'good') {
              const pts = item.points * (isDouble ? 2 : 1);
              gameStateRef.current.score += pts;
              sound.playCatch();

              if (images.sparkleBurst) {
                visualEffects.push({
                  img: images.sparkleBurst,
                  x: cx,
                  y: cy,
                  startSize: 40,
                  endSize: 90,
                  duration: 0.35,
                  elapsed: 0,
                });
              }
              floatingTexts.push({
                text: `+${pts}`,
                x: cx,
                y: cy,
                duration: 0.65,
                elapsed: 0,
              });
            } else if (item.type === 'bad') {
              gameStateRef.current.lives = Math.max(0, gameStateRef.current.lives - 1);
              redFlashTimer = 0.2;
              shakeTimer = 0.25;
              sound.playBomb();

              if (images.explosion) {
                visualEffects.push({
                  img: images.explosion,
                  x: cx,
                  y: cy,
                  startSize: 60,
                  endSize: 120,
                  duration: 0.4,
                  elapsed: 0,
                });
              }
            } else if (item.type === 'power' && item.effect && item.duration) {
              activePowerUps[item.effect] = {
                timer: item.duration,
                maxDuration: item.duration,
                iconKey: item.imageKey,
              };
              sound.playPowerUp();

              if (images.sparkleBurst) {
                visualEffects.push({
                  img: images.sparkleBurst,
                  x: cx,
                  y: cy,
                  startSize: 40,
                  endSize: 90,
                  duration: 0.35,
                  elapsed: 0,
                });
              }
            }
            activeItems.splice(i, 1);
          }
        }

        // End condition check
        if (gameStateRef.current.timeLeft <= 0 || gameStateRef.current.lives <= 0) {
          gameStateRef.current.isOver = true;
          isRunning = false;

          const early = gameStateRef.current.earlyScore || 10;
          const late = gameStateRef.current.lateScore || 10;
          const asc = Math.max(0.6, Math.min(1.6, late / (early + 5)));
          const graze = gameStateRef.current.closestBombGraze === 999 ? 35 : gameStateRef.current.closestBombGraze;
          const jitterRate = gameStateRef.current.pointerMoveFrames > 0
            ? gameStateRef.current.pointerJitterEvents / gameStateRef.current.pointerMoveFrames
            : 0.1;
          const icq = Math.max(0.65, Math.min(0.98, 1 - jitterRate * 1.5));

          const telemetry: TelemetryData = {
            attentionSpanCurve: parseFloat(asc.toFixed(2)),
            redFlagTolerance: Math.round(graze),
            impulseControl: parseFloat(icq.toFixed(2)),
            dopamineHunger: Math.round(180 + Math.random() * 50),
          };

          onGameOver(gameStateRef.current.score, telemetry);
          return;
        }
      }

      // Visual effects update
      for (let i = visualEffects.length - 1; i >= 0; i--) {
        visualEffects[i].elapsed += dt;
        if (visualEffects[i].elapsed >= visualEffects[i].duration) {
          visualEffects.splice(i, 1);
        }
      }
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].elapsed += dt;
        if (floatingTexts[i].elapsed >= floatingTexts[i].duration) {
          floatingTexts.splice(i, 1);
        }
      }

      // Render
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      ctx.save();
      if (shakeTimer > 0) {
        ctx.translate((Math.random() * 2 - 1) * 8, (Math.random() * 2 - 1) * 8);
      }

      // Background
      if (images.background && images.background.complete) {
        ctx.drawImage(images.background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else {
        ctx.fillStyle = '#0b0b0e';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }

      // Items
      for (const item of activeItems) {
        const img = images[item.imageKey];
        if (!img || !img.complete) continue;
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(item.rotation);
        ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
      }

      // Catcher
      const catcherImg = images.catcher;
      if (catcherImg && catcherImg.complete) {
        catcher.height = 54;
        catcher.y = WORLD_HEIGHT - 32 - catcher.height;

        if (catcherSquashTimer > 0) {
          const sw = CATCHER_WIDTH * 1.2;
          const sh = 54 * 0.8;
          ctx.drawImage(catcherImg, catcher.x - (sw - CATCHER_WIDTH) / 2, (catcher.y + 54) - sh, sw, sh);
        } else {
          ctx.drawImage(catcherImg, catcher.x, catcher.y, CATCHER_WIDTH, 54);
        }
      }

      // Visual FX
      for (const fx of visualEffects) {
        const p = Math.min(1, fx.elapsed / fx.duration);
        const size = fx.startSize + p * (fx.endSize - fx.startSize);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.drawImage(fx.img, fx.x - size / 2, fx.y - size / 2, size, size);
        ctx.restore();
      }

      if (redFlashTimer > 0) {
        ctx.fillStyle = 'rgba(225, 29, 72, 0.4)';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }

      ctx.restore(); // end shake

      // Floating texts
      for (const ft of floatingTexts) {
        const p = Math.min(1, ft.elapsed / ft.duration);
        const curY = ft.y - p * 40;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(ft.text, ft.x, curY);
        ctx.fillStyle = '#fde047';
        ctx.fillText(ft.text, ft.x, curY);
        ctx.restore();
      }

      // Top HUD: Score & Active Powerups
      ctx.save();
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(`Chemistry: ${gameStateRef.current.score}`, 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Chemistry: ${gameStateRef.current.score}`, 20, 20);

      // Power-up indicators under score
      let yOffset = 54;
      for (const effect in activePowerUps) {
        const p = activePowerUps[effect];
        const img = images[p.iconKey];
        if (img && img.complete) {
          ctx.drawImage(img, 20, yOffset, 24, 24);
          const barW = 50 * (p.timer / p.maxDuration);
          ctx.fillStyle = effect === 'double' ? '#fde047' : '#38bdf8';
          ctx.fillRect(50, yOffset + 8, barW, 8);
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(50, yOffset + 8, 50, 8);
          yOffset += 30;
        }
      }

      // Timer (Center)
      const sec = Math.ceil(Math.max(0, gameStateRef.current.timeLeft));
      if (images.clock && images.clock.complete) {
        ctx.drawImage(images.clock, WORLD_WIDTH / 2 - 36, 18, 26, 26);
      }
      ctx.textAlign = 'left';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(`${sec}s`, WORLD_WIDTH / 2 - 4, 20);
      ctx.fillStyle = sec <= 10 ? '#f43f5e' : '#ffffff';
      ctx.fillText(`${sec}s`, WORLD_WIDTH / 2 - 4, 20);

      // Lives (Hearts top-right)
      if (images.heart && images.heartEmpty) {
        for (let i = 0; i < 3; i++) {
          const hImg = i < gameStateRef.current.lives ? images.heart : images.heartEmpty;
          if (hImg.complete) {
            ctx.drawImage(hImg, WORLD_WIDTH - 110 + i * 30, 20, 24, 24);
          }
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onGameOver]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0c0c10] select-none touch-none rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Top Status Bar (De-AI-Slopped: Clean, minimal, no pulsating green hacker vibes) */}
      <div className="absolute top-3 z-20 flex items-center justify-between w-full max-w-[430px] px-4 py-1.5 text-xs bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-zinc-300">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="font-medium text-white/90">{activeDaterCount} daters online</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMute}
            className="p-1 rounded-full hover:bg-white/10 transition text-zinc-400 hover:text-white"
            title="Toggle Mute (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
          </button>
          <button
            onClick={togglePause}
            className="p-1 rounded-full hover:bg-white/10 transition text-zinc-400 hover:text-white"
            title="Pause (P)"
          >
            {isPaused ? <Play className="w-4 h-4 text-rose-400" /> : <Pause className="w-4 h-4 text-zinc-300" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex items-center justify-center w-full h-full max-w-[450px] max-h-[800px]">
        <canvas id="game-canvas" ref={canvasRef} className="block touch-none" />

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase">Paused</h2>
            <p className="mt-2 text-xs text-zinc-400">Press P or click resume</p>
            <button
              onClick={togglePause}
              className="mt-5 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 font-bold text-white text-xs uppercase tracking-wider transition shadow-lg"
            >
              Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
