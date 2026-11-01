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
  const [syncMetric, setSyncMetric] = useState(88);

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
    powerUpReactionLatencies: [] as number[],
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
    const BASKET_WIDTH = 110;
    const BASKET_SPEED = 420;
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
      background: '/assets/background.png',
      basket: '/assets/basket.png',
      heart: '/assets/heart.png',
      heartEmpty: '/assets/heart-empty.png',
      clock: '/assets/clock.png',
      star: '/assets/star.png',
      bomb: '/assets/bomb.png',
      lightning: '/assets/lightning.png',
      snowflake: '/assets/snowflake.png',
      sparkleBurst: '/assets/sparkle-burst.png',
      explosion: '/assets/explosion.png',
    };

    let loadedCount = 0;
    const totalAssets = Object.keys(assetSources).length;

    Object.entries(assetSources).forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        images[key] = img;
        loadedCount++;
      };
      img.src = src;
    });

    const basket = {
      x: (WORLD_WIDTH - BASKET_WIDTH) / 2,
      y: 710,
      height: 60,
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

    // Active entities
    interface ActiveItem {
      name: string;
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
      spawnedAt: number;
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
    const activePowerUps: Record<string, { timer: number; maxDuration: number; icon: string }> = {};

    let spawnTimer = 0;
    let redFlashTimer = 0;
    let shakeTimer = 0;
    let basketSquashTimer = 0;

    const ITEMS_DEF = [
      { name: 'star', points: 10, type: 'good' as const, width: 56, weight: 70 },
      { name: 'bomb', points: 0, type: 'bad' as const, width: 60, weight: 30 },
      { name: 'lightning', points: 0, type: 'power' as const, effect: 'double', duration: 5, width: 58, weight: 6 },
      { name: 'snowflake', points: 0, type: 'power' as const, effect: 'slow', duration: 4, width: 58, weight: 6 },
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

      const img = images[def.name];
      const aspect = img && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
      const height = def.width * aspect;
      const x = Math.random() * (WORLD_WIDTH - def.width);
      const speed = 180 + Math.random() * 80;

      if (def.type === 'power') {
        gameStateRef.current.powerUpSpawnTimes.push(Date.now());
      }

      activeItems.push({
        name: def.name,
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
        rotationSpeed: def.name === 'star' ? (Math.random() - 0.5) * 2 : 0,
        wobblePhase: Math.random() * Math.PI * 2,
        spawnedAt: Date.now(),
      });
    };

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!isRunning) return;

      let dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      if (dt > MAX_DELTA_TIME) dt = MAX_DELTA_TIME;

      // Update if not paused
      if (!gameStateRef.current.isPaused && !gameStateRef.current.isOver) {
        gameStateRef.current.timeLeft -= dt;

        if (shakeTimer > 0) shakeTimer -= dt;
        if (redFlashTimer > 0) redFlashTimer -= dt;
        if (basketSquashTimer > 0) basketSquashTimer -= dt;

        // Telemetry interval tracking
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

        // Move basket
        if (keys.left) basket.x -= BASKET_SPEED * dt;
        if (keys.right) basket.x += BASKET_SPEED * dt;

        if (isPointerDown) {
          const targetX = pointerWorldX - BASKET_WIDTH / 2;
          basket.x += (targetX - basket.x) * (1 - Math.exp(-POINTER_LERP_SPEED * dt));
        }

        basket.x = Math.max(0, Math.min(WORLD_WIDTH - BASKET_WIDTH, basket.x));

        // Spawning
        spawnTimer += dt;
        if (spawnTimer >= currentSpawnInterval) {
          spawnTimer -= currentSpawnInterval;
          spawnItem();
        }

        // Collision logic with 70% hitboxes
        const basketHitbox = {
          x: basket.x + BASKET_WIDTH * 0.15,
          y: basket.y + basket.height * 0.15,
          w: BASKET_WIDTH * 0.7,
          h: basket.height * 0.7,
        };

        for (let i = activeItems.length - 1; i >= 0; i--) {
          const item = activeItems[i];
          item.y += item.speed * currentSpeedMult * slowFactor * dt;

          let wobbleX = 0;
          if (item.name === 'star') {
            item.rotation += item.rotationSpeed * slowFactor * dt;
          } else if (item.name === 'bomb') {
            item.wobblePhase += dt * 7 * slowFactor;
            wobbleX = Math.sin(item.wobblePhase) * 10;
            item.rotation = Math.sin(item.wobblePhase) * 0.15;

            // Graze distance tracking
            const dist = Math.hypot(basket.x + BASKET_WIDTH / 2 - (item.x + item.width / 2 + wobbleX), basket.y - item.y);
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
            basketHitbox.x < itemHitbox.x + itemHitbox.w &&
            basketHitbox.x + basketHitbox.w > itemHitbox.x &&
            basketHitbox.y < itemHitbox.y + itemHitbox.h &&
            basketHitbox.y + basketHitbox.h > itemHitbox.y;

          if (overlap) {
            basketSquashTimer = 0.1;
            const cx = visualX + item.width / 2;
            const cy = item.y + item.height / 2;

            if (item.type === 'good') {
              const pts = item.points * (isDouble ? 2 : 1);
              gameStateRef.current.score += pts;
              sound.playCatch();
              setSyncMetric((prev) => Math.min(99, prev + 1));

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
                text: `+${pts} Rizz`,
                x: cx,
                y: cy,
                duration: 0.7,
                elapsed: 0,
              });
            } else if (item.type === 'bad') {
              gameStateRef.current.lives = Math.max(0, gameStateRef.current.lives - 1);
              redFlashTimer = 0.2;
              shakeTimer = 0.25;
              sound.playBomb();
              setSyncMetric((prev) => Math.max(65, prev - 4));

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
                icon: item.name,
              };
              sound.playPowerUp();
              setSyncMetric((prev) => Math.min(99, prev + 3));

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

          // Compute final telemetry
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

      // Draw background
      if (images.background) {
        const cw = WORLD_WIDTH;
        const ch = WORLD_HEIGHT;
        const iw = images.background.naturalWidth;
        const ih = images.background.naturalHeight;
        const scale = Math.max(cw / iw, ch / ih);
        const rw = iw * scale;
        const rh = ih * scale;
        ctx.drawImage(images.background, (cw - rw) / 2, (ch - rh) / 2, rw, rh);
      }

      // Draw items
      for (const item of activeItems) {
        const img = images[item.name];
        if (!img) continue;
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(item.rotation);
        ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
      }

      // Draw basket
      if (images.basket) {
        const aspect = images.basket.naturalHeight / images.basket.naturalWidth;
        const baseH = BASKET_WIDTH * aspect;
        basket.height = baseH;
        basket.y = WORLD_HEIGHT - 30 - baseH;

        if (basketSquashTimer > 0) {
          const sw = BASKET_WIDTH * 1.22;
          const sh = baseH * 0.78;
          ctx.drawImage(images.basket, basket.x - (sw - BASKET_WIDTH) / 2, (basket.y + baseH) - sh, sw, sh);
        } else {
          ctx.drawImage(images.basket, basket.x, basket.y, BASKET_WIDTH, baseH);
        }
      }

      // Draw visual FX
      for (const fx of visualEffects) {
        const p = Math.min(1, fx.elapsed / fx.duration);
        const size = fx.startSize + p * (fx.endSize - fx.startSize);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.drawImage(fx.img, fx.x - size / 2, fx.y - size / 2, size, size);
        ctx.restore();
      }

      if (redFlashTimer > 0) {
        ctx.fillStyle = 'rgba(255, 45, 85, 0.4)';
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
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(ft.text, ft.x, curY);
        ctx.fillStyle = '#ffea00';
        ctx.fillText(ft.text, ft.x, curY);
        ctx.restore();
      }

      // Top HUD: Score & Active Powerups
      ctx.save();
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(`Rizz: ${gameStateRef.current.score}`, 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Rizz: ${gameStateRef.current.score}`, 20, 20);

      // Power-up indicators under score
      let yOffset = 56;
      for (const effect in activePowerUps) {
        const p = activePowerUps[effect];
        const img = images[p.icon];
        if (img) {
          ctx.drawImage(img, 20, yOffset, 24, 24);
          const barW = 50 * (p.timer / p.maxDuration);
          ctx.fillStyle = effect === 'double' ? '#ffea00' : '#00e5ff';
          ctx.fillRect(50, yOffset + 8, barW, 8);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(50, yOffset + 8, 50, 8);
          yOffset += 30;
        }
      }

      // Timer (Center)
      const sec = Math.ceil(Math.max(0, gameStateRef.current.timeLeft));
      if (images.clock) {
        ctx.drawImage(images.clock, WORLD_WIDTH / 2 - 38, 20, 28, 28);
      }
      ctx.textAlign = 'left';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(`${sec}s`, WORLD_WIDTH / 2 - 4, 22);
      ctx.fillStyle = sec <= 10 ? '#ff2d55' : '#ffffff';
      ctx.fillText(`${sec}s`, WORLD_WIDTH / 2 - 4, 22);

      // Lives (Hearts top-right)
      if (images.heart && images.heartEmpty) {
        for (let i = 0; i < 3; i++) {
          const hImg = i < gameStateRef.current.lives ? images.heart : images.heartEmpty;
          ctx.drawImage(hImg, WORLD_WIDTH - 120 + i * 32, 20, 28, 28);
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
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0b0b0e] select-none touch-none">
      {/* Top Telemetry Radar Bar */}
      <div className="absolute top-2 z-20 flex items-center justify-between w-full max-w-[450px] px-4 py-1 text-xs glass-panel rounded-full border border-white/10 shadow-lg">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-400 font-medium">{activeDaterCount} Daters Online</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-white/60">Sync Frequency:</span>
          <span className="text-[#ff2d55] font-bold">{syncMetric}%</span>
          <button
            onClick={toggleMute}
            className="p-1 rounded-full hover:bg-white/10 transition text-white/80"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={togglePause}
            className="p-1 rounded-full hover:bg-white/10 transition text-white/80"
            title="Pause Game (P)"
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-white/80" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex items-center justify-center w-full h-full max-w-[450px] max-h-[800px]">
        <canvas id="game-canvas" ref={canvasRef} className="block shadow-2xl rounded-xl touch-none" />

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm rounded-xl">
            <h2 className="text-3xl font-black text-white glow-pink tracking-wider">PAUSED</h2>
            <p className="mt-2 text-sm text-[#ffea00] font-medium">Press P or click Resume to continue</p>
            <button
              onClick={togglePause}
              className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#ff2d55] to-[#ff375f] font-bold text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition"
            >
              Resume Dating
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
