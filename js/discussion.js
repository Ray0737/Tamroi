// ── Discussion Module ─────────────────────────────────
const DiscussionModule = (() => {
  let _currentFigureId = null;

  async function init(figureId) {
    _currentFigureId = figureId;
    const el = document.getElementById('discussion-panel');
    if (!el) return;

    el.innerHTML = `<div style="display:flex;justify-content:center;padding:30px"><div class="spinner"></div></div>`;

    try {
      const comments = await DB.Discussion.getComments(figureId);
      renderThread(comments);
    } catch {
      el.innerHTML = `<p style="color:var(--color-muted);font-size:12px;text-align:center;padding:var(--space-md)">
        โหลดความเห็นไม่ได้</p>`;
    }
  }

  function renderThread(comments) {
    const el = document.getElementById('discussion-panel');
    if (!el) return;

    const user = window.AppCore?.App?.user;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                    border:1px solid var(--color-border);padding:var(--space-sm)">
          <textarea id="disc-compose" rows="2" maxlength="500"
                    placeholder="แสดงความคิดเห็น... (สูงสุด 500 ตัวอักษร)"
                    style="width:100%;background:transparent;border:none;color:var(--color-white);
                           font-size:13px;resize:none;outline:none;font-family:inherit"></textarea>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" id="btn-disc-post"
                    style="font-size:12px;padding:6px 16px">โพสต์</button>
          </div>
        </div>
        ${!comments.length
          ? `<p style="text-align:center;color:var(--color-muted);font-size:12px;padding:var(--space-md)">
               ยังไม่มีความเห็น — เป็นคนแรก!</p>`
          : comments.map(c => _commentCard(c, user, false)).join('')}
      </div>`;

    document.getElementById('btn-disc-post')?.addEventListener('click', _handlePost);

    el.querySelectorAll('[data-flag]').forEach(btn =>
      btn.addEventListener('click', () => flagPost(btn.dataset.flag))
    );
    el.querySelectorAll('[data-reply-to]').forEach(btn =>
      btn.addEventListener('click', () => _openReplyBox(btn.dataset.replyTo))
    );
  }

  function _commentCard(c, user, isReply) {
    const p      = c.profiles || {};
    const name   = escapeHtml(p.username || 'Anonymous');
    const ago    = _timeAgo(c.created_at);

    return `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-md);
                  border:1px solid var(--color-border);padding:10px var(--space-sm);
                  ${isReply ? 'margin-left:24px;border-left:2px solid rgba(234,231,225,0.3)' : ''}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px">
            ${avatarHTML(p.avatar_url, name.substring(0, 2).toUpperCase(), 24, 'rgba(255,255,255,0.2)')}
            <span style="font-size:12px;font-weight:600">${name}</span>
            <span style="font-size:10px;color:var(--color-muted)">${ago}</span>
          </div>
          ${user && c.user_id !== user.id ? `
            <button data-flag="${escapeHtml(c.id)}"
                    style="font-size:10px;color:var(--color-muted);background:none;border:none;cursor:pointer;padding:2px 6px"
                    title="รายงานความเห็นนี้">🚩</button>` : ''}
        </div>
        <p style="margin:0 0 6px;font-size:13px;line-height:1.5">${escapeHtml(c.content)}</p>
        ${!isReply ? `
          <button data-reply-to="${escapeHtml(c.id)}"
                  style="font-size:10px;color:var(--color-muted);background:none;border:none;cursor:pointer">
            ↩ ตอบกลับ
          </button>
          <div id="reply-box-${escapeHtml(c.id)}" hidden></div>
          ${(c.replies || []).map(r => _commentCard(r, user, true)).join('')}` : ''}
      </div>`;
  }

  function _openReplyBox(parentId) {
    const box = document.getElementById(`reply-box-${parentId}`);
    if (!box) return;
    box.removeAttribute('hidden');
    box.innerHTML = `
      <div style="display:flex;gap:6px;margin-top:6px">
        <input id="reply-input-${escapeHtml(parentId)}" type="text" maxlength="500"
               placeholder="ตอบกลับ..."
               style="flex:1;background:var(--color-card-darker);border:1px solid var(--color-border);
                      border-radius:var(--radius-md);padding:6px 10px;color:var(--color-white);font-size:12px">
        <button class="btn btn-primary" style="font-size:11px;padding:6px 12px"
                data-send-reply="${escapeHtml(parentId)}">ส่ง</button>
      </div>`;
    box.querySelector('[data-send-reply]')?.addEventListener('click', () => _handleReply(parentId));
  }

  async function _handlePost() {
    const ta   = document.getElementById('disc-compose');
    const text = ta?.value?.trim();
    if (!text || !_currentFigureId) return;

    const user = window.AppCore?.App?.user;
    if (!user) return;

    try {
      await DB.Discussion.postComment(_currentFigureId, user.id, text);
      ta.value = '';
      await init(_currentFigureId);
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'โพสต์ไม่สำเร็จ');
    }
  }

  async function _handleReply(parentId) {
    const input = document.getElementById(`reply-input-${parentId}`);
    const text  = input?.value?.trim();
    if (!text || !_currentFigureId) return;

    const user = window.AppCore?.App?.user;
    if (!user) return;

    try {
      await DB.Discussion.postComment(_currentFigureId, user.id, text, parentId);
      await init(_currentFigureId);
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'ตอบกลับไม่สำเร็จ');
    }
  }

  async function flagPost(discussionId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try {
      await DB.Discussion.flagComment(discussionId, user.id);
    } catch {}
  }

  function _timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'เมื่อกี้';
    if (m < 60) return `${m} นาทีที่แล้ว`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
    return `${Math.floor(h / 24)} วันที่แล้ว`;
  }

  return { init, renderThread, flagPost };
})();

window.DiscussionModule = DiscussionModule;
