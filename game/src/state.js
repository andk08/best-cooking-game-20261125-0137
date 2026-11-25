// Dapur Kilat — the kitchen itself: orders, hand, board, wok, plate, score.
// Pure game logic, no drawing and no DOM: input, screenshots and the main
// loop all drive the same functions, so a staged screenshot plays by the
// same rules as a real shift.

import {
  BIN_ORDER, BURN_SECONDS, CHOP_TAPS, COOK_SECONDS, INGREDIENTS, LAYOUT,
  MAX_LIVES, MAX_ORDERS, PATIENCE_EARLY_SECONDS, PATIENCE_LATE_SECONDS,
  RECIPES, RECIPE_ORDER, SHIFT_SECONDS, SPAWN_EARLY_SECONDS, SPAWN_LATE_SECONDS,
} from './config.js';
import { pickRandom } from './random.js';

/** A carried or plated item: an ingredient id plus how it was prepared. */
export function makeItem(ing, prep) {
  return { ing, prep };
}

/** True when the item is ready to go on a plate. */
export function isPlatable(item) {
  return item && (item.prep === 'ready' || item.prep === 'chopped' || item.prep === 'cooked');
}

/** The recipe a plate must match, as a sorted key, for quick comparison. */
export function plateKey(plate) {
  return plate.map((item) => `${item.ing}:${item.prep}`).sort().join('|');
}

export function recipeKey(recipe) {
  return recipe.needs.map((need) => `${need.ing}:${need.prep}`).sort().join('|');
}

/** Fresh kitchen, before any shift starts. */
export function createKitchen(rng) {
  return {
    rng,
    started: false,
    over: false,
    attract: true,
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    lives: MAX_LIVES,
    orders: [],
    spawnIn: 4,
    nextOrderId: 1,
    hand: null,
    board: null,
    wok: null,
    plate: [],
    particles: [],
    floats: [],
    hint: '',
    hintUntil: 0,
  };
}

/** Put a fresh order for `recipeId` on the board with a patience timer. */
export function addOrder(kitchen, recipeId) {
  const progress = 1 - kitchen.shiftLeft / SHIFT_SECONDS;
  const patience = PATIENCE_EARLY_SECONDS + (PATIENCE_LATE_SECONDS - PATIENCE_EARLY_SECONDS) * progress;
  const order = {
    id: kitchen.nextOrderId,
    recipeId,
    timeLeft: patience,
    timeMax: patience,
  };
  kitchen.nextOrderId += 1;
  kitchen.orders.push(order);
  return order;
}

/** Start a shift: clear the board, reset the score, spawn the first order. */
export function startShift(kitchen) {
  kitchen.started = true;
  kitchen.over = false;
  kitchen.attract = false;
  kitchen.time = 0;
  kitchen.shiftLeft = SHIFT_SECONDS;
  kitchen.score = 0;
  kitchen.coins = 0;
  kitchen.combo = 0;
  kitchen.bestCombo = 0;
  kitchen.served = 0;
  kitchen.missed = 0;
  kitchen.lives = MAX_LIVES;
  kitchen.orders = [];
  kitchen.spawnIn = 3;
  kitchen.nextOrderId = 1;
  kitchen.hand = null;
  kitchen.board = null;
  kitchen.wok = null;
  kitchen.plate = [];
  kitchen.particles = [];
  kitchen.floats = [];
  addOrder(kitchen, pickRandom(kitchen.rng, RECIPE_ORDER));
  return ['start'];
}

/** A short hint line under the kitchen, shown for a few seconds. */
export function setHint(kitchen, text) {
  kitchen.hint = text;
  kitchen.hintUntil = kitchen.time + 4;
}

/** Burst of crumbs / steam / sparkles at a canvas point. */
export function burst(kitchen, x, y, color, count = 10) {
  for (let i = 0; i < count; i += 1) {
    kitchen.particles.push({
      x, y,
      vx: (kitchen.rng() - 0.5) * 220,
      vy: -40 - kitchen.rng() * 160,
      life: 0.5 + kitchen.rng() * 0.4,
      maxLife: 0.9,
      color,
      size: 2 + kitchen.rng() * 4,
    });
  }
}

/** Floating score text that rises and fades. */
export function floatText(kitchen, x, y, text, color) {
  kitchen.floats.push({ x, y, text, color, life: 1.2, maxLife: 1.2 });
}

