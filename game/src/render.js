// Dapur Kilat — everything the player sees, drawn on one canvas with code:
// the kitchen, the order board, the bins, the board and wok, the plate,
// the HUD and the title / pause / game-over screens. No images are loaded.

import {
  BIN_ORDER, BURN_SECONDS, CHOP_TAPS, COOK_SECONDS, INGREDIENTS, LAYOUT,
  MAX_LIVES, MAX_ORDERS, PALETTE, RECIPES, SCREEN, SHIFT_SECONDS, VIEW_HEIGHT, VIEW_WIDTH,
} from './config.js';
import { isPlatable, matchingOrder, plateKey, recipeKey } from './state.js';

export { SCREEN };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, back = 'rgba(0,0,0,0.25)') {
  ctx.fillStyle = back;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -5, -10, 0, -4);
  ctx.bezierCurveTo(5, -10, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? PALETTE.red : 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.restore();
}

/** Draw one ingredient at (x, y) as a small picture, sized by `s`. */
export function drawIngredientIcon(ctx, ing, prep, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const burnt = prep === 'burnt';
  const cooked = prep === 'cooked';
  const chopped = prep === 'chopped';
  if (ing === 'nasi') {
    ctx.fillStyle = burnt ? '#3a2c22' : '#e8e0d0';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.18, s * 0.52, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9b896';
    ctx.lineWidth = s * 0.04;
    ctx.stroke();
    ctx.fillStyle = burnt ? '#2b2018' : '#fff6e0';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.02, s * 0.42, s * 0.26, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = burnt ? '#1f1712' : '#fdf3d0';
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.arc(i * s * 0.14, -s * 0.12 - Math.abs(i) * -s * 0.02, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ing === 'ayam') {
    if (chopped) {
      ctx.fillStyle = cooked ? '#c97b2e' : '#f2a65a';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.arc(i * s * 0.3, (i % 2) * s * 0.14, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(-s * 0.42, -s * 0.05, s * 0.12, s * 0.1);
      ctx.fillRect(s * 0.3, s * 0.18, s * 0.12, s * 0.1);
    } else {
      ctx.fillStyle = burnt ? '#241a12' : cooked ? '#c97b2e' : '#e08a3c';
      ctx.beginPath();
      ctx.ellipse(s * 0.05, 0, s * 0.42, s * 0.3, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f7ead0';
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.32, s * 0.22);
      ctx.lineTo(s * 0.55, s * 0.5);
      ctx.stroke();
      ctx.fillStyle = '#f7ead0';
      ctx.beginPath();
      ctx.arc(s * 0.55, s * 0.5, s * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ing === 'telur') {
    if (chopped) {
      ctx.fillStyle = '#fff';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.ellipse(i * s * 0.28, (i % 2) * s * 0.12, s * 0.18, s * 0.14, 0.4 * i, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbbf9f';
        ctx.lineWidth = s * 0.04;
        ctx.stroke();
      }
      ctx.fillStyle = '#ffcf3f';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = burnt ? '#241a12' : '#fffdf4';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.34, s * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbbf9f';
      ctx.lineWidth = s * 0.04;
      ctx.stroke();
      ctx.fillStyle = burnt ? '#1f1712' : '#ffcf3f';
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ing === 'mie') {
    ctx.strokeStyle = burnt ? '#241a12' : cooked ? '#e8a91c' : '#ffd34d';
    ctx.lineWidth = s * 0.1;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * (0.42 - i * 0.12), Math.PI * (0.15 + i * 0.2), Math.PI * (0.85 - i * 0.1));
      ctx.stroke();
    }
    ctx.fillStyle = cooked ? '#3f9d4e' : '#7dc383';
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.3, s * 0.09, 0, Math.PI * 2);
    ctx.arc(s * 0.32, -s * 0.28, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing === 'sayur') {
    if (chopped) {
      ctx.fillStyle = '#5da864';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.arc(i * s * 0.3, (i % 2) * s * 0.14, s * 0.17, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3f7d46';
      ctx.beginPath();
      ctx.arc(-s * 0.15, s * 0.2, s * 0.1, 0, Math.PI * 2);
      ctx.arc(s * 0.2, -s * 0.18, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#4e9a51';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.1, s * 0.4, s * 0.28, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, s * 0.12, s * 0.4, s * 0.26, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2f6b34';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.35);
      ctx.lineTo(0, s * 0.35);
      ctx.stroke();
    }
  } else if (ing === 'sambal') {
    ctx.fillStyle = burnt ? '#3a1414' : '#d21f26';
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.28);
    ctx.quadraticCurveTo(0, -s * 0.55, s * 0.42, -s * 0.2);
    ctx.quadraticCurveTo(s * 0.3, s * 0.4, 0, s * 0.42);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.3, -s * 0.42, -s * 0.28);
    ctx.fill();
    ctx.strokeStyle = '#3f7d46';
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 0.25);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.45, s * 0.5, -s * 0.6);
    ctx.stroke();
  }
  if (cooked && ing !== 'ayam' && ing !== 'mie') {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.55);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.75, -s * 0.2, -s * 0.9);
    ctx.moveTo(s * 0.15, -s * 0.55);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.75, s * 0.15, -s * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground(ctx, kitchen) {
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, VIEW_WIDTH, 400);
  ctx.fillStyle = PALETTE.wallBottom;
  ctx.fillRect(0, 400, VIEW_WIDTH, 320);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let y = 30; y < 400; y += 56) ctx.fillRect(0, y, VIEW_WIDTH, 10);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 640, VIEW_WIDTH, 80);
  ctx.fillStyle = PALETTE.floorLine;
  for (let x = 0; x < VIEW_WIDTH; x += 90) ctx.fillRect(x, 640, 4, 80);
  // The long wooden counter the stations sit on.
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(0, 316, VIEW_WIDTH, 22);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, 308, VIEW_WIDTH, 10);
  ctx.fillStyle = PALETTE.counterEdge;
  ctx.fillRect(0, 336, VIEW_WIDTH, 6);
  void kitchen;
}

