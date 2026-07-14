// ── Debate Module ─────────────────────────────────────
const DebateModule = (() => {
  let _debate = null;
  let _stats  = null;
  let _pendingVote = null;

  async function open(figureId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;

    try {
      _debate = await DB.Debates.getForFigure(figureId);
      if (!_debate) { window.AppCore?.showToast?.('ยังไม่มีประเด็นถกเถียงสำหรับบุคคลนี้'); return; }
      _stats = await DB.Debates.getStats(_debate.id);
      _render();
      document.getElementById('debate-sheet')?.classList.add('open');
      document.getElementById('debate-overlay')?.classList.add('open');
    } catch { window.AppCore?.showToast?.('ไม่สามารถโหลดข้อมูลได้'); }
  }

  function close() {
    document.getElementById('debate-sheet')?.classList.remove('open');
    document.getElementById('debate-overlay')?.classList.remove('open');
  }

  function _render() {
    const d     = _debate;
    const s     = _stats;
    const total = s.total || 0;
    const pctA  = total ? Math.round((s.count_a / total) * 100) : 50;
    const pctB  = 100 - pctA;

    document.getElementById('debate-title').textContent      = d.title_th;
    document.getElementById('debate-vote-count').textContent = `${total} เสียง`;

    const body = document.getElementById('debate-body');
    if (!body) return;

    body.innerHTML = `
      ${s.user_vote ? _renderResults(s, pctA, pctB) : _renderVoteForm(d)}
      ${d.source_citations ? `
        <p class="debate-citation"><strong>แหล่งอ้างอิง:</strong> ${escapeHtml(d.source_citations)}</p>` : ''}
    `;

    if (!s.user_vote) {
      document.getElementById('btn-vote-a')?.addEventListener('click', () => _openReasonInput('A'));
      document.getElementById('btn-vote-b')?.addEventListener('click', () => _openReasonInput('B'));
      _equalizeVoteButtonHeights();
    }
  }

  // Belt-and-suspenders: grid stretch should equalize these two buttons on
  // its own, but force it explicitly in JS too so mismatched text length
  // (one-line "A" vs two-line "B") can never leave them visually uneven.
  function _equalizeVoteButtonHeights() {
    requestAnimationFrame(() => {
      const a = document.getElementById('btn-vote-a');
      const b = document.getElementById('btn-vote-b');
      if (!a || !b) return;
      a.style.height = 'auto';
      b.style.height = 'auto';
      const tallest = Math.max(a.offsetHeight, b.offsetHeight);
      a.style.height = `${tallest}px`;
      b.style.height = `${tallest}px`;
    });
  }

  function _renderVoteForm(d) {
    return `
      <div class="debate-cases">
        <div class="debate-case-card">
          <p class="debate-case-title debate-case-title-a">${escapeHtml(d.case_a_title)}</p>
          <p class="debate-case-text">${escapeHtml(d.case_a_text)}</p>
        </div>
        <div class="debate-case-card">
          <p class="debate-case-title debate-case-title-b">${escapeHtml(d.case_b_title)}</p>
          <p class="debate-case-text">${escapeHtml(d.case_b_text)}</p>
        </div>
      </div>
      <div id="debate-reason-form" class="debate-reason-form" hidden>
        <p class="debate-reason-label">เหตุผลของคุณ (ไม่บังคับ, สูงสุด 200 ตัวอักษร)</p>
        <textarea id="debate-reason-input" class="debate-reason-input" maxlength="200" rows="2"></textarea>
        <button class="btn btn-primary btn-full debate-reason-submit" onclick="DebateModule._submitVote()">ยืนยันคำตอบ</button>
      </div>
      <div class="debate-vote-row">
        <button id="btn-vote-a" class="btn debate-vote-btn debate-vote-btn-a">เลือก ${escapeHtml(d.case_a_title)}</button>
        <button id="btn-vote-b" class="btn debate-vote-btn debate-vote-btn-b">เลือก ${escapeHtml(d.case_b_title)}</button>
      </div>
    `;
  }

  function _renderResults(s, pctA, pctB) {
    const userSide = s.user_vote === 'A' ? _debate.case_a_title : _debate.case_b_title;
    const reasons = side => {
      const list = side === 'A' ? (s.reasons_a || []) : (s.reasons_b || []);
      if (!list.length) return '<p class="debate-reason-empty">ยังไม่มีเหตุผล</p>';
      return list.map(r => `<p class="debate-reason-quote">"${escapeHtml(r)}"</p>`).join('');
    };

    return `
      <p class="debate-result-vote">✓ คุณเลือก: <strong>${escapeHtml(userSide)}</strong></p>
      <div class="debate-result-bar">
        <div class="debate-result-bar-a" style="flex:${pctA}"></div>
        <div class="debate-result-bar-b" style="flex:${pctB}"></div>
      </div>
      <div class="debate-result-pcts">
        <span>${escapeHtml(_debate.case_a_title)} ${pctA}%</span>
        <span>${pctB}% ${escapeHtml(_debate.case_b_title)}</span>
      </div>
      <div class="debate-result-reasons">
        <div>
          <p class="debate-case-title debate-case-title-a">${escapeHtml(_debate.case_a_title)}</p>
          ${reasons('A')}
        </div>
        <div>
          <p class="debate-case-title debate-case-title-b">${escapeHtml(_debate.case_b_title)}</p>
          ${reasons('B')}
        </div>
      </div>
    `;
  }

  function _openReasonInput(vote) {
    _pendingVote = vote;
    const form = document.getElementById('debate-reason-form');
    if (form) { form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }

  async function _submitVote() {
    const user = window.AppCore?.App?.user;
    if (!user || !_pendingVote || !_debate) return;
    const reason = document.getElementById('debate-reason-input')?.value?.trim() || null;
    try {
      await DB.Debates.vote(_debate.id, user.id, _pendingVote, reason);
      _stats = await DB.Debates.getStats(_debate.id);
      _render();
    } catch { window.AppCore?.showToast?.('ไม่สามารถบันทึกคำตอบได้'); }
    _pendingVote = null;
  }

  return { open, close, _submitVote };
})();

window.DebateModule = DebateModule;