/** Take a raw ingredient from its bin into the hand. */
export function pickIngredient(kitchen, ingId) {
  if (kitchen.hand) {
    setHint(kitchen, 'Tangan penuh! Letakkan dulu bahannya.');
    return ['error'];
  }
  const def = INGREDIENTS[ingId];
  if (!def) return ['error'];
  kitchen.hand = makeItem(ingId, def.prep === 'none' ? 'ready' : 'raw');
  setHint(kitchen, `${def.name} di tangan — ${def.prep === 'chop' ? 'potong di talenan' : def.prep === 'cook' ? 'masak di wajan' : 'langsung ke piring'}.`);
  return ['pick'];
}

/** Use the chopping board: load it, tap to chop, or pick the chopped item up. */
export function useBoard(kitchen) {
  const board = kitchen.board;
  if (!board) {
    const hand = kitchen.hand;
    if (!hand || hand.prep !== 'raw' || INGREDIENTS[hand.ing].prep !== 'chop') {
      setHint(kitchen, 'Talenan: bawa Ayam atau Sayur mentah ke sini.');
      return ['error'];
    }
    kitchen.board = { ing: hand.ing, prep: 'raw', taps: 0 };
    kitchen.hand = null;
    return ['pick'];
  }
  if (board.prep === 'chopped') {
    if (kitchen.hand) {
      setHint(kitchen, 'Tangan penuh! Letakkan dulu bahannya.');
      return ['error'];
    }
    kitchen.hand = makeItem(board.ing, 'chopped');
    kitchen.board = null;
    return ['pick'];
  }
  board.taps += 1;
  burst(kitchen, LAYOUT.board.x + LAYOUT.board.w / 2, LAYOUT.board.y + 40, '#c98f4e', 6);
  if (board.taps >= CHOP_TAPS) {
    board.prep = 'chopped';
    return ['chop', 'ding'];
  }
  return ['chop'];
}

/** Use the wok: load it, or take the cooked item out. */
export function useWok(kitchen) {
  const wok = kitchen.wok;
  if (!wok) {
    const hand = kitchen.hand;
    if (!hand || hand.prep !== 'raw' || INGREDIENTS[hand.ing].prep !== 'cook') {
      setHint(kitchen, 'Wajan: bawa Ayam, Telur, atau Mie mentah ke sini.');
      return ['error'];
    }
    kitchen.wok = { ing: hand.ing, prep: 'raw', t: 0, dinged: false };
    kitchen.hand = null;
    return ['sizzle'];
  }
  if (kitchen.hand) {
    setHint(kitchen, 'Tangan penuh! Letakkan dulu bahannya.');
    return ['error'];
  }
  kitchen.hand = makeItem(wok.ing, wok.prep);
  kitchen.wok = null;
  if (wok.prep === 'burnt') setHint(kitchen, 'Gosong! Buang ke tempat sampah.');
  return ['pick'];
}

/** Put the held item on the plate, when it is prepared and not a duplicate. */
export function placeOnPlate(kitchen) {
  const hand = kitchen.hand;
  if (!hand) {
    setHint(kitchen, 'Piring kosong — bawa bahan yang sudah siap.');
    return ['error'];
  }
  if (!isPlatable(hand)) {
    setHint(kitchen, hand.prep === 'burnt' ? 'Gosong! Buang dulu.' : 'Bahan mentah! Potong atau masak dulu.');
    return ['error'];
  }
  if (kitchen.plate.some((item) => item.ing === hand.ing && item.prep === hand.prep)) {
    setHint(kitchen, 'Bahan itu sudah ada di piring.');
    return ['error'];
  }
  if (kitchen.plate.length >= 4) {
    setHint(kitchen, 'Piring penuh! Sajikan atau buang dulu.');
    return ['error'];
  }
  kitchen.plate.push(makeItem(hand.ing, hand.prep));
  kitchen.hand = null;
  burst(kitchen, LAYOUT.plate.x + LAYOUT.plate.w / 2, LAYOUT.plate.y + 110, '#ffd34d', 8);
  return ['pick'];
}

/** The order whose recipe the plate matches, or null. */
export function matchingOrder(kitchen) {
  const key = plateKey(kitchen.plate);
  if (!key) return null;
  for (const order of kitchen.orders) {
    if (recipeKey(RECIPES[order.recipeId]) === key) return order;
  }
  return null;
}

