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