function drawHud(ctx, kitchen, best) {
  const hud = LAYOUT.hud;
  ctx.fillStyle = '#2b1d12';
  ctx.fillRect(hud.x, hud.y, hud.w, hud.h);
  text(ctx, 'DAPUR KILAT', 24, 33, 26, '#ffc93c');
  text(ctx, 'warung cepat saji', 230, 36, 14, '#ffe9c4', '400');
  const mins = Math.floor(kitchen.shiftLeft / 60);
  const secs = Math.floor(kitchen.shiftLeft % 60);
  const urgent = kitchen.started && !kitchen.over && kitchen.shiftLeft <= 20;
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, 640, 30, 30, urgent ? '#ff6b6b' : '#ffffff', '800', 'center');
  text(ctx, 'SHIFT', 640, 54, 11, '#c9b8a3', '700', 'center');
  bar(ctx, 560, 58, 160, 5, kitchen.shiftLeft / SHIFT_SECONDS, urgent ? '#e5484d' : '#3f9d4e');
  text(ctx, `SKOR ${kitchen.score}`, 1010, 26, 20, '#ffffff', '800', 'right');
  text(ctx, `KOIN ${kitchen.coins}  •  BEST ${Math.max(best, kitchen.score)}`, 1010, 50, 14, '#ffd34d', '700', 'right');
  for (let i = 0; i < MAX_LIVES; i += 1) heart(ctx, 1052 + i * 30, 32, 22, i < kitchen.lives);
  if (kitchen.combo >= 2) {
    text(ctx, `KOMBO x${kitchen.combo}`, 1256, 32, 18, '#ff9f1c', '800', 'right');
  }
}

