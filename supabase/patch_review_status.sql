-- B1 fix (docs/LEFT_FUNCTIONS.md): quiz_questions was missing review_status,
-- so the app couldn't filter out unreviewed content. Applied directly via
-- Supabase MCP on 2026-07-03 — this file documents it for local dev setup.

ALTER TABLE quiz_questions
  ADD COLUMN review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status = ANY (ARRAY['pending','approved','needs_edit','rejected']));

-- Backfill: existing rows were already live in the app, so treat them as reviewed.
-- Run this BEFORE adding any .eq('review_status', 'approved') filter in
-- supabase-client.js, or existing content disappears.
UPDATE lore_nodes SET review_status = 'approved' WHERE review_status = 'pending';
UPDATE quiz_questions SET review_status = 'approved' WHERE review_status = 'pending';
