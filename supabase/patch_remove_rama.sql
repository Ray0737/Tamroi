-- Remove King Rama I (rama-i) from all tables
DELETE FROM raid_sessions   WHERE figure_id = 'rama-i';
DELETE FROM quiz_questions  WHERE figure_id = 'rama-i';
DELETE FROM user_captures   WHERE figure_id = 'rama-i';
DELETE FROM figures         WHERE id        = 'rama-i';
