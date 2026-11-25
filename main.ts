// Ember & Thyme — the entrypoint (Node 22, standard library only).
//
// The game is plain static files under game/: index.html plus its ES modules,
// no library, no build step, no network request. This program is the hand-in:
// it copies game/ and screenshots/ from beside this file into /output and
// writes /output/dossier.json — the summary the judge reads — using the
// vendored make.fun library (vendor/makefun-game.ts, the kit's copy).
//
// To play it locally, serve game/ with any static server and open
// http://localhost:8080. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The gate's caps, as the kit's reference/gate.json states them. Only
// text_max_bytes shapes the dossier's bytes; the rest refuse an entry the
// sealed scorer would refuse (more than 4 screenshots, or one over 256 KiB;
// more than 993 files in game/, or 48 MiB of game files in all; a path under
// game/ over 1000 bytes). game/ counts beside /output's own 1000-entry cap,
// its screenshots/ and dossier.json, so the limits below leave them room.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn() {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  }

  // buildDossier reads the copied files back and writes the dossier from
  // them, so what it writes is always exactly what the scorer re-checks.
  // The run is deterministic: same files in, same dossier bytes out.
  writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_LIMITS));
}

handIn();
