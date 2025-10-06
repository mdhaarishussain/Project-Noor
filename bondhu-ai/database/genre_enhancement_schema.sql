-- Enhanced Video Entertainment Database Schema
-- Genre-based recommendation system improvements
-- Run these SQL commands in your Supabase database
-- Add genre tracking to user_video_history table
ALTER TABLE user_video_history
ADD COLUMN IF NOT EXISTS inferred_genre TEXT,
    ADD COLUMN IF NOT EXISTS genre_confidence FLOAT DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS engagement_score FLOAT DEFAULT 0.0;
-- Create genre preferences table
CREATE TABLE IF NOT EXISTS user_genre_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    genre TEXT NOT NULL,
    preference_score FLOAT DEFAULT 0.0,
    -- 0.0 to 1.0
    personality_score FLOAT DEFAULT 0.0,
    -- Contribution from personality
    history_score FLOAT DEFAULT 0.0,
    -- Contribution from watch history
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, genre)
);
-- Create genre recommendations cache table
CREATE TABLE IF NOT EXISTS genre_recommendations_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    genre TEXT NOT NULL,
    recommendations JSONB NOT NULL,
    personality_profile JSONB,
    reason TEXT,
    preference_score FLOAT DEFAULT 0.0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create video genre mapping table for better categorization
CREATE TABLE IF NOT EXISTS video_genre_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL UNIQUE,
    primary_genre TEXT NOT NULL,
    secondary_genres TEXT [],
    -- Array of additional genres
    confidence_score FLOAT DEFAULT 0.0,
    source TEXT DEFAULT 'inferred',
    -- 'youtube_category', 'content_analysis', 'inferred'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_user_id ON user_genre_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_genre ON user_genre_preferences(genre);
CREATE INDEX IF NOT EXISTS idx_genre_recommendations_cache_user_id ON genre_recommendations_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_genre_recommendations_cache_expires ON genre_recommendations_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_video_genre_mapping_video_id ON video_genre_mapping(video_id);
CREATE INDEX IF NOT EXISTS idx_video_genre_mapping_genre ON video_genre_mapping(primary_genre);
CREATE INDEX IF NOT EXISTS idx_user_video_history_genre ON user_video_history(inferred_genre);
-- Update entertainment_preferences table to include genre-specific settings
ALTER TABLE entertainment_preferences
ADD COLUMN IF NOT EXISTS genre_preferences JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS discovery_mode BOOLEAN DEFAULT true,
    -- Whether user wants genre variety
ADD COLUMN IF NOT EXISTS preferred_video_length TEXT DEFAULT 'mixed';
-- 'short', 'medium', 'long', 'mixed'
-- Function to update user genre preferences based on watch history
CREATE OR REPLACE FUNCTION update_user_genre_preferences() RETURNS TRIGGER AS $$ BEGIN -- Update genre preferences when new video history is added
INSERT INTO user_genre_preferences (user_id, genre, history_score, last_updated)
VALUES (
        NEW.user_id,
        NEW.inferred_genre,
        NEW.engagement_score,
        NOW()
    ) ON CONFLICT (user_id, genre) DO
UPDATE
SET history_score = (user_genre_preferences.history_score * 0.8) + (NEW.engagement_score * 0.2),
    last_updated = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger to automatically update genre preferences
DROP TRIGGER IF EXISTS trigger_update_genre_preferences ON user_video_history;
CREATE TRIGGER trigger_update_genre_preferences
AFTER
INSERT
    OR
UPDATE ON user_video_history FOR EACH ROW
    WHEN (
        NEW.inferred_genre IS NOT NULL
        AND NEW.engagement_score > 0
    ) EXECUTE FUNCTION update_user_genre_preferences();
-- Function to clean up expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations() RETURNS void AS $$ BEGIN
DELETE FROM genre_recommendations_cache
WHERE expires_at < NOW();
DELETE FROM video_recommendations_cache
WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
-- Create example genres for reference
INSERT INTO user_genre_preferences (
        user_id,
        genre,
        preference_score,
        personality_score,
        history_score
    )
SELECT auth.users.id,
    unnest(
        ARRAY ['comedy', 'education', 'technology', 'music', 'gaming', 'fitness', 'food', 'travel']
    ) as genre,
    0.5,
    -- Default neutral preference
    0.0,
    -- Will be calculated by system
    0.0 -- Will be updated based on history
FROM auth.users ON CONFLICT (user_id, genre) DO NOTHING;
-- Add RLS (Row Level Security) policies
ALTER TABLE user_genre_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE genre_recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_genre_mapping ENABLE ROW LEVEL SECURITY;
-- Policy for user_genre_preferences
CREATE POLICY "Users can only access their own genre preferences" ON user_genre_preferences FOR ALL USING (auth.uid() = user_id);
-- Policy for genre_recommendations_cache
CREATE POLICY "Users can only access their own genre recommendations" ON genre_recommendations_cache FOR ALL USING (auth.uid() = user_id);
-- Policy for video_genre_mapping (read-only for all authenticated users)
CREATE POLICY "All authenticated users can read video genre mappings" ON video_genre_mapping FOR
SELECT USING (auth.role() = 'authenticated');
-- Grant necessary permissions
GRANT ALL ON user_genre_preferences TO authenticated;
GRANT ALL ON genre_recommendations_cache TO authenticated;
GRANT SELECT ON video_genre_mapping TO authenticated;
-- Create comments for documentation
COMMENT ON TABLE user_genre_preferences IS 'Stores user preferences for different video genres based on personality and viewing history';
COMMENT ON TABLE genre_recommendations_cache IS 'Caches genre-specific video recommendations to improve performance';
COMMENT ON TABLE video_genre_mapping IS 'Maps videos to their primary and secondary genres for better categorization';
COMMENT ON COLUMN user_genre_preferences.preference_score IS 'Combined preference score (0.0-1.0) calculated from personality and history';
COMMENT ON COLUMN user_genre_preferences.personality_score IS 'Contribution from personality traits (0.0-1.0)';
COMMENT ON COLUMN user_genre_preferences.history_score IS 'Contribution from viewing history engagement (0.0-1.0)';