function drawOrders(ctx, kitchen) {
  const o = LAYOUT.orders;
  for (let slot = 0; slot < MAX_ORDERS; slot += 1) {
    const x = o.x + slot * (o.w + o.gap);
    const order = kitchen.orders[slot];
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, x + 3, o.y + 3, o.w, o.h, 12);
    ctx.fill();
    if (!order) {
      ctx.fillStyle = 'rgba(255,251,232,0.35)';
      roundRect(ctx, x, o.y, o.w, o.h, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,251,232,0.6)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      roundRect(ctx, x, o.y, o.w, o.h, 12);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'menunggu pesanan…', x + o.w / 2, o.y + o.h / 2, 14, '#fff7e6', '600', 'center');
      continue;
    }
    const recipe = RECIPES[order.recipeId];
    const frac = Math.max(0, order.timeLeft / order.timeMax);
    const urgent = order.timeLeft <= 10;
    ctx.fillStyle = PALETTE.ticket;
    roundRect(ctx, x, o.y, o.w, o.h, 12);
    ctx.fill();
    ctx.strokeStyle = urgent ? PALETTE.red : PALETTE.ticketEdge;
    ctx.lineWidth = urgent ? 3 : 2;
    roundRect(ctx, x, o.y, o.w, o.h, 12);
    ctx.stroke();
    text(ctx, `#${order.id}  ${recipe.name}`, x + 12, o.y + 20, 16, PALETTE.ink, '800');
    text(ctx, `${Math.ceil(order.timeLeft)} dtk`, x + o.w - 12, o.y + 20, 15, urgent ? PALETTE.red : PALETTE.inkSoft, '800', 'right');
    recipe.needs.forEach((need, i) => {
      const ix = x + 30 + i * 62;
      drawIngredientIcon(ctx, need.ing, need.prep, ix, o.y + 56, 30);
      const done = kitchen.plate.some((item) => item.ing === need.ing && item.prep === need.prep);
      if (done) {
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ix, o.y + 56, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    bar(ctx, x + 12, o.y + o.h - 14, o.w - 24, 8, frac, frac > 0.5 ? '#3f9d4e' : frac > 0.25 ? '#ff9f1c' : '#e5484d');
  }
}

function stationHighlight(ctx, rect, hovered) {
  if (!hovered) return;
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 4;
  roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 12);
  ctx.stroke();
}

function drawBins(ctx, kitchen, ui) {
  const b = LAYOUT.bins;
  text(ctx, 'BAHAN DI COUNTER  —  klik atau tekan 1-6', b.x, b.y - 12, 13, '#fff7e6', '800');
  BIN_ORDER.forEach((ingId, i) => {
    const x = b.x + i * (b.w + b.gap);
    const def = INGREDIENTS[ingId];
    const hovered = ui.hover && ui.hover.kind === 'bin' && ui.hover.index === i;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, x + 3, b.y + 3, b.w, b.h, 12);
    ctx.fill();
    ctx.fillStyle = '#fffdf6';
    roundRect(ctx, x, b.y, b.w, b.h, 12);
    ctx.fill();
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = 2;
    roundRect(ctx, x, b.y, b.w, b.h, 12);
    ctx.stroke();
    drawIngredientIcon(ctx, ingId, 'raw', x + b.w / 2, b.y + 44, 44);
    text(ctx, def.name.toUpperCase(), x + b.w / 2, b.y + 82, 14, PALETTE.ink, '800', 'center');
    const prepLabel = def.prep === 'none' ? 'siap saji' : def.prep === 'chop' ? 'potong dulu' : 'masak dulu';
    text(ctx, prepLabel, x + b.w / 2, b.y + 98, 11, PALETTE.inkSoft, '600', 'center');
    ctx.fillStyle = 'rgba(43,29,18,0.75)';
    ctx.beginPath();
    ctx.arc(x + 16, b.y + 16, 11, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, def.key, x + 16, b.y + 17, 12, '#fff', '800', 'center');
    stationHighlight(ctx, { x, y: b.y, w: b.w, h: b.h }, hovered);
  });
}

function drawBoard(ctx, kitchen, ui) {
  const r = LAYOUT.board;
  const hovered = ui.hover && ui.hover.kind === 'board';
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ctx, r.x + 3, r.y + 3, r.w, r.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.boardWood;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#b98a4a';
  ctx.lineWidth = 2;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.stroke();
  text(ctx, 'TALENAN', r.x + r.w / 2, r.y + 16, 12, '#7c4f27', '800', 'center');
  const board = kitchen.board;
  if (board) {
    drawIngredientIcon(ctx, board.ing, board.prep, r.x + r.w / 2, r.y + 58, 44);
    if (board.prep !== 'chopped') {
      bar(ctx, r.x + 16, r.y + r.h - 18, r.w - 32, 8, board.taps / CHOP_TAPS, '#e5484d');
      text(ctx, `ketuk ${CHOP_TAPS - board.taps}x lagi`, r.x + r.w / 2, r.y + r.h - 28, 11, PALETTE.inkSoft, '700', 'center');
    } else {
      text(ctx, 'siap! klik untuk ambil', r.x + r.w / 2, r.y + r.h - 12, 11, PALETTE.green, '700', 'center');
    }
  } else {
    // A small knife drawn with code: blade and handle.
    ctx.fillStyle = '#dfe5ec';
    ctx.beginPath();
    ctx.moveTo(r.x + r.w / 2 - 26, r.y + 66);
    ctx.lineTo(r.x + r.w / 2 + 18, r.y + 46);
    ctx.lineTo(r.x + r.w / 2 + 26, r.y + 54);
    ctx.lineTo(r.x + r.w / 2 - 18, r.y + 74);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7c4f27';
    ctx.fillRect(r.x + r.w / 2 + 14, r.y + 58, 22, 8);
    text(ctx, 'klik untuk potong', r.x + r.w / 2, r.y + r.h - 12, 11, '#7c4f27', '600', 'center');
  }
  stationHighlight(ctx, r, hovered);
}

