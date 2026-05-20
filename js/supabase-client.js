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

  async signUp(email, password, username) {
    const { data, error } = await _sb.auth.signUp({
      email, password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/login.html')
      }
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
  },

  async addLegacyPoints(userId, pts) {
    const amount = Number(pts) || 0;
    const { error } = await _sb.rpc('increment_legacy_score', {
      p_user_id: userId,
      p_amount: amount
    });
    if (!error) return;

    const profile = await Profiles.get(userId);
    await Profiles.update(userId, {
      legacy_score: (profile.legacy_score || 0) + amount
    });
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

  async getDiscoveryPercent(userId) {
    const [{ count: cleared, error: clearedError }, { count: total, error: totalError }] = await Promise.all([
      _sb.from('user_districts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('fogged', false),
      _sb.from('districts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);
    if (clearedError) throw clearedError;
    if (totalError) throw totalError;
    return total ? Math.round(((cleared || 0) / total) * 100) : 0;
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

  async getVisitedSupportNodes(userId) {
    const { data, error } = await _sb
      .from('user_support_node_visits')
      .select('node_id')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(row => row.node_id).filter(Boolean);
  },

  async updateNodeVisit(userId, districtId, nodeType, nodeId) {
    const { data: rpcData, error: rpcError } = await _sb.rpc('increment_node_visit', {
      p_user_id: userId,
      p_district_id: districtId,
      p_node_type: nodeType,
      p_node_id: nodeId
    });
    if (!rpcError) return rpcData;

    if (nodeId) {
      const { error: visitError } = await _sb
        .from('user_support_node_visits')
        .insert({ user_id: userId, district_id: districtId, node_type: nodeType, node_id: nodeId });
      if (visitError?.code === '23505') {
        const { data: state, error: stateError } = await _sb
          .from('user_districts')
          .select('*')
          .eq('user_id', userId)
          .eq('district_id', districtId)
          .single();
        if (stateError) throw stateError;
        return state;
      }
      if (visitError) throw visitError;
    }

    const col = nodeType === 'cafe' ? 'cafes_visited'
              : nodeType === 'otop' ? 'otops_visited'
              : 'landmarks_visited';
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
    const { data, error } = await _sb
      .from('user_captures')
      .insert({ user_id: userId, figure_id: figureId, quiz_score: quizScore })
      .select().single();
    if (error) throw error;
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
      .from('leaderboard_legacy')
      .select('id, username, avatar_url, legacy_score, map_discovery, archive_count')
      .order(col, { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  subscribe(callback) {
    return _sb
      .channel('leaderboard-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, callback)
      .subscribe();
  }
};

// ── Lore ───────────────────────────────────────────────
const Lore = {
  async getAll() {
    const { data, error } = await _sb
      .from('lore_nodes')
      .select('*, districts(name_th,name_en,province)')
      .eq('is_active', true)
      .order('chain_id', { ascending: true, nullsFirst: false })
      .order('chain_part', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getUserUnlocked(userId) {
    const { data, error } = await _sb
      .from('user_lore')
      .select('unlocked_at, lore_nodes(*, districts(name_th,name_en,province))')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async unlock(userId, loreId) {
    const { data, error } = await _sb
      .from('user_lore')
      .upsert({ user_id: userId, lore_id: loreId }, {
        onConflict: 'user_id,lore_id',
        ignoreDuplicates: true
      })
      .select()
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// ── Quiz ───────────────────────────────────────────────
const Quiz = {
  async getForFigure(figureId, count = 1) {
    const { data, error } = await _sb
      .from('quiz_questions')
      .select('*')
      .eq('figure_id', figureId)
      .limit(count);
    if (error) throw error;
    return count === 1 ? (data?.[0] || null) : data;
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
  },

  subscribe(userId, callback) {
    return _sb
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
};

// Expose globally
window.DB = { Auth, Profiles, Districts, Figures, Artifacts, Leaderboard, Lore, Quiz, Notifications };
