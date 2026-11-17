// A small, safe Markdown renderer for bounty descriptions: the text is escaped
// first, then a conservative subset (headings, emphasis, code, links, lists,
// tables, quotes) is turned into HTML. Links may only point at make.fun or a
// hash route of this app.

import { esc } from './format.js';

function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
      const safe = /^(https:\/\/make\.fun|#\/)/.test(url) ? url : '#';
      return `<a href="${safe}">${label}</a>`;
    });
}

function tableRow(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

function isTableDivider(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');
}

/** Markdown text to an HTML string for a .description container. */
export function markdown(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const code = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i += 1; }
      i += 1;
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
    } else if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      out.push(`<h${level}>${inline(line.slice(level + 1))}</h${level}>`);
      i += 1;
    } else if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const head = tableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') { rows.push(tableRow(lines[i])); i += 1; }
      const thead = head.map((c) => `<th>${inline(c)}</th>`).join('');
      const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`);
    } else if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+[.)]\s+/.test(lines[i]))) {
        items.push(`<li>${inline(lines[i].replace(/^\s*(?:[-*]|\d+[.)])\s+/, ''))}</li>`);
        i += 1;
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
    } else if (/^>\s?/.test(line)) {
      const quoted = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quoted.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      out.push(`<blockquote>${inline(quoted.join(' '))}</blockquote>`);
    } else if (line.trim() === '') {
      i += 1;
    } else {
      const para = [line.trim()];
      i += 1;
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3}\s|```|>|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])) {
        para.push(lines[i].trim());
        i += 1;
      }
      out.push(`<p>${inline(para.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}
