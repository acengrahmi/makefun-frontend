// An account's public profile: who they are, their record across every
// bounty, and the entries they have submitted.

import { count, dateUtc, esc, money, monthYear } from './format.js';

function avatar(p) {
  const initial = esc((p.display_name || p.handle || '?').trim().charAt(0).toUpperCase() || '?');
  if (p.image) {
    return `<img class="profile-avatar" src="${esc(p.image)}" alt="" crossorigin="anonymous" width="84" height="84" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'profile-avatar profile-avatar-fallback',textContent:'${initial}'}))">`;
  }
  return `<span class="profile-avatar profile-avatar-fallback" aria-hidden="true">${initial}</span>`;
}

function recordBand(record) {
  if (!record) return '';
  const stats = [
    [record.competitions_entered, 'Entered'],
    [record.competitions_placed, 'Placed'],
    [record.competitions_won, 'Won'],
    [record.podium_finishes, 'Podiums'],
    [record.best_placement ? `#${record.best_placement}` : '—', 'Best finish'],
    [money(record.prize_usd ?? 0), 'Prizes'],
  ];
  const cells = stats.map(([value, label]) => `
    <div class="stat-card"><span class="stat-value">${typeof value === 'number' ? count(value) : esc(value)}</span><span class="stat-label">${label}</span></div>`).join('');
  return `<div class="record-band" aria-label="Record">${cells}</div>`;
}

function solutionRow(s) {
  const comp = s.competition ?? {};
  const placement = s.placement ? `<span class="placement-badge">#${s.placement}</span>` : '—';
  const prize = Number(s.prize_usd ?? 0) > 0 ? ` · ${money(s.prize_usd)}` : '';
  const score = s.score?.display ?? s.score?.value;
  const scoreText = score != null && score !== '' ? ` · ${esc(s.score?.column?.title ?? 'Score')} ${esc(score)}` : '';
  return `
    <div class="solution-row">
      <div class="solution-main">
        <a class="solution-competition" href="#/bounty/${encodeURIComponent(comp.slug ?? '')}">${esc(comp.title ?? comp.slug ?? '')}</a>
        <div class="solution-title">${esc(s.title || 'Untitled entry')}</div>
      </div>
      <div class="solution-facts">${placement}${prize}${scoreText}<br>${dateUtc(s.entered_at)}</div>
    </div>`;
}

/** A public profile page from /profiles/<handle>. */
export function profileView(p) {
  const name = p.display_name || p.handle;
  const links = [
    p.github_login ? `<a href="https://github.com/${encodeURIComponent(p.github_login)}">GitHub @${esc(p.github_login)}</a>` : '',
    p.x ? `<span>X @${esc(p.x)}</span>` : '',
    p.discord ? `<span>Discord ${esc(p.discord)}</span>` : '',
    p.joined_at ? `<span>Joined ${monthYear(p.joined_at)}</span>` : '',
  ].filter(Boolean).join(' · ');
  const solutions = (p.solutions ?? []).map(solutionRow).join('');
  return `
    <p><a class="back-link" href="#/">← All bounties</a></p>
    <div class="profile-head">
      ${avatar(p)}
      <div>
        <h1 class="profile-name">${esc(name)}</h1>
        <span class="profile-handle">@${esc(p.handle)}</span>
        ${p.bio ? `<p class="profile-bio">${esc(p.bio)}</p>` : ''}
        <p class="profile-meta">${links}</p>
      </div>
    </div>
    ${recordBand(p.record)}
    <section class="panel" aria-label="Entries">
      <h2 class="panel-title">Entries — ${count((p.solutions ?? []).length)}</h2>
      ${solutions || '<p class="empty-note">No entries yet.</p>'}
    </section>`;
}
