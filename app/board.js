// The bounty board: every open bounty with its live pot, entry fee, time left
// and entries, ending soonest first; bounties past their deadline are shown as
// closed, because a bounty can read status open until its results publish.

import { count, countdownParts, esc, isOpen, money, timeLeft } from './format.js';

/** The reward as it stands now: the prize plus any entry fees paid into it. */
export const potOf = (b) => Number(b.potUsd ?? b.rewardAmount ?? 0);

function statusChip(b) {
  if (!isOpen(b.deadline)) return '<span class="status-chip status-chip-closed">Entries closed</span>';
  const p = countdownParts(b.deadline);
  if (p.days === 0 && p.hours < 12) return '<span class="status-chip status-chip-live"><span class="live-dot"></span>Closing soon</span>';
  return '<span class="status-chip status-chip-live"><span class="live-dot"></span>Live</span>';
}

function feeCell(b) {
  if (b.entryFeeUsd) return `<span class="fee-chip">${money(b.entryFeeUsd)} entry fee</span>`;
  return '<span class="fee-free">Free entry</span>';
}

function potCell(b, maxPot) {
  const fees = Number(b.entryFeesUsd ?? 0);
  const note = fees > 0 ? `<span class="pot-note">${money(b.rewardAmount)} prize + ${money(fees)} fees</span>` : `<span class="pot-note">${money(b.rewardAmount)} prize</span>`;
  const pct = Math.max(5, Math.round((potOf(b) / maxPot) * 100));
  return `<span class="pot-value">${money(potOf(b))}</span>${note}<span class="pot-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>`;
}

function bountyRow(b, maxPot) {
  const sponsor = b.sponsor?.name ? `<span class="sponsor-badge">${esc(b.sponsor.name)}</span> · ` : '';
  const category = b.category ? ` · <span class="category-chip">${esc(b.category)}</span>` : '';
  const left = timeLeft(b.deadline);
  const urgent = !countdownParts(b.deadline).ended && countdownParts(b.deadline).days === 0 ? ' countdown-urgent' : '';
  const ended = countdownParts(b.deadline).ended ? ' countdown-ended' : '';
  return `
    <tr>
      <td>
        <a class="bounty-name" href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a>
        <div class="bounty-meta">${sponsor}${esc(b.slug)}${category}</div>
      </td>
      <td class="num">${potCell(b, maxPot)}</td>
      <td>${feeCell(b)}</td>
      <td class="num"><span class="countdown${urgent}${ended}" data-deadline="${esc(b.deadline)}">${left}</span></td>
      <td class="num"><span class="entries-count">${count(b.submissionCount)}</span></td>
      <td>${statusChip(b)}</td>
    </tr>`;
}

/** The board page from the competitions list. */
export function boardView(data) {
  const items = [...(data.items ?? [])];
  const live = items.filter((b) => isOpen(b.deadline)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const closed = items.filter((b) => !isOpen(b.deadline)).sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  const totalPot = items.reduce((sum, b) => sum + potOf(b), 0);
  const totalEntries = items.reduce((sum, b) => sum + Number(b.submissionCount ?? 0), 0);
  const maxPot = Math.max(...items.map(potOf), 1);
  const rows = [...live, ...closed].map((b) => bountyRow(b, maxPot)).join('');
  return `
    <section class="board-hero">
      <div>
        <p class="hero-eyebrow"><span class="live-dot"></span>Live now · every pot updates in real time</p>
        <h1 class="board-title">Live bounties</h1>
        <p class="board-sub">Every open competition on make.fun, with the pot it pays today — prize plus entry fees paid in — and the time left to enter.</p>
      </div>
      <div class="hero-stats" aria-label="Board totals">
        <div class="hero-stat"><span class="hero-stat-value">${money(totalPot)}</span><span class="hero-stat-label">In live pots</span></div>
        <div class="hero-stat"><span class="hero-stat-value">${live.length}</span><span class="hero-stat-label">Taking entries</span></div>
        <div class="hero-stat"><span class="hero-stat-value">${count(totalEntries)}</span><span class="hero-stat-label">Entries so far</span></div>
      </div>
    </section>
    <table class="board-table">
      <thead><tr>
        <th scope="col">Bounty</th>
        <th scope="col" class="num">Live pot</th>
        <th scope="col">Entry fee</th>
        <th scope="col" class="num">Time left</th>
        <th scope="col" class="num">Entries</th>
        <th scope="col">Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${closed.length ? '<p class="board-closed-note">Bounties past their deadline stay listed until their results are published; their pages and leaderboards remain open.</p>' : ''}`;
}
