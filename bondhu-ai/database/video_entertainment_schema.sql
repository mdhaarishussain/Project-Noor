-- Video Entertainment Database Schema
-- Add these tables to your Supabase database
-- Video feedback table for like/dislike functionality
CREATE TABLE IF NOT EXISTS video_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (
        feedback_type IN ('like', 'dislike', 'watch', 'skip', 'share')
    ),
    additional_data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- User video history table
CREATE TABLE IF NOT EXISTS user_video_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    video_title TEXT,
    channel_title TEXT,
    category_name TEXT,
    watch_time INTEGER DEFAULT 0,
    -- in seconds
    completion_rate FLOAT DEFAULT 0.0,
    -- 0.0 to 1.0
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Video recommendations cache table
CREATE TABLE IF NOT EXISTS video_recommendations_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL,
    personality_profile JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '8 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Entertainment preferences table
CREATE TABLE IF NOT EXISTS entertainment_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_preferences JSONB DEFAULT '{}',
    music_preferences JSONB DEFAULT '{}',
    gaming_preferences JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_feedback_user_id ON video_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_video_feedback_video_id ON video_feedback(video_id);
CREATE INDEX IF NOT EXISTS idx_video_feedback_feedback_type ON video_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_video_feedback_timestamp ON video_feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_video_history_user_id ON user_video_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_history_watched_at ON user_video_history(watched_at);
CREATE INDEX IF NOT EXISTS idx_user_video_history_category ON user_video_history(category_name);
CREATE INDEX IF NOT EXISTS idx_video_recommendations_user_id ON video_recommendations_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_video_recommendations_expires_at ON video_recommendations_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_entertainment_preferences_user_id ON entertainment_preferences(user_id);
-- Enable Row Level Security (RLS)
ALTER TABLE video_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE entertainment_preferences ENABLE ROW LEVEL SECURITY;
-- Create RLS policies
CREATE POLICY "Users can manage their own video feedback" ON video_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own video history" ON user_video_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own video recommendations" ON video_recommendations_cache FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own entertainment preferences" ON entertainment_preferences FOR ALL USING (auth.uid() = user_id);
-- Functions for automatic cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_video_recommendations() RETURNS void AS $$ BEGIN
DELETE FROM video_recommendations_cache
WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
-- Function to update entertainment preferences based on feedback
CREATE OR REPLACE FUNCTION update_entertainment_preferences() RETURNS TRIGGER AS $$ BEGIN -- Update video preferences based on feedback
INSERT INTO entertainment_preferences (user_id, video_preferences, updated_at)
VALUES (
        NEW.user_id,
        JSONB_BUILD_OBJECT(
            'last_feedback',
            NEW.feedback_type,
            'last_feedback_time',
            NEW.timestamp,
            'total_feedback_count',
            1
        ),
        NOW()
    ) ON CONFLICT (user_id) DO
UPDATE
SET video_preferences = JSONB_SET(
        entertainment_preferences.video_preferences,
        '{total_feedback_count}',
        TO_JSONB(
            COALESCE(
                (
                    entertainment_preferences.video_preferences->>'total_feedback_count'
                )::INTEGER,
                0
            ) + 1
        )
    ),
    updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for automatic preference updates
CREATE TRIGGER trigger_update_entertainment_preferences
AFTER
INSERT ON video_feedback FOR EACH ROW EXECUTE FUNCTION update_entertainment_preferences();
-- Create a cleanup job (run this periodically)
-- SELECT cron.schedule('cleanup-video-recommendations', '0 */6 * * *', 'SELECT cleanup_expired_video_recommendations();');