// Dapur Kilat — configuration: recipes, ingredients, timings and the kitchen layout.
// One file, one job: every number the game tunes lives here, so the other files
// only read constants and never re-derive them.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 4;
export const MAX_LIVES = 3;
export const BEST_KEY = 'dapur-kilat-best';

/** The four screens the main loop moves between. */
export const SCREEN = { TITLE: 'title', PLAY: 'play', PAUSED: 'paused', OVER: 'over' };

/** How many board taps finish one chopping job. */
export const CHOP_TAPS = 3;
/** Seconds in the wok before an item is cooked, and before it burns. */
export const COOK_SECONDS = 3;
export const BURN_SECONDS = 6;
/** Seconds between order spawns at the start and at the end of the shift. */
export const SPAWN_EARLY_SECONDS = 13;
export const SPAWN_LATE_SECONDS = 8;
/** Order patience at the start and at the end of the shift. */
export const PATIENCE_EARLY_SECONDS = 48;
export const PATIENCE_LATE_SECONDS = 34;

/** A station the player can click, with its key shortcut. */
export const STATION = {
  BIN: 'bin',
  BOARD: 'board',
  WOK: 'wok',
  PLATE: 'plate',
  SERVE: 'serve',
  TRASH: 'trash',
};

/** Ingredient catalogue. `prep` says what the raw item needs before it can be plated:
 *  'none' goes straight on the plate, 'chop' needs the board, 'cook' needs the wok. */
export const INGREDIENTS = {
  nasi: { id: 'nasi', name: 'Nasi', short: 'NASI', prep: 'none', color: '#fff6e0', dark: '#d9c48f', key: '1' },
  ayam: { id: 'ayam', name: 'Ayam', short: 'AYAM', prep: 'chop', color: '#f2a65a', dark: '#b96a1e', key: '2' },
  telur: { id: 'telur', name: 'Telur', short: 'TELUR', prep: 'cook', color: '#ffe9a8', dark: '#d9a441', key: '3' },
  mie: { id: 'mie', name: 'Mie', short: 'MIE', prep: 'cook', color: '#ffd34d', dark: '#c98f1b', key: '4' },
  sayur: { id: 'sayur', name: 'Sayur', short: 'SAYUR', prep: 'chop', color: '#7dc383', dark: '#3f7d46', key: '5' },
  sambal: { id: 'sambal', name: 'Sambal', short: 'SAMBAL', prep: 'none', color: '#e5484d', dark: '#9c1f24', key: '6' },
};
export const BIN_ORDER = ['nasi', 'ayam', 'telur', 'mie', 'sayur', 'sambal'];

/** A recipe is a dish: its name, its price in coins, and the prepared items it needs.
 *  `prep` is the state the ingredient must be in on the plate. */
export const RECIPES = {
  'nasi-ayam-geprek': {
    id: 'nasi-ayam-geprek', name: 'Nasi Ayam Geprek', price: 45,
    needs: [
      { ing: 'nasi', prep: 'ready' },
      { ing: 'ayam', prep: 'chopped' },
      { ing: 'sambal', prep: 'ready' },
    ],
  },
  'mie-goreng': {
    id: 'mie-goreng', name: 'Mie Goreng Spesial', price: 55,
    needs: [
      { ing: 'mie', prep: 'cooked' },
      { ing: 'sayur', prep: 'chopped' },
      { ing: 'telur', prep: 'cooked' },
    ],
  },
  'nasi-telur-balado': {
    id: 'nasi-telur-balado', name: 'Nasi Telur Balado', price: 40,
    needs: [
      { ing: 'nasi', prep: 'ready' },
      { ing: 'telur', prep: 'cooked' },
      { ing: 'sambal', prep: 'ready' },
    ],
  },
  'ayam-bakar': {
    id: 'ayam-bakar', name: 'Ayam Bakar + Nasi', price: 50,
    needs: [
      { ing: 'nasi', prep: 'ready' },
      { ing: 'ayam', prep: 'cooked' },
    ],
  },
};
export const RECIPE_ORDER = ['nasi-ayam-geprek', 'mie-goreng', 'nasi-telur-balado', 'ayam-bakar'];

/** Fixed rectangles for every clickable zone, shared by input and rendering. */
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 64 },
  orders: { x: 24, y: 76, w: 296, h: 96, gap: 16 },
  bins: { x: 24, y: 196, w: 148, h: 108, gap: 14 },
  board: { x: 996, y: 196, w: 122, h: 108 },
  wok: { x: 1130, y: 196, w: 126, h: 108 },
  plate: { x: 430, y: 330, w: 420, h: 220 },
  serve: { x: 880, y: 420, w: 170, h: 76 },
  trash: { x: 1080, y: 420, w: 96, h: 76 },
  hand: { x: 24, y: 560, w: 380, h: 92 },
  hints: { x: 24, y: 664, w: 1232, h: 44 },
};

/** Warm warung palette, one place so the kitchen keeps a single look. */
export const PALETTE = {
  wallTop: '#ffb347',
  wallBottom: '#ff8c42',
  floor: '#8a5a33',
  floorLine: '#6e4525',
  counter: '#a4713e',
  counterTop: '#c98f4e',
  counterEdge: '#7c4f27',
  boardWood: '#e8b96f',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  plate: '#fdfdfd',
  plateRim: '#3b82c4',
  ink: '#2b1d12',
  inkSoft: '#5d4630',
  cream: '#fff7e6',
  red: '#e5484d',
  green: '#3f9d4e',
  gold: '#ffc93c',
  ticket: '#fffbe8',
  ticketEdge: '#e8d9a0',
  wok: '#3a3f47',
};