function drawWok(ctx, kitchen, ui) {
  const r = LAYOUT.wok;
  const hovered = ui.hover && ui.hover.kind === 'wok';
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ctx, r.x + 3, r.y + 3, r.w, r.h, 12);
  ctx.fill();
  ctx.fillStyle = '#fdf6e3';
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.steelDark;
  ctx.lineWidth = 2;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.stroke();
  text(ctx, 'WAJAN', r.x + r.w / 2, r.y + 16, 12, PALETTE.inkSoft, '800', 'center');
  const wok = kitchen.wok;
  ctx.fillStyle = PALETTE.wok;
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, r.y + 62, 44, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22262d';
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, r.y + 58, 36, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  if (wok) {
    drawIngredientIcon(ctx, wok.ing, wok.prep, r.x + r.w / 2, r.y + 58, 34);
    const frac = Math.min(1, wok.t / COOK_SECONDS);
    const burnFrac = wok.prep === 'cooked' ? Math.min(1, (wok.t - COOK_SECONDS) / (BURN_SECONDS - COOK_SECONDS)) : 0;
    ctx.strokeStyle = wok.prep === 'burnt' ? '#e5484d' : wok.prep === 'cooked' ? '#3f9d4e' : '#ff9f1c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + 58, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    if (wok.prep === 'cooked') {
      text(ctx, 'MATANG! angkat!', r.x + r.w / 2, r.y + r.h - 12, 11, PALETTE.green, '800', 'center');
      bar(ctx, r.x + 16, r.y + r.h - 26, r.w - 32, 6, 1 - burnFrac, '#e5484d');
    } else if (wok.prep === 'burnt') {
      text(ctx, 'GOSONG!', r.x + r.w / 2, r.y + r.h - 12, 11, PALETTE.red, '800', 'center');
    } else {
      text(ctx, 'memasak…', r.x + r.w / 2, r.y + r.h - 12, 11, PALETTE.inkSoft, '600', 'center');
    }
  } else {
    // A small flame drawn with code under the empty wok.
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.moveTo(r.x + r.w / 2, r.y + 42);
    ctx.quadraticCurveTo(r.x + r.w / 2 + 16, r.y + 58, r.x + r.w / 2 + 8, r.y + 72);
    ctx.quadraticCurveTo(r.x + r.w / 2, r.y + 66, r.x + r.w / 2 - 8, r.y + 72);
    ctx.quadraticCurveTo(r.x + r.w / 2 - 16, r.y + 58, r.x + r.w / 2, r.y + 42);
    ctx.fill();
    text(ctx, 'klik untuk masak', r.x + r.w / 2, r.y + r.h - 12, 11, PALETTE.inkSoft, '600', 'center');
  }
  stationHighlight(ctx, r, hovered);
}

