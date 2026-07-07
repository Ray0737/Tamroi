// ── Figure Graph Module ──────────────────────────────
const FigureGraphModule = (() => {
  const RADIUS      = 22;   // node circle radius
  const LABEL_Y     = 38;   // label offset below center
  const FLY_MS      = 450;  // camera fly duration
  const TRAIT_STAGGER = 60; // ms between trait chip animations
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let _overlay, _svg, _svgRoot, _traitContainer, _detailCard;
  let _nodes    = [];   // { id, label, sub, emoji, class, captured, traits, detail, x, y, el }
  let _edges    = [];   // { source, target, label, el }
  let _camera   = { x: 0, y: 0, scale: 1 };
  let _focusId  = null;
  let _allFigs  = [];
  let _captures = new Set();
  let _currentFigureId = null;

  // ── Camera ──────────────────────────────────────────
  let _camTarget = null, _camStart = null, _camT0 = null, _camRaf = null;

  function _camApply() {
    if (_svgRoot) _svgRoot.setAttribute('transform',
      `translate(${_camera.x} ${_camera.y}) scale(${_camera.scale})`);
  }

  function _camFlyTo(tx, ty, ts) {
    _camTarget = { x: tx, y: ty, scale: ts };
    _camStart  = { ..._camera };
    _camT0     = performance.now();
    if (_camRaf) cancelAnimationFrame(_camRaf);
    if (REDUCED_MOTION) {
      _camera = { ..._camTarget };
      _camApply();
      return;
    }
    function step(now) {
      const t = Math.min((now - _camT0) / FLY_MS, 1);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      _camera.x     = _camStart.x + (_camTarget.x - _camStart.x) * e;
      _camera.y     = _camStart.y + (_camTarget.y - _camStart.y) * e;
      _camera.scale = _camStart.scale + (_camTarget.scale - _camStart.scale) * e;
      _camApply();
      if (t < 1) _camRaf = requestAnimationFrame(step);
    }
    _camRaf = requestAnimationFrame(step);
  }

  // ── Layout ──────────────────────────────────────────
  function _layout(focusId) {
    if (!_nodes.length) return;
    const focus = _nodes.find(n => n.id === focusId) || _nodes[0];
    const others = _nodes.filter(n => n.id !== focus.id);
    const cx = 0, cy = 0;
    focus.x = cx; focus.y = cy;
    const r = Math.max(130, 60 * Math.sqrt(others.length));
    others.forEach((n, i) => {
      const a = (2 * Math.PI * i) / others.length - Math.PI / 2;
      n.x = cx + r * Math.cos(a);
      n.y = cy + r * Math.sin(a);
    });
  }

  // ── Render ───────────────────────────────────────────
  function _ns(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }

  function _classColor(cls) {
    return { S: '#FF7E55', A: '#7BC67E', B: '#66A3D9', C: '#9DA3AE' }[cls] || '#9DA3AE';
  }

  function _renderEdges() {
    _svg.querySelectorAll('.fg-edge').forEach(e => e.remove());
    _edges.forEach(edge => {
      const src = _nodes.find(n => n.id === edge.source);
      const tgt = _nodes.find(n => n.id === edge.target);
      if (!src || !tgt) return;
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2 - 40;
      const path = _ns('path');
      path.classList.add('fg-edge');
      path.setAttribute('d', `M${src.x},${src.y} Q${mx},${my} ${tgt.x},${tgt.y}`);
      edge.el = path;
      _svgRoot.insertBefore(path, _svgRoot.firstChild);
    });
  }

  function _renderNodes() {
    _svg.querySelectorAll('.fg-node').forEach(e => e.remove());
    _nodes.forEach(node => {
      const g = _ns('g');
      g.classList.add('fg-node');
      g.setAttribute('data-id', node.id);
      g.style.cursor = 'pointer';

      const color = _classColor(node.class);

      // Glow ring for selected state
      const glow = _ns('circle');
      glow.classList.add('fg-glow');
      glow.setAttribute('r', RADIUS + 6);
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', color);
      glow.setAttribute('stroke-width', '3');
      glow.setAttribute('opacity', '0');
      glow.style.transition = 'opacity .3s';

      // Avatar circle
      const circle = _ns('circle');
      circle.setAttribute('r', RADIUS);
      circle.setAttribute('fill', node.captured ? `${color}30` : 'rgba(255,255,255,.05)');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', node.captured ? '2.5' : '1.5');
      circle.setAttribute('opacity', node.captured ? '1' : '.5');

      // Emoji
      const text = _ns('text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', '18');
      text.textContent = node.captured ? node.emoji : '🔒';

      // Name label
      const label = _ns('text');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('y', LABEL_Y);
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', node.captured ? '#fff' : 'rgba(255,255,255,.35)');
      label.setAttribute('font-family', 'Kanit, sans-serif');
      label.textContent = node.captured ? (node.label || '') : '???';

      // Relation label (appears on edge, placed near midpoint)
      g.appendChild(glow);
      g.appendChild(circle);
      g.appendChild(text);
      g.appendChild(label);
      g.setAttribute('transform', `translate(${node.x},${node.y})`);

      // Drag support
      let _dragging = false, _didMove = false, _dx = 0, _dy = 0, _px = 0, _py = 0;
      g.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        e.stopPropagation();
        _dragging = true;
        _didMove  = false;
        g.setPointerCapture(e.pointerId);
        const pt = _svgPoint(e);
        _px = pt.x - node.x;
        _py = pt.y - node.y;
      });
      g.addEventListener('pointermove', e => {
        if (!_dragging) return;
        const pt = _svgPoint(e);
        const nx = pt.x - _px, ny = pt.y - _py;
        if (Math.abs(nx - node.x) > 2 || Math.abs(ny - node.y) > 2) _didMove = true;
        node.x = nx; node.y = ny;
        g.setAttribute('transform', `translate(${node.x},${node.y})`);
        _renderEdges();
        if (_focusId === node.id) _updateTraitChips(node);
      });
      g.addEventListener('pointerup', () => {
        _dragging = false;
        if (!_didMove) _focus(node);
      });

      node.el = g;
      _svgRoot.appendChild(g);
    });
  }

  function _svgPoint(e) {
    const pt = _svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(_svgRoot.getScreenCTM().inverse());
  }

  // ── Pan/Zoom ─────────────────────────────────────────
  let _panning = false, _panStart = null;
  let _pinchDist = null;

  function _bindPan() {
    _svg.addEventListener('pointerdown', e => {
      if (e.target !== _svg && !e.target.closest('#fg-svg > g:not(.fg-node)') && e.target.closest('.fg-node')) return;
      if (e.button !== 0) return;
      _panning = true;
      _panStart = { x: e.clientX - _camera.x, y: e.clientY - _camera.y };
      _svg.setPointerCapture(e.pointerId);
    });
    _svg.addEventListener('pointermove', e => {
      if (!_panning) return;
      _camera.x = e.clientX - _panStart.x;
      _camera.y = e.clientY - _panStart.y;
      _camApply();
    });
    _svg.addEventListener('pointerup', () => { _panning = false; });

    _svg.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      _camera.scale = Math.max(0.3, Math.min(3, _camera.scale * factor));
      _camApply();
    }, { passive: false });

    // Two-finger pinch
    let _touches = {};
    _svg.addEventListener('touchstart', e => {
      [...e.changedTouches].forEach(t => { _touches[t.identifier] = { x: t.clientX, y: t.clientY }; });
    }, { passive: true });
    _svg.addEventListener('touchmove', e => {
      const ids = Object.keys(_touches);
      if (ids.length !== 2) return;
      const [a, b] = ids.map(id => {
        const t = [...e.touches].find(t => t.identifier === +id);
        return t ? { x: t.clientX, y: t.clientY } : _touches[id];
      });
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (_pinchDist !== null) {
        _camera.scale = Math.max(0.3, Math.min(3, _camera.scale * (dist / _pinchDist)));
        _camApply();
      }
      _pinchDist = dist;
    }, { passive: true });
    _svg.addEventListener('touchend', () => { _touches = {}; _pinchDist = null; });
  }

  // ── Focus ────────────────────────────────────────────
  function _focus(node) {
    _focusId = node.id;
    _svgRoot.classList.add('fg-focused');

    // Mark connected edges
    _edges.forEach(edge => {
      const connected = edge.source === node.id || edge.target === node.id;
      if (edge.el) edge.el.classList.toggle('fg-connected', connected);
    });

    // Mark selected node
    _nodes.forEach(n => n.el?.classList.toggle('fg-selected', n.id === node.id));

    // Glow on selected
    const glowEl = node.el?.querySelector('.fg-glow');
    if (glowEl) glowEl.setAttribute('opacity', '0.6');

    // Fly camera to center node
    const vw = _overlay.clientWidth / 2;
    const vh = _overlay.clientHeight / 2;
    const targetScale = 1.5;
    _camFlyTo(vw - node.x * targetScale, vh - node.y * targetScale, targetScale);

    // Trait chips
    setTimeout(() => _showTraitChips(node), REDUCED_MOTION ? 0 : 300);

    // Detail card
    _fillDetailCard(node);
    _detailCard.classList.add('fg-card-visible');
  }

  function _unfocus() {
    _focusId = null;
    _svgRoot.classList.remove('fg-focused');
    _edges.forEach(e => e.el?.classList.remove('fg-connected'));
    _nodes.forEach(n => {
      n.el?.classList.remove('fg-selected');
      n.el?.querySelector('.fg-glow')?.setAttribute('opacity', '0');
    });
    _hideTraitChips();
    _detailCard.classList.remove('fg-card-visible');
    // Restore neutral camera
    _camFlyTo(0, 0, 1);
  }

  // ── Trait chips ──────────────────────────────────────
  function _nodeToScreen(node) {
    const svgRect = _svg.getBoundingClientRect();
    const x = node.x * _camera.scale + _camera.x + svgRect.left;
    const y = node.y * _camera.scale + _camera.y + svgRect.top;
    return { x, y };
  }

  function _showTraitChips(node) {
    _hideTraitChips();
    if (!node.traits?.length || REDUCED_MOTION) return;
    const { x, y } = _nodeToScreen(node);
    const angles = [0, 45, 90, 135, 180, 225, 270, 315].slice(0, node.traits.length);
    node.traits.forEach((trait, i) => {
      const chip = document.createElement('div');
      chip.className = 'fg-trait-chip';
      chip.textContent = trait;
      const a = (angles[i] ?? 0) * (Math.PI / 180) - Math.PI / 2;
      const dist = 75 + (RADIUS * _camera.scale);
      chip.style.left = `${x + dist * Math.cos(a)}px`;
      chip.style.top  = `${y + dist * Math.sin(a)}px`;
      chip.style.transitionDelay = `${i * TRAIT_STAGGER}ms`;
      _traitContainer.appendChild(chip);
      requestAnimationFrame(() => requestAnimationFrame(() => chip.classList.add('fg-chip-visible')));
    });
  }

  function _updateTraitChips(node) {
    if (_focusId !== node.id) return;
    const { x, y } = _nodeToScreen(node);
    const chips = _traitContainer.querySelectorAll('.fg-trait-chip');
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    chips.forEach((chip, i) => {
      const a = (angles[i] ?? 0) * (Math.PI / 180) - Math.PI / 2;
      const dist = 75 + (RADIUS * _camera.scale);
      chip.style.left = `${x + dist * Math.cos(a)}px`;
      chip.style.top  = `${y + dist * Math.sin(a)}px`;
    });
  }

  function _hideTraitChips() {
    _traitContainer.innerHTML = '';
  }

  // ── Detail card ─────────────────────────────────────
  function _fillDetailCard(node) {
    document.getElementById('fg-detail-name').textContent = node.captured ? (node.label || '') : '???';
    document.getElementById('fg-detail-sub').textContent  = node.captured ? (node.sub || '') : '';
    document.getElementById('fg-detail-desc').textContent = node.captured ? (node.detail?.description || '') : 'ยังไม่ถูกจับ — ไปสำรวจพื้นที่เพื่อพบตัวละครนี้';

    const relsEl = document.getElementById('fg-detail-relations');
    const connectedRels = _edges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => escapeHtml(e.label || ''));
    relsEl.innerHTML = connectedRels.map(r => `<span class="fg-detail-rel-chip">${r}</span>`).join('');

    const bioBtn = document.getElementById('btn-fg-open-bio');
    if (bioBtn) {
      bioBtn.style.display = node.captured ? '' : 'none';
      bioBtn.onclick = () => {
        close();
        setTimeout(() => window.CollectionModule?.showDetail(node.id), 100);
      };
    }
  }

  // ── Build graph data ─────────────────────────────────
  async function _build(focusId) {
    _allFigs   = window.CollectionModule ? [] : [];
    _captures  = new Set();

    // Gather figures from CollectionModule internals via public API if possible
    // Fall back to DB.Figures.getAll()
    let figs;
    try {
      const [allFigsRes, captRes, relsRes] = await Promise.all([
        DB.Figures.getAll(),
        DB.Figures.getRelations(focusId),
        DB.Figures.getAllRelations(),
      ]);
      figs = allFigsRes;

      // Build capture set from CollectionModule
      figs.forEach(f => {
        if (window.CollectionModule?.isCaptured(f.id)) _captures.add(f.id);
      });

      // Neighborhood: focus + 1-hop neighbours
      const neighbourIds = new Set([focusId]);
      relsRes.forEach(r => {
        if (r.figure_id === focusId || r.related_id === focusId) {
          neighbourIds.add(r.figure_id);
          neighbourIds.add(r.related_id);
        }
      });
      // Also add 2-hop from direct neighbours for a richer graph
      relsRes.forEach(r => {
        if (neighbourIds.has(r.figure_id) || neighbourIds.has(r.related_id)) {
          neighbourIds.add(r.figure_id);
          neighbourIds.add(r.related_id);
        }
      });

      const focusFig = figs.find(f => f.id === focusId);

      _nodes = figs
        .filter(f => neighbourIds.has(f.id))
        .map(f => ({
          id:       f.id,
          label:    f.name_th || '',
          sub:      f.name_en || '',
          emoji:    f.image_emoji || '🏛️',
          class:    f.class || 'C',
          captured: _captures.has(f.id) || f.id === focusId,
          traits:   [f.era, f.district_id?.replace(/_/g,' ')].filter(Boolean),
          detail:   { description: f.description || '' },
          x: 0, y: 0, el: null,
        }));

      // If no relations, show just the focus node
      if (_nodes.length === 0 && focusFig) {
        _nodes = [{
          id:       focusFig.id,
          label:    focusFig.name_th || '',
          sub:      focusFig.name_en || '',
          emoji:    focusFig.image_emoji || '🏛️',
          class:    focusFig.class || 'C',
          captured: true,
          traits:   [focusFig.era, focusFig.district_id?.replace(/_/g,' ')].filter(Boolean),
          detail:   { description: focusFig.description || '' },
          x: 0, y: 0, el: null,
        }];
      }

      _edges = relsRes
        .filter(r => neighbourIds.has(r.figure_id) && neighbourIds.has(r.related_id))
        .map(r => ({ source: r.figure_id, target: r.related_id, label: r.relation_th || '', el: null }));

    } catch (err) {
      console.error('[FigureGraph] build error', err);
      _nodes = [];
      _edges = [];
    }
  }

  // ── DOM setup ────────────────────────────────────────
  function _buildDOM() {
    _overlay = document.getElementById('figure-graph-overlay');
    _overlay.innerHTML = `
      <div id="fg-topbar">
        <button id="fg-back-btn" aria-label="กลับ">‹</button>
        <span id="fg-title">แผนผังความสัมพันธ์</span>
      </div>
      <svg id="fg-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="fg-blur"><feGaussianBlur stdDeviation="1"/></filter>
        </defs>
        <g id="fg-root"></g>
      </svg>
      <div id="fg-trait-chips"></div>
      <div id="fg-detail-card">
        <div style="width:40px;height:4px;background:rgba(255,255,255,.2);border-radius:2px;margin:0 auto 16px"></div>
        <p id="fg-detail-name"></p>
        <p id="fg-detail-sub"></p>
        <p id="fg-detail-desc"></p>
        <div id="fg-detail-relations"></div>
        <button id="btn-fg-open-bio">เปิดประวัติเต็ม</button>
      </div>
    `;

    _svg           = document.getElementById('fg-svg');
    _svgRoot       = document.getElementById('fg-root');
    _traitContainer = document.getElementById('fg-trait-chips');
    _detailCard    = document.getElementById('fg-detail-card');

    document.getElementById('fg-back-btn').onclick = () => {
      if (_focusId) { _unfocus(); return; }
      close();
    };

    // Tap background = unfocus
    _svg.addEventListener('click', e => {
      if (e.target === _svg || e.target === _svgRoot) _unfocus();
    });

    _bindPan();
  }

  // ── Public API ───────────────────────────────────────
  async function open(figureId) {
    _currentFigureId = figureId;
    _buildDOM();
    _overlay.style.display = 'block';

    // Center camera on first paint
    _camera = { x: _overlay.clientWidth / 2, y: _overlay.clientHeight / 2, scale: 1 };
    _camApply();

    await _build(figureId);
    _layout(figureId);
    _renderEdges();
    _renderNodes();

    // Auto-focus the opening figure
    const startNode = _nodes.find(n => n.id === figureId);
    if (startNode) setTimeout(() => _focus(startNode), 100);
  }

  function close() {
    if (_camRaf) cancelAnimationFrame(_camRaf);
    _camRaf = null;
    _overlay.style.display = 'none';
    _overlay.innerHTML = '';
    _nodes = []; _edges = []; _focusId = null;
  }

  return { open, close };
})();

window.FigureGraphModule = FigureGraphModule;
