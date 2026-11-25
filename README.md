[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/andk08/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/andk08/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Kilat — Warung Cepat Saji

A complete, original cooking game that plays offline in a desktop browser.
You run a small Indonesian warung (food stall) through a busy shift: order
tickets land on the board with a countdown, and you have to cook each dish
before its timer runs out.

## How to play

- **Take ingredients** from the counter — click a bin or press `1`–`6`.
  Nasi and Sambal are ready to serve; Ayam and Sayur need chopping;
  Ayam, Telur and Mie need the wok.
- **Chop** on the wooden board: put a raw ingredient on it and tap three
  times, then pick the chopped pieces back up.
- **Cook** in the wok: drop a raw ingredient in and lift it out once it is
  cooked — leave it too long and it burns.
- **Build the dish** on the plate: click the plate with each prepared
  ingredient the recipe needs.
- **Serve** by clicking the matching order ticket (or the big SAJIKAN button,
  or `Enter`). Fast serves earn a time bonus; serving in a row builds a
  combo. A ticket that runs out costs one of three lives.
- The shift lasts 2 minutes 30 seconds. Orders arrive faster and their
  timers get shorter as the rush builds.

Four dishes to master: Nasi Ayam Geprek, Mie Goreng Spesial, Nasi Telur
Balado, and Ayam Bakar + Nasi. All art is drawn in code, all sounds and the
music loop are synthesized with WebAudio — no assets, no network requests.
The best score is kept in the browser's local storage.

## Run it

No build step, no dependencies. Serve `game/` with any static server and
open `index.html` in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` directly from disk — the game still plays, since
every file it loads sits under `game/`.

Keyboard: `1`–`6` take ingredients, `Enter` serve, `T` throw away,
`P` pause, `M` music on/off, `Space` start / resume.

## Layout

- `game/index.html` — the page, one canvas, one module script.
- `game/src/config.js` — recipes, ingredients, timings, layout, palette.
- `game/src/state.js` — the kitchen: orders, hand, board, wok, plate, score.
- `game/src/render.js` — everything drawn on the canvas, food icons included.
- `game/src/input.js` — mouse and keyboard, hit-testing the same layout.
- `game/src/audio.js` — synthesized sound effects and music loop.
- `game/src/shots.js` — the four screenshot scenes, staged by playing the
  real rules with a scripted cook.
- `game/src/main.js` — boot, the fixed-step loop, screens, shot mode.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`.
- `screenshots/` — four real renders of the game in a browser.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Screenshots

`1-play.jpg` — mid-shift: a dish half-built on the plate, mie in the wok,
three tickets on the board. `2-serve.jpg` — a finished plate ready to serve
against a six-second ticket. `3-start.jpg` — the title screen over a kitchen
already mid-service. `4-end.jpg` — the shift report.

---

Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.
