// ── Mission Module ────────────────────────────────────
const MissionModule = (() => {
  let loaded = false;

  const MOCK_ACTIVE = {
    figure:     'สมเด็จพระเจ้าตากสิน',
    district:   'Rattanakosin',
    reward_pts: 500,
    progress:   2,
    total:      4,
    steps: [
      { text: 'Visit 2 Local Cafes',         sub: 'Gather Local Rumors',           done: true  },
      { text: 'Obtain 1 Relic from OTOP',    sub: 'Collect a historical artifact',  done: true  },
      { text: 'Check-in at 3 Landmarks',     sub: '1 of 3 done',                   done: false },
      { text: 'Complete Master Quiz',        sub: 'Test your historical knowledge', done: false },
    ]
  };

  // SVG icon helpers
  const _pinSVG    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const _buildSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`;
  const _targetSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
  const _mapSVG    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`;
  const _crownSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M2 20h20"/><path d="M2 14l5-8 5 5 5-8 5 8v6H2v-3z"/></svg>`;
  const _trainSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="4" y="3" width="16" height="14" rx="4"/><path d="M8 17l-2 4m10-4l2 4"/><line x1="8" y1="12" x2="16" y2="12"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/></svg>`;

  const MOCK_DAILY = [
    { icon: _pinSVG,    color: '#F6C19E', name: 'Visit a café in Rattanakosin',     loc: 'Rattanakosin Island',    pts: 50,  done: false },
    { icon: _buildSVG,  color: '#7BC67E', name: 'Check-in at a riverside landmark', loc: 'Chao Phraya River area',  pts: 75,  done: false },
    { icon: _targetSVG, color: '#C0A060', name: 'Answer a C-Class figure quiz',     loc: 'Any district',           pts: 30,  done: true  },
    { icon: _mapSVG,    color: '#8986A8', name: 'Explore a new district',           loc: 'Bangkok',                pts: 100, done: false },
  ];

  function load() {
    if (loaded) return;
    loaded = true;
    renderBKKBonus();
    renderActive();
    renderDaily();
  }

  // ── Active mission ────────────────────────────────
  function renderActive() {
    const el = document.getElementById('active-mission');
    if (!el) return;
    const m = MOCK_ACTIVE;

    el.innerHTML = `
      <div style="background:var(--color-card-dark);border-radius:var(--radius-xl);
                  border:1px solid rgba(246,193,158,0.2);overflow:hidden" class="anim-fade-up">

        <!-- Gradient header bar -->
        <div style="background:linear-gradient(135deg,rgba(246,193,158,0.18),rgba(246,193,158,0.05));
                    padding:var(--space-md);border-bottom:1px solid rgba(246,193,158,0.12)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;border-radius:var(--radius-md);
                        background:rgba(246,193,158,0.15);border:1.5px solid rgba(246,193,158,0.4);
                        display:flex;align-items:center;justify-content:center;
                        flex-shrink:0;color:var(--color-primary)">
              ${_crownSVG}
            </div>
            <div style="flex:1;min-width:0">
              <p style="margin:0;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;
                        color:var(--color-primary);font-weight:600">Active Quest</p>
              <h3 style="margin:2px 0 0;font-family:var(--font-heading);font-size:15px;
                          font-weight:700;line-height:1.2">${escapeHtml(m.figure)}</h3>
            </div>
            <span class="badge badge-s">S-Class</span>
          </div>
          <p style="margin:6px 0 0;font-size:11px;color:var(--color-muted)">
            ${escapeHtml(m.district)} &nbsp;·&nbsp;
            Reward: <span style="color:var(--color-primary);font-weight:600">+${m.reward_pts.toLocaleString()} pts</span>
          </p>
        </div>

        <!-- Step progress circles -->
        <div style="padding:var(--space-md) var(--space-md) 0;display:flex;align-items:center">
          ${m.steps.map((s, i) => `
            <div style="display:flex;align-items:center;flex:1">
              <div style="
                width:26px;height:26px;border-radius:50%;flex-shrink:0;
                background:${s.done ? 'var(--color-success)' : i === m.progress ? 'rgba(246,193,158,0.15)' : 'var(--color-card-darker)'};
                border:2px solid ${s.done ? 'var(--color-success)' : i === m.progress ? 'var(--color-primary)' : 'var(--color-border)'};
                display:flex;align-items:center;justify-content:center;
                font-size:10px;font-weight:700;
                color:${s.done ? '#1C1B2E' : i === m.progress ? 'var(--color-primary)' : 'var(--color-muted)'}">
                ${s.done ? checkSVGSmall() : i + 1}
              </div>
              ${i < m.steps.length - 1 ? `
                <div style="flex:1;height:2px;margin:0 3px;
                            background:${s.done ? 'var(--color-success)' : 'var(--color-border)'};
                            border-radius:2px"></div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Step detail list -->
        <div style="padding:var(--space-sm) var(--space-md) var(--space-md)">
          ${m.steps.map((s, i) => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;
                        ${i < m.steps.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.04)' : ''}">
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
                <p style="margin:1px 0 0;font-size:10px;color:${s.done ? 'rgba(137,134,168,0.5)' : 'var(--color-muted)'}">${escapeHtml(s.sub)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ── Daily challenges ──────────────────────────────
  function renderDaily() {
    const el = document.getElementById('daily-challenges');
    if (!el) return;

    const now  = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const hLeft = Math.max(0, Math.floor((next - now) / 3600000));

    const donePct = Math.round((MOCK_DAILY.filter(c => c.done).length / MOCK_DAILY.length) * 100);

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
        ${MOCK_DAILY.map(c => `
          <div style="
            display:flex;align-items:center;gap:10px;
            background:var(--color-card-dark);
            border:1px solid ${c.done ? 'rgba(123,198,126,0.2)' : 'var(--color-border)'};
            border-left:3px solid ${c.done ? 'var(--color-success)' : c.color};
            border-radius:var(--radius-md);
            padding:10px 12px;
            transition:border-color 0.15s;
          ">
            <div style="
              width:32px;height:32px;border-radius:50%;
              background:${c.color}1A;
              display:flex;align-items:center;justify-content:center;
              flex-shrink:0;color:${c.color}">
              ${c.icon}
            </div>
            <div style="flex:1;min-width:0">
              <p style="margin:0;font-size:12px;font-weight:600;
                        color:${c.done ? 'var(--color-muted)' : 'var(--color-white)'};
                        text-decoration:${c.done ? 'line-through' : 'none'};
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.name)}</p>
              <p style="margin:2px 0 0;font-size:10px;color:var(--color-muted)">${escapeHtml(c.loc)}</p>
            </div>
            ${c.done
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
                   color:var(--color-primary);white-space:nowrap">+${c.pts}</span>`
            }
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── BKK transport bonus ───────────────────────────
  function renderBKKBonus() {
    const el = document.getElementById('bkk-bonus');
    if (!el) return;
    el.innerHTML = `
      <div style="
        display:flex;align-items:center;gap:12px;
        background:var(--color-success-dim);
        border:1px solid rgba(123,198,126,0.25);
        border-left:3px solid var(--color-success);
        border-radius:var(--radius-md);padding:12px var(--space-md)">
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(123,198,126,0.2);
                    display:flex;align-items:center;justify-content:center;
                    flex-shrink:0;color:var(--color-success)">
          ${_trainSVG}
        </div>
        <div style="flex:1">
          <p style="margin:0;font-size:13px;font-weight:700;color:var(--color-success)">BTS / MRT Bonus Active</p>
          <p style="margin:2px 0 0;font-size:10px;color:var(--color-muted)">Using public transport in Bangkok · +2× Points on all actions</p>
        </div>
        <span style="flex-shrink:0;font-size:18px;font-weight:800;font-family:var(--font-heading);
                     color:var(--color-success)">×2</span>
      </div>
    `;
  }

  function checkSVGSmall() {
    return `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <polyline points="1.5,5 3.5,7.5 8.5,2.5"/>
    </svg>`;
  }

  return { load };
})();

window.MissionModule = MissionModule;