function drawPlate(ctx, kitchen, ui) {
  const p = LAYOUT.plate;
  const hovered = ui.hover && ui.hover.kind === 'plate';
  const match = matchingOrder(kitchen);
  text(ctx, 'PIRING SAJI', p.x + p.w / 2, p.y - 12, 13, '#fff7e6', '800', 'center');
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 118, 200, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 110, 196, 82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = match ? PALETTE.green : PALETTE.plateRim;
  ctx.lineWidth = match ? 6 : 4;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 110, 196, 82, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(59,130,196,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, p.y + 110, 168, 64, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (!kitchen.plate.length) {
    text(ctx, 'klik bahan siap saji ke sini', p.x + p.w / 2, p.y + 112, 15, '#9aa1ad', '600', 'center');
  } else {
    const n = kitchen.plate.length;
    kitchen.plate.forEach((item, i) => {
      const ix = p.x + p.w / 2 + (i - (n - 1) / 2) * 96;
      drawIngredientIcon(ctx, item.ing, item.prep, ix, p.y + 108, 62);
      text(ctx, INGREDIENTS[item.ing].name, ix, p.y + 152, 12, PALETTE.inkSoft, '700', 'center');
    });
  }
  if (match) {
    text(ctx, `✓ cocok: ${RECIPES[match.recipeId].name}!`, p.x + p.w / 2, p.y + p.h - 8, 15, PALETTE.green, '800', 'center');
  }
  stationHighlight(ctx, p, hovered);
  // Serve button.
  const s = LAYOUT.serve;
  const serveHover = ui.hover && ui.hover.kind === 'serve';
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, s.x + 3, s.y + 3, s.w, s.h, 14);
  ctx.fill();
  ctx.fillStyle = match ? PALETTE.green : '#b9bec7';
  roundRect(ctx, s.x, s.y, s.w, s.h, 14);
  ctx.fill();
  if (match) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    roundRect(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 16);
    ctx.stroke();
  }
  text(ctx, 'SAJIKAN!', s.x + s.w / 2, s.y + s.h / 2 - 10, 22, '#fff', '800', 'center');
  text(ctx, match ? 'pesanan cocok ✓' : 'atau klik tiketnya', s.x + s.w / 2, s.y + s.h / 2 + 18, 12, '#fff', '600', 'center');
  stationHighlight(ctx, s, serveHover);
  // Trash can.
  const t = LAYOUT.trash;
  const trashHover = ui.hover && ui.hover.kind === 'trash';
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, t.x + 3, t.y + 3, t.w, t.h, 14);
  ctx.fill();
  ctx.fillStyle = '#8a93a1';
  roundRect(ctx, t.x, t.y, t.w, t.h, 14);
  ctx.fill();
  ctx.fillStyle = '#5d6470';
  ctx.fillRect(t.x + 22, t.y + 22, t.w - 44, t.h - 34);
  ctx.fillRect(t.x + 14, t.y + 12, t.w - 28, 10);
  text(ctx, 'BUANG', t.x + t.w / 2, t.y + t.h - 12, 11, '#fff', '800', 'center');
  stationHighlight(ctx, t, trashHover);
}

function drawHand(ctx, kitchen) {
  const h = LAYOUT.hand;
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  roundRect(ctx, h.x, h.y, h.w, h.h, 14);
  ctx.fill();
  text(ctx, 'DI TANGAN', h.x + 16, h.y + 18, 12, '#ffc93c', '800');
  const hand = kitchen.hand;
  if (!hand) {
    text(ctx, '— kosong —', h.x + 16, h.y + 56, 16, '#c9b8a3', '600');
    text(ctx, 'klik bahan di counter', h.x + 190, h.y + 56, 13, '#8a7a68', '600');
    return;
  }
  drawIngredientIcon(ctx, hand.ing, hand.prep, h.x + 48, h.y + 56, 44);
  const def = INGREDIENTS[hand.ing];
  const prepLabel = hand.prep === 'raw' ? 'mentah' : hand.prep === 'chopped' ? 'sudah dipotong' : hand.prep === 'cooked' ? 'sudah dimasak' : hand.prep === 'burnt' ? 'GOSONG' : 'siap saji';
  text(ctx, def.name, h.x + 86, h.y + 46, 18, '#fff', '800');
  text(ctx, prepLabel, h.x + 86, h.y + 70, 13, hand.prep === 'burnt' ? '#ff6b6b' : '#ffd34d', '700');
}

/** The warung's menu board: every dish, its ingredients and its price. */
function drawMenu(ctx) {
  const x = 430;
  const y = 556;
  const w = 826;
  const h = 96;
  ctx.fillStyle = '#2b1d12';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c98f4e';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
  text(ctx, 'MENU WARUNG', x + 16, y + 20, 13, '#ffc93c', '800');
  const dishes = Object.values(RECIPES);
  const colW = (w - 150) / dishes.length;
  dishes.forEach((recipe, i) => {
    const cx = x + 150 + i * colW;
    text(ctx, recipe.name, cx, y + 20, 13, '#fff7e6', '800');
    recipe.needs.forEach((need, j) => {
      drawIngredientIcon(ctx, need.ing, need.prep, cx + 14 + j * 34, y + 52, 26);
    });
    text(ctx, `${recipe.price} koin`, cx + 14 + recipe.needs.length * 34, y + 52, 13, '#ffd34d', '800');
  });
}

