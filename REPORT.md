# makefun-frontend-01 — build report

A dark, dense, read-only make.fun frontend: no build step, no framework, no
webfonts, no external code. All four surfaces run on live data from make.fun's
public API alone.

## The app (app/, 9 files, 39,445 bytes whole)

| File | Bytes | Job |
| --- | ---: | --- |
| index.html | 1,320 | Shell: sticky header (wordmark, nav, builder lookup), `#app`, footer |
| style.css | 12,046 | The whole design system: board table, stat cards, rewards grid, leaderboard, profile, phone layout |
| main.js | 3,426 | Hash router for the 4 routes; lazy `import()` of bounty/profile views; in-place 1s countdown ticker; `window.__shotReady` |
| api.js | 1,799 | Public API with an ETag-revalidating cache and in-flight request dedupe |
| format.js | 2,941 | Escaping, money, counts, UTC dates, countdown parts, leaderboard metric formatting |
| board.js | 4,297 | The board: hero totals (live pots, taking entries, entries so far), every bounty with pot/fee/countdown/entries/status |
| bounty.js | 6,973 | A bounty's page (stat band, rewards grid, markdown description, leaderboard beside it) and the leaderboard's own page, rendered from the API's own column definitions |
| markdown.js | 3,237 | A small safe Markdown renderer (escape first; headings, emphasis, code, tables, lists, quotes) |
| profile.js | 3,406 | Public profile: avatar, record band (entered/placed/won/podiums/best/prizes), full entry history |

**First load (from the dossier's Load block): 6 files, 25,829 raw bytes,
8,713 bytes gzip-9.** Loaded later by `import()`: 3 files, 4,972 bytes gzip-9.

## Routes (each reachable by link and by its own URL)

- `#/` — the bounty board (live pot = prize + entry fees paid in, fee chip or
  "Free entry", ticking countdown, entries, Live / Closing soon / Entries
  closed judged by deadline, not status alone)
- `#/bounty/<slug>` — a bounty's page: summary, stat band, rewards table with
  the live pot (fee shares shown; tables over 24 places fold the tail into one
  summarised cell), rendered description, top-10 leaderboard beside it
- `#/bounty/<slug>/leaderboard` — the leaderboard in full, all shown columns
- `#/u/<handle>` — a public profile (also linked from every leaderboard row
  and from the header's builder lookup)

## API routes used (public, read-only GET)

- `GET /api/competitions?status=open&activity=times&limit=100` — the board in one request
- `GET /api/competitions/<slug>` — bounty detail (fetched in parallel with:)
- `GET /api/competitions/<slug>/leaderboard?rows=first` — top 10 + the API's column definitions (`rows=all` can be 19 MB; `first` keeps a view to two requests)
- `GET /api/profiles/<handle>` — profile, record and solutions

## Screenshots (screenshots/, per shots.json: 1280×800, JPEG)

Captured from the running app on live data with headless Chromium (Playwright
build) driven over CDP through the sandbox's egress proxy: navigate, wait for
`window.__shotReady === true` with real content on screen, capture.

- `1-board.jpg` — 122,512 B — `#/` (cover): hero totals $7,863 in live pots, 7 taking entries, 72,105 entries; all live bounties visible
- `2-bounty.jpg` — 101,697 B — `#/bounty/threejs-fps-02`: stat band, full rewards table, leaderboard top 4+ with medals and judge win rates
- `3-bounty.jpg` — 100,179 B — `#/bounty/bring-the-humans-01`: 100-place rewards (tail folded), signup leaderboard

All ≤ 256 KiB, long side 1280, no console errors during capture.

## Checks run

- `node serve.ts` + headless renders of all four routes: board (11 bounties),
  bounty page (stat band, rewards, description, 10 leaderboard rows), full
  leaderboard page, profile (record band + 23 entries) — all on live data.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` — dossier builds cleanly;
  `out/dossier.json` 476,621 bytes (cap 1.5 MiB).
- Kit check (`node cli/makefun.mjs check --repo . --worktree`): **4 passed,
  0 failed** (competition_open, snapshot, license_osi, entrypoint);
  transcript rows are the site's, from the sealed recording; repo-public /
  owner / created-after-open rows are decided at submission.
- `vendor/makefun-frontend.ts` verified byte-identical to the kit's
  (sha256 4c8da1c8…9240) and untouched.

## Notes

- The sealed recording was started by the main agent before this build and is
  still running; it is stopped/sealed at submission time, not here.
- Screenshots were taken mid-afternoon WIB; board numbers (pots, countdowns)
  are live and will differ by viewing time.
