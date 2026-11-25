// Dapur Kilat — mouse and keyboard input. Hit-testing reads the same
// LAYOUT rectangles the renderer draws, so a click always lands where the
// player sees the station. The input layer only translates gestures into
// kitchen actions and one-bit action flags for the main loop.

import { BIN_ORDER, LAYOUT, SCREEN } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_TRASH = 8;
export const ACTION_MUSIC = 16;

/** True when (x, y) is inside rect. */
export function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Which station, if any, sits under a canvas point (in 1280x720 space). */
export function stationAt(x, y, kitchen) {
  const b = LAYOUT.bins;
  for (let i = 0; i < BIN_ORDER.length; i += 1) {
    if (inside({ x: b.x + i * (b.w + b.gap), y: b.y, w: b.w, h: b.h }, x, y)) {
      return { kind: 'bin', index: i, ing: BIN_ORDER[i] };
    }
  }
  if (inside(LAYOUT.board, x, y)) return { kind: 'board' };
  if (inside(LAYOUT.wok, x, y)) return { kind: 'wok' };
  if (inside(LAYOUT.plate, x, y)) return { kind: 'plate' };
  if (inside(LAYOUT.serve, x, y)) return { kind: 'serve' };
  if (inside(LAYOUT.trash, x, y)) return { kind: 'trash' };
  const o = LAYOUT.orders;
  for (let slot = 0; slot < kitchen.orders.length; slot += 1) {
    const rect = { x: o.x + slot * (o.w + o.gap), y: o.y, w: o.w, h: o.h };
    if (inside(rect, x, y)) return { kind: 'order', orderId: kitchen.orders[slot].id };
  }
  return null;
}

/**
 * Wire the canvas and the keyboard. `handlers` receives the kitchen actions:
 * onStation(station) for clicks, onAction(bits) for keys. Returns the live
 * hover state the renderer reads, plus a `detach` for cleanup.
 */
export function createInput(canvas, toLogical, handlers) {
  let actions = 0;
  const hover = { current: null };
  let pressed = null;

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return toLogical(event.clientX - rect.left, event.clientY - rect.top);
  }

  function onPointerMove(event) {
    const point = pointFromEvent(event);
    hover.current = stationAt(point.x, point.y, handlers.kitchen());
  }

  function onPointerDown(event) {
    const point = pointFromEvent(event);
    pressed = stationAt(point.x, point.y, handlers.kitchen());
    handlers.unlockAudio();
  }

  function onPointerUp(event) {
    if (!pressed) return;
    const point = pointFromEvent(event);
    const released = stationAt(point.x, point.y, handlers.kitchen());
    const station = released && pressed.kind === released.kind && pressed.index === released.index ? pressed : null;
    pressed = null;
    if (station) handlers.onStation(station);
    else handlers.onStation(null);
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === ' ') {
      event.preventDefault();
      actions |= ACTION_CONFIRM;
    } else if (key === 'enter') {
      actions |= ACTION_SERVE;
    } else if (key === 'p' || key === 'escape') {
      actions |= ACTION_PAUSE;
    } else if (key === 't') {
      actions |= ACTION_TRASH;
    } else if (key === 'm') {
      actions |= ACTION_MUSIC;
    } else if (key >= '1' && key <= '6') {
      handlers.onStation({ kind: 'bin', index: Number(key) - 1, ing: BIN_ORDER[Number(key) - 1] });
    }
    handlers.unlockAudio();
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyDown);

  return {
    hover,
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    detach() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}

/** Map the current screen name to the one the main loop draws. */
export function screenName(screen) {
  return screen === SCREEN.TITLE || screen === SCREEN.PLAY || screen === SCREEN.PAUSED || screen === SCREEN.OVER
    ? screen
    : SCREEN.TITLE;
}

/** The station under a point, or null — used by the screenshot staging. */
export function stationAtPoint(x, y, kitchen) {
  return stationAt(x, y, kitchen);
}
