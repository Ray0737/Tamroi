// ── Mission Module ────────────────────────────────────
const MissionModule = (() => {
  let loaded = false;
  let _missionCtx = null; // { figures, capturedIds, districtMap }

  // SVG icon helpers
  const _pinSVG    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const _buildSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`;
  const _targetSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
  const _mapSVG    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`;
  const _crownSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M2 20h20"/><path d="M2 14l5-8 5 5 5-8 5 8v6H2v-3z"/></svg>`;

  // District → Thai era name mapping used by renderActive()
  const DISTRICT_ERA_TH = {
    rattanakosin: 'รัตนโกสินทร์', dusit: 'รัตนโกสินทร์',
    pathumwan: 'รัตนโกสินทร์', silom: 'รัตนโกสินทร์',
    sukhumvit: 'รัตนโกสินทร์', watthana: 'รัตนโกสินทร์',
    chatuchak: 'รัตนโกสินทร์', ladphrao: 'รัตนโกสินทร์',
    bang_kapi: 'รัตนโกสินทร์', phra_khanong: 'รัตนโกสินทร์',
    bang_na: 'รัตนโกสินทร์', nonthaburi: 'รัตนโกสินทร์',
    ayutthaya: 'อยุธยา',
  };

  // Load mission context from DB and re-render active + daily sections
  async function _loadMissionData() {
    const user = window.AppCore?.App?.user;
    if (!user) { _renderActiveFallback(); _renderDailyFallback(); return; }

    try {
      const [figures, captureRows, districtRows, challenges, recallMissions] = await Promise.all([
        DB.Figures.getAll(),
        DB.Figures.getUserCaptures(user.id),
        DB.Districts.getUserState(user.id),
        DB.Missions.getDailyChallenges(user.id),
        DB.Missions.getRecallMissions(user.id),
      ]);

      const capturedIds  = new Set((captureRows || []).map(c => c.figure_id));
      const districtMap  = Object.fromEntries(
        (districtRows || []).map(d => [d.district_id || d.districts?.id, d])
      );

      _missionCtx = { figures: figures || [], capturedIds, districtMap };
      renderActive();
      renderDaily([...(challenges || []), ...(recallMissions || [])]);
      _maybeMergeEmptyStates();
    } catch {
      _renderActiveFallback();
      _renderDailyFallback();
    }
  }

  // If group/active/daily missions are all empty at once, collapse the 3 near-identical
  // empty cards into a single message instead of a wall of "nothing here" boxes.
  function _maybeMergeEmptyStates() {
    const coopEl   = document.getElementById('coop-missions');
    const activeEl = document.getElementById('active-mission');
    const dailyEl  = document.getElementById('daily-challenges');
    const mergedEl = document.getElementById('mission-merged-empty');
    const wrapEl   = document.getElementById('mission-section-inner');
    if (!coopEl || !activeEl || !dailyEl || !mergedEl || !wrapEl) return;

    const allEmpty = coopEl.querySelector('[data-empty]') &&
                      activeEl.querySelector('[data-empty]') &&
                      dailyEl.querySelector('[data-empty]');

    coopEl.style.display   = allEmpty ? 'none' : '';
    activeEl.style.display = allEmpty ? 'none' : '';
    dailyEl.style.display  = allEmpty ? 'none' : '';
    wrapEl.classList.toggle('mission-empty-centered', !!allEmpty);

    if (!allEmpty) { mergedEl.style.display = 'none'; mergedEl.innerHTML = ''; return; }
    mergedEl.style.display = '';
    mergedEl.innerHTML = `
      <div class="mission-empty">
        <div class="mascot-wrap">
          <div class="mascot-bubble">Hmm... เร็ว ๆ นี้...</div>
          <svg class="mascot-blob" viewBox="0 0 64 64" width="56" height="56">
            <circle cx="32" cy="32" r="26" fill="var(--color-primary)"/>
            <circle cx="23" cy="29" r="3.2" fill="var(--color-on-primary)"/>
            <circle cx="41" cy="29" r="3.2" fill="var(--color-on-primary)"/>
            <path d="M24 40 Q32 36 40 40" stroke="var(--color-on-primary)" stroke-width="2.5"
                  stroke-linecap="round" fill="none"/>
          </svg>
        </div>
        <p>ยังไม่มีภารกิจให้ทำตอนนี้</p>
        <p class="sub">สำรวจพื้นที่ใหม่เพื่อปลดล็อคภารกิจส่วนตัว — ภารกิจกลุ่มจะเปิดให้เล่นเร็ว ๆ นี้</p>
      </div>`;
  }

  // Thai historical seasonal events — month is 0-indexed (JS Date)
  const SEASONAL_EVENTS = [
    {
      name: 'สงกรานต์ — Year Reset Bonus',
      name_en: 'Songkran Festival',
      start: { month: 3, day: 13 }, end: { month: 3, day: 15 },
      color: '#4FC3F7',
      multiplier: 2,
      desc: 'เทศกาลสงกรานต์! คะแนนทุกกิจกรรมเพิ่ม ×2 ตลอดช่วงปีใหม่ไทย',
    },
    {
      name: 'วันที่ 14 ตุลา — Democracy Bonus',
      name_en: '14 October Uprising',
      start: { month: 9, day: 14 }, end: { month: 9, day: 14 },
      color: '#EF5350',
      multiplier: 1.5,
      desc: 'วันครบรอบเหตุการณ์ 14 ตุลา 2516 รับโบนัส +50% สำหรับ Lore Nodes ทั้งหมด',
    },
    {
      name: 'วันปิยมหาราช — Legacy Surge',
      name_en: 'Chulalongkorn Day',
      start: { month: 9, day: 23 }, end: { month: 9, day: 23 },
      color: '#EAE7E1',
      multiplier: 2,
      desc: 'วันปิยมหาราช! Legacy Points จากบุคคล S-Class เพิ่มเป็น ×2 ตลอดวันนี้',
    },
    {
      name: 'วันพ่อ — Royal Heritage Day',
      name_en: 'Father\'s Day / Rama IX Birthday',
      start: { month: 11, day: 5 }, end: { month: 11, day: 5 },
      color: '#FFD700',
      multiplier: 1.5,
      desc: 'วันพระราชสมภพรัชกาลที่ 9 รับโบนัส +50% สำหรับ Districts ที่สำรวจใหม่',
    },
    {
      name: 'วันคล้ายวันเฉลิมพระชนม์พรรษา — King\'s Bonus',
      name_en: 'Vajiralongkorn\'s Birthday',
      start: { month: 6, day: 28 }, end: { month: 6, day: 28 },
      color: '#CE93D8',
      multiplier: 2,
      desc: 'วันเฉลิมพระชนม์พรรษา ร.10! เก็บ Figures ทั้งหมดวันนี้รับ ×2 Legacy Points',
    },
  ];

  const _calendarSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

  function renderSeasonalContent() {
    const el = document.getElementById('seasonal-events');
    if (!el) return;

    const now   = new Date();
    const month = now.getMonth();
    const day   = now.getDate();

    const active = SEASONAL_EVENTS.filter(e => {
      const afterStart  = month > e.start.month || (month === e.start.month && day >= e.start.day);
      const beforeEnd   = month < e.end.month   || (month === e.end.month   && day <= e.end.day);
      return afterStart && beforeEnd;
    });

    if (!active.length) { el.innerHTML = ''; return; }

    el.innerHTML = active.map(ev => `
      <div style="
        display:flex;align-items:center;gap:12px;
        background:${ev.color}18;
        border:1px solid ${ev.color}30;
        border-left:3px solid ${ev.color};
        border-radius:var(--radius-md);
        padding:12px var(--space-md);
        margin-bottom:10px">
        <div style="width:36px;height:36px;border-radius:50%;background:${ev.color}22;
                    display:flex;align-items:center;justify-content:center;
                    flex-shrink:0;color:${ev.color}">
          ${_calendarSVG}
        </div>
        <div style="flex:1">
          <p style="margin:0;font-size:13px;font-weight:700;color:${ev.color}">${escapeHtml(ev.name)}</p>
          <p style="margin:2px 0 0;font-size:10px;color:var(--color-muted)">${escapeHtml(ev.desc)}</p>
        </div>
        <span style="flex-shrink:0;font-size:18px;font-weight:800;font-family:var(--font-heading);
                     color:${ev.color}">×${ev.multiplier}</span>
      </div>
    `).join('');
  }

  function load() {
    if (loaded) return;
    loaded = true;
    renderSeasonalContent();
    _renderActiveFallback();
    _renderDailyFallback();
    _loadMissionData(); // async — re-renders when data arrives
  }

  // ── Active mission ────────────────────────────────
  function _renderActiveFallback() {
    const el = document.getElementById('active-mission');
    if (!el) return;
    el.innerHTML = `
      <div class="mission-empty">
        <i class="bi bi-hourglass-split"></i>
        <p>กำลังโหลดภารกิจ...</p>
      </div>`;
  }

  function renderActive() {
    const el = document.getElementById('active-mission');
    if (!el) return;

    if (!_missionCtx) { _renderActiveFallback(); return; }

    const { figures, capturedIds, districtMap } = _missionCtx;

    // Find first uncaptured S-tier figure in an unfogged district, then A-tier
    let target = null;
    for (const cls of ['S', 'A']) {
      target = figures.find(f =>
        f.class === cls &&
        !capturedIds.has(f.id) &&
        districtMap[f.district_id] &&
        districtMap[f.district_id].fogged === false
      );
      if (target) break;
    }

    if (!target) {
      // All S/A figures captured or no districts explored yet
      const allDone = figures.filter(f => f.class === 'S' || f.class === 'A').every(f => capturedIds.has(f.id));
      el.innerHTML = `
        <div class="mission-empty" ${allDone ? '' : 'data-empty'}>
          <i class="bi ${allDone ? 'bi-trophy' : 'bi-compass'}"></i>
          <p>${allDone ? 'ทุกภารกิจเสร็จสมบูรณ์!' : 'สำรวจพื้นที่ใหม่เพื่อปลดล็อคภารกิจ'}</p>
          <p class="sub">${allDone ? 'คุณจับบุคคลสำคัญระดับ S/A ครบทั้งหมดแล้ว' : 'Check-in ที่ Watchtower ในเขตที่ยังไม่ได้สำรวจ'}</p>
        </div>`;
      return;
    }

    const dist   = districtMap[target.district_id] || {};
    const era    = DISTRICT_ERA_TH[target.district_id] || 'ประวัติศาสตร์ไทย';
    const cafes  = dist.cafes_visited     || 0;
    const otops  = dist.otops_visited     || 0;
    const lands  = dist.landmarks_visited || 0;

    // Steps: 1 café, 1 OTOP, 1 landmark, then quiz
    const steps = [
      { text: 'เยี่ยมชมร้านกาแฟ',    sub: `เก็บข้อมูลในพื้นที่ · ${cafes}/1 แห่ง`,     done: cafes  >= 1 },
      { text: 'เยี่ยมชมสินค้า OTOP',  sub: `สำรวจสินค้าท้องถิ่น · ${otops}/1 แห่ง`,     done: otops  >= 1 },
      { text: 'Check-in สถานที่สำคัญ', sub: `เยี่ยมชมแลนด์มาร์ก · ${lands}/1 แห่ง`,    done: lands  >= 1 },
      { text: 'ทำ Master Quiz',        sub: 'ทดสอบความรู้ประวัติศาสตร์',                 done: false },
    ];
    const progress = steps.filter(s => s.done).length;

    el.innerHTML = `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                  border:1px solid rgba(234,231,225,0.2);overflow:hidden" class="anim-fade-up">

        <div style="background:linear-gradient(135deg,rgba(234,231,225,0.18),rgba(234,231,225,0.05));
                    padding:var(--space-md);border-bottom:1px solid rgba(234,231,225,0.12)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;border-radius:var(--radius-md);
                        background:rgba(234,231,225,0.15);border:1.5px solid rgba(234,231,225,0.4);
                        display:flex;align-items:center;justify-content:center;
                        flex-shrink:0;color:var(--color-primary)">${_crownSVG}</div>
            <div style="flex:1;min-width:0">
              <p style="margin:0;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;
                        color:var(--color-primary);font-weight:600">Active Quest</p>
              <h3 style="margin:2px 0 0;font-family:var(--font-heading);font-size:15px;
                          font-weight:700;line-height:1.2">${escapeHtml(target.name_th)}</h3>
            </div>
            <span class="badge badge-${target.class.toLowerCase()}">${target.class}</span>
          </div>
          <p style="margin:6px 0 0;font-size:11px;color:var(--color-muted)">
            ${escapeHtml(era)} &nbsp;·&nbsp;
            Reward: <span style="color:var(--color-primary);font-weight:600">+${(target.legacy_pts||0).toLocaleString()} pts</span>
          </p>
        </div>

        <div style="padding:var(--space-md) var(--space-md) 0;display:flex;align-items:center">
          ${steps.map((s, i) => `
            <div style="display:flex;align-items:center;flex:1">
              <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;
                background:${s.done ? 'var(--color-success)' : i === progress ? 'rgba(234,231,225,0.15)' : 'var(--color-card-darker)'};
                border:2px solid ${s.done ? 'var(--color-success)' : i === progress ? 'var(--color-primary)' : 'var(--color-border)'};
                display:flex;align-items:center;justify-content:center;
                font-size:10px;font-weight:700;
                color:${s.done ? '#1C1B2E' : i === progress ? 'var(--color-primary)' : 'var(--color-muted)'}">
                ${s.done ? checkSVGSmall() : i + 1}
              </div>
              ${i < steps.length - 1 ? `<div style="flex:1;height:2px;margin:0 3px;
                  background:${s.done ? 'var(--color-success)' : 'var(--color-border)'};border-radius:2px"></div>` : ''}
            </div>
          `).join('')}
        </div>

        <div style="padding:var(--space-sm) var(--space-md) var(--space-md)">
          ${steps.map((s, i) => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;
                        ${i < steps.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.04)' : ''}">
              <div style="width:16px;height:16px;border-radius:50%;flex-shrink:0;margin-top:2px;
                          background:${s.done ? 'var(--color-success)' : 'transparent'};
                          border:1.5px solid ${s.done ? 'var(--color-success)' : 'var(--color-border)'};
                          display:flex;align-items:center;justify-content:center">
                ${s.done ? checkSVGSmall() : ''}
              </div>
              <div>
                <p style="margin:0;font-size:12px;font-weight:600;
                          color:${s.done ? 'var(--color-muted)' : 'var(--color-white)'};
                          text-decoration:${s.done ? 'line-through' : 'none'}">${escapeHtml(s.text)}</p>
                <p style="margin:1px 0 0;font-size:10px;
                          color:${s.done ? 'rgba(137,134,168,0.5)' : 'var(--color-muted)'}">${escapeHtml(s.sub)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ── Daily challenges ──────────────────────────────
  const _DAILY_TYPE_STYLE = {
    lore:        { color: '#7BC67E', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>` },
    checkin:     { color: '#EAE7E1', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>` },
    capture:     { color: '#EAE7E1', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>` },
    quiz:        { color: '#4FC3F7', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
    lore_recall: { color: '#CE93D8', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>` },
  };

  function _renderDailyFallback() {
    const el = document.getElementById('daily-challenges');
    if (!el) return;
    el.innerHTML = `
      <div class="mission-empty">
        <i class="bi bi-hourglass-split"></i>
        <p>กำลังโหลดภารกิจรายวัน...</p>
      </div>`;
  }

  function renderDaily(challenges) {
    const el = document.getElementById('daily-challenges');
    if (!el) return;

    if (!challenges?.length) {
      el.innerHTML = `
        <div class="mission-empty" data-empty>
          <i class="bi bi-calendar2-check"></i>
          <p>ไม่มีภารกิจในขณะนี้</p>
        </div>`;
      return;
    }

    const now   = new Date();
    const next  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const hLeft = Math.max(0, Math.floor((next - now) / 3600000));
    const donePct = Math.round((challenges.filter(c => c.completed).length / challenges.length) * 100);

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <h3 class="section-title">Daily Challenges</h3>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:var(--text-xs);color:var(--color-muted)">Resets in ${hLeft}h</span>
          <span style="font-size:10px;font-weight:700;color:var(--color-success);
                       background:var(--color-success-dim);border-radius:var(--radius-full);
                       padding:2px 8px">${donePct}%</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        ${challenges.map(c => {
          const style = _DAILY_TYPE_STYLE[c.type] || _DAILY_TYPE_STYLE.quiz;
          const color = c.completed ? 'var(--color-success)' : style.color;
          const showProg = c.target_count > 1 && !c.completed;
          const isRecall = c.type === 'lore_recall' && !c.completed;
        return `
          <div onclick="${isRecall ? `MissionModule.openRecall(${JSON.stringify(c).replace(/"/g, '&quot;')})` : ''}"
               style="
            display:flex;align-items:center;gap:10px;
            background:var(--color-card-dark);
            border:1px solid ${c.completed ? 'rgba(123,198,126,0.2)' : 'var(--color-border)'};
            border-left:3px solid ${color};
            border-radius:var(--radius-md);
            padding:10px 12px;
            ${isRecall ? 'cursor:pointer;' : ''}
          ">
            <div style="
              width:32px;height:32px;border-radius:50%;
              background:${style.color}1A;
              display:flex;align-items:center;justify-content:center;
              flex-shrink:0;color:${style.color}">
              ${style.icon}
            </div>
            <div style="flex:1;min-width:0">
              <p style="margin:0;font-size:12px;font-weight:600;
                        color:${c.completed ? 'var(--color-muted)' : 'var(--color-white)'};
                        text-decoration:${c.completed ? 'line-through' : 'none'};
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.title_th)}</p>
              ${showProg ? `<p style="margin:2px 0 0;font-size:10px;color:var(--color-muted)">${c.current}/${c.target_count}</p>` : ''}
            </div>
            ${c.completed
              ? `<div style="width:26px;height:26px;border-radius:50%;background:var(--color-success-dim);
                             display:flex;align-items:center;justify-content:center;flex-shrink:0">
                   <svg viewBox="0 0 16 16" fill="none" stroke="var(--color-success)" stroke-width="2.5" style="width:12px;height:12px">
                     <polyline points="2,8 6,12 14,4"/>
                   </svg>
                 </div>`
              : `<span style="
                   flex-shrink:0;background:var(--color-primary-dim);
                   border:1px solid var(--color-primary);border-radius:var(--radius-full);
                   padding:3px 10px;font-size:10px;font-weight:700;
                   color:var(--color-primary);white-space:nowrap">+${c.pts_reward}</span>`
            }
          </div>`;
        }).join('')}
      </div>
    `;
  }

  function checkSVGSmall() {
    return `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <polyline points="1.5,5 3.5,7.5 8.5,2.5"/>
    </svg>`;
  }

  // ── Recall Quiz ───────────────────────────────────────
  async function openRecall(challenge) {
    const user = window.AppCore?.App?.user;
    if (!user) return;
    const questions = await DB.Lore.getRecallQuestions(challenge.lore_node_id);
    const modal = document.getElementById('recall-modal');
    if (!modal) return;

    const titleEl    = document.getElementById('recall-modal-title');
    const questionEl = document.getElementById('recall-modal-question');
    const optionsEl  = document.getElementById('recall-modal-options');
    const resultEl   = document.getElementById('recall-modal-result');
    const doneBtn    = document.getElementById('recall-modal-done');

    resultEl.hidden = true;
    doneBtn.hidden  = true;

    if (!questions?.length) {
      titleEl.textContent    = challenge.title_th;
      questionEl.textContent = 'ยังไม่มีคำถามสำหรับ Recall นี้';
      optionsEl.innerHTML    = '';
      bootstrap.Modal.getOrCreateInstance(modal).show();
      return;
    }

    const q = questions[0];
    titleEl.textContent    = challenge.title_th;
    questionEl.textContent = q.question_th;

    optionsEl.innerHTML = ['A','B','C','D'].map(k => {
      const text = q[`option_${k.toLowerCase()}`];
      if (!text) return '';
      return `<button class="btn btn-outline btn-full" style="text-align:left;font-size:13px"
                      data-opt="${k}"
                      onclick="MissionModule._handleRecallAnswer('${q.correct_option}','${challenge.lore_node_id}',this)">
                ${escapeHtml(k + '. ' + text)}
              </button>`;
    }).join('');

    bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  async function _handleRecallAnswer(correctOpt, loreNodeId, btn) {
    const user    = window.AppCore?.App?.user;
    const chosen  = btn.dataset.opt;
    const correct = chosen === correctOpt;

    document.querySelectorAll('#recall-modal-options button')
            .forEach(b => { b.disabled = true; b.style.opacity = '0.6'; });

    const resultEl = document.getElementById('recall-modal-result');
    const doneBtn  = document.getElementById('recall-modal-done');
    resultEl.style.background = correct ? 'rgba(123,198,126,0.12)' : 'rgba(234,231,225,0.12)';
    resultEl.style.border     = `1px solid ${correct ? 'rgba(123,198,126,0.3)' : 'rgba(234,231,225,0.3)'}`;
    resultEl.style.color      = correct ? 'var(--color-success)' : 'var(--color-primary)';
    resultEl.textContent      = correct
      ? '✓ ถูกต้อง! +30 pts · ยอดเยี่ยม'
      : '✗ ไม่ถูกต้อง — จะนำกลับมาทบทวนใน 3 วัน';
    resultEl.hidden = false;
    doneBtn.hidden  = false;

    if (user) await DB.Missions.completeRecall(user.id, loreNodeId, correct);
  }

  return { load, openRecall, _handleRecallAnswer };
})();

window.MissionModule = MissionModule;