function drawHints(ctx, kitchen) {
  const h = LAYOUT.hints;
  const hint = kitchen.hint && kitchen.time < kitchen.hintUntil ? kitchen.hint : '';
  const line = hint || '1-6 ambil bahan  •  klik talenan untuk potong  •  klik wajan untuk masak  •  klik piring untuk rakit  •  Enter sajikan  •  T buang  •  P jeda  •  M musik';
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  roundRect(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.fill();
  text(ctx, hint ? hint : line, h.x + 16, h.y + h.h / 2 + 1, 14, hint ? '#ffd34d' : '#e8dcc8', '600');
}

function drawParticles(ctx, kitchen) {
  for (const p of kitchen.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of kitchen.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    text(ctx, f.text, f.x, f.y, 26, f.color, '800', 'center');
  }
  ctx.globalAlpha = 1;
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#fff7e6';
  roundRect(ctx, 340, 150, 600, 420, 20);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 150, 600, 420, 20);
  ctx.stroke();
  text(ctx, title, 640, 196, 40, PALETTE.ink, '800', 'center');
  let y = 252;
  for (const line of lines) {
    text(ctx, line, 640, y, 17, PALETTE.inkSoft, '600', 'center');
    y += 30;
  }
  return y;
}

function drawTitle(ctx, kitchen, best) {
  const y = drawOverlay(ctx, 'DAPUR KILAT', [
    'Warung cepat saji — pesanan datang, kamu yang masak!',
    '',
    'Ambil bahan di counter, potong di talenan, masak di wajan,',
    'rakit di piring, lalu sajikan sebelum waktunya habis.',
    'Sajikan cepat = bonus. Pesanan hangus = kehilangan nyawa.',
    '',
    `Skor terbaik: ${Math.max(best, kitchen.score)}`,
  ], PALETTE.gold);
  text(ctx, 'KLIK ATAU TEKAN SPASI UNTUK MULAI', 640, y + 36, 20, PALETTE.red, '800', 'center');
}

function drawPaused(ctx) {
  const y = drawOverlay(ctx, 'JEDA', [
    'Istirahat sebentar, kompor tetap menyala.',
    '',
    'Tekan P atau klik untuk lanjut masak.',
  ], PALETTE.plateRim);
  void y;
}

function drawOver(ctx, kitchen, best) {
  const stars = kitchen.served >= 12 ? '★★★' : kitchen.served >= 8 ? '★★☆' : kitchen.served >= 4 ? '★☆☆' : '☆☆☆';
  const y = drawOverlay(ctx, 'SHIFT SELESAI!', [
    `Skor akhir: ${kitchen.score}   •   Pesanan disajikan: ${kitchen.served}`,
    `Pesanan hangus: ${kitchen.missed}   •   Kombo terbaik: x${kitchen.bestCombo}`,
    `Skor terbaik: ${Math.max(best, kitchen.score)}`,
    '',
    stars,
    stars === '★★★' ? 'Koki bintang tiga! Warungmu legendaris.' : stars === '★★☆' ? 'Koki andal! Sedikit lagi bintang tiga.' : 'Terus berlatih, pelanggan menunggu!',
  ], PALETTE.green);
  text(ctx, 'KLIK ATAU TEKAN SPASI UNTUK MASAK LAGI', 640, y + 36, 20, PALETTE.red, '800', 'center');
}

/** Paint one frame. `screen` is one of SCREEN.*; `ui.hover` names the hovered station. */
export function drawGame(ctx, kitchen, screen, best, ui) {
  drawBackground(ctx, kitchen);
  drawOrders(ctx, kitchen);
  drawBins(ctx, kitchen, ui);
  drawBoard(ctx, kitchen, ui);
  drawWok(ctx, kitchen, ui);
  drawPlate(ctx, kitchen, ui);
  drawHand(ctx, kitchen);
  drawMenu(ctx);
  drawHints(ctx, kitchen);
  drawParticles(ctx, kitchen);
  drawHud(ctx, kitchen, best);
  if (screen === SCREEN.TITLE) drawTitle(ctx, kitchen, best);
  else if (screen === SCREEN.PAUSED) drawPaused(ctx);
  else if (screen === SCREEN.OVER) drawOver(ctx, kitchen, best);
  void plateKey;
  void recipeKey;
}
