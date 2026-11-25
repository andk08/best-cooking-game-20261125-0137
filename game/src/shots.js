// Dapur Kilat — the screenshot scenes behind ?shot=start|play|serve|end.
// Each scene plays the real rules forward from a fresh kitchen with a
// scripted cook (the same pick / chop / cook / plate actions a player
// uses), then freezes the frame, so every screenshot is what a real shift
// looks like and the same seed always gives the same frame.

import { SCREEN, STEP } from './config.js';
import {
  addOrder, createKitchen, pickIngredient, placeOnPlate, startShift, useBoard, useWok,
} from './state.js';

/** Step the kitchen forward `seconds` of game time in fixed steps. */
function stepSeconds(kitchen, seconds, updateKitchen) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) updateKitchen(kitchen, STEP);
}

/** Cook one ingredient in the wok until it is part-way done. */
function cookPartway(kitchen, updateKitchen, seconds) {
  stepSeconds(kitchen, seconds, updateKitchen);
}

/** Build a plate of Nasi Ayam Geprek: nasi, chopped ayam, sambal. */
function assembleGeprek(kitchen) {
  pickIngredient(kitchen, 'nasi');
  placeOnPlate(kitchen);
  pickIngredient(kitchen, 'ayam');
  useBoard(kitchen);
  useBoard(kitchen);
  useBoard(kitchen);
  useBoard(kitchen);
  useBoard(kitchen);
  placeOnPlate(kitchen);
  pickIngredient(kitchen, 'sambal');
  placeOnPlate(kitchen);
}

/**
 * Set `kitchen` to the named scene and return the screen to draw over it
 * and the best score to show. `updateKitchen` is the state's own stepper.
 */
export function stageShot(name, kitchen, updateKitchen) {
  if (name === 'play') {
    startShift(kitchen);
    // Rakit geprek sampai tinggal sambal, masak mie di wajan, lalu potong sayur.
    pickIngredient(kitchen, 'nasi');
    placeOnPlate(kitchen);
    pickIngredient(kitchen, 'ayam');
    useBoard(kitchen);
    useBoard(kitchen);
    useBoard(kitchen);
    useBoard(kitchen);
    useBoard(kitchen);
    placeOnPlate(kitchen);
    pickIngredient(kitchen, 'mie');
    useWok(kitchen);
    cookPartway(kitchen, updateKitchen, 1.5);
    pickIngredient(kitchen, 'sayur');
    useBoard(kitchen);
    useBoard(kitchen);
    pickIngredient(kitchen, 'sambal');
    kitchen.orders = [];
    const first = addOrder(kitchen, 'nasi-ayam-geprek');
    first.timeLeft = 40;
    const second = addOrder(kitchen, 'mie-goreng');
    second.timeLeft = 28;
    const third = addOrder(kitchen, 'nasi-telur-balado');
    third.timeLeft = 18;
    kitchen.shiftLeft = 107;
    kitchen.score = 320;
    kitchen.coins = 145;
    kitchen.combo = 3;
    kitchen.bestCombo = 3;
    kitchen.served = 5;
    return { screen: SCREEN.PLAY, best: 320 };
  }
  if (name === 'serve') {
    startShift(kitchen);
    assembleGeprek(kitchen);
    kitchen.hint = '';
    kitchen.orders = [];
    const first = addOrder(kitchen, 'nasi-ayam-geprek');
    first.timeLeft = 32;
    const second = addOrder(kitchen, 'ayam-bakar');
    second.timeLeft = 6;
    kitchen.shiftLeft = 62;
    kitchen.score = 540;
    kitchen.coins = 260;
    kitchen.combo = 4;
    kitchen.bestCombo = 4;
    kitchen.served = 9;
    return { screen: SCREEN.PLAY, best: 540 };
  }
  if (name === 'end') {
    startShift(kitchen);
    kitchen.orders = [];
    const only = addOrder(kitchen, 'mie-goreng');
    only.timeLeft = 12;
    kitchen.shiftLeft = 0;
    kitchen.over = true;
    kitchen.score = 685;
    kitchen.coins = 330;
    kitchen.combo = 0;
    kitchen.bestCombo = 5;
    kitchen.served = 11;
    kitchen.missed = 2;
    kitchen.lives = 1;
    return { screen: SCREEN.OVER, best: 685 };
  }
  // start: the title screen over a kitchen already mid-service.
  const demo = createKitchen(kitchen.rng);
  demo.attract = true;
  const first = addOrder(demo, 'nasi-ayam-geprek');
  first.timeLeft = 38;
  const second = addOrder(demo, 'mie-goreng');
  second.timeLeft = 25;
  demo.plate = [
    { ing: 'nasi', prep: 'ready' },
    { ing: 'ayam', prep: 'chopped' },
  ];
  demo.hand = { ing: 'sambal', prep: 'ready' };
  demo.wok = { ing: 'mie', prep: 'raw', t: 1.5, dinged: false };
  demo.score = 120;
  demo.coins = 60;
  demo.shiftLeft = 121;
  Object.assign(kitchen, demo);
  return { screen: SCREEN.TITLE, best: 0 };
}
