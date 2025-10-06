-- SIMPLE TEST DATA - Works for all users at once
-- Run this in Supabase SQL Editor AFTER running QUICK-SETUP.sql

-- This will populate stats for ALL users in your database
-- Safe to run multiple times

-- Step 1: Create rows for all users who don't have stats yet
INSERT INTO user_activity_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Update ALL users with sample data
UPDATE user_activity_stats SET
  wellness_score = 85,
  wellness_trend = 12,
  total_messages = 150,
  messages_today = 8,
  total_games_played = 12,
  games_this_week = 2,
  current_streak_days = 23,  -- This shows in the "23 day streak" badge
  longest_streak_days = 30,
  total_achievements = 8,
  achievements_this_month = 2,
  active_sessions = 3,
  active_sessions_today = 3,
  games_played_count = 3,
  videos_watched_count = 5,
  songs_listened_count = 12,
  last_activity_date = NOW(),
  updated_at = NOW();

-- Step 3: Verify all users have stats
SELECT 
  user_id,
  wellness_score,
  total_messages,
  total_games_played,
  games_played_count,
  videos_watched_count,
  songs_listened_count
FROM user_activity_stats;
