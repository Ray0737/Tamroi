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
    const base = window.location.href.split('#')[0].replace(/\/[^/]*$/, '');
    const { error } = await _sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: base + '/onboarding.html' }
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
      .upsert({ user_id: userId, lore_node_id: loreId }, {
        onConflict: 'user_id,lore_node_id',
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
  async getForDistrict(districtId) {
    const { data, error } = await _sb
      .from('quiz_questions')
      .select('*')
      .eq('district_id', districtId)
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },

  async getForFigure(figureId, count = 1) {
    const { data, error } = await _sb
      .from('quiz_questions')
      .select('*')
      .eq('figure_id', figureId)
      .limit(count);
    if (error) throw error;
    return count === 1 ? (data?.[0] || null) : data;
  },

  async getRaidQuestions(figureId, count = 3) {
    const { data, error } = await _sb
      .from('quiz_questions')
      .select('*')
      .eq('figure_id', figureId)
      .eq('is_raid_question', true)
      .limit(count);
    if (error) throw error;
    // Fallback: use any questions for this figure if none flagged as raid-only
    if (!data?.length) return Quiz.getForFigure(figureId, count);
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

  async push(userId, type, title, message, refId = null) {
    await _sb.from('notifications').insert({ user_id: userId, type, title, message, ref_id: refId });
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

// ── BTS / MRT Stations ────────────────────────────────
const BtsMrtStations = {
  async getAll() {
    const { data, error } = await _sb.from('bts_mrt_stations').select('*');
    if (error) throw error;
    return data;
  }
};

// ── Support Nodes ─────────────────────────────────────
const SupportNodes = {
  async getAll() {
    const { data, error } = await _sb
      .from('support_nodes')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data;
  }
};

// ── Missions ───────────────────────────────────────────
const Missions = {
  async getDailyChallenges(userId) {
    const today = new Date().toISOString().split('T')[0];
    const { data: challenges } = await _sb
      .from('daily_challenges')
      .select('*')
      .eq('is_active', true);
    if (!challenges) return [];

    await _sb.from('user_daily_progress').upsert(
      challenges.map(c => ({ user_id: userId, challenge_id: c.id, date: today, current_count: 0, completed: false })),
      { onConflict: 'user_id,challenge_id,date', ignoreDuplicates: true }
    );

    const { data: progress } = await _sb
      .from('user_daily_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    return challenges.map(c => ({
      ...c,
      current:   progress?.find(p => p.challenge_id === c.id)?.current_count ?? 0,
      completed: progress?.find(p => p.challenge_id === c.id)?.completed     ?? false,
    }));
  },

  async updateChallengeProgress(userId, type) {
    const today = new Date().toISOString().split('T')[0];
    const { data: challenges } = await _sb
      .from('daily_challenges')
      .select('id, target_count')
      .eq('type', type)
      .eq('is_active', true);
    if (!challenges?.length) return;

    for (const c of challenges) {
      const { data: row } = await _sb
        .from('user_daily_progress')
        .select('current_count, completed')
        .eq('user_id', userId).eq('challenge_id', c.id).eq('date', today)
        .single();
      if (!row || row.completed) continue;
      const newCount = (row.current_count || 0) + 1;
      await _sb.from('user_daily_progress').upsert({
        user_id: userId, challenge_id: c.id, date: today,
        current_count: newCount, completed: newCount >= c.target_count,
      }, { onConflict: 'user_id,challenge_id,date' });
    }
  }
};

// ── Coop ──────────────────────────────────────────────
const Coop = {
  async getMyGuild(userId) {
    const { data: rows, error: rowsErr } = await _sb
      .from('guild_members')
      .select('guild_id, role')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(1);
    if (rowsErr) throw rowsErr;
    const memberRow = rows?.[0];
    if (!memberRow) return null;

    const { data: guild, error } = await _sb
      .from('guilds')
      .select('*')
      .eq('id', memberRow.guild_id)
      .single();
    if (error) throw error;

    const members = await Coop.getGuildMembers(guild.id);
    return { guild: { ...guild, myRole: memberRow.role }, members };
  },

  async createGuild(name, userId) {
    const { data, error } = await _sb
      .from('guilds')
      .insert({ name, created_by: userId })
      .select()
      .single();
    if (error) throw error;

    const { error: memberErr } = await _sb
      .from('guild_members').insert({ guild_id: data.id, user_id: userId, role: 'leader' });
    if (memberErr) throw memberErr;
    return data;
  },

  async joinGuild(inviteCode, userId) {
    const { data: guild, error: gErr } = await _sb
      .from('guilds')
      .select('id, max_members')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();
    if (gErr) throw new Error('ไม่พบกลุ่มด้วยรหัสนี้');

    const { count } = await _sb
      .from('guild_members')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', guild.id);
    if (count >= guild.max_members) throw new Error('กลุ่มเต็มแล้ว');

    const { data, error } = await _sb
      .from('guild_members')
      .insert({ guild_id: guild.id, user_id: userId, role: 'member' })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new Error('คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว');
      throw error;
    }
    return data;
  },

  async leaveGuild(guildId, userId) {
    const { error } = await _sb.from('guild_members').delete()
      .eq('guild_id', guildId).eq('user_id', userId);
    if (error) throw error;
  },

  async kickMember(guildId, targetUserId) {
    const { error } = await _sb.from('guild_members').delete()
      .eq('guild_id', guildId).eq('user_id', targetUserId);
    if (error) throw error;
  },

  async getGuildMembers(guildId) {
    const { data: members, error } = await _sb
      .from('guild_members')
      .select('user_id, role, joined_at')
      .eq('guild_id', guildId)
      .order('joined_at');
    if (error) throw error;
    if (!members?.length) return [];

    const ids = members.map(m => m.user_id);
    const { data: profiles } = await _sb
      .from('profiles')
      .select('id, username, avatar_url, legacy_score')
      .in('id', ids);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return members.map(m => ({ ...m, profiles: profileMap[m.user_id] || {} }));
  },

  async getGuildClearedDistrictIds(guildId) {
    const { data: members } = await _sb
      .from('guild_members').select('user_id').eq('guild_id', guildId);
    if (!members?.length) return [];
    const { data } = await _sb
      .from('user_districts').select('district_id')
      .eq('fogged', false).in('user_id', members.map(m => m.user_id));
    return [...new Set((data || []).map(r => r.district_id))];
  },

  async getCollabMissions() {
    const { data, error } = await _sb
      .from('collab_missions')
      .select('*, districts(center_lat, center_lng, watchtower_lat, watchtower_lng)')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async checkInToMission(missionId, guildId, userId) {
    const { data, error } = await _sb
      .from('collab_mission_checkins')
      .insert({ mission_id: missionId, guild_id: guildId, user_id: userId })
      .select().single();
    if (error && error.code !== '23505') throw error;
    return data;
  },

  async getMissionCheckins(missionId, guildId) {
    const { data, error } = await _sb
      .from('collab_mission_checkins')
      .select('user_id, checked_in_at, profiles(username)')
      .eq('mission_id', missionId)
      .eq('guild_id', guildId);
    if (error) throw error;
    return data || [];
  },

  async getAllGuildCheckins(guildId) {
    const { data, error } = await _sb
      .from('collab_mission_checkins')
      .select('mission_id, user_id, profiles(username)')
      .eq('guild_id', guildId);
    if (error) throw error;
    return data || [];
  },

  async getGuildLeaderboard() {
    const { data, error } = await _sb
      .from('guild_leaderboard')
      .select('*')
      .order('guild_legacy_score', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  async getMyMemberships(userId) {
    const { data } = await _sb.from('guild_members').select('guild_id, role').eq('user_id', userId);
    return Object.fromEntries((data || []).map(m => [m.guild_id, m.role]));
  },

  async deleteGuild(guildId) {
    const { error } = await _sb.from('guilds').delete().eq('id', guildId);
    if (error) throw error;
  },

  subscribeGuildChanges(onChange) {
    return _sb.channel('guild-leaderboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guilds' },       onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_members' }, onChange)
      .subscribe();
  },

  subscribeGuildPresence(guildId, { onSync, onJoin, onLeave } = {}) {
    const ch = _sb.channel(`presence:guild:${guildId}`, {
      config: { presence: { key: guildId } }
    });
    if (onSync)  ch.on('presence', { event: 'sync' },  onSync);
    if (onJoin)  ch.on('presence', { event: 'join' },  onJoin);
    if (onLeave) ch.on('presence', { event: 'leave' }, onLeave);
    ch.subscribe();
    return ch;
  },

  subscribeMissionProgress(missionId, guildId, callback) {
    return _sb
      .channel(`mission-progress-${missionId}-${guildId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'collab_mission_checkins',
        filter: `mission_id=eq.${missionId}`
      }, callback)
      .subscribe();
  },

  subscribeGuildMembers(guildId, callback) {
    return _sb.channel(`guild-members-${guildId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'guild_members',
        filter: `guild_id=eq.${guildId}`
      }, callback)
      .subscribe();
  },

  async searchGuilds(query) {
    const q = query?.trim() ?? '';
    const { data, error } = await _sb
      .from('guilds')
      .select('id, name, announcement')
      .ilike('name', `%${q}%`)
      .limit(20);
    if (error) throw error;
    if (!data?.length) return [];

    const ids = data.map(g => g.id);
    const { data: lb } = await _sb
      .from('guild_leaderboard')
      .select('guild_id, member_count, guild_legacy_score')
      .in('guild_id', ids);
    const lbMap = Object.fromEntries((lb || []).map(r => [r.guild_id, r]));

    return data.map(g => ({
      ...g,
      member_count:       lbMap[g.id]?.member_count       ?? 0,
      guild_legacy_score: lbMap[g.id]?.guild_legacy_score ?? 0,
      announcement:       g.announcement ?? null,
    }));
  },

  async sendJoinRequest(guildId, userId) {
    const { data: existing } = await _sb
      .from('guild_join_requests')
      .select('id, status')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) return existing;

    const { data, error } = await _sb
      .from('guild_join_requests')
      .insert({ guild_id: guildId, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGuild(guildId, fields) {
    const { error } = await _sb.from('guilds').update(fields).eq('id', guildId);
    if (error) throw error;
  },

  async getAnnouncements(guildId) {
    const { data, error } = await _sb
      .from('guild_announcements')
      .select('id, content, created_at, profiles(username)')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  async postAnnouncement(guildId, content, userId) {
    const { error } = await _sb
      .from('guild_announcements')
      .insert({ guild_id: guildId, content, posted_by: userId });
    if (error) throw error;
  },

  async deleteAnnouncement(id) {
    const { error } = await _sb.from('guild_announcements').delete().eq('id', id);
    if (error) throw error;
  },

  async getMyPendingRequest(userId) {
    const { data } = await _sb
      .from('guild_join_requests')
      .select('id, guild_id, status, guilds(name)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    return data || null;
  },

  async getJoinRequests(guildId) {
    const { data, error } = await _sb
      .from('guild_join_requests')
      .select('id, user_id, created_at')
      .eq('guild_id', guildId)
      .eq('status', 'pending')
      .order('created_at');
    if (error) throw error;
    if (!data?.length) return [];
    const ids = data.map(r => r.user_id);
    const { data: profiles } = await _sb.from('profiles').select('id, username').in('id', ids);
    const map = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return data.map(r => ({ ...r, profiles: map[r.user_id] || null }));
  },

  async approveRequest(requestId) {
    const { data: req, error: reqErr } = await _sb
      .from('guild_join_requests')
      .select('guild_id, user_id')
      .eq('id', requestId)
      .single();
    if (reqErr) throw reqErr;

    const { error: memberErr } = await _sb
      .from('guild_members')
      .insert({ guild_id: req.guild_id, user_id: req.user_id, role: 'member' });
    if (memberErr && memberErr.code !== '23505') throw memberErr;
    const { error } = await _sb
      .from('guild_join_requests')
      .delete()
      .eq('id', requestId);
    if (error) throw error;
  },

  async rejectRequest(requestId) {
    const { error } = await _sb
      .from('guild_join_requests')
      .delete()
      .eq('id', requestId);
    if (error) throw error;
  },

  async cancelRequest(requestId) {
    const { error } = await _sb.from('guild_join_requests').delete().eq('id', requestId);
    if (error) throw error;
  },

  async transferLeader(guildId, newLeaderId, oldLeaderId) {
    const { error: e1 } = await _sb.from('guild_members').update({ role: 'leader' })
      .eq('guild_id', guildId).eq('user_id', newLeaderId);
    if (e1) throw e1;
    const { error: e2 } = await _sb.from('guild_members').update({ role: 'member' })
      .eq('guild_id', guildId).eq('user_id', oldLeaderId);
    if (e2) throw e2;
  },

  async getGuildScore(guildId) {
    const { data } = await _sb.from('guild_leaderboard').select('guild_legacy_score')
      .eq('guild_id', guildId).maybeSingle();
    return data?.guild_legacy_score ?? 0;
  },
};

// ── Raid ───────────────────────────────────────────────
const Raid = {
  async createSession(figureId, guildId, hostUserId) {
    const { data, error } = await _sb
      .from('raid_sessions')
      .insert({ figure_id: figureId, guild_id: guildId, host_user_id: hostUserId })
      .select().single();
    if (error) throw error;
    return data;
  },

  async joinSession(sessionId, userId) {
    const { data, error } = await _sb
      .from('raid_session_members')
      .insert({ session_id: sessionId, user_id: userId })
      .select().single();
    if (error && error.code !== '23505') throw error;
    return data;
  },

  async updateSession(sessionId, fields) {
    const { error } = await _sb.from('raid_sessions').update(fields).eq('id', sessionId);
    if (error) throw error;
  },

  async getSessionMembers(sessionId) {
    const { data, error } = await _sb
      .from('raid_session_members')
      .select('user_id, is_ready, joined_at, profiles(username, avatar_url)')
      .eq('session_id', sessionId)
      .order('joined_at');
    if (error) throw error;
    return data || [];
  },

  async setReady(sessionId, userId) {
    const { error } = await _sb.from('raid_session_members')
      .update({ is_ready: true }).eq('session_id', sessionId).eq('user_id', userId);
    if (error) throw error;
  },

  async insertCaptures(figureId, userIds) {
    if (!userIds?.length) return;
    const { error } = await _sb.from('user_captures')
      .insert(userIds.map(uid => ({ user_id: uid, figure_id: figureId, quiz_score: 3 })));
    if (error && error.code !== '23505') throw error;
  },

  openBroadcast(sessionId) {
    return _sb.channel(`broadcast:raid:${sessionId}`, {
      config: { broadcast: { self: true } }
    }).subscribe();
  },

  openPresence(sessionId) {
    const ch = _sb.channel(`presence:raid:${sessionId}`, {
      config: { presence: { key: sessionId } }
    });
    ch.subscribe();
    return ch;
  }
};

// ── Discussion ────────────────────────────────────────
const Discussion = {
  async getComments(figureId) {
    const { data, error } = await _sb
      .from('figure_discussions')
      .select('*, profiles(username, avatar_url)')
      .eq('figure_id', figureId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const posts = data || [];
    if (!posts.length) return posts;

    const ids = posts.map(p => p.id);
    const { data: replies } = await _sb
      .from('figure_discussions')
      .select('*, profiles(username, avatar_url)')
      .in('parent_id', ids)
      .order('created_at');

    return posts.map(post => ({
      ...post,
      replies: (replies || []).filter(r => r.parent_id === post.id)
    }));
  },

  async postComment(figureId, userId, content, parentId = null) {
    const { data, error } = await _sb
      .from('figure_discussions')
      .insert({ figure_id: figureId, user_id: userId, content, parent_id: parentId })
      .select().single();
    if (error) throw error;
    return data;
  },

  async flagComment(discussionId, userId) {
    const { error } = await _sb
      .from('discussion_flags')
      .insert({ discussion_id: discussionId, user_id: userId });
    if (error && error.code !== '23505') throw error;
  }
};

// ── Community ──────────────────────────────────────────
const Community = {
  async getPosts(userId = null) {
    const { data, error } = await _sb
      .from('community_posts')
      .select('*, profiles(username)')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    const posts = data || [];
    if (!posts.length) return posts;

    const { data: likes } = await _sb
      .from('community_post_likes')
      .select('post_id, user_id')
      .in('post_id', posts.map(p => p.id));

    const likesByPost = {};
    (likes || []).forEach(l => {
      if (!likesByPost[l.post_id]) likesByPost[l.post_id] = { count: 0, likedByMe: false };
      likesByPost[l.post_id].count++;
      if (l.user_id === userId) likesByPost[l.post_id].likedByMe = true;
    });

    return posts.map(p => ({
      ...p,
      likeCount:  likesByPost[p.id]?.count     ?? 0,
      likedByMe:  likesByPost[p.id]?.likedByMe ?? false,
    }));
  },

  async getReplies(parentId) {
    const { data, error } = await _sb
      .from('community_posts')
      .select('*, profiles(username)')
      .eq('parent_id', parentId)
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async postMessage(userId, content, parentId = null) {
    const { data, error } = await _sb
      .from('community_posts')
      .insert({ user_id: userId, content, parent_id: parentId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async flagPost(postId, userId) {
    const { error } = await _sb
      .from('community_post_flags')
      .insert({ post_id: postId, flagged_by: userId });
    if (error && error.code !== '23505') throw error;
  },

  async likePost(postId, userId) {
    const { error } = await _sb.from('community_post_likes').insert({ post_id: postId, user_id: userId });
    if (error && error.code !== '23505') throw error;
  },

  async unlikePost(postId, userId) {
    const { error } = await _sb.from('community_post_likes').delete()
      .eq('post_id', postId).eq('user_id', userId);
    if (error) throw error;
  },
};

// Expose globally
window.DB = { Auth, Profiles, Districts, Figures, SupportNodes, BtsMrtStations, Artifacts, Leaderboard, Lore, Quiz, Notifications, Missions, Coop, Raid, Discussion, Community };
