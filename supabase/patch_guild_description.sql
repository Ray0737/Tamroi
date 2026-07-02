-- patch_guild_description.sql
-- Run after patch_group_management.sql
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS description TEXT;
