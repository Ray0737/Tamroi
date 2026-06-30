# COOP_FIX_INSTRUCTIONS — Verification Checklist

Use this to verify each fix after implementation. Check off items as you test.

---

## DB Setup (run `supabase/patch_coop_fix.sql` first)

- [ ] `guild_join_requests` table exists in Supabase dashboard
- [ ] `community_posts` table exists in Supabase dashboard
- [ ] `community_post_flags` table exists in Supabase dashboard
- [ ] RLS is enabled on all three tables

---

## 1. Community Tab (nav rename)

- [ ] Bottom nav shows "Community" instead of "Rank"
- [ ] Tapping Community opens a tab with 3 pills: อันดับ · กลุ่มของฉัน · ถกเถียง
- [ ] Default active pill is อันดับ
- [ ] อันดับ pill shows the existing leaderboard (solo/guild toggle, podium, rank list)
- [ ] Switching pills works without page reload

---

## 2. กลุ่มของฉัน — No-guild state

- [ ] User not in any group sees "ยังไม่มีกลุ่ม" with Create + Join fields
- [ ] "ค้นหากลุ่ม" button opens a search bottom sheet
- [ ] Searching by guild name returns results with member count
- [ ] Tapping "ขอเข้าร่วม" sends a join request (row appears in `guild_join_requests`)
- [ ] Sending a second request to the same guild shows "รอการอนุมัติอยู่" (no duplicate)
- [ ] Pending request status is shown on the no-guild screen ("⏳ รอการอนุมัติจาก [name]")

---

## 3. กลุ่มของฉัน — Member view

- [ ] Guild name and 6-char invite code are displayed
- [ ] **Copy** button copies the invite code to clipboard
- [ ] "คัดลอกแล้ว!" feedback appears for ~1.5 s after copying
- [ ] Member list shows all members with name, role badge, online dot
- [ ] **When a new user joins the group**, the member list updates without page refresh
- [ ] Leave button works and returns user to no-guild state

---

## 4. กลุ่มของฉัน — Leader (admin) view

- [ ] Leader sees the same member list + Kick button per non-leader member
- [ ] Pending join requests badge shows count of pending requests
- [ ] Tapping the requests badge shows a list of pending requesters
- [ ] **Approve** inserts the user into `guild_members` and updates request status
- [ ] **Reject** sets request status to 'rejected' and removes from pending list
- [ ] Approved user's member list entry appears in real-time (no refresh needed)

---

## 5. Bug Fixes

### 5a. Duplicate join error
- [ ] Joining a group you're already in shows "คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว" (not a raw error)

### 5b. Member list showing
- [ ] Opening กลุ่มของฉัน for an existing group shows all members immediately
- [ ] Online dots appear correctly for online/offline members

---

## 6. ถกเถียง — General Community Forum

- [ ] ถกเถียง pill in Community tab shows a forum feed (not figure-specific)
- [ ] 50 most recent top-level posts load on open
- [ ] Compose box at top: textarea + Post button
- [ ] Posting a message adds it to the feed without page refresh
- [ ] Replies are expandable per post
- [ ] Flag button appears on other users' posts (not your own)
- [ ] **Collection tab no longer has a "ถกเถียง" filter pill**
- [ ] Removing the pill does not break other Collection filters (all/S/A/B/C/artifacts/journal)

---

## 7. Collection Tab (cleanup)

- [ ] Collection filter pills: ทั้งหมด · S-Class · A-Class · B-Class · C-Class · Artifacts · Journal (7 pills, no ถกเถียง)
- [ ] Lore journal still works via Journal pill
- [ ] Figure search still works

---

## Regression Check

- [ ] Map tab loads correctly
- [ ] Mission tab shows co-op missions (CoopModule)
- [ ] Leaderboard (อันดับ sub-tab) still shows correct data
- [ ] Raid modal still works
- [ ] Login / logout flow unaffected
