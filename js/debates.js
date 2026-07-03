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

    document.getElementById('debate-title').textContent      = escapeHtml(d.title_th);
    document.getElementById('debate-vote-count').textContent = `${total} เสียง`;

    const body = document.getElementById('debate-body');
    if (!body) return;

    body.innerHTML = `
      ${s.user_vote ? _renderResults(s, pctA, pctB) : _renderVoteForm(d)}
      ${d.source_citations ? `
        <p style="margin-top:12px;font-size:10px;color:var(--color-muted);line-height:1.5">
          <strong>แหล่งอ้างอิง:</strong> ${escapeHtml(d.source_citations)}
        </p>` : ''}
    `;

    if (!s.user_vote) {
      document.getElementById('btn-vote-a')?.addEventListener('click', () => _openReasonInput('A'));
      document.getElementById('btn-vote-b')?.addEventListener('click', () => _openReasonInput('B'));
    }
  }

  function _renderVoteForm(d) {
    return `
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:var(--space-md)">
        <div style="background:var(--color-card-dark);border:1px solid var(--color-border);
                    border-left:3px solid #7BC67E;border-radius:var(--radius-md);padding:var(--space-md)">
          <p style="font-size:10px;text-transform:uppercase;font-weight:700;
                    color:#7BC67E;margin-bottom:6px">${escapeHtml(d.case_a_title)}</p>
          <p style="font-size:13px;color:var(--color-muted);line-height:1.55;margin:0">${escapeHtml(d.case_a_text)}</p>
        </div>
        <div style="background:var(--color-card-dark);border:1px solid var(--color-border);
                    border-left:3px solid var(--color-primary);border-radius:var(--radius-md);padding:var(--space-md)">
          <p style="font-size:10px;text-transform:uppercase;font-weight:700;
                    color:var(--color-primary);margin-bottom:6px">${escapeHtml(d.case_b_title)}</p>
          <p style="font-size:13px;color:var(--color-muted);line-height:1.55;margin:0">${escapeHtml(d.case_b_text)}</p>
        </div>
      </div>
      <div id="debate-reason-form" hidden style="margin-bottom:12px">
        <p style="font-size:11px;color:var(--color-muted);margin-bottom:6px">
          เหตุผลของคุณ (ไม่บังคับ, สูงสุด 200 ตัวอักษร)
        </p>
        <textarea id="debate-reason-input" maxlength="200" rows="2"
          style="width:100%;background:var(--color-card-dark);border:1px solid var(--color-border);
                 border-radius:var(--radius-md);color:var(--color-white);font-size:12px;
                 padding:8px;resize:none;box-sizing:border-box"></textarea>
        <button class="btn btn-primary btn-full" style="margin-top:8px"
                onclick="DebateModule._submitVote()">ยืนยันคำตอบ</button>
      </div>
      <div style="display:flex;gap:8px">
        <button id="btn-vote-a" class="btn btn-full"
                style="flex:1;background:rgba(123,198,126,0.12);border:1px solid #7BC67E;
                       color:#7BC67E;font-size:12px;font-weight:700">
          เลือก ${escapeHtml(d.case_a_title)}
        </button>
        <button id="btn-vote-b" class="btn btn-full"
                style="flex:1;background:rgba(255,126,85,0.12);border:1px solid var(--color-primary);
                       color:var(--color-primary);font-size:12px;font-weight:700">
          เลือก ${escapeHtml(d.case_b_title)}
        </button>
      </div>
    `;
  }

  function _renderResults(s, pctA, pctB) {
    const userSide = s.user_vote === 'A' ? _debate.case_a_title : _debate.case_b_title;
    const reasons = side => {
      const list = side === 'A' ? (s.reasons_a || []) : (s.reasons_b || []);
      if (!list.length) return '<p style="font-size:11px;color:var(--color-muted)">ยังไม่มีเหตุผล</p>';
      return list.map(r => `<p style="font-size:11px;color:var(--color-muted);
        border-left:2px solid var(--color-border);padding-left:8px;margin:4px 0">
        "${escapeHtml(r)}"</p>`).join('');
    };

    return `
      <p style="font-size:11px;color:var(--color-success);margin-bottom:10px">
        ✓ คุณเลือก: <strong>${escapeHtml(userSide)}</strong>
      </p>
      <div style="display:flex;align-items:center;gap:0;margin-bottom:12px">
        <div style="flex:${pctA};height:8px;background:#7BC67E;border-radius:4px 0 0 4px"></div>
        <div style="flex:${pctB};height:8px;background:var(--color-primary);border-radius:0 4px 4px 0"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;
                  color:var(--color-muted);margin-bottom:16px">
        <span>${escapeHtml(_debate.case_a_title)} ${pctA}%</span>
        <span>${pctB}% ${escapeHtml(_debate.case_b_title)}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <p style="font-size:9px;text-transform:uppercase;font-weight:700;
                    color:#7BC67E;margin-bottom:4px">${escapeHtml(_debate.case_a_title)}</p>
          ${reasons('A')}
        </div>
        <div>
          <p style="font-size:9px;text-transform:uppercase;font-weight:700;
                    color:var(--color-primary);margin-bottom:4px">${escapeHtml(_debate.case_b_title)}</p>
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
