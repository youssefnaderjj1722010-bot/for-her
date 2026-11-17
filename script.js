/* =========================================================
   Love For Jana — interactions, petals and hearts
   ========================================================= */

"use strict";

/* ---------- DOM references ---------- */
const ui = {
  canvas: document.getElementById("heart-canvas"),
  envelopeStage: document.getElementById("envelope-stage"),
  envelope: document.getElementById("envelope"),
  openButton: document.getElementById("open-button"),
  letterStage: document.getElementById("letter-stage"),
  heartsButton: document.getElementById("hearts-button"),
  musicButton: document.getElementById("music-button"),
};

const ctx = ui.canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Configuration ---------- */
const CONFIG = {
  petalCount: reducedMotion ? 18 : 42,
  heartChance: 0.22,
  gravity: 620,
  maxHearts: 240,
};

const PALETTE = ["#d9264a", "#b3182f", "#f0627d", "#ff9fb4", "#8f0f22", "#ffd9c2"];
const HEART_COLORS = ["#ff5f7e", "#d9264a", "#ff9fb4", "#ffe3d6", "#b3182f"];

/* ---------- Runtime state ---------- */
const view = { w: 0, h: 0, dpr: 1 };
const state = {
  opened: false,
  musicOn: false,
  petals: [],
  hearts: [],
  burstTotal: 0,
  time: 0,
};

