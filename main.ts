// Dapur Kilat — the hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory itself is never removed or re-permissioned: it is
// created (recursively, when missing) and only its children are cleared,
// so the program also works when /output is a mount the runner owns. The
// copy below is idempotent, so running twice writes the same bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
for (const child of readdirSync(out)) {
  rmSync(join(out, child), { recursive: true, force: true });
}
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Caps taken from the scorer's own limits: the dossier text is capped at
// 160 KiB, at most 4 screenshots of at most 256 KiB each, and game/ holds
// at most 993 files and directories and 48 MiB in all, every path at most
// 1000 bytes. Enforcing them here means an entry this program accepts is
// one the scorer accepts on these rows too.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
