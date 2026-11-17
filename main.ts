// makefun-frontend — entry program for the makefun-frontend-01 bounty.
//
// Written for this entry: a small, strict hand-in program around the vendored
// dossier builder. It does three things, in order:
//   1. Pre-flight: refuse to hand in a broken entry. app/ must be present and
//      screenshots/ must hold exactly three shots, none over the 256 KiB cap
//      the scorer enforces — failing here is loud and early, not a surprise
//      rejection after submission.
//   2. Hand-in: copy app/ and screenshots/ beside the dossier and write
//      dossier.json with the vendored buildDossier, byte for byte as the
//      scorer's own copy writes it (that call is untouched below).
//   3. Report: read the finished dossier back and print what was handed in —
//      file counts, first-load bytes and the screenshot names — all computed
//      from the dossier itself, never from a second measurement.
// Node 22, standard library only, like the frontend it hands in.

// A working makefun-frontend-01 entry (Node 22, standard library only): the frontend is this directory's app/
// folder, plain static files a browser opens at app/index.html (ES modules, CSS, no build step), reading make.fun's
// public API at https://make.fun/api. The program hands it in: it copies app/ and screenshots/ from beside this file
// to /output and writes /output/dossier.json, the summary the judge reads (your screenshots, the first load's files
// and bytes, and your source), with the vendored make.fun library. Leave vendor/makefun-frontend.ts as it is: the
// scorer requires dossier.json to be byte for byte what its own copy writes.
//
// A starting point, not a winner: a plain board of open bounties and a page for each. Build your frontend in app/
// (a leaderboard, profiles, speed, ease of use), put 3 PNG or JPEG screenshots of it running on live data in
// screenshots/ (the first by name is the cover; shots.json says which views this starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight (mine): the scorer refuses an entry with more than 3 screenshots
// or one over 256 KiB, and a missing app/ would hand in an empty frontend.
// Check the sources beside this file before copying anything, and fail loudly
// — a thrown error exits non-zero with the reason on stderr.
const SCREENSHOT_LIMIT = 3;
const SCREENSHOT_MAX_BYTES = 262144; // 256 KiB, the scorer's per-shot cap

function preflight() {
  const problems = [];
  if (!existsSync(join(here, 'app'))) problems.push('app/ is missing: nothing to hand in');
  const shotsDir = join(here, 'screenshots');
  if (!existsSync(shotsDir)) {
    problems.push('screenshots/ is missing: the judge reads the entry from its screenshots');
  } else {
    const shots = readdirSync(shotsDir).filter((name) => statSync(join(shotsDir, name)).isFile());
    if (shots.length !== SCREENSHOT_LIMIT) {
      problems.push(`screenshots/ holds ${shots.length} file(s); exactly ${SCREENSHOT_LIMIT} are required`);
    }
    for (const name of shots) {
      const bytes = statSync(join(shotsDir, name)).size;
      if (bytes > SCREENSHOT_MAX_BYTES) {
        problems.push(`screenshots/${name} is ${bytes} bytes; the cap is ${SCREENSHOT_MAX_BYTES}`);
      }
    }
  }
  if (problems.length > 0) throw new Error(`pre-flight failed:\n  - ${problems.join('\n  - ')}`);
}

preflight();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 3 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 16 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 3, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);

// Report (mine): read the dossier back and summarise what was handed in,
// taking every figure from the dossier itself — the "## Load" totals and the
// image list — so this report can never disagree with what the judge reads.
const dossier = JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
const firstLoad = dossier.text.match(/^First load: (\d+) files, (\d+) bytes raw, (\d+) bytes gzip-9$/m);
const wholeApp = dossier.text.match(/^Whole app: (\d+) files, (\d+) bytes/m);
const shotNames = dossier.images.map((image) => image.name);
console.log(`handed in: ${wholeApp[1]} app files (${wholeApp[2]} bytes); first load ${firstLoad[1]} files, ${firstLoad[2]} bytes raw / ${firstLoad[3]} bytes gzip-9`);
console.log(`screenshots (${shotNames.length}): ${shotNames.join(', ')}; cover: ${shotNames[dossier.cover]}`);
