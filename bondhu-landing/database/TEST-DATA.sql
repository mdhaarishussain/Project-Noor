-- TEST DATA FOR DASHBOARD STATS
-- Run this AFTER running QUICK-SETUP.sql to populate your stats with sample data

-- METHOD 1: If you know your user ID, replace 'YOUR_USER_ID_HERE' with your actual user ID
-- Get your user ID from: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- First, let's see all users to find your ID
SELECT id, email FROM auth.users;

-- Copy your user ID from above and use it in the commands below
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID

-- Step 1: Make sure you have a row (replace YOUR_USER_ID_HERE)
INSERT INTO user_activity_stats (user_id)
VALUES ('YOUR_USER_ID_HERE')
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

-- Step 2: Add sample data for all fields (replace YOUR_USER_ID_HERE)
UPDATE user_activity_stats SET
  -- Progress Stats (6 cards at bottom)
  wellness_score = 85,
  wellness_trend = 12,
  total_messages = 150,
  messages_today = 8,
  total_games_played = 12,
  games_this_week = 2,
  current_streak_days = 23,
  longest_streak_days = 30,
  total_achievements = 8,
  achievements_this_month = 2,
  active_sessions = 3,
  active_sessions_today = 3,
  
  -- Entertainment Hub Preview (Recent Activity)
  games_played_count = 3,
  videos_watched_count = 5,
  songs_listened_count = 12,
  
  last_activity_date = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Step 3: Verify the data was inserted (replace YOUR_USER_ID_HERE)
SELECT 
  wellness_score,
  total_messages,
  total_games_played,
  current_streak_days,
  games_played_count,
  videos_watched_count,
  songs_listened_count
FROM user_activity_stats 
WHERE user_id = 'YOUR_USER_ID_HERE';


-- ===================================================================
-- ALTERNATIVE METHOD: Insert for ALL existing users at once
-- ===================================================================
-- This will add sample data for every user in your database
-- Use this if you want to populate stats for all users

-- Uncomment the lines below to use this method:

/*
INSERT INTO user_activity_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

UPDATE user_activity_stats SET
  wellness_score = 85,
  wellness_trend = 12,
  total_messages = 150,
  messages_today = 8,
  total_games_played = 12,
  games_this_week = 2,
  current_streak_days = 23,
  longest_streak_days = 30,
  total_achievements = 8,
  achievements_this_month = 2,
  active_sessions = 3,
  active_sessions_today = 3,
  games_played_count = 3,
  videos_watched_count = 5,
  songs_listened_count = 12,
  last_activity_date = NOW();

SELECT * FROM user_activity_stats;
*/
