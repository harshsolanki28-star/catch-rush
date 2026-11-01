// HOW TO CUSTOMISE: change CONFIG only. Swap images in /assets with the same file names, or change the paths in CONFIG.ASSETS.

const CONFIG = {
  // BRAND: Title, tagline, typography, and theme colours
  BRAND: {
    title: "Catch Rush", // Game title displayed on start badge
    tagline: "Catch the stars. Dodge the bombs.", // Subtitle displayed under logo badge
    fontFamily: "system-ui, -apple-system, sans-serif", // Font family used across all game text
    mainColor: "#ffffff", // Primary text and UI element colour
    accentColor: "#ffea00", // Accent highlight and badge text colour
  },

  // PLAYER: Basket visual dimensions and movement responsiveness
  PLAYER: {
    img: "assets/basket.png", // Basket sprite asset path
    width: 110, // Basket width in pixels
    bottomOffset: 30, // Distance from bottom edge of canvas in pixels
    speed: 420, // Keyboard movement speed in pixels per second
    pointerLerpSpeed: 20, // Smoothing speed factor for gliding to pointer position
  },

  // ITEMS: Full catalog of collectible stars, hazard bombs, and power-up drops
  ITEMS: [
    { name: "star", img: "assets/star.png", width: 56, points: 10, type: "good", weight: 70 },
    { name: "bomb", img: "assets/bomb.png", width: 60, points: 0,  type: "bad",  weight: 30 },
    { name: "lightning", img: "assets/lightning.png", width: 58, type: "power", effect: "double", duration: 5, weight: 5 },
    { name: "snowflake", img: "assets/snowflake.png", width: 58, type: "power", effect: "slow", duration: 4, weight: 5 },
  ],

  // RULES: Core game mechanics, round duration, spawn pacing, and collision hitboxes
  RULES: {
    worldWidth: 450, // Virtual game world width in pixels
    worldHeight: 800, // Virtual game world height in pixels
    maxDeltaTime: 0.05, // Maximum delta time in seconds to prevent position jumps
    lives: 3, // Initial player lives
    roundSeconds: 45, // Total duration of each round in seconds
    spawnIntervalStart: 0.8, // Initial spawn interval at round start in seconds
    spawnIntervalEnd: 0.4, // Final spawn interval at round end in seconds
    fallSpeedMin: 180, // Minimum item base falling speed in pixels per second
    fallSpeedMax: 260, // Maximum item base falling speed in pixels per second
    fallSpeedMultiplierStart: 1.0, // Initial fall speed multiplier at round start
    fallSpeedMultiplierEnd: 1.4, // Final fall speed multiplier at round end (40% increase)
    hitboxScale: 0.7, // Shrunk hitbox scale (70%) for fair collisions
    flashDuration: 0.2, // Red screen flash duration in seconds when catching a bad item
    shakeDuration: 0.25, // Duration of screen shake on bomb catch in seconds
  },

  // POWER_UPS: Multipliers and modifiers applied during active power-ups
  POWER_UPS: {
    doubleFactor: 2, // Multiplier for points during double power-up
    slowFactor: 0.5, // Multiplier for item speed during slow power-up
  },

  // ASSETS: Central registry of all image assets used across the game
  ASSETS: {
    background: "assets/background.png",
    basket: "assets/basket.png",
    heart: "assets/heart.png",
    heartEmpty: "assets/heart-empty.png",
    clock: "assets/clock.png",
    sparkleBurst: "assets/sparkle-burst.png",
    explosion: "assets/explosion.png",
    logoBadge: "assets/logo-badge.png",
    playButton: "assets/play-button.png",
    restartButton: "assets/restart-button.png",
    trophy: "assets/trophy.png",
  },
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let dpr = window.devicePixelRatio || 1;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const worldAspect = CONFIG.RULES.worldWidth / CONFIG.RULES.worldHeight;

  let displayWidth;
  let displayHeight;

  if (windowWidth / windowHeight < worldAspect) {
    displayWidth = windowWidth;
    displayHeight = windowWidth / worldAspect;
  } else {
    displayHeight = windowHeight;
    displayWidth = windowHeight * worldAspect;
  }

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  canvas.width = Math.round(CONFIG.RULES.worldWidth * dpr);
  canvas.height = Math.round(CONFIG.RULES.worldHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function renderLoading() {
  ctx.save();
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, CONFIG.RULES.worldWidth, CONFIG.RULES.worldHeight);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.font = `24px ${CONFIG.BRAND.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Loading...', CONFIG.RULES.worldWidth / 2, CONFIG.RULES.worldHeight / 2);
  ctx.restore();
}

renderLoading();

const images = {};

// Game state: "start" | "playing" | "paused" | "over"
let state = 'start';
let gameOverReason = '';
let score = 0;
let lives = CONFIG.RULES.lives;
let timeLeft = CONFIG.RULES.roundSeconds;
let isNewBest = false;
let redFlashTimer = 0;
let shakeTimer = 0;
let spawnTimer = 0;
let basketSquashTimer = 0;

const activeItems = [];
const startDecorations = [];
let activePowerUps = {};
const visualEffects = [];
const floatingTexts = [];

// Audio via Web Audio API
let audioCtx = null;
let isMuted = false;

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playCatchSound() {
  if (isMuted || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (err) {}
}

function playBombSound() {
  if (isMuted || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (err) {}
}

function playPowerUpSound() {
  if (isMuted || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    [523.25, 783.99].forEach((freq, idx) => {
      const noteTime = now + idx * 0.1;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });
  } catch (err) {}
}

function playGameOverSound() {
  if (isMuted || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    [440, 370, 293.66].forEach((freq, idx) => {
      const noteTime = now + idx * 0.14;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  } catch (err) {}
}

function getBestScore() {
  try {
    return parseInt(localStorage.getItem('catch_rush_best_score'), 10) || 0;
  } catch (err) {
    return 0;
  }
}

function saveBestScore(val) {
  try {
    localStorage.setItem('catch_rush_best_score', val);
  } catch (err) {}
}

let bestScore = getBestScore();

const basket = {
  x: (CONFIG.RULES.worldWidth - CONFIG.PLAYER.width) / 2,
  y: 0,
  height: 0,
};

const keys = {
  left: false,
  right: false,
};

let isPointerDown = false;
let pointerWorldX = CONFIG.RULES.worldWidth / 2;
let pointerWorldY = 0;

// Interactive UI regions
const playBtnCenter = { x: CONFIG.RULES.worldWidth / 2, y: 460, radius: 65 };
const restartBtnRect = { x: (CONFIG.RULES.worldWidth - 100) / 2, y: 520, w: 100, h: 100 };
const menuBtnRect = { x: (CONFIG.RULES.worldWidth - 140) / 2, y: 640, w: 140, h: 40 };
const muteBtn = { x: CONFIG.RULES.worldWidth - 48, y: CONFIG.RULES.worldHeight - 48, w: 38, h: 38 };

function updatePointerPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CONFIG.RULES.worldWidth / rect.width;
  const scaleY = CONFIG.RULES.worldHeight / rect.height;
  pointerWorldX = (e.clientX - rect.left) * scaleX;
  pointerWorldY = (e.clientY - rect.top) * scaleY;
}

function startRound() {
  score = 0;
  lives = CONFIG.RULES.lives;
  timeLeft = CONFIG.RULES.roundSeconds;
  isNewBest = false;
  activeItems.length = 0;
  activePowerUps = {};
  visualEffects.length = 0;
  floatingTexts.length = 0;
  spawnTimer = 0;
  redFlashTimer = 0;
  shakeTimer = 0;
  basketSquashTimer = 0;
  state = 'playing';
  basket.x = (CONFIG.RULES.worldWidth - CONFIG.PLAYER.width) / 2;
  keys.left = false;
  keys.right = false;
}

function endGame(reason) {
  state = 'over';
  gameOverReason = reason;
  isPointerDown = false;
  playGameOverSound();
  if (score > bestScore) {
    bestScore = score;
    isNewBest = true;
    saveBestScore(bestScore);
  } else {
    isNewBest = false;
  }
}

canvas.addEventListener('pointerdown', (e) => {
  initAudio();
  updatePointerPosition(e);

  // Mute button tap
  if (
    pointerWorldX >= muteBtn.x &&
    pointerWorldX <= muteBtn.x + muteBtn.w &&
    pointerWorldY >= muteBtn.y &&
    pointerWorldY <= muteBtn.y + muteBtn.h
  ) {
    isMuted = !isMuted;
    return;
  }

  // Start screen play button
  if (state === 'start') {
    const dist = Math.hypot(pointerWorldX - playBtnCenter.x, pointerWorldY - playBtnCenter.y);
    if (dist <= playBtnCenter.radius) {
      startRound();
      return;
    }
  }

  // Paused screen tap to continue
  if (state === 'paused') {
    state = 'playing';
    return;
  }

  // Game over screen buttons
  if (state === 'over') {
    if (
      pointerWorldX >= restartBtnRect.x &&
      pointerWorldX <= restartBtnRect.x + restartBtnRect.w &&
      pointerWorldY >= restartBtnRect.y &&
      pointerWorldY <= restartBtnRect.y + restartBtnRect.h
    ) {
      startRound();
      return;
    }

    if (
      pointerWorldX >= menuBtnRect.x &&
      pointerWorldX <= menuBtnRect.x + menuBtnRect.w &&
      pointerWorldY >= menuBtnRect.y &&
      pointerWorldY <= menuBtnRect.y + menuBtnRect.h
    ) {
      state = 'start';
      return;
    }
  }

  if (state === 'playing') {
    isPointerDown = true;
    canvas.setPointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (isPointerDown) {
    updatePointerPosition(e);
  }
});

function onPointerUp(e) {
  isPointerDown = false;
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch (err) {}
}

canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);

window.addEventListener('keydown', (e) => {
  initAudio();

  if (e.code === 'KeyM') {
    isMuted = !isMuted;
    return;
  }

  if (e.code === 'KeyP') {
    if (state === 'playing') {
      state = 'paused';
    } else if (state === 'paused') {
      state = 'playing';
    }
    return;
  }

  if (state === 'start') {
    if (e.code === 'Space' || e.code === 'Enter') {
      startRound();
      return;
    }
  }

  if (state === 'paused') {
    state = 'playing';
    return;
  }

  if (state === 'over') {
    if (e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter') {
      startRound();
      return;
    }
  }

  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = true;
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = false;
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = false;
  }
});

window.addEventListener('blur', () => {
  if (state === 'playing') {
    state = 'paused';
  }
});

function preloadImages(sources, onComplete) {
  const keysList = Object.keys(sources);
  let loadedCount = 0;
  let hasFailed = false;

  keysList.forEach((key) => {
    const src = sources[key];
    const img = new Image();

    img.onload = () => {
      images[key] = img;
      loadedCount++;
      if (loadedCount === keysList.length && !hasFailed) {
        onComplete();
      }
    };

    img.onerror = () => {
      hasFailed = true;
      console.error(`Failed to load image: ${src}`);
    };

    img.src = src;
  });
}

function initGame() {
  const basketImg = images.basket;
  const basketAspect = basketImg.naturalHeight / basketImg.naturalWidth;
  basket.height = CONFIG.PLAYER.width * basketAspect;
  basket.y = CONFIG.RULES.worldHeight - CONFIG.PLAYER.bottomOffset - basket.height;
  basket.x = (CONFIG.RULES.worldWidth - CONFIG.PLAYER.width) / 2;

  let lastTime = performance.now();

  function gameLoop(currentTime) {
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (dt > CONFIG.RULES.maxDeltaTime) {
      dt = CONFIG.RULES.maxDeltaTime;
    }

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    gameLoop(time);
  });
}

function chooseRandomItemDef() {
  const totalWeight = CONFIG.ITEMS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of CONFIG.ITEMS) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return CONFIG.ITEMS[0];
}

function spawnItem() {
  const def = chooseRandomItemDef();
  const img = images[def.name];
  const aspect = img.naturalHeight / img.naturalWidth;
  const height = def.width * aspect;
  const x = Math.random() * (CONFIG.RULES.worldWidth - def.width);
  const y = -height;
  const speed = CONFIG.RULES.fallSpeedMin + Math.random() * (CONFIG.RULES.fallSpeedMax - CONFIG.RULES.fallSpeedMin);

  activeItems.push({
    def,
    x,
    y,
    width: def.width,
    height,
    speed,
    rotation: 0,
    rotationSpeed: def.name === 'star' ? (Math.random() < 0.5 ? 1 : -1) * (1.8 + Math.random() * 0.8) : 0,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleX: 0,
  });
}

function checkOverlap(r1, r2) {
  return (
    r1.x < r2.x + r2.w &&
    r1.x + r1.w > r2.x &&
    r1.y < r2.y + r2.h &&
    r1.y + r1.h > r2.y
  );
}

function update(dt) {
  if (state === 'start') {
    // Gentle decorative items falling in the background
    if (startDecorations.length < 5 && Math.random() < 0.035) {
      const isStar = Math.random() < 0.7;
      const name = isStar ? 'star' : 'bomb';
      const width = isStar ? 50 : 54;
      const img = images[name];
      const aspect = img ? img.naturalHeight / img.naturalWidth : 1;
      startDecorations.push({
        name,
        x: Math.random() * (CONFIG.RULES.worldWidth - width),
        y: -width * aspect,
        width,
        height: width * aspect,
        speed: 90 + Math.random() * 50,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 1.5,
      });
    }

    for (let i = startDecorations.length - 1; i >= 0; i--) {
      const dec = startDecorations[i];
      dec.y += dec.speed * dt;
      dec.rotation += dec.rotationSpeed * dt;
      if (dec.y > CONFIG.RULES.worldHeight + 40) {
        startDecorations.splice(i, 1);
      }
    }
    return;
  }

  if (state === 'paused') {
    return;
  }

  if (shakeTimer > 0) {
    shakeTimer -= dt;
  }
  if (redFlashTimer > 0) {
    redFlashTimer -= dt;
  }
  if (basketSquashTimer > 0) {
    basketSquashTimer -= dt;
  }

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

  if (state !== 'playing') {
    return;
  }

  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    endGame("Time's up!");
    return;
  }

  const progress = Math.min(1, Math.max(0, 1 - timeLeft / CONFIG.RULES.roundSeconds));
  const currentSpawnInterval = CONFIG.RULES.spawnIntervalStart + progress * (CONFIG.RULES.spawnIntervalEnd - CONFIG.RULES.spawnIntervalStart);
  const currentSpeedMult = CONFIG.RULES.fallSpeedMultiplierStart + progress * (CONFIG.RULES.fallSpeedMultiplierEnd - CONFIG.RULES.fallSpeedMultiplierStart);

  for (const effect in activePowerUps) {
    activePowerUps[effect].timer -= dt;
    if (activePowerUps[effect].timer <= 0) {
      delete activePowerUps[effect];
    }
  }

  const isDoublePoints = !!(activePowerUps['double'] && activePowerUps['double'].timer > 0);
  const isSlowMotion = !!(activePowerUps['slow'] && activePowerUps['slow'].timer > 0);
  const slowFactor = isSlowMotion ? CONFIG.POWER_UPS.slowFactor : 1.0;

  if (keys.left) {
    basket.x -= CONFIG.PLAYER.speed * dt;
  }
  if (keys.right) {
    basket.x += CONFIG.PLAYER.speed * dt;
  }

  if (isPointerDown) {
    const targetX = pointerWorldX - CONFIG.PLAYER.width / 2;
    basket.x += (targetX - basket.x) * (1 - Math.exp(-CONFIG.PLAYER.pointerLerpSpeed * dt));
  }

  basket.x = Math.max(0, Math.min(CONFIG.RULES.worldWidth - CONFIG.PLAYER.width, basket.x));

  spawnTimer += dt;
  if (spawnTimer >= currentSpawnInterval) {
    spawnTimer -= currentSpawnInterval;
    spawnItem();
  }

  const basketHitbox = {
    x: basket.x + (CONFIG.PLAYER.width * (1 - CONFIG.RULES.hitboxScale)) / 2,
    y: basket.y + (basket.height * (1 - CONFIG.RULES.hitboxScale)) / 2,
    w: CONFIG.PLAYER.width * CONFIG.RULES.hitboxScale,
    h: basket.height * CONFIG.RULES.hitboxScale,
  };

  for (let i = activeItems.length - 1; i >= 0; i--) {
    const item = activeItems[i];
    item.y += item.speed * currentSpeedMult * slowFactor * dt;

    if (item.def.name === 'star') {
      item.rotation += item.rotationSpeed * slowFactor * dt;
    } else if (item.def.name === 'bomb') {
      item.wobblePhase += dt * 7 * slowFactor;
      item.wobbleX = Math.sin(item.wobblePhase) * 10;
      item.rotation = Math.sin(item.wobblePhase) * 0.15;
    }

    if (item.y > CONFIG.RULES.worldHeight) {
      activeItems.splice(i, 1);
      continue;
    }

    const visualX = item.x + item.wobbleX;
    const itemHitbox = {
      x: visualX + (item.width * (1 - CONFIG.RULES.hitboxScale)) / 2,
      y: item.y + (item.height * (1 - CONFIG.RULES.hitboxScale)) / 2,
      w: item.width * CONFIG.RULES.hitboxScale,
      h: item.height * CONFIG.RULES.hitboxScale,
    };

    if (checkOverlap(basketHitbox, itemHitbox)) {
      basketSquashTimer = 0.1;
      const cx = visualX + item.width / 2;
      const cy = item.y + item.height / 2;

      if (item.def.type === 'good') {
        const pts = item.def.points * (isDoublePoints ? CONFIG.POWER_UPS.doubleFactor : 1);
        score += pts;
        playCatchSound();
        visualEffects.push({
          img: images.sparkleBurst,
          x: cx,
          y: cy,
          startSize: 40,
          endSize: 90,
          duration: 0.35,
          elapsed: 0,
        });
        floatingTexts.push({
          text: `+${pts}`,
          x: cx,
          y: cy,
          duration: 0.7,
          elapsed: 0,
        });
      } else if (item.def.type === 'bad') {
        lives = Math.max(0, lives - 1);
        redFlashTimer = CONFIG.RULES.flashDuration;
        shakeTimer = CONFIG.RULES.shakeDuration;
        playBombSound();
        visualEffects.push({
          img: images.explosion,
          x: cx,
          y: cy,
          startSize: 60,
          endSize: 120,
          duration: 0.4,
          elapsed: 0,
        });
        if (lives <= 0) {
          endGame('Out of lives!');
        }
      } else if (item.def.type === 'power') {
        activePowerUps[item.def.effect] = {
          timer: item.def.duration,
          maxDuration: item.def.duration,
          iconName: item.def.name,
        };
        playPowerUpSound();
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
      activeItems.splice(i, 1);
    }
  }
}

function drawBackground() {
  const img = images.background;
  if (!img) return;
  const cw = CONFIG.RULES.worldWidth;
  const ch = CONFIG.RULES.worldHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih);
  const rw = iw * scale;
  const rh = ih * scale;
  const rx = (cw - rw) / 2;
  const ry = (ch - rh) / 2;

  ctx.drawImage(img, rx, ry, rw, rh);
}

function drawItems() {
  for (const item of activeItems) {
    const img = images[item.def.name];
    if (!img) continue;
    const centerX = item.x + item.width / 2 + item.wobbleX;
    const centerY = item.y + item.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(item.rotation);
    ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
    ctx.restore();
  }
}

function drawBasket() {
  const img = images.basket;
  if (!img) return;
  if (basketSquashTimer > 0) {
    const scaleX = 1.22;
    const scaleY = 0.78;
    const squashW = CONFIG.PLAYER.width * scaleX;
    const squashH = basket.height * scaleY;
    const drawX = basket.x - (squashW - CONFIG.PLAYER.width) / 2;
    const drawY = (basket.y + basket.height) - squashH;
    ctx.drawImage(img, drawX, drawY, squashW, squashH);
  } else {
    ctx.drawImage(img, basket.x, basket.y, CONFIG.PLAYER.width, basket.height);
  }
}

function drawVisualEffects() {
  for (const fx of visualEffects) {
    if (!fx.img) continue;
    const p = Math.min(1, fx.elapsed / fx.duration);
    const size = fx.startSize + p * (fx.endSize - fx.startSize);
    const alpha = Math.max(0, 1 - p);
    const aspect = fx.img.naturalHeight / fx.img.naturalWidth;
    const h = size * aspect;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(fx.img, fx.x - size / 2, fx.y - h / 2, size, h);
    ctx.restore();
  }
}

function drawFloatingTexts() {
  for (const ft of floatingTexts) {
    const p = Math.min(1, ft.elapsed / ft.duration);
    const currentY = ft.y - p * 40;
    const alpha = Math.max(0, 1 - p);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold 26px ${CONFIG.BRAND.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(ft.text, ft.x, currentY);
    ctx.fillStyle = CONFIG.BRAND.accentColor;
    ctx.fillText(ft.text, ft.x, currentY);
    ctx.restore();
  }
}

function drawPowerUps() {
  const activeEffects = Object.keys(activePowerUps);
  if (activeEffects.length === 0) return;

  let yOffset = 58;
  for (const effect of activeEffects) {
    const p = activePowerUps[effect];
    if (p.timer <= 0) continue;
    const img = images[p.iconName];
    if (!img) continue;

    const iconSize = 28;
    const barWidth = 60;
    const barHeight = 8;
    const currentBarW = Math.max(0, barWidth * (p.timer / p.maxDuration));

    ctx.drawImage(img, 20, yOffset, iconSize, iconSize);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(20 + iconSize + 6, yOffset + 10, barWidth, barHeight);

    ctx.fillStyle = effect === 'double' ? CONFIG.BRAND.accentColor : '#00e5ff';
    ctx.fillRect(20 + iconSize + 6, yOffset + 10, currentBarW, barHeight);

    ctx.strokeStyle = CONFIG.BRAND.mainColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(20 + iconSize + 6, yOffset + 10, barWidth, barHeight);
    ctx.restore();

    yOffset += 34;
  }
}

function drawScore() {
  ctx.save();
  ctx.font = `bold 28px ${CONFIG.BRAND.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const scoreText = `Score: ${score}`;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(scoreText, 20, 20);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.fillText(scoreText, 20, 20);
  ctx.restore();
}

function drawTimer() {
  const clockImg = images.clock;
  if (!clockImg) return;

  const clockWidth = 30;
  const clockAspect = clockImg.naturalHeight / clockImg.naturalWidth;
  const clockHeight = clockWidth * clockAspect;
  const sec = Math.ceil(timeLeft);
  const timeText = `${sec}`;

  ctx.save();
  ctx.font = `bold 26px ${CONFIG.BRAND.fontFamily}`;
  const textWidth = ctx.measureText(timeText).width;
  const gap = 8;
  const totalWidth = clockWidth + gap + textWidth;
  const startX = (CONFIG.RULES.worldWidth - totalWidth) / 2;
  const startY = 20;

  ctx.drawImage(clockImg, startX, startY + (28 - clockHeight) / 2, clockWidth, clockHeight);

  const textX = startX + clockWidth + gap + textWidth / 2;
  const textY = startY + 14;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (sec <= 10 && state === 'playing') {
    const pulse = 1 + 0.16 * Math.sin(performance.now() / 1000 * 9);
    ctx.translate(textX, textY);
    ctx.scale(pulse, pulse);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(timeText, 0, 0);
    ctx.fillStyle = '#ff3333';
    ctx.fillText(timeText, 0, 0);
  } else {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(timeText, textX, textY);
    ctx.fillStyle = sec <= 10 ? '#ff3333' : CONFIG.BRAND.mainColor;
    ctx.fillText(timeText, textX, textY);
  }

  ctx.restore();
}

function drawLives() {
  const heartImg = images.heart;
  const heartEmptyImg = images.heartEmpty;
  if (!heartImg || !heartEmptyImg) return;

  const heartWidth = 34;
  const heartAspect = heartImg.naturalHeight / heartImg.naturalWidth;
  const heartHeight = heartWidth * heartAspect;
  const gap = 6;
  const totalWidth = CONFIG.RULES.lives * heartWidth + (CONFIG.RULES.lives - 1) * gap;
  const startX = CONFIG.RULES.worldWidth - 20 - totalWidth;
  const startY = 20;

  for (let i = 0; i < CONFIG.RULES.lives; i++) {
    const img = i < lives ? heartImg : heartEmptyImg;
    ctx.drawImage(img, startX + i * (heartWidth + gap), startY, heartWidth, heartHeight);
  }
}

function drawMuteButton() {
  ctx.save();
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isMuted ? '🔇' : '🔊', muteBtn.x + muteBtn.w / 2, muteBtn.y + muteBtn.h / 2);
  ctx.restore();
}

function drawStartScreen() {
  drawBackground();

  // Draw decorative falling stars and bombs
  for (const dec of startDecorations) {
    const img = images[dec.name];
    if (!img) continue;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.translate(dec.x + dec.width / 2, dec.y + dec.height / 2);
    ctx.rotate(dec.rotation);
    ctx.drawImage(img, -dec.width / 2, -dec.height / 2, dec.width, dec.height);
    ctx.restore();
  }

  // Logo badge (340 px wide) in upper third
  const badgeImg = images.logoBadge;
  if (badgeImg) {
    const badgeW = 340;
    const badgeAspect = badgeImg.naturalHeight / badgeImg.naturalWidth;
    const badgeH = badgeW * badgeAspect;
    const badgeX = (CONFIG.RULES.worldWidth - badgeW) / 2;
    const badgeY = 120;
    ctx.drawImage(badgeImg, badgeX, badgeY, badgeW, badgeH);

    // Title written on badge
    ctx.save();
    ctx.font = `bold 36px ${CONFIG.BRAND.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(CONFIG.BRAND.title, CONFIG.RULES.worldWidth / 2, badgeY + badgeH / 2);
    ctx.fillStyle = CONFIG.BRAND.accentColor;
    ctx.fillText(CONFIG.BRAND.title, CONFIG.RULES.worldWidth / 2, badgeY + badgeH / 2);
    ctx.restore();

    // Tagline underneath badge
    ctx.save();
    ctx.font = `bold 16px ${CONFIG.BRAND.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(CONFIG.BRAND.tagline, CONFIG.RULES.worldWidth / 2, badgeY + badgeH + 28);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText(CONFIG.BRAND.tagline, CONFIG.RULES.worldWidth / 2, badgeY + badgeH + 28);
    ctx.restore();
  }

  // Play button (120 px wide) pulsing between 1.0 and 1.08
  const playImg = images.playButton;
  if (playImg) {
    const playW = 120;
    const playAspect = playImg.naturalHeight / playImg.naturalWidth;
    const playH = playW * playAspect;
    const pulse = 1.0 + 0.04 * (1 + Math.sin(performance.now() / 1000 * 3));

    ctx.save();
    ctx.translate(playBtnCenter.x, playBtnCenter.y);
    ctx.scale(pulse, pulse);
    ctx.drawImage(playImg, -playW / 2, -playH / 2, playW, playH);
    ctx.restore();
  }

  // How to play hint
  ctx.save();
  ctx.font = `14px ${CONFIG.BRAND.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('Move: arrows / drag • Catch stars • Dodge bombs', CONFIG.RULES.worldWidth / 2, CONFIG.RULES.worldHeight - 50);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.fillText('Move: arrows / drag • Catch stars • Dodge bombs', CONFIG.RULES.worldWidth / 2, CONFIG.RULES.worldHeight - 50);
  ctx.restore();

  drawMuteButton();
}

function drawPausedScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(0, 0, CONFIG.RULES.worldWidth, CONFIG.RULES.worldHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `bold 40px ${CONFIG.BRAND.fontFamily}`;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('PAUSED', CONFIG.RULES.worldWidth / 2, 360);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.fillText('PAUSED', CONFIG.RULES.worldWidth / 2, 360);

  ctx.font = `bold 18px ${CONFIG.BRAND.fontFamily}`;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('Press P or tap to continue', CONFIG.RULES.worldWidth / 2, 415);
  ctx.fillStyle = CONFIG.BRAND.accentColor;
  ctx.fillText('Press P or tap to continue', CONFIG.RULES.worldWidth / 2, 415);

  ctx.restore();
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(0, 0, CONFIG.RULES.worldWidth, CONFIG.RULES.worldHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `bold 40px ${CONFIG.BRAND.fontFamily}`;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('GAME OVER', CONFIG.RULES.worldWidth / 2, 110);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.fillText('GAME OVER', CONFIG.RULES.worldWidth / 2, 110);

  ctx.font = `bold 20px ${CONFIG.BRAND.fontFamily}`;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(gameOverReason, CONFIG.RULES.worldWidth / 2, 155);
  ctx.fillStyle = CONFIG.BRAND.accentColor;
  ctx.fillText(gameOverReason, CONFIG.RULES.worldWidth / 2, 155);

  // Trophy (90 px wide)
  const trophyImg = images.trophy;
  let trophyBottom = 280;
  if (trophyImg) {
    const trophyW = 90;
    const trophyAspect = trophyImg.naturalHeight / trophyImg.naturalWidth;
    const trophyH = trophyW * trophyAspect;
    const trophyX = (CONFIG.RULES.worldWidth - trophyW) / 2;
    const trophyY = 190;
    ctx.drawImage(trophyImg, trophyX, trophyY, trophyW, trophyH);
    trophyBottom = trophyY + trophyH;
  }

  // Bouncing NEW BEST! text if beat best score
  let currentY = trophyBottom + 26;
  if (isNewBest) {
    const bounce = Math.abs(Math.sin(performance.now() / 1000 * 6)) * 8;
    ctx.font = `bold 22px ${CONFIG.BRAND.fontFamily}`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText('★ NEW BEST! ★', CONFIG.RULES.worldWidth / 2, currentY - bounce);
    ctx.fillStyle = CONFIG.BRAND.accentColor;
    ctx.fillText('★ NEW BEST! ★', CONFIG.RULES.worldWidth / 2, currentY - bounce);
    currentY += 34;
  }

  // Score
  ctx.font = `bold 28px ${CONFIG.BRAND.fontFamily}`;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(`Score: ${score}`, CONFIG.RULES.worldWidth / 2, currentY);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.fillText(`Score: ${score}`, CONFIG.RULES.worldWidth / 2, currentY);
  currentY += 34;

  // Best
  ctx.font = `bold 22px ${CONFIG.BRAND.fontFamily}`;
  ctx.strokeText(`Best: ${bestScore}`, CONFIG.RULES.worldWidth / 2, currentY);
  ctx.fillStyle = CONFIG.BRAND.accentColor;
  ctx.fillText(`Best: ${bestScore}`, CONFIG.RULES.worldWidth / 2, currentY);

  // Restart button (100 px wide)
  const restartImg = images.restartButton;
  if (restartImg) {
    const restartW = 100;
    const restartAspect = restartImg.naturalHeight / restartImg.naturalWidth;
    const restartH = restartW * restartAspect;
    restartBtnRect.w = restartW;
    restartBtnRect.h = restartH;
    restartBtnRect.x = (CONFIG.RULES.worldWidth - restartW) / 2;
    restartBtnRect.y = 515;
    ctx.drawImage(restartImg, restartBtnRect.x, restartBtnRect.y, restartW, restartH);
  }

  // Menu button
  menuBtnRect.y = restartBtnRect.y + restartBtnRect.h + 20;
  ctx.font = `bold 18px ${CONFIG.BRAND.fontFamily}`;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('⌂ Main Menu', CONFIG.RULES.worldWidth / 2, menuBtnRect.y + 16);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.fillText('⌂ Main Menu', CONFIG.RULES.worldWidth / 2, menuBtnRect.y + 16);

  ctx.restore();
}

function render() {
  if (state === 'start') {
    drawStartScreen();
    return;
  }

  ctx.clearRect(0, 0, CONFIG.RULES.worldWidth, CONFIG.RULES.worldHeight);

  ctx.save();
  if (shakeTimer > 0) {
    const shakeAmount = 8;
    const sx = (Math.random() * 2 - 1) * shakeAmount;
    const sy = (Math.random() * 2 - 1) * shakeAmount;
    ctx.translate(sx, sy);
  }

  drawBackground();
  drawItems();
  drawBasket();
  drawVisualEffects();

  if (redFlashTimer > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.fillRect(0, 0, CONFIG.RULES.worldWidth, CONFIG.RULES.worldHeight);
    ctx.restore();
  }

  ctx.restore();

  drawFloatingTexts();
  drawScore();
  drawPowerUps();
  drawTimer();
  drawLives();
  drawMuteButton();

  if (state === 'paused') {
    drawPausedScreen();
  } else if (state === 'over') {
    drawGameOver();
  }
}

// Build preloader asset dictionary from CONFIG.ASSETS and CONFIG.ITEMS
const assetSources = { ...CONFIG.ASSETS };
CONFIG.ITEMS.forEach((item) => {
  assetSources[item.name] = item.img;
});

preloadImages(assetSources, initGame);
