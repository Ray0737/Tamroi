-- patch_group_management.sql
-- Run in Supabase SQL Editor after patch_coop_fix.sql

ALTER TABLE guilds ADD COLUMN IF NOT EXISTS announcement TEXT;
