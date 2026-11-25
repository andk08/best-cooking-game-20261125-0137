// Dapur Kilat — boot and the one loop: input is read every frame, the
// kitchen advances in fixed 1/60 s steps, and the renderer paints what is
// there. The game moves between four screens: title, play, paused and over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import {
  BEST_KEY, SCREEN, STEP, VIEW_HEIGHT, VIEW_WIDTH,
} from './config.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM, ACTION_MUSIC, ACTION_PAUSE, ACTION_SERVE, ACTION_TRASH, createInput,
} from './input.js';
import { createRandom } from './random.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';
import {
  createKitchen, pickIngredient, placeOnPlate, serveOrder, startShift,
  trashHeld, tryServeFirst, updateKitchen, useBoard, useWok,
} from './state.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const kitchen = createKitchen(createRandom(seed));
// Debug hook for play-testing: lets a test read the live score and orders.
window.__kitchen = kitchen;
const audio = createAudio();
const ui = { hover: null };

/** Fit the 1280x720 kitchen into the window, letterboxed. */
function resizeCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT);
  canvas.width = Math.round(VIEW_WIDTH * scale);
  canvas.height = Math.round(VIEW_HEIGHT * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function paint(screen, best) {
  const scale = canvas.width / VIEW_WIDTH;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawGame(ctx, kitchen, screen, best, { hover: ui.hover ? ui.hover.current : null });
}

/** Route one station click to the kitchen action it means. */
function handleStation(station, screen) {
  if (screen !== SCREEN.PLAY || !station) return [];
  if (station.kind === 'bin') return pickIngredient(kitchen, station.ing);
  if (station.kind === 'board') return useBoard(kitchen);
  if (station.kind === 'wok') return useWok(kitchen);
  if (station.kind === 'plate') return placeOnPlate(kitchen);
  if (station.kind === 'serve') return tryServeFirst(kitchen);
  if (station.kind === 'trash') return trashHeld(kitchen);
  if (station.kind === 'order') return serveOrder(kitchen, station.orderId);
  return [];
}

function playEvents(events) {
  for (const event of events) audio.play(event);
}

function runShot(name) {
  const scene = stageShot(name, kitchen, updateKitchen);
  let painted = 0;
  function paintFrame() {
    paint(scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paintFrame);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paintFrame);
}

function runGame() {
  const input = createInput(
    canvas,
    (clientX, clientY) => ({
      x: (clientX / canvas.width) * VIEW_WIDTH,
      y: (clientY / canvas.height) * VIEW_HEIGHT,
    }),
    {
      kitchen: () => kitchen,
      unlockAudio: () => audio.unlock(),
      onStation: (station) => {
        if (screen === SCREEN.TITLE || screen === SCREEN.OVER) {
          // Any click on the title or game-over screen starts a new shift.
          playEvents(startShift(kitchen));
          screen = SCREEN.PLAY;
          announce('Playing. Serve orders before their timers run out.');
          return;
        }
        if (screen === SCREEN.PAUSED) {
          screen = SCREEN.PLAY;
          announce('Playing.');
          return;
        }
        playEvents(handleStation(station, screen));
      },
    },
  );
  ui.hover = input.hover;
  let screen = SCREEN.TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function endShift() {
    screen = SCREEN.OVER;
    if (kitchen.score > best) {
      best = kitchen.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${kitchen.score}. Best ${best}.`);
    playEvents(['over']);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUSIC) {
      const on = audio.toggleMusic();
      announce(on ? 'Music on.' : 'Music off.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN.TITLE || screen === SCREEN.OVER)) {
      playEvents(startShift(kitchen));
      screen = SCREEN.PLAY;
      announce('Playing. Serve orders before their timers run out.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN.PLAY) {
      screen = SCREEN.PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN.PAUSED) {
      screen = SCREEN.PLAY;
      announce('Playing.');
    } else if (actions & ACTION_SERVE && screen === SCREEN.PLAY) {
      playEvents(tryServeFirst(kitchen));
    } else if (actions & ACTION_TRASH && screen === SCREEN.PLAY) {
      playEvents(trashHeld(kitchen));
    }
  }

  function step() {
    if (screen === SCREEN.TITLE) {
      updateKitchen(kitchen, STEP);
      return;
    }
    playEvents(updateKitchen(kitchen, STEP));
    if (kitchen.over) endShift();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN.TITLE || screen === SCREEN.PLAY) {
      while (accumulator >= STEP && (screen === SCREEN.TITLE || screen === SCREEN.PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    paint(screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN.PLAY) {
      screen = SCREEN.PAUSED;
      announce('Paused.');
    }
  });

  // The title screen shows a kitchen already mid-service, staged once.
  stageShot('start', kitchen, updateKitchen);
  announce('Dapur Kilat. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
