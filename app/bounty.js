// A bounty's page (summary, live pot, rewards table, dates, description and
// its leaderboard) and the leaderboard's own page. The leaderboard renders the
// API's own column definitions, so it fits judged, forecast and signup
// bounties alike; rows=first keeps the answer to the leading entries.

import { potOf } from './board.js';
import { count, dateUtc, esc, isOpen, metric, money, timeLeft } from './format.js';
import { markdown } from './markdown.js';

function statBand(b) {
  const fee = b.entryFeeUsd ? money(b.entryFeeUsd) : 'Free';
  const feeNote = b.entryFeeUsd ? `${count(b.entryFeePayers ?? 0)} paid in` : 'no fee to enter';
  const deadlineNote = isOpen(b.deadline) ? dateUtc(b.deadline) : `closed ${dateUtc(b.deadline)}`;
  return `
    <div class="stat-band">
      <div class="stat-card"><span class="stat-label">Live pot</span><span class="stat-value stat-value-lime">${money(potOf(b))}</span><span class="stat-note">${money(b.rewardAmount)} prize${Number(b.entryFeesUsd ?? 0) > 0 ? ` + ${money(b.entryFeesUsd)} entry fees` : ''}</span></div>
      <div class="stat-card"><span class="stat-label">Entry fee</span><span class="stat-value">${fee}</span><span class="stat-note">${feeNote}</span></div>
      <div class="stat-card"><span class="stat-label">Entries</span><span class="stat-value">${count(b.submissionCount)}</span><span class="stat-note">submitted so far</span></div>
      <div class="stat-card"><span class="stat-label">${isOpen(b.deadline) ? 'Time left' : 'Deadline'}</span><span class="stat-value" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span><span class="stat-note">${deadlineNote}</span></div>
    </div>`;
}

function rewardsPanel(b) {
  const now = Array.isArray(b.rewardsNow) && b.rewardsNow.length
    ? b.rewardsNow
    : Object.entries(b.rewards ?? {}).map(([place, amount]) => ({ place: Number(place), amountUsd: amount, baseUsd: amount, feeShareUsd: '0' }));
  if (!now.length) return '';
  const shown = now.slice(0, 24);
  const pot = potOf(b) || 1;
  const shareBar = (amount) => `<span class="reward-bar" aria-hidden="true"><span style="width:${Math.max(4, Math.round((Number(amount ?? 0) / pot) * 100))}%"></span></span>`;
  const cells = shown.map((r) => `
    <div class="reward-cell${r.place <= 3 ? ' reward-cell-top' : ''}${r.place === 1 ? ' reward-cell-first' : ''}">
      <span class="reward-place">#${r.place}</span>
      <span class="reward-amount">${money(r.amountUsd)}</span>
      ${shareBar(r.amountUsd)}
      ${Number(r.feeShareUsd ?? 0) > 0 ? `<span class="reward-fee-share">incl. ${money(r.feeShareUsd)} fees</span>` : ''}
    </div>`).join('') + (now.length > shown.length ? `
    <div class="reward-cell">
      <span class="reward-place">Places ${shown.length + 1}–${now.length}</span>
      <span class="reward-amount">${money(now.slice(shown.length).reduce((sum, r) => sum + Number(r.amountUsd ?? 0), 0))}</span>
      ${shareBar(now.slice(shown.length).reduce((sum, r) => sum + Number(r.amountUsd ?? 0), 0))}
      <span class="reward-fee-share">shared between them</span>
    </div>` : '');
  return `
    <section class="panel" aria-label="Rewards">
      <h2 class="panel-title">Rewards — ${count(now.length)} places share ${money(potOf(b))}</h2>
      <div class="rewards-grid">${cells}</div>
    </section>`;
}

/** The columns a leaderboard shows: the ranked metric first, the rest after, hidden ones left out. */
export function visibleColumns(lb) {
  const cols = (lb.columns ?? []).filter((c) => !c.hidden && c.key !== 'valid');
  const rankKey = lb.rank_key ?? lb.competition?.rank_key;
  return cols.sort((a, b) => (a.key === rankKey ? -1 : 0) - (b.key === rankKey ? -1 : 0));
}