/** Serve the plate to one order ticket. */
export function serveOrder(kitchen, orderId) {
  const order = kitchen.orders.find((entry) => entry.id === orderId);
  if (!order) return ['error'];
  if (!kitchen.plate.length) {
    setHint(kitchen, 'Piring kosong — rakit dulu pesanannya.');
    return ['error'];
  }
  const recipe = RECIPES[order.recipeId];
  if (recipeKey(recipe) !== plateKey(kitchen.plate)) {
    setHint(kitchen, `Belum cocok! ${recipe.name} butuh ${recipe.needs.map((n) => INGREDIENTS[n.ing].name).join(', ')}.`);
    return ['error'];
  }
  const timeBonus = Math.round((order.timeLeft / order.timeMax) * 20);
  const comboBonus = kitchen.combo * 5;
  const earned = recipe.price + timeBonus + comboBonus;
  kitchen.score += earned;
  kitchen.coins += recipe.price;
  kitchen.served += 1;
  kitchen.combo += 1;
  kitchen.bestCombo = Math.max(kitchen.bestCombo, kitchen.combo);
  kitchen.orders = kitchen.orders.filter((entry) => entry.id !== orderId);
  kitchen.plate = [];
  const rect = LAYOUT.orders;
  const index = Math.max(0, kitchen.orders.indexOf(order));
  floatText(kitchen, rect.x + index * (rect.w + rect.gap) + rect.w / 2, rect.y + 20, `+${earned}`, '#3f9d4e');
  burst(kitchen, LAYOUT.plate.x + LAYOUT.plate.w / 2, LAYOUT.plate.y + 110, '#ffc93c', 16);
  return ['serve', 'coin'];
}

/** Serve the first order the plate matches, if any. */
export function tryServeFirst(kitchen) {
  const order = matchingOrder(kitchen);
  if (!order) {
    setHint(kitchen, 'Piring belum cocok dengan pesanan mana pun.');
    return ['error'];
  }
  return serveOrder(kitchen, order.id);
}

/** Throw away the held item, or clear the plate when the hand is empty. */
export function trashHeld(kitchen) {
  if (kitchen.hand) {
    kitchen.hand = null;
    return ['pick'];
  }
  if (kitchen.plate.length) {
    kitchen.plate = [];
    setHint(kitchen, 'Piring dibersihkan.');
    return ['pick'];
  }
  return ['error'];
}

/** Advance timers, spawn orders, cook the wok and expire stale tickets. */
export function updateKitchen(kitchen, dt) {
  const events = [];
  for (let i = kitchen.particles.length - 1; i >= 0; i -= 1) {
    const p = kitchen.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
    if (p.life <= 0) kitchen.particles.splice(i, 1);
  }
  for (let i = kitchen.floats.length - 1; i >= 0; i -= 1) {
    const f = kitchen.floats[i];
    f.life -= dt;
    f.y -= 42 * dt;
    if (f.life <= 0) kitchen.floats.splice(i, 1);
  }
  if (!kitchen.started || kitchen.over || kitchen.attract) return events;
  kitchen.time += dt;
  kitchen.shiftLeft -= dt;
  if (kitchen.shiftLeft <= 0) {
    kitchen.shiftLeft = 0;
    kitchen.over = true;
    events.push('over');
    return events;
  }
  const progress = 1 - kitchen.shiftLeft / SHIFT_SECONDS;
  kitchen.spawnIn -= dt;
  if (kitchen.spawnIn <= 0 && kitchen.orders.length < MAX_ORDERS) {
    const onBoard = new Set(kitchen.orders.map((order) => order.recipeId));
    const free = RECIPE_ORDER.filter((id) => !onBoard.has(id));
    addOrder(kitchen, pickRandom(kitchen.rng, free.length ? free : RECIPE_ORDER));
    kitchen.spawnIn = SPAWN_EARLY_SECONDS + (SPAWN_LATE_SECONDS - SPAWN_EARLY_SECONDS) * progress;
  }
  for (let i = kitchen.orders.length - 1; i >= 0; i -= 1) {
    const order = kitchen.orders[i];
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      kitchen.orders.splice(i, 1);
      kitchen.missed += 1;
      kitchen.combo = 0;
      kitchen.lives -= 1;
      setHint(kitchen, `Pesanan ${RECIPES[order.recipeId].name} hangus!`);
      events.push('error');
      if (kitchen.lives <= 0) {
        kitchen.over = true;
        events.push('over');
        return events;
      }
    }
  }
  const wok = kitchen.wok;
  if (wok) {
    wok.t += dt;
    if (wok.prep === 'raw' && wok.t >= COOK_SECONDS) {
      wok.prep = 'cooked';
      events.push('ding');
    } else if (wok.prep === 'cooked' && wok.t >= BURN_SECONDS) {
      wok.prep = 'burnt';
      setHint(kitchen, 'Di wajan gosong! Angkat dan buang.');
      events.push('burn');
    }
  }
  return events;
}