/* ---------- Small helpers ---------- */
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* ========== Canvas setup ========== */
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  view.dpr = dpr;
  ui.canvas.width = Math.round(view.w * dpr);
  ui.canvas.height = Math.round(view.h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ========== Floating petals and hearts ========== */
function createPetal(initial) {
  const isHeart = Math.random() < CONFIG.heartChance;
  return {
    x: randomBetween(-40, view.w + 40),
    y: initial ? randomBetween(-view.h, view.h) : randomBetween(-120, -20),
    size: isHeart ? randomBetween(6, 12) : randomBetween(7, 16),
    speed: randomBetween(26, 64) * (reducedMotion ? 0.25 : 1),
    swayAmp: randomBetween(14, 42),
    swaySpeed: randomBetween(0.4, 1.1),
    phase: randomBetween(0, Math.PI * 2),
    rotation: randomBetween(0, Math.PI * 2),
    spin: randomBetween(-0.9, 0.9),
    color: isHeart ? pick(HEART_COLORS) : pick(PALETTE),
    alpha: randomBetween(0.28, 0.7),
    isHeart,
  };
}

function spawnPetals() {
  state.petals = [];
  for (let i = 0; i < CONFIG.petalCount; i += 1) {
    state.petals.push(createPetal(true));
  }
}

function drawHeart(x, y, size, color, rotation, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.32);
  ctx.bezierCurveTo(-size * 1.05, -size * 0.42, -size * 0.5, -size * 1.05, 0, -size * 0.4);
  ctx.bezierCurveTo(size * 0.5, -size * 1.05, size * 1.05, -size * 0.42, 0, size * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPetal(x, y, size, color, rotation, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  const gradient = ctx.createLinearGradient(0, -size, 0, size);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#5e0714");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.95, -size * 0.35, size * 0.7, size * 0.7, 0, size);
  ctx.bezierCurveTo(-size * 0.7, size * 0.7, -size * 0.95, -size * 0.35, 0, -size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function update(dt) {
  state.time += dt;

  for (const petal of state.petals) {
    petal.y += petal.speed * dt;
    petal.x += Math.sin(state.time * petal.swaySpeed + petal.phase) * petal.swayAmp * dt;
    petal.rotation += petal.spin * dt;

    if (petal.y > view.h + 40) {
      Object.assign(petal, createPetal(false));
    }
    if (petal.x < -60) petal.x = view.w + 40;
    if (petal.x > view.w + 60) petal.x = -40;
  }

  for (const heart of state.hearts) {
    heart.vy += CONFIG.gravity * 0.32 * dt;
    heart.x += heart.vx * dt;
    heart.y += heart.vy * dt;
    heart.rotation += heart.spin * dt;
    heart.life -= dt;
  }

  state.hearts = state.hearts.filter((heart) => heart.life > 0);
}

function render() {
  ctx.clearRect(0, 0, view.w, view.h);

  for (const petal of state.petals) {
    if (petal.isHeart) {
      drawHeart(petal.x, petal.y, petal.size, petal.color, petal.rotation, petal.alpha);
    } else {
      drawPetal(petal.x, petal.y, petal.size, petal.color, petal.rotation, petal.alpha);
    }
  }

  for (const heart of state.hearts) {
    const fade = Math.min(1, (heart.life / heart.maxLife) * 1.4);
    drawHeart(heart.x, heart.y, heart.size, heart.color, heart.rotation, heart.alpha * fade);
  }
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

/* ========== Heart bursts ========== */
function spawnHeartBurst(x, y, count) {
  const total = Math.min(count, CONFIG.maxHearts - state.hearts.length);

  for (let i = 0; i < total; i += 1) {
    const angle = randomBetween(-Math.PI * 0.9, -Math.PI * 0.1);
    const power = randomBetween(120, 420);
    const life = randomBetween(1.1, 2.1);

    state.hearts.push({
      x,
      y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      size: randomBetween(6, 16),
      rotation: randomBetween(-0.6, 0.6),
      spin: randomBetween(-2.4, 2.4),
      color: pick(HEART_COLORS),
      alpha: randomBetween(0.75, 1),
      life,
      maxLife: life,
    });
  }

  state.burstTotal += total;
}

function burstFromElement(element, count) {
  const rect = element.getBoundingClientRect();
  spawnHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, count);
}

/* ========== Sound ========== */
let audioContext = null;
let musicTimer = null;

function ensureAudio() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playNote(frequency, duration, volume, type, delay) {
  const audio = ensureAudio();
  if (!audio) return;

  const start = audio.currentTime + (delay || 0);
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = type || "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.08);
}

function playChime() {
  const notes = [659.25, 830.61, 987.77, 1318.51];
  notes.forEach((frequency, index) => {
    playNote(frequency, 0.9, 0.06, "sine", index * 0.13);
  });
}

/* ========== Ambient music loop ========== */
const MUSIC_NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.51];

function playAmbientNote() {
  const note = MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)];
  playNote(note, 1.6, 0.028, "sine", 0);
  if (Math.random() < 0.35) {
    playNote(note / 2, 1.8, 0.02, "triangle", 0.02);
  }
}

function updateMusicButton() {
  ui.musicButton.textContent = state.musicOn ? "اقفلي الموسيقى ♪" : "شغّلي الموسيقى ♪";
  ui.musicButton.setAttribute("aria-pressed", String(state.musicOn));
}

function startMusic() {
  if (!ensureAudio()) return;
  state.musicOn = true;
  playAmbientNote();
  musicTimer = window.setInterval(playAmbientNote, 780);
  updateMusicButton();
}

function stopMusic() {
  state.musicOn = false;
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  updateMusicButton();
}

function toggleMusic() {
  if (state.musicOn) {
    stopMusic();
  } else {
    startMusic();
  }
  return state.musicOn;
}

/* ========== Page flow ========== */
function openLetter() {
  if (state.opened) return;
  state.opened = true;

  ui.openButton.disabled = true;
  ui.openButton.textContent = "بتتفتح…";
  ui.envelope.classList.add("is-opening");

  playChime();
  spawnHeartBurst(window.innerWidth / 2, window.innerHeight * 0.46, 30);

  window.setTimeout(() => {
    ui.envelopeStage.hidden = true;
    ui.letterStage.hidden = false;
    ui.openButton.disabled = false;
    ui.openButton.textContent = "افتحي الرسالة ♥";
    spawnHeartBurst(window.innerWidth / 2, window.innerHeight * 0.35, 24);
  }, reducedMotion ? 120 : 820);
}

function sendHearts() {
  burstFromElement(ui.heartsButton, 28);
  playNote(880, 0.35, 0.05, "sine", 0);
  playNote(1174.66, 0.4, 0.045, "sine", 0.08);
}

/* ========== Events ========== */
function bindEvents() {
  ui.openButton.addEventListener("click", openLetter);
  ui.envelope.addEventListener("click", openLetter);

  ui.envelope.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLetter();
    }
  });

  ui.heartsButton.addEventListener("click", sendHearts);
  ui.musicButton.addEventListener("click", () => {
    toggleMusic();
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    spawnPetals();
    render();
  });
}

/* ========== Init ========== */
function init() {
  resizeCanvas();
  spawnPetals();
  bindEvents();
  updateMusicButton();
  render();

  lastTime = performance.now();
  requestAnimationFrame(frame);
}

init();

/* Debug/verification hook */
window.LoveForJana = {
  state,
  openLetter,
  sendHearts,
  toggleMusic,
  petals: () => state.petals.length,
  hearts: () => state.hearts.length,
  burstCount: () => state.burstTotal,
  render,
};
