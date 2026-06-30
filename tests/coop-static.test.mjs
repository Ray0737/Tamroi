import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (c, msg) => { if (!c) throw new Error(msg); };

// ── Task 1: SQL patch ─────────────────────────────────
assert(existsSync(new URL('supabase/patch_coop.sql', root)), 'patch_coop.sql must exist');
const sql = read('supabase/patch_coop.sql');
assert(sql.includes('CREATE TABLE IF NOT EXISTS guilds'), 'guilds table must be defined');
assert(sql.includes('CREATE TABLE IF NOT EXISTS guild_members'), 'guild_members table must be defined');
assert(sql.includes('CREATE TABLE IF NOT EXISTS collab_missions'), 'collab_missions table must be defined');
assert(sql.includes('CREATE TABLE IF NOT EXISTS raid_sessions'), 'raid_sessions table must be defined');
assert(sql.includes('CREATE TABLE IF NOT EXISTS figure_discussions'), 'figure_discussions table must be defined');
assert(sql.includes('CREATE TABLE IF NOT EXISTS discussion_flags'), 'discussion_flags table must be defined');
assert(sql.includes('guild_leaderboard'), 'guild_leaderboard view must be defined');
assert(sql.includes('on_collab_checkin_threshold'), 'checkin threshold trigger must be defined');
assert(sql.includes('on_discussion_flag_count'), 'flag count trigger must be defined');
assert(sql.includes('raid_only'), 'figures must gain raid_only column');
assert(sql.includes('is_raid_question'), 'quiz_questions must gain is_raid_question column');
console.log('✓ Task 1: SQL patch checks passed');

// ── Task 2: DB API layer ──────────────────────────────
const dbJs = read('js/supabase-client.js');
assert(dbJs.includes('const Coop'), 'supabase-client.js must define Coop namespace');
assert(dbJs.includes('const Raid'), 'supabase-client.js must define Raid namespace');
assert(dbJs.includes('const Discussion'), 'supabase-client.js must define Discussion namespace');
assert(dbJs.includes('getMyGuild'), 'DB.Coop must have getMyGuild');
assert(dbJs.includes('createSession'), 'DB.Raid must have createSession');
assert(dbJs.includes('getComments'), 'DB.Discussion must have getComments');
assert(dbJs.includes('Coop, Raid, Discussion'), 'window.DB must expose Coop, Raid, Discussion');
console.log('✓ Task 2: DB API checks passed');

// ── Task 3: Guild module ──────────────────────────────
assert(existsSync(new URL('js/guild.js', root)), 'js/guild.js must exist');
const guildJs = read('js/guild.js');
assert(guildJs.includes('const GuildModule'), 'guild.js must define GuildModule');
assert(guildJs.includes('window.GuildModule'), 'GuildModule must be exposed on window');
assert(guildJs.includes('renderGuildPanel'), 'GuildModule must have renderGuildPanel');
assert(guildJs.includes('subscribePresence'), 'GuildModule must have subscribePresence');
const appHtml = read('app.html');
assert(appHtml.includes('id="guild-panel"'), 'app.html must include #guild-panel');
assert(appHtml.includes('data-community-tab="mygroup"'), 'community tab must have guild sub-tab pill');
console.log('✓ Task 3: Guild module checks passed');

// ── Task 4: Coop module ───────────────────────────────
assert(existsSync(new URL('js/coop.js', root)), 'js/coop.js must exist');
const coopJs = read('js/coop.js');
assert(coopJs.includes('const CoopModule'), 'coop.js must define CoopModule');
assert(coopJs.includes('window.CoopModule'), 'CoopModule must be exposed on window');
assert(coopJs.includes('renderMissionCard'), 'CoopModule must have renderMissionCard');
assert(coopJs.includes('subscribeProgress'), 'CoopModule must subscribe to mission progress');
assert(appHtml.includes('id="coop-missions"'), 'app.html must include #coop-missions section');
console.log('✓ Task 4: CoopModule checks passed');

