// ── Community Forum Module ─────────────────────────────
const CommunityForumModule = (() => {

  async function load() {
    const el = document.getElementById('community-forum-panel');
    if (!el) return;
    el.innerHTML = `<div style="display:flex;justify-content:center;padding:30px">
      <div class="spinner"></div></div>`;
    try {
      const posts = await DB.Community.getPosts();
      _render(posts);
    } catch {
      el.innerHTML = `<p style="text-align:center;color:var(--color-muted);
        font-size:12px;padding:var(--space-md)">โหลดไม่ได้</p>`;
    }
  }

  function _render(posts) {
    const el   = document.getElementById('community-forum-panel');
    if (!el) return;
    const user = window.AppCore?.App?.user;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                    border:1px solid var(--color-border);padding:var(--space-sm)">
          <textarea id="forum-compose" rows="2" maxlength="500"
                    placeholder="แสดงความคิดเห็น... (สูงสุด 500 ตัวอักษร)"
                    style="width:100%;background:transparent;border:none;color:var(--color-white);
                           font-size:13px;resize:none;outline:none;font-family:inherit"></textarea>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" id="btn-forum-post"
                    style="font-size:12px;padding:6px 16px">โพสต์</button>
          </div>
        </div>
        ${!posts.length
          ? `<p style="text-align:center;color:var(--color-muted);font-size:12px;padding:var(--space-md)">
               ยังไม่มีโพสต์ — เป็นคนแรก!</p>`
          : posts.map(p => _postCard(p, user)).join('')}
      </div>`;

    document.getElementById('btn-forum-post')?.addEventListener('click', _handlePost);
    el.querySelectorAll('[data-toggle-replies]').forEach(btn =>
      btn.addEventListener('click', () => _toggleReplies(btn.dataset.toggleReplies))
    );
    el.querySelectorAll('[data-flag-post]').forEach(btn =>
      btn.addEventListener('click', () => _flagPost(btn.dataset.flagPost))
    );
  }

  function _postCard(p, user) {
    const name = escapeHtml(p.profiles?.username || 'Anonymous');
    const ago  = _timeAgo(p.created_at);
    return `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-md);
                  border:1px solid var(--color-border);padding:10px var(--space-sm)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px">
            <div class="avatar-sm" style="width:24px;height:24px;font-size:10px">
              ${name.substring(0,2).toUpperCase()}</div>
            <span style="font-size:12px;font-weight:600">${name}</span>
            <span style="font-size:10px;color:var(--color-muted)">${ago}</span>
          </div>
          ${user && p.user_id !== user.id ? `
            <button data-flag-post="${escapeHtml(p.id)}"
                    style="font-size:10px;color:var(--color-muted);background:none;
                           border:none;cursor:pointer;padding:2px 6px"
                    title="รายงาน">🚩</button>` : ''}
        </div>
        <p style="margin:0 0 6px;font-size:13px;line-height:1.5">${escapeHtml(p.content)}</p>
        <button data-toggle-replies="${escapeHtml(p.id)}"
                style="font-size:10px;color:var(--color-muted);background:none;border:none;cursor:pointer">
          ↩ ตอบกลับ</button>
        <div id="replies-${escapeHtml(p.id)}" hidden></div>
      </div>`;
  }

  async function _toggleReplies(postId) {
    const el = document.getElementById(`replies-${postId}`);
    if (!el) return;
    if (!el.hidden) { el.hidden = true; return; }

    el.innerHTML = `<div style="display:flex;justify-content:center;padding:10px">
      <div class="spinner" style="width:16px;height:16px"></div></div>`;
    el.hidden = false;

    try {
      const replies = await DB.Community.getReplies(postId);
      el.innerHTML = `
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:6px">
          ${replies.map(r => `
            <div style="margin-left:16px;border-left:2px solid rgba(246,193,158,0.3);
                        padding-left:10px;padding-top:4px">
              <span style="font-size:11px;font-weight:600">
                ${escapeHtml(r.profiles?.username || 'Anonymous')}</span>
              <span style="font-size:10px;color:var(--color-muted);margin-left:4px">
                ${_timeAgo(r.created_at)}</span>
              <p style="margin:2px 0 0;font-size:12px">${escapeHtml(r.content)}</p>
            </div>`).join('')}
          <div style="margin-left:16px;display:flex;gap:6px;margin-top:4px">
            <input id="reply-input-${escapeHtml(postId)}" type="text" maxlength="500"
                   placeholder="ตอบกลับ..."
                   style="flex:1;background:var(--color-card-darker);border:1px solid var(--color-border);
                          border-radius:var(--radius-md);padding:6px 10px;
                          color:var(--color-white);font-size:12px">
            <button class="btn btn-primary" style="font-size:11px;padding:6px 12px"
                    data-send-reply="${escapeHtml(postId)}">ส่ง</button>
          </div>
        </div>`;
      el.querySelector('[data-send-reply]')?.addEventListener('click', () => _handleReply(postId));
    } catch {
      el.hidden = true;
    }
  }

  async function _handlePost() {
    const ta   = document.getElementById('forum-compose');
    const text = ta?.value?.trim();
    if (!text) return;
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try {
      await DB.Community.postMessage(user.id, text);
      ta.value = '';
      await load();
    } catch (e) {
      alert(e.message || 'โพสต์ไม่สำเร็จ');
    }
  }

  async function _handleReply(parentId) {
    const input = document.getElementById(`reply-input-${parentId}`);
    const text  = input?.value?.trim();
    if (!text) return;
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try {
      await DB.Community.postMessage(user.id, text, parentId);
      // close and reopen to reload replies
      const el = document.getElementById(`replies-${parentId}`);
      if (el) { el.hidden = true; el.innerHTML = ''; }
      await _toggleReplies(parentId);
    } catch (e) {
      alert(e.message || 'ตอบกลับไม่สำเร็จ');
    }
  }

  async function _flagPost(postId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try { await DB.Community.flagPost(postId, user.id); } catch {}
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

  return { load };
})();

window.CommunityForumModule = CommunityForumModule;
