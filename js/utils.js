// ── HTML Escape Utility ───────────────────────────────
// Use this whenever user-controlled or DB-sourced strings
// are injected into innerHTML template literals.
// Prevents XSS through stored/reflected injection.

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}

window.escapeHtml = escapeHtml;

function avatarHTML(url, init, size, ringColor, bgColor) {
  ringColor = ringColor || 'rgba(255,255,255,0.2)';
  bgColor   = bgColor   || 'rgba(255,255,255,0.06)';
  try {
    const u = new URL(url || '');
    if (u.protocol === 'https:') {
      return `<img src="${escapeHtml(u.href)}" alt="${escapeHtml(init)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2.5px solid ${ringColor};display:block;flex-shrink:0">`;
    }
  } catch {}
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;background:${bgColor};border:2.5px solid ${ringColor};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${Math.max(10, Math.floor(size / 3))}px;color:${ringColor}">${escapeHtml(init)}</div>`;
}

window.avatarHTML = avatarHTML;
