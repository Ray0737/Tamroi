// ── Supabase Client Singleton ─────────────────────────
const _sb = window.supabase.createClient(
  window.APP_CONFIG.supabaseUrl,
  window.APP_CONFIG.supabaseAnonKey
);

// ── Auth ──────────────────────────────────────────────
const Auth = {
  async signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
//test
  async signUp(email, password, username) {
    const { data, error } = await _sb.auth.signUp({
      email, password,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  },

  async signInGoogle() {
    const { error } = await _sb.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "/onboarding.html")
      }
    });
    if (error) throw error;
  },

  async signOut() {
    await _sb.auth.signOut();
  },

  async getSession() {
    const { data } = await _sb.auth.getSession();
    return data.session;
  },

  async getUser() {
    const { data } = await _sb.auth.getUser();
    return data.user;
  },

  onStateChange(callback) {
    return _sb.auth.onAuthStateChange(callback);
  }
};

// ── Profiles ──────────────────────────────────────────
const Profiles = {
  async get(userId) {
    const { data, error } = await _sb.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },

  // getOrCreate: used after Google OAuth where the DB trigger may not have run yet
  async getOrCreate(user) {
    const { data: existing } = await _sb.from('profiles').select('*').eq('id', user.id).single();
    if (existing) return existing;

    const username = user.user_metadata?.full_name?.split(' ')[0]
                  || user.user_metadata?.name?.split(' ')[0]
                  || user.user_metadata?.username
                  || user.email?.split('@')[0]
                  || 'Traveler';

    const { data, error } = await _sb.from('profiles')
      .upsert({ id: user.id, username, avatar_url: user.user_metadata?.avatar_url || null },
               { onConflict: 'id' })
      .select().single();
    if (error) throw error;
    return data;
  },

  async update(userId, fields) {
    const { data, error } = await _sb
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// ── Districts ─────────────────────────────────────────
const Districts = {
  async getAll() {
    const { data, error } = await _sb.from('districts').select('*').eq('is_active', true);
    if (error) throw error;
    return data;
  },

  async getUserState(userId) {
    const { data, error } = await _sb
      .from('user_districts')
      .select('*, districts(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async checkIn(userId, districtId) {
    const { data, error } = await _sb
      .from('user_districts')
      .upsert({ user_id: userId, district_id: districtId, fogged: false, checked_in_at: new Date().toISOString() },
               { onConflict: 'user_id,district_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateNodeVisit(userId, districtId, nodeType) {
    const col = nodeType + '_visited';
    const { data: existing } = await _sb
      .from('user_districts')
      .select(col)
      .eq('user_id', userId)
      .eq('district_id', districtId)
      .single();

    const current = existing ? (existing[col] || 0) : 0;
    const { data, error } = await _sb
      .from('user_districts')
      .upsert({ user_id: userId, district_id: districtId, [col]: current + 1 },
               { onConflict: 'user_id,district_id' })
      .select().single();
    if (error) throw error;
    return data;
  }
};

// ── Figures ───────────────────────────────────────────
const Figures = {
  async getAll() {
    const { data, error } = await _sb.from('figures').select('*').eq('is_active', true);
    if (error) throw error;
    return data;
  },

  async getUserCaptures(userId) {
    const { data, error } = await _sb
      .from('user_captures')
      .select('figure_id, captured_at, quiz_score')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async capture(userId, figureId, quizScore) {
    const figure = await _sb.from('figures').select('legacy_pts').eq('id', figureId).single();
    const pts = figure.data?.legacy_pts || 0;

    const { data, error } = await _sb
      .from('user_captures')
      .insert({ user_id: userId, figure_id: figureId, quiz_score: quizScore })
      .select().single();
    if (error) throw error;

    // Update legacy score + archive count
    const profile = await Profiles.get(userId);
    await Profiles.update(userId, {
      legacy_score: (profile.legacy_score || 0) + pts,
      archive_count: (profile.archive_count || 0) + 1
    });

    return data;
  }
};

// ── Artifacts ─────────────────────────────────────────
const Artifacts = {
  async getAll() {
    const { data, error } = await _sb.from('artifacts').select('*');
    if (error) throw error;
    return data;
  },

  async getUserArtifacts(userId) {
    const { data, error } = await _sb
      .from('user_artifacts')
      .select('artifact_id, obtained_at')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async obtain(userId, artifactId) {
    const { data, error } = await _sb
      .from('user_artifacts')
      .insert({ user_id: userId, artifact_id: artifactId })
      .select().single();
    if (error && error.code !== '23505') throw error; // ignore duplicate
    return data;
  }
};

// ── Leaderboard ───────────────────────────────────────
const Leaderboard = {
  async get(metric = 'legacy_score', limit = 50) {
    const col = metric === 'discovery' ? 'map_discovery'
              : metric === 'archive'   ? 'archive_count'
              : 'legacy_score';

    const { data, error } = await _sb
      .from('profiles')
      .select('id, username, avatar_url, legacy_score, map_discovery, archive_count')
      .order(col, { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
};

// ── Notifications ──────────────────────────────────────
const Notifications = {
  async get(userId) {
    const { data, error } = await _sb
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  },

  async markRead(notifId) {
    await _sb.from('notifications').update({ is_read: true }).eq('id', notifId);
  },

  async push(userId, type, title, message) {
    await _sb.from('notifications').insert({ user_id: userId, type, title, message });
  }
};

// Expose globally
window.DB = { Auth, Profiles, Districts, Figures, Artifacts, Leaderboard, Notifications };
