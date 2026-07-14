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
  const fontSize = Math.max(10, Math.floor(size / 3));
  const fallback = `<div style="width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;background:${bgColor};border:2.5px solid ${ringColor};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${fontSize}px;color:${ringColor}">${escapeHtml(init)}</div>`;
  try {
    const u = new URL(url || '');
    if (u.protocol === 'https:') {
      // Google/OAuth avatar hosts often 403 hotlinked requests without no-referrer,
      // and onerror swaps in the initials fallback instead of leaving a broken-image icon.
      return `<span style="position:relative;display:inline-block;width:${size}px;height:${size}px;flex-shrink:0">
        <img src="${escapeHtml(u.href)}" alt="${escapeHtml(init)}" referrerpolicy="no-referrer" loading="lazy"
             style="width:100%;height:100%;border-radius:50%;object-fit:cover;border:2.5px solid ${ringColor};display:block"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;position:absolute;inset:0;border-radius:50%;background:${bgColor};border:2.5px solid ${ringColor};align-items:center;justify-content:center;font-weight:800;font-size:${fontSize}px;color:${ringColor}">${escapeHtml(init)}</div>
      </span>`;
    }
  } catch {}
  return fallback;
}

window.avatarHTML = avatarHTML;

// ── Custom themed <select> replacement ────────────────
// Hides a native <select> and drives it from a themed button + option
// list instead, since native option popups can't be styled. The select
// stays in the DOM (display:none) so existing value/change-event code
// keeps working untouched.
function buildCustomSelect(id, { wrapClass = 'lb-custom-wrap', triggerClass = 'lb-custom-trigger', panelClass = 'lb-custom-panel', optionClass = 'lb-custom-option' } = {}) {
  const sel = document.getElementById(id);
  if (!sel || sel.dataset.customBuilt) return;
  sel.dataset.customBuilt = '1';

  const chevron = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  const wrap = document.createElement('div');
  wrap.className = wrapClass;
  if (sel.style.flex) wrap.style.flex = sel.style.flex;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = triggerClass;

  const panel = document.createElement('div');
  panel.className = panelClass;

  function renderOptions() {
    panel.innerHTML = '';
    Array.from(sel.options).forEach(o => {
      const item = document.createElement('div');
      item.className = optionClass + (o.selected ? ' selected' : '');
      item.dataset.value = o.value;
      item.textContent = o.text;
      item.addEventListener('click', () => {
        sel.value = o.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        updateTrigger();
        closePanel();
      });
      panel.appendChild(item);
    });
  }

  function updateTrigger() {
    const cur = sel.options[sel.selectedIndex];
    trigger.innerHTML = `<span>${cur?.text || ''}</span>${chevron}`;
    panel.querySelectorAll(`.${optionClass}`).forEach(item => {
      item.classList.toggle('selected', item.dataset.value === sel.value);
    });
  }

  function closePanel() {
    panel.classList.remove('open');
    trigger.classList.remove('open');
    wrap.classList.remove('open');
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = panel.classList.contains('open');
    document.querySelectorAll(`.${panelClass}.open`).forEach(p => {
      p.classList.remove('open');
      p.previousElementSibling?.classList.remove('open');
      p.closest(`.${wrapClass}`)?.classList.remove('open');
    });
    if (!isOpen) {
      panel.classList.add('open');
      trigger.classList.add('open');
      wrap.classList.add('open');
    }
  });

  document.addEventListener('click', closePanel);

  renderOptions();
  updateTrigger();
  sel.style.display = 'none';
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(trigger);
  wrap.appendChild(panel);
  wrap.appendChild(sel);

  // Options are re-populated after data loads (e.g. district list) —
  // watch for that and re-render the themed list.
  const observer = new MutationObserver(() => { renderOptions(); updateTrigger(); });
  observer.observe(sel, { childList: true });
}

window.buildCustomSelect = buildCustomSelect;
