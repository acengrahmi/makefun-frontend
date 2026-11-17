# makefun-frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/acengrahmi/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/acengrahmi/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, read-only web client for make.fun, built as plain static files with no build step and no framework. It reads make.fun's public API and renders four surfaces, each reachable by a link and by its own URL: the live bounty board (every open bounty with its live pot — prize plus entry fees paid in — its entry fee and a ticking countdown), a bounty's own page (rules, rewards grid, top entries), its full leaderboard, and a builder's public profile with their record and entry history. The whole app is 39 KB; the first load is 25,829 bytes raw, 8,713 bytes gzipped, and every view after the board is lazy-loaded.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve the `app/` folder with any static file server.

---

<sub>Entered on [make.fun](https://make.fun/?ref=t155jt27&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