function leaderboardRows(lb, cols) {
  return (lb.entries ?? []).map((e) => {
    const metrics = cols.map((c) => `<td class="num"><span class="score-value">${metric(c.key, e.display?.[c.key])}</span></td>`).join('');
    return `
    <tr>
      <td><span class="rank-badge rank-${e.rank}">${e.rank}</span></td>
      <td>
        <div class="entry-title">${esc(e.title || 'Untitled entry')}${e.house ? ' <span class="category-chip">house</span>' : ''}</div>
        <a class="entry-handle" href="#/u/${encodeURIComponent(e.handle)}">@${esc(e.handle)}</a>
      </td>
      ${metrics}
    </tr>`;
  }).join('');
}

/** A leaderboard as a table, from the API's columns and each entry's display values. */
export function leaderboardTable(lb, maxCols = 3) {
  const cols = visibleColumns(lb).slice(0, maxCols);
  if (!(lb.entries ?? []).length) return '<p class="empty-note">No entries yet.</p>';
  const head = cols.map((c) => `<th scope="col" class="num">${esc(c.title)}</th>`).join('');
  return `
    <table class="leaderboard-table">
      <thead><tr><th scope="col">#</th><th scope="col">Entry</th>${head}</tr></thead>
      <tbody>${leaderboardRows(lb, cols)}</tbody>
    </table>`;
}

function bountyHead(b) {
  const sponsor = b.sponsor?.name ? `${esc(b.sponsor.name)}${b.sponsor.isVerified ? ' ✓' : ''} · ` : '';
  const status = isOpen(b.deadline) ? 'Taking entries' : 'Entries closed';
  return `
    <p><a class="back-link" href="#/">← All bounties</a></p>
    <div class="bounty-head">
      <h1 class="bounty-title">${esc(b.title)}</h1>
      <p class="bounty-summary">${esc(b.summary ?? '')}</p>
      <p class="bounty-meta">${sponsor}${b.category ? `<span class="category-chip">${esc(b.category)}</span> ` : ''}<span class="status-chip ${isOpen(b.deadline) ? 'status-chip-live' : 'status-chip-closed'}">${status}</span></p>
    </div>`;
}

/** A bounty's page: head, stat band, rewards and description beside the leaderboard. */
export function bountyView(b, lb) {
  return `
    ${bountyHead(b)}
    ${statBand(b)}
    <div class="bounty-grid">
      <div>
        ${rewardsPanel(b)}
        <section class="panel" aria-label="About this bounty">
          <h2 class="panel-title">About this bounty</h2>
          <div class="description">${markdown(b.description)}</div>
        </section>
      </div>
      <section class="panel" aria-label="Leaderboard">
        <div class="panel-title-row">
          <h2 class="panel-title">Leaderboard</h2>
          <a class="panel-link" href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Full table →</a>
        </div>
        ${leaderboardTable(lb, 1)}
        <p class="leaderboard-note">Top ${count((lb.entries ?? []).length)} of ${count(b.submissionCount)} entries · ${esc(lb.title ?? 'Results')} · updated live from the API.</p>
      </section>
    </div>`;
}

/** The leaderboard's own page: every shown column, the leaders in full. */
export function leaderboardView(b, lb) {
  return `
    <p><a class="back-link" href="#/bounty/${encodeURIComponent(b.slug)}">← ${esc(b.title)}</a></p>
    <div class="bounty-head">
      <h1 class="bounty-title">Leaderboard</h1>
      <p class="bounty-summary">${esc(b.title)} — ${esc(lb.title ?? 'Results')}, ranked by ${esc(visibleColumns(lb)[0]?.title ?? 'score')}. The pot is ${money(potOf(b))} across ${count(b.submissionCount)} entries.</p>
    </div>
    <section class="panel" aria-label="Leaderboard">
      ${leaderboardTable(lb, 4)}
      <p class="leaderboard-note">Showing the leading ${count((lb.entries ?? []).length)} entries; the board's first rows are what the API returns for a live page.</p>
    </section>`;
}
