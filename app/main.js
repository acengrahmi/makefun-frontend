// A make.fun frontend: the bounty board, a page for each bounty with its
// leaderboard, the leaderboard's own page, and public builder profiles, on
// hash routes.
//
//   #/                              the board
//   #/bounty/<slug>                 one bounty, with its leaderboard
//   #/bounty/<slug>/leaderboard    the leaderboard in full
//   #/u/<handle>                    a builder's public profile
//
// The board's modules load with the page; the bounty and profile views load
// on first visit (import()), so the first load stays small. Countdowns tick
// in place — only the changing text updates, never the whole view.
// window.__shotReady is false while a page loads and true once its data is
// on screen, so a screenshot script knows when to capture.

import { getBounty, getBounties, getLeaderboard, getProfile } from './api.js';
import { boardView } from './board.js';
import { timeLeft } from './format.js';

const app = document.getElementById('app');

function loading(label) {
  app.innerHTML = `<p class="loading-note" role="status">Loading ${label}…</p>
    <div class="skeleton-bar" style="width:72%"></div><div class="skeleton-bar" style="width:94%"></div><div class="skeleton-bar" style="width:58%"></div>`;
}

function failed(label, error) {
  app.innerHTML = `<p class="error-note" role="alert">Could not load ${label}. ${error?.message ?? ''} <a href="${location.hash || '#/'}">Try again</a></p>`;
  window.__shotReady = true;
}

async function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const bountyMatch = hash.match(/^#\/bounty\/([^/]+)(\/leaderboard)?\/?$/);
  const profileMatch = hash.match(/^#\/u\/([^/]+)\/?$/);
  try {
    if (bountyMatch) {
      const slug = decodeURIComponent(bountyMatch[1]);
      loading('bounty');
      const [{ bountyView, leaderboardView }, bounty, leaderboard] = await Promise.all([
        import('./bounty.js'),
        getBounty(slug),
        getLeaderboard(slug),
      ]);
      document.title = `${bounty.title} | make.fun bounties`;
      app.innerHTML = bountyMatch[2] ? leaderboardView(bounty, leaderboard) : bountyView(bounty, leaderboard);
    } else if (profileMatch) {
      const handle = decodeURIComponent(profileMatch[1]);
      loading('profile');
      const [{ profileView }, profile] = await Promise.all([import('./profile.js'), getProfile(handle)]);
      document.title = `@${profile.handle} | make.fun bounties`;
      app.innerHTML = profileView(profile);
    } else {
      loading('bounties');
      const data = await getBounties();
      document.title = 'make.fun bounties';
      app.innerHTML = boardView(data);
    }
  } catch (error) {
    failed('that page', error);
    return;
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

/** Tick every visible countdown in place, once a second. */
function tickCountdowns() {
  for (const el of document.querySelectorAll('[data-deadline]')) {
    el.textContent = timeLeft(el.dataset.deadline);
  }
}
setInterval(tickCountdowns, 1000);

/** The header's builder lookup goes to that handle's profile. */
document.getElementById('handle-lookup').addEventListener('submit', (event) => {
  event.preventDefault();
  const handle = new FormData(event.target).get('handle')?.trim().replace(/^@/, '');
  if (handle) location.hash = `#/u/${encodeURIComponent(handle)}`;
});

window.addEventListener('hashchange', render);
render();
