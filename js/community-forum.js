// ── Community Forum Module ─────────────────────────────
const CommunityForumModule = (() => {

  async function load() {
    const el = document.getElementById('community-forum-panel');
    if (!el) return;
    el.innerHTML = `<div style="display:flex;justify-content:center;padding:30px">
      <div class="spinner"></div></div>`;
    const user = window.AppCore?.App?.user;
    try {
      const posts = await DB.Community.getPosts(user?.id);
      _render(posts, user);
    } catch (err) {
      console.error('[CommunityForum] load failed:', err);
      el.innerHTML = `<p class="forum-empty">โหลดไม่ได้</p>`;
    }
  }

  function _render(posts, user) {
    const el = document.getElementById('community-forum-panel');
    if (!el) return;

    el.innerHTML = `
      <div class="forum-compose">
        <textarea id="forum-compose" rows="1" maxlength="500"
                  placeholder="แสดงความคิดเห็น... (สูงสุด 500 ตัวอักษร)"></textarea>
        <button class="forum-send-btn" id="btn-forum-post" title="โพสต์">
          <i class="bi bi-send-fill"></i>
        </button>
      </div>
      <div id="forum-posts-list">
        ${!posts.length
          ? `<p class="forum-empty no-posts-msg"><i class="bi bi-chat-square-text"></i>ยังไม่มีโพสต์ · เป็นคนแรก!</p>`
          : posts.map(p => _postCard(p, user)).join('')}
      </div>`;

    document.getElementById('btn-forum-post')?.addEventListener('click', () => _handlePost(user));
    _bindPostsIn(el, user);
  }

  function _bindPostsIn(root, user) {
    root.querySelectorAll('[data-toggle-replies]').forEach(btn =>
      btn.addEventListener('click', () => _toggleReplies(btn.dataset.toggleReplies, user))
    );
    root.querySelectorAll('[data-flag-post]').forEach(btn =>
      btn.addEventListener('click', () => _flagPost(btn.dataset.flagPost))
    );
    root.querySelectorAll('[data-like-post]').forEach(btn =>
      btn.addEventListener('click', () => _handleLike(btn, user))
    );
  }

  function _postCard(p, user) {
    const name      = escapeHtml(p.profiles?.username || 'Anonymous');
    const ago       = _timeAgo(p.created_at);
    const liked     = !!p.likedByMe;
    const likeCount = p.likeCount ?? 0;

    return `
      <div class="forum-post">
        <div class="forum-post-head">
          ${avatarHTML(p.profiles?.avatar_url, name.substring(0, 2).toUpperCase(), 24, 'rgba(255,255,255,0.2)')}
          <span class="forum-post-name">${name}</span>
          <span class="forum-post-time">${ago}</span>
          ${user && p.user_id !== user.id ? `
            <button class="forum-flag-btn" data-flag-post="${escapeHtml(p.id)}" title="รายงาน">
              <i class="bi bi-flag"></i>
            </button>` : ''}
        </div>
        <p class="forum-post-body">${escapeHtml(p.content)}</p>
        <div class="forum-post-actions">
          <button class="forum-action-btn ${liked ? 'liked' : ''}"
                  data-like-post="${escapeHtml(p.id)}" data-liked="${liked}">
            <i class="bi ${liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i>
            <span>${likeCount > 0 ? likeCount : ''}</span>
          </button>
          <button class="forum-action-btn" data-toggle-replies="${escapeHtml(p.id)}">
            <i class="bi bi-reply"></i> ตอบกลับ
          </button>
        </div>
        <div id="replies-${escapeHtml(p.id)}" hidden></div>
      </div>`;
  }

  async function _handleLike(btn, user) {
    if (!user) return;
    const postId  = btn.dataset.likePost;
    const liked   = btn.dataset.liked === 'true';
    const iconEl  = btn.querySelector('i');
    const countEl = btn.querySelector('span');
    const current = parseInt(countEl.textContent || '0', 10) || 0;

    // Optimistic update
    const newLiked = !liked;
    btn.dataset.liked = newLiked;
    btn.classList.toggle('liked', newLiked);
    iconEl.className = newLiked ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up';
    const newCount = newLiked ? current + 1 : Math.max(0, current - 1);
    countEl.textContent = newCount > 0 ? newCount : '';

    try {
      if (newLiked) {
        await DB.Community.likePost(postId, user.id);
      } else {
        await DB.Community.unlikePost(postId, user.id);
      }
    } catch {
      // Revert on failure
      btn.dataset.liked = liked;
      btn.classList.toggle('liked', liked);
      iconEl.className = liked ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up';
      countEl.textContent = current > 0 ? current : '';
    }
  }

  async function _toggleReplies(postId, user) {
    const el = document.getElementById(`replies-${postId}`);
    if (!el) return;
    if (!el.hidden) { el.hidden = true; return; }

    el.innerHTML = `<div style="display:flex;justify-content:center;padding:10px">
      <div class="spinner" style="width:16px;height:16px"></div></div>`;
    el.hidden = false;

    try {
      const replies = await DB.Community.getReplies(postId);
      el.innerHTML = `
        <div class="forum-replies">
          ${replies.map(r => `
            <div class="forum-reply">
              <span class="forum-reply-name">${escapeHtml(r.profiles?.username || 'Anonymous')}</span>
              <span class="forum-reply-time">${_timeAgo(r.created_at)}</span>
              <p class="forum-reply-body">${escapeHtml(r.content)}</p>
            </div>`).join('')}
          <div class="forum-reply-compose">
            <input id="reply-input-${escapeHtml(postId)}" class="forum-reply-input"
                   type="text" maxlength="500" placeholder="ตอบกลับ...">
            <button class="forum-reply-send" data-send-reply="${escapeHtml(postId)}" title="ส่ง">
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
        </div>`;
      el.querySelector('[data-send-reply]')?.addEventListener('click', () => _handleReply(postId, user));
    } catch {
      el.hidden = true;
    }
  }

  async function _handlePost(user) {
    const ta   = document.getElementById('forum-compose');
    const text = ta?.value?.trim();
    if (!text || !user) return;
    if (!(await _ensureGuidelinesAccepted(user))) return;
    try {
      const newPost = await DB.Community.postMessage(user.id, text);
      ta.value = '';

      // Prepend the new card · no full reload, no flash
      newPost.profiles  = { username: window.AppCore?.App?.profile?.username };
      newPost.likeCount = 0;
      newPost.likedByMe = false;

      const listEl = document.getElementById('forum-posts-list');
      if (listEl) {
        listEl.querySelector('.no-posts-msg')?.remove();
        const div = document.createElement('div');
        div.innerHTML = _postCard(newPost, user);
        _bindPostsIn(div, user);
        listEl.prepend(div.firstElementChild);
      }
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'โพสต์ไม่สำเร็จ');
    }
  }

  async function _handleReply(parentId, user) {
    const input = document.getElementById(`reply-input-${parentId}`);
    const text  = input?.value?.trim();
    if (!text || !user) return;
    if (!(await _ensureGuidelinesAccepted(user))) return;
    try {
      await DB.Community.postMessage(user.id, text, parentId);
      const el = document.getElementById(`replies-${parentId}`);
      if (el) { el.hidden = true; el.innerHTML = ''; }
      await _toggleReplies(parentId, user);
    } catch (e) {
      window.AppCore?.showToast?.(e.message || 'ตอบกลับไม่สำเร็จ');
    }
  }

  async function _flagPost(postId) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    try { await DB.Community.flagPost(postId, user.id); } catch {}
  }

  // One-time consent gate · required before a user's first post/reply.
  async function _ensureGuidelinesAccepted(user) {
    const profile = window.AppCore?.App?.profile;
    if (profile?.guidelines_accepted_at) return true;

    const accepted = await window.AppCore.showConfirm(
      'กติกาชุมชน: ห้ามใช้ถ้อยคำหยาบคาย คุกคาม หรือละเมิดสิทธิผู้อื่น ' +
      'ความคิดเห็นที่ถูกรายงานจะถูกซ่อนอัตโนมัติและทีมงานจะตรวจสอบ ' +
      'กดตกลงเพื่อยืนยันว่าคุณรับทราบและจะปฏิบัติตาม',
      { confirmLabel: 'ตกลง' }
    );
    if (!accepted) return false;

    try {
      await DB.Profiles.update(user.id, { guidelines_accepted_at: new Date().toISOString() });
      if (profile) profile.guidelines_accepted_at = new Date().toISOString();
    } catch { /* best-effort · don't block the post on this write */ }
    return true;
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
