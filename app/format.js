// Small helpers for showing API values: escaping, money, dates and live countdowns.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A dollar amount ('1000.00' or 0.5) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0';
  return n.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** A count with thousands separators: 13,765. */
export function count(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
}

/** A large score as a compact number: 973639 -> '973.6k'. */
export function compact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

/** A date in UTC: 'Nov 24, 2026, 5:00 PM UTC'. */
export function dateUtc(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}

/** A join date: 'Joined Nov 2026'. */
export function monthYear(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Whether a deadline is still ahead. */
export function isOpen(iso) {
  return new Date(iso).getTime() > Date.now();
}

/** The time until a deadline as parts: { days, hours, minutes, seconds, ended }. */
export function countdownParts(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const s = Math.floor(ms / 1000);
  return {
    ended: false,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** The time until a deadline as text: '7d 4h left', '3h 12m left', '41m 09s left', or 'ended'. */
export function timeLeft(iso) {
  const p = countdownParts(iso);
  if (p.ended) return 'ended';
  if (p.days > 0) return `${p.days}d ${p.hours}h left`;
  if (p.hours > 0) return `${p.hours}h ${p.minutes}m left`;
  return `${p.minutes}m ${String(p.seconds).padStart(2, '0')}s left`;
}

/** A leaderboard metric: judge scores (per-million) as a win-rate %, bytes as KB, the rest grouped. */
export function metric(key, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return esc(raw ?? '');
  if (key === 'judge' || key === 'judge_low' || key === 'judge_high') return `${(n / 10000).toFixed(1)}%`;
  if (key === 'bytes') return n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`;
  return count(n);
}
