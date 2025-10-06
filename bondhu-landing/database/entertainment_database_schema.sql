-- ============================================================================
-- BONDHU APP - UPDATED DATABASE SCHEMA FOR ENTERTAINMENT SYSTEM
-- ============================================================================
-- This script adds the missing tables needed for the entertainment recommendation system
-- Run this AFTER your base schema to add entertainment-specific tables
-- ============================================================================
-- Enable required extensions (in case not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================================================
-- ENTERTAINMENT RECOMMENDATION TABLES
-- ============================================================================
-- Entertainment recommendations table (enhanced version)
CREATE TABLE IF NOT EXISTS entertainment_recommendations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    recommendation_type text not null check (
        recommendation_type in ('music', 'video', 'game')
    ),
    content_id text not null,
    title text not null,
    description text,
    url text,
    thumbnail_url text,
    metadata jsonb default '{}'::jsonb,
    agent_reasoning text,
    confidence_score numeric(5, 2) check (
        confidence_score >= 0
        AND confidence_score <= 100
    ),
    personality_match_score numeric(5, 2) check (
        personality_match_score >= 0
        AND personality_match_score <= 100
    ),
    mood_context text,
    category text,
    tags text [],
    created_at timestamp with time zone default now(),
    expires_at timestamp with time zone,
    is_active boolean default true
);
-- Entertainment interactions table (track user interactions)
CREATE TABLE IF NOT EXISTS entertainment_interactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    recommendation_id uuid references entertainment_recommendations on delete cascade,
    interaction_type text not null check (
        interaction_type in (
            'view',
            'play',
            'like',
            'dislike',
            'share',
            'complete',
            'skip'
        )
    ),
    content_type text not null check (
        content_type in ('music', 'video', 'game')
    ),
    content_id text not null,
    interaction_data jsonb default '{}'::jsonb,
    duration_seconds integer,
    completion_percentage numeric(5, 2),
    mood_before text,
    mood_after text,
    created_at timestamp with time zone default now()
);
-- Entertainment sessions table (track entertainment sessions)
CREATE TABLE IF NOT EXISTS entertainment_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    session_type text not null check (
        session_type in ('music', 'video', 'game', 'mixed')
    ),
    start_time timestamp with time zone default now(),
    end_time timestamp with time zone,
    total_duration_seconds integer,
    activities_count integer default 0,
    mood_before text,
    mood_after text,
    session_data jsonb default '{}'::jsonb,
    engagement_score numeric(5, 2),
    created_at timestamp with time zone default now()
);
-- User entertainment preferences table
CREATE TABLE IF NOT EXISTS entertainment_preferences (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    preference_type text not null check (
        preference_type in (
            'music_genre',
            'video_category',
            'game_type',
            'mood_preference'
        )
    ),
    preference_key text not null,
    preference_value text not null,
    preference_score numeric(5, 2) default 50.0,
    learned_from text,
    -- 'explicit', 'implicit', 'personality_analysis'
    last_updated timestamp with time zone default now(),
    UNIQUE(user_id, preference_type, preference_key)
);
-- Entertainment analytics table (for advanced insights)
CREATE TABLE IF NOT EXISTS entertainment_analytics (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    analysis_date date default current_date,
    content_type text not null check (
        content_type in ('music', 'video', 'game', 'overall')
    ),
    metrics jsonb not null default '{}'::jsonb,
    insights jsonb default '{}'::jsonb,
    personality_correlations jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now(),
    UNIQUE(user_id, analysis_date, content_type)
);
-- ============================================================================
-- INDEXES FOR ENTERTAINMENT TABLES
-- ============================================================================
-- Entertainment recommendations indexes
CREATE INDEX IF NOT EXISTS idx_entertainment_recommendations_user_id ON entertainment_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_entertainment_recommendations_type ON entertainment_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_entertainment_recommendations_active ON entertainment_recommendations(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_entertainment_recommendations_confidence ON entertainment_recommendations(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_entertainment_recommendations_mood ON entertainment_recommendations(mood_context);
-- Entertainment interactions indexes
CREATE INDEX IF NOT EXISTS idx_entertainment_interactions_user_id ON entertainment_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_entertainment_interactions_recommendation_id ON entertainment_interactions(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_entertainment_interactions_type ON entertainment_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_entertainment_interactions_created_at ON entertainment_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_entertainment_interactions_content ON entertainment_interactions(content_type, content_id);
-- Entertainment sessions indexes
CREATE INDEX IF NOT EXISTS idx_entertainment_sessions_user_id ON entertainment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_entertainment_sessions_type ON entertainment_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_entertainment_sessions_start_time ON entertainment_sessions(start_time);
-- Entertainment preferences indexes
CREATE INDEX IF NOT EXISTS idx_entertainment_preferences_user_id ON entertainment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_entertainment_preferences_type ON entertainment_preferences(preference_type);
CREATE INDEX IF NOT EXISTS idx_entertainment_preferences_score ON entertainment_preferences(preference_score DESC);
-- Entertainment analytics indexes
CREATE INDEX IF NOT EXISTS idx_entertainment_analytics_user_id ON entertainment_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_entertainment_analytics_date ON entertainment_analytics(analysis_date);
CREATE INDEX IF NOT EXISTS idx_entertainment_analytics_type ON entertainment_analytics(content_type);
-- ============================================================================
-- ROW LEVEL SECURITY FOR ENTERTAINMENT TABLES
-- ============================================================================
-- Enable RLS on entertainment tables
ALTER TABLE entertainment_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entertainment_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entertainment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entertainment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE entertainment_analytics ENABLE ROW LEVEL SECURITY;
-- Entertainment recommendations policies
CREATE POLICY "Users can view own entertainment recommendations" ON entertainment_recommendations FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own entertainment recommendations" ON entertainment_recommendations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Entertainment interactions policies
CREATE POLICY "Users can manage own entertainment interactions" ON entertainment_interactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Entertainment sessions policies
CREATE POLICY "Users can manage own entertainment sessions" ON entertainment_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Entertainment preferences policies
CREATE POLICY "Users can manage own entertainment preferences" ON entertainment_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Entertainment analytics policies
CREATE POLICY "Users can view own entertainment analytics" ON entertainment_analytics FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage entertainment analytics" ON entertainment_analytics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- ============================================================================
-- ENTERTAINMENT FUNCTIONS
-- ============================================================================
-- Function to record entertainment interaction
CREATE OR REPLACE FUNCTION public.record_entertainment_interaction(
        p_user_id UUID,
        p_recommendation_id UUID,
        p_interaction_type TEXT,
        p_content_type TEXT,
        p_content_id TEXT,
        p_interaction_data JSONB DEFAULT '{}'::JSONB,
        p_duration_seconds INTEGER DEFAULT NULL,
        p_completion_percentage NUMERIC DEFAULT NULL,
        p_mood_before TEXT DEFAULT NULL,
        p_mood_after TEXT DEFAULT NULL
    ) RETURNS UUID AS $$
DECLARE interaction_id UUID;
BEGIN
INSERT INTO entertainment_interactions (
        user_id,
        recommendation_id,
        interaction_type,
        content_type,
        content_id,
        interaction_data,
        duration_seconds,
        completion_percentage,
        mood_before,
        mood_after
    )
VALUES (
        p_user_id,
        p_recommendation_id,
        p_interaction_type,
        p_content_type,
        p_content_id,
        p_interaction_data,
        p_duration_seconds,
        p_completion_percentage,
        p_mood_before,
        p_mood_after
    )
RETURNING id INTO interaction_id;
RETURN interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get entertainment recommendations
CREATE OR REPLACE FUNCTION public.get_entertainment_recommendations(
        p_user_id UUID,
        p_content_type TEXT DEFAULT NULL,
        p_limit INTEGER DEFAULT 10,
        p_mood_context TEXT DEFAULT NULL
    ) RETURNS TABLE (
        id UUID,
        recommendation_type TEXT,
        content_id TEXT,
        title TEXT,
        description TEXT,
        url TEXT,
        thumbnail_url TEXT,
        metadata JSONB,
        agent_reasoning TEXT,
        confidence_score NUMERIC,
        personality_match_score NUMERIC,
        mood_context TEXT,
        category TEXT,
        tags TEXT [],
        created_at TIMESTAMPTZ
    ) AS $$ BEGIN RETURN QUERY
SELECT r.id,
    r.recommendation_type,
    r.content_id,
    r.title,
    r.description,
    r.url,
    r.thumbnail_url,
    r.metadata,
    r.agent_reasoning,
    r.confidence_score,
    r.personality_match_score,
    r.mood_context,
    r.category,
    r.tags,
    r.created_at
FROM entertainment_recommendations r
WHERE r.user_id = p_user_id
    AND r.is_active = true
    AND (
        p_content_type IS NULL
        OR r.recommendation_type = p_content_type
    )
    AND (
        p_mood_context IS NULL
        OR r.mood_context = p_mood_context
    )
    AND (
        r.expires_at IS NULL
        OR r.expires_at > NOW()
    )
ORDER BY r.confidence_score DESC,
    r.created_at DESC
LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to update entertainment preferences
CREATE OR REPLACE FUNCTION public.update_entertainment_preference(
        p_user_id UUID,
        p_preference_type TEXT,
        p_preference_key TEXT,
        p_preference_value TEXT,
        p_preference_score NUMERIC DEFAULT 50.0,
        p_learned_from TEXT DEFAULT 'implicit'
    ) RETURNS BOOLEAN AS $$ BEGIN
INSERT INTO entertainment_preferences (
        user_id,
        preference_type,
        preference_key,
        preference_value,
        preference_score,
        learned_from
    )
VALUES (
        p_user_id,
        p_preference_type,
        p_preference_key,
        p_preference_value,
        p_preference_score,
        p_learned_from
    ) ON CONFLICT (user_id, preference_type, preference_key) DO
UPDATE
SET preference_value = EXCLUDED.preference_value,
    preference_score = EXCLUDED.preference_score,
    learned_from = EXCLUDED.learned_from,
    last_updated = NOW();
RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get entertainment statistics
CREATE OR REPLACE FUNCTION public.get_entertainment_stats(p_user_id UUID) RETURNS JSONB AS $$
DECLARE stats JSONB;
BEGIN
SELECT jsonb_build_object(
        'total_interactions',
        COUNT(*),
        'music_interactions',
        COUNT(*) FILTER (
            WHERE content_type = 'music'
        ),
        'video_interactions',
        COUNT(*) FILTER (
            WHERE content_type = 'video'
        ),
        'game_interactions',
        COUNT(*) FILTER (
            WHERE content_type = 'game'
        ),
        'total_time_minutes',
        COALESCE(SUM(duration_seconds), 0) / 60,
        'last_activity',
        MAX(created_at),
        'favorite_content_type',
        (
            SELECT content_type
            FROM entertainment_interactions ei2
            WHERE ei2.user_id = p_user_id
            GROUP BY content_type
            ORDER BY COUNT(*) DESC
            LIMIT 1
        )
    ) INTO stats
FROM entertainment_interactions
WHERE user_id = p_user_id;
RETURN COALESCE(stats, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- VIEWS FOR ENTERTAINMENT DATA
-- ============================================================================
-- Entertainment activity summary view
CREATE OR REPLACE VIEW entertainment_activity_summary AS
SELECT ei.user_id,
    ei.content_type,
    COUNT(*) as interaction_count,
    SUM(ei.duration_seconds) as total_duration_seconds,
    AVG(ei.completion_percentage) as avg_completion_rate,
    MAX(ei.created_at) as last_interaction,
    COUNT(DISTINCT DATE(ei.created_at)) as active_days
FROM entertainment_interactions ei
GROUP BY ei.user_id,
    ei.content_type;
-- User entertainment preferences view
CREATE OR REPLACE VIEW user_entertainment_summary AS
SELECT p.id as user_id,
    p.full_name,
    COALESCE(eas_music.interaction_count, 0) as music_interactions,
    COALESCE(eas_video.interaction_count, 0) as video_interactions,
    COALESCE(eas_game.interaction_count, 0) as game_interactions,
    COALESCE(eas_music.total_duration_seconds, 0) + COALESCE(eas_video.total_duration_seconds, 0) + COALESCE(eas_game.total_duration_seconds, 0) as total_entertainment_seconds,
    GREATEST(
        COALESCE(
            eas_music.last_interaction,
            '1970-01-01'::timestamptz
        ),
        COALESCE(
            eas_video.last_interaction,
            '1970-01-01'::timestamptz
        ),
        COALESCE(
            eas_game.last_interaction,
            '1970-01-01'::timestamptz
        )
    ) as last_entertainment_activity
FROM profiles p
    LEFT JOIN entertainment_activity_summary eas_music ON p.id = eas_music.user_id
    AND eas_music.content_type = 'music'
    LEFT JOIN entertainment_activity_summary eas_video ON p.id = eas_video.user_id
    AND eas_video.content_type = 'video'
    LEFT JOIN entertainment_activity_summary eas_game ON p.id = eas_game.user_id
    AND eas_game.content_type = 'game';
-- ============================================================================
-- PERMISSIONS FOR ENTERTAINMENT TABLES
-- ============================================================================
-- Grant permissions to authenticated users
GRANT ALL ON entertainment_recommendations TO authenticated,
    service_role;
GRANT ALL ON entertainment_interactions TO authenticated,
    service_role;
GRANT ALL ON entertainment_sessions TO authenticated,
    service_role;
GRANT ALL ON entertainment_preferences TO authenticated,
    service_role;
GRANT ALL ON entertainment_analytics TO authenticated,
    service_role;
-- Grant permissions on views
GRANT SELECT ON entertainment_activity_summary TO authenticated,
    service_role;
GRANT SELECT ON user_entertainment_summary TO authenticated,
    service_role;
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.record_entertainment_interaction(
        UUID,
        UUID,
        TEXT,
        TEXT,
        TEXT,
        JSONB,
        INTEGER,
        NUMERIC,
        TEXT,
        TEXT
    ) TO authenticated,
    service_role;
GRANT EXECUTE ON FUNCTION public.get_entertainment_recommendations(UUID, TEXT, INTEGER, TEXT) TO authenticated,
    service_role;
GRANT EXECUTE ON FUNCTION public.update_entertainment_preference(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO authenticated,
    service_role;
GRANT EXECUTE ON FUNCTION public.get_entertainment_stats(UUID) TO authenticated,
    service_role;
-- ============================================================================
-- ANALYZE TABLES FOR PERFORMANCE
-- ============================================================================
ANALYZE entertainment_recommendations;
ANALYZE entertainment_interactions;
ANALYZE entertainment_sessions;
ANALYZE entertainment_preferences;
ANALYZE entertainment_analytics;
-- ============================================================================
-- ENTERTAINMENT SCHEMA SETUP COMPLETE
-- ============================================================================
-- This schema adds:
-- ✅ Entertainment recommendations tracking
-- ✅ User interaction recording
-- ✅ Entertainment session management
-- ✅ Dynamic preference learning
-- ✅ Advanced analytics and insights
-- ✅ Proper RLS security policies
-- ✅ Optimized indexes for performance
-- ✅ Utility functions for common operations
-- ✅ Views for easy data access
-- ============================================================================