// ── Task 5: Raid module ───────────────────────────────
assert(existsSync(new URL('js/raid.js', root)), 'js/raid.js must exist');
const raidJs = read('js/raid.js');
assert(raidJs.includes('const RaidModule'), 'raid.js must define RaidModule');
assert(raidJs.includes('window.RaidModule'), 'RaidModule must be exposed on window');
assert(raidJs.includes('renderLobbyModal'), 'RaidModule must have renderLobbyModal');
assert(raidJs.includes('renderQuizScreen'), 'RaidModule must have renderQuizScreen');
assert(raidJs.includes('RAID_COMPLETE'), 'RaidModule must handle RAID_COMPLETE broadcast event');
assert(raidJs.includes('handleHostFailover'), 'RaidModule must implement host failover');
assert(appHtml.includes('id="raid-modal"'), 'app.html must include #raid-modal');
console.log('✓ Task 5: RaidModule checks passed');

// ── Task 6: Discussion module ─────────────────────────
assert(existsSync(new URL('js/discussion.js', root)), 'js/discussion.js must exist');
const discJs = read('js/discussion.js');
assert(discJs.includes('const DiscussionModule'), 'discussion.js must define DiscussionModule');
assert(discJs.includes('window.DiscussionModule'), 'DiscussionModule must be exposed on window');
assert(discJs.includes('renderThread'), 'DiscussionModule must have renderThread');
assert(discJs.includes('flagPost'), 'DiscussionModule must have flagPost');
assert(appHtml.includes('id="community-forum-panel"'), 'app.html must include #community-forum-panel');
assert(appHtml.includes('data-community-tab="discuss"'), 'community tab must have discuss sub-tab pill');
console.log('✓ Task 6: DiscussionModule checks passed');

// ── Task 7: Wire-up ───────────────────────────────────
const appJs = read('js/app.js');
assert(appJs.includes('GuildModule'), 'app.js must reference GuildModule');
assert(appHtml.includes('js/guild.js'), 'app.html must load guild.js');
assert(appHtml.includes('js/coop.js'), 'app.html must load coop.js');
assert(appHtml.includes('js/raid.js'), 'app.html must load raid.js');
assert(appHtml.includes('js/discussion.js'), 'app.html must load discussion.js');
const runMjs = read('tests/run-static.mjs');
assert(runMjs.includes('coop-static'), 'run-static.mjs must include coop-static test');
console.log('✓ Task 7: Wire-up checks passed');

// ── New: community-forum.js ───────────────────────────
assert(existsSync(new URL('js/community-forum.js', root)), 'js/community-forum.js must exist');
const forumJs = read('js/community-forum.js');
assert(forumJs.includes('const CommunityForumModule'), 'community-forum.js must define CommunityForumModule');
assert(forumJs.includes('window.CommunityForumModule'), 'CommunityForumModule must be exposed on window');
assert(appHtml.includes('js/community-forum.js'), 'app.html must load community-forum.js');
console.log('✓ CommunityForumModule checks passed');

// ── New: DB additions ─────────────────────────────────
assert(dbJs.includes('subscribeGuildMembers'), 'DB.Coop must have subscribeGuildMembers');
assert(dbJs.includes('sendJoinRequest'), 'DB.Coop must have sendJoinRequest');
assert(dbJs.includes('const Community'), 'supabase-client.js must define Community namespace');
assert(dbJs.includes('Community'), 'window.DB must expose Community');
console.log('✓ DB additions checks passed');

// ── New: patch_coop_fix.sql ───────────────────────────
assert(existsSync(new URL('supabase/patch_coop_fix.sql', root)), 'patch_coop_fix.sql must exist');
const fixSql = read('supabase/patch_coop_fix.sql');
assert(fixSql.includes('guild_join_requests'), 'patch_coop_fix.sql must define guild_join_requests');
assert(fixSql.includes('community_posts'), 'patch_coop_fix.sql must define community_posts');
assert(fixSql.includes('community_post_flags'), 'patch_coop_fix.sql must define community_post_flags');
console.log('✓ patch_coop_fix.sql checks passed');

console.log('\n✅ All coop-static checks passed');
