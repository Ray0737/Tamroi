# ตามรอย (Tamroi) — Flowchart Diagrams (ASCII)

Source diagrams for proposal doc section 11 (โครงร่างของโปรแกรมพอสังเขป). Drawn in plain ASCII (`- | + / \ * v`) so they can be pasted straight into the `.docx` in place of the `[insert image later]` placeholders, or rendered from a monospace font.

---

## 11.1 ผังงานรวมของระบบในแต่ละโหมด (Overall System Flow)

```
                              +-------------------+
                              |   Login / Signup   |
                              |  (Google / Email)  |
                              +----------+----------+
                                         |
                                         v
                              +-------------------+
                              | Grant Location perm |
                              | + pick Home District |
                              +----------+----------+
                                         |
                                         v
                              +-------------------+
                              |  Fog of War Map     |
                              |  (whole Thailand)    |
                              +----------+----------+
                                         |
                     +-------------------+-------------------+
                     |                                       |
                     v                                       v
          +---------------------+                +----------------------+
          |   SOLO MODE          |                |   CO-OP MODE          |
          |  (play alone)        |                |  (in a Guild)         |
          +----------+-----------+                +-----------+----------+
                     |                                        |
                     v                                        v
       * Core Solo Loop (see 11.5)              * Guild Fog Overlay (shared)
       * Mission Tab (Active Quest /             * Collaborative Missions
         Daily Challenges)                       * Raid Encounters (Realtime)
       * Leaderboard (solo rank)                 * Guild Leaderboard
                     |                                        |
                     +-------------------+--------------------+
                                         |
                                         v
                              +-------------------+
                              |  Legacy Score /     |
                              |  Archive / Lore      |
                              |  (shared by both)     |
                              +-------------------+
```

---

## 11.2 หลักการเล่น (Game Logic) และกระบวนการปลดล็อคระบบเรื่องราวเชิงลึก

```
   Figure discovered on map (Phase-Locked or Unlocked, by class)
                    |
                    v
        +-----------------------+
        |  Which rarity class?   |
        +-----------------------+
         /       |        |       \
        /        |        |        \
       v         v        v         v
   C: Common  B: Uncommon A: Rare   S: Legendary
   Capture     Answer 1   Visit ALL  Same gate as A
   instantly   quiz Q     Support    (no spawn-chance
   no quiz     correct    Nodes in   roll -- identical
               to capture district,  requirements)
                          then answer
                          3 quiz Qs
         \        |        |        /
          \       |        |       /
           v      v        v      v
        +---------------------------+
        |  Correct answer(s)?        |
        +---------------------------+
              |               |
             yes              no
              |               |
              v               v
     +-----------------+   Retry allowed
     | Capture success  |   (Raid: 1 retry
     | -> Figure Card    |   per session)
     | -> Legacy Score++  |
     | -> Capture Reveal   |
     +--------+---------+
              |
              v
   +-----------------------------+
   |  Lore unlock check           |
   +-----------------------------+
     /          |            \
    /            |             \
   v              v              v
 Proximity     Lore Chain     Special-date
 (near 1       (visit N       (only unlocks
 coordinate)   linked spots   on the real
               in sequence)    calendar date)
    \            |             /
     \           |            /
      v          v           v
        +---------------------+
        |  Story saved to       |
        |  Archive for review    |
        +---------------------+
```

---

## 11.3 สถาปัตยกรรมระบบและโครงสร้างการทำงานของ Runtime

```
+-----------------------------------------------------------------+
|                     PRESENTATION LAYER                            |
|   HTML5 / CSS3 / Bootstrap 5.3  --  Leaflet.js 1.9.4 (map render) |
|   Vanilla JS ES6+ (no bundler, no framework)                      |
+------------------------------------+------------------------------+
                                     |  DOM events / user input
                                     v
+-----------------------------------------------------------------+
|                  APPLICATION LOGIC LAYER                          |
|   AppCore (boot/auth/notify)   MapModule (fog/GPS/capture)         |
|   CollectionModule   LeaderboardModule   CoopModule                 |
|   GuildModule   RaidModule   CommunityForumModule   DiscussionModule|
+----------------+-------------------------------+------------------+
                 |  REST (PostgREST)              |  Realtime
                 v                                 v
        +-----------------+              +------------------------+
        |   DATA LAYER     |              |  Supabase Realtime      |
        |   Supabase        |<------------>|  Postgres Changes       |
        |   (PostgreSQL)     |              |  Presence  Broadcast     |
        |   + RLS policies    |              +------------------------+
        |   + DB Triggers      |
        +----------+-----------+
                   |
                   v
        +-----------------------+
        |  Vercel (Deploy/Host)   |
        |  auto build on git push  |
        +-----------------------+
```

---

## 11.4 ขอบเขตการทำงานของโมดูลและชั้นการเข้าถึงฐานข้อมูล

```
 JS Module              Talks to (Supabase tables)
 ----------------       -----------------------------------------
 AppCore            --> profiles, notifications
 MapModule          --> districts, figures, user_districts,
                        user_captures, user_support_node_visits,
                        support_nodes, bts_mrt_stations
 CollectionModule    --> user_captures, figures, user_artifacts,
                        artifacts, user_lore, lore_nodes
 LeaderboardModule    --> profiles, guilds  (aggregate queries)
 CoopModule           --> collab_missions, collab_mission_checkins,
                        collab_mission_completions
 GuildModule          --> guilds, guild_members, guild_join_requests
 RaidModule           --> raid_sessions, raid_session_members,
                        quiz_questions (is_raid_question = true)
 CommunityForumModule --> community_posts, community_post_likes,
                        community_post_flags
 DiscussionModule     --> figure_discussions, discussion_flags

                    +---------------------------+
                    |   Row Level Security (RLS)  |
                    |   gates every table above --  |
                    |   client never bypasses DB     |
                    |   authorization rules            |
                    +---------------------------+
```

---

## 11.5 ผังการทำงานหลักของระบบ (เช็คอิน → จับบุคคลสำคัญ)

```
   User walks near a district boundary
                |
                v
   HTML5 Geolocation API -- watchPosition()
                |
                v
   +--------------------------------+
   |  Client-side polygon matching    |
   |  (GeoJSON district boundary)      |
   +--------------------------------+
                |
                v
   +--------------------------------+
   |  Server re-verifies coordinate    |
   |  (anti-spoof check, ~20m tolerance) |
   +--------------------------------+
                |
           pass?  \--- no --> reject check-in, no fog change
                |
               yes
                |
                v
   +--------------------------------+
   | Update user_districts.fogged      |
   | Fog clears ~1 sq.km around point   |
   +--------------------------------+
                |
                v
   +--------------------------------+
   | Figures in area rendered on map    |
   | Phase-Locked (A/S) or open (B/C)     |
   +--------------------------------+
                |
                v
   +--------------------------------+
   | User visits Support Nodes          |
   | (increment_node_visit trigger)      |
   +--------------------------------+
                |
                v
   +--------------------------------+
   | Visit count meets requirement?      |
   +--------------------------------+
           |                |
          no                yes
           |                |
     stay locked        Quiz Modal opens
                                |
                                v
                    +--------------------------+
                    | Answer question(s)         |
                    +--------------------------+
                          |            |
                       correct       wrong
                          |            |
                          v          retry
              +-------------------+
              | DB triggers fire:    |
              | on_capture_update_    |
              | score / increment_    |
              | legacy_score           |
              | -> user_captures row    |
              | -> Legacy Score++         |
              +-------------------+
                          |
                          v
              +-------------------+
              | Capture Reveal screen |
              | + Figure Card saved     |
              |   to Archive             |
              +-------------------+
```
