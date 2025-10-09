-- ============================================================================
-- SPOTIFY PERSONALITY-BASED MUSIC RECOMMENDER - DATABASE SCHEMA
-- Version: 1.0 - Spec Compliant
-- Target Scale: 500-1000 concurrent users
-- ============================================================================
-- This schema adds the missing tables required by the spec:
-- - listening_history: User's Spotify listening history with audio features
-- - recommendations_cache: Cached recommendations with scores
-- - personality_scores: Big Five personality assessment scores
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LISTENING HISTORY TABLE
-- Stores user's Spotify listening history with audio features for recommendations
-- ============================================================================
CREATE TABLE IF NOT EXISTS listening_history (
    history_id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    
    -- Spotify track information
    track_id text not null,
    track_name text not null,
    artist_name text not null,
    album_name text,
    track_uri text,
    external_url text,
    
    -- Audio features (from Spotify Audio Features API)
    danceability numeric(5, 3) check (danceability >= 0 AND danceability <= 1),
    energy numeric(5, 3) check (energy >= 0 AND energy <= 1),
    valence numeric(5, 3) check (valence >= 0 AND valence <= 1),
    tempo numeric(6, 2),
    acousticness numeric(5, 3) check (acousticness >= 0 AND acousticness <= 1),
    instrumentalness numeric(5, 3) check (instrumentalness >= 0 AND instrumentalness <= 1),
    speechiness numeric(5, 3) check (speechiness >= 0 AND speechiness <= 1),
    liveness numeric(5, 3) check (liveness >= 0 AND liveness <= 1),
    loudness numeric(6, 2),
    key integer check (key >= 0 AND key <= 11),
    mode integer check (mode IN (0, 1)),
    time_signature integer,
    
    -- Metadata
    duration_ms integer,
    popularity integer check (popularity >= 0 AND popularity <= 100),
    explicit boolean default false,
    
    -- Listening context
    played_at timestamp with time zone not null,
    play_count integer default 1,
    last_played_at timestamp with time zone,
    total_listen_time_ms bigint default 0,
    
    -- Timestamps
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    -- Index for efficient queries
    CONSTRAINT unique_user_track_played UNIQUE (user_id, track_id, played_at)
);

-- Indexes for listening_history
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON listening_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_played ON listening_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_track_id ON listening_history(track_id);

-- ============================================================================
-- RECOMMENDATIONS CACHE TABLE
-- Stores generated recommendations with scores and expires_at for cache management
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendations_cache (
    cache_id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    
    -- Cached recommendation data (JSON array of tracks with scores)
    recommended_tracks_json jsonb not null,
    scores_json jsonb not null,
    
    -- Recommendation metadata
    recommendation_type text default 'standard' check (
        recommendation_type IN ('standard', 'cold_start', 'personality_only', 'history_based')
    ),
    total_candidates integer,
    final_count integer,
    
    -- Scoring breakdown (for analysis)
    avg_history_similarity numeric(5, 3),
    avg_personality_match numeric(5, 3),
    avg_diversity_score numeric(5, 3),
    avg_novelty_score numeric(5, 3),
    avg_rl_score numeric(5, 3),
    
    -- Cache management
    generated_at timestamp with time zone default now() not null,
    expires_at timestamp with time zone not null,
    is_valid boolean default true,
    cache_hit_count integer default 0,
    last_accessed_at timestamp with time zone,
    
    -- User context snapshot
    user_account_age_days integer,
    personality_snapshot jsonb,
    listening_history_size integer,
    
    -- Timestamps
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Indexes for recommendations_cache
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_user_id ON recommendations_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_expires_at ON recommendations_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_user_expiry ON recommendations_cache(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_valid ON recommendations_cache(is_valid, expires_at);

-- ============================================================================
-- PERSONALITY SCORES TABLE
-- Stores Big Five personality assessment scores (44-item inventory)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personality_scores (
    score_id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    
    -- Big Five personality traits (0-100 scale per spec)
    openness integer not null check (openness >= 0 AND openness <= 100),
    conscientiousness integer not null check (conscientiousness >= 0 AND conscientiousness <= 100),
    extraversion integer not null check (extraversion >= 0 AND extraversion <= 100),
    agreeableness integer not null check (agreeableness >= 0 AND agreeableness <= 100),
    neuroticism integer not null check (neuroticism >= 0 AND neuroticism <= 100),
    
    -- Confidence and reliability metrics
    assessment_confidence numeric(5, 3) check (assessment_confidence >= 0 AND assessment_confidence <= 1),
    assessment_method text default 'big_five_inventory_44' check (
        assessment_method IN ('big_five_inventory_44', 'tipi', 'neo_pi_r', 'inferred')
    ),
    
    -- Assessment metadata
    assessment_date timestamp with time zone default now() not null,
    assessment_duration_seconds integer,
    total_questions integer default 44,
    questions_answered integer,
    
    -- Raw responses (for re-scoring if needed)
    raw_responses jsonb,
    
    -- Previous scores (for tracking changes)
    previous_score_id uuid references personality_scores(score_id),
    change_magnitude numeric(5, 3),
    
    -- Validity flags
    is_active boolean default true,
    is_valid boolean default true,
    invalidation_reason text,
    
    -- Timestamps
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Indexes for personality_scores
CREATE INDEX IF NOT EXISTS idx_personality_scores_user_id ON personality_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_scores_user_active ON personality_scores(user_id, is_active, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_personality_scores_assessment_date ON personality_scores(assessment_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_scores ENABLE ROW LEVEL SECURITY;

-- Listening history policies
CREATE POLICY "Users can manage own listening history" 
    ON listening_history FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Recommendations cache policies
CREATE POLICY "Users can manage own recommendations cache" 
    ON recommendations_cache FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Personality scores policies
CREATE POLICY "Users can manage own personality scores" 
    ON personality_scores FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's top 50 tracks
CREATE OR REPLACE FUNCTION public.get_user_top_50_tracks(p_user_id UUID)
RETURNS TABLE (
    track_id TEXT,
    track_name TEXT,
    artist_name TEXT,
    play_count INTEGER,
    total_listen_time_ms BIGINT,
    last_played_at TIMESTAMPTZ,
    danceability NUMERIC,
    energy NUMERIC,
    valence NUMERIC,
    tempo NUMERIC,
    acousticness NUMERIC,
    instrumentalness NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lh.track_id,
        lh.track_name,
        lh.artist_name,
        lh.play_count,
        lh.total_listen_time_ms,
        lh.last_played_at,
        lh.danceability,
        lh.energy,
        lh.valence,
        lh.tempo,
        lh.acousticness,
        lh.instrumentalness
    FROM listening_history lh
    WHERE lh.user_id = p_user_id
    ORDER BY lh.play_count DESC, lh.last_played_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active personality profile
CREATE OR REPLACE FUNCTION public.get_active_personality_profile(p_user_id UUID)
RETURNS TABLE (
    openness INTEGER,
    conscientiousness INTEGER,
    extraversion INTEGER,
    agreeableness INTEGER,
    neuroticism INTEGER,
    assessment_confidence NUMERIC,
    assessment_date TIMESTAMPTZ,
    days_since_assessment INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.openness,
        ps.conscientiousness,
        ps.extraversion,
        ps.agreeableness,
        ps.neuroticism,
        ps.assessment_confidence,
        ps.assessment_date,
        EXTRACT(DAY FROM (NOW() - ps.assessment_date))::INTEGER as days_since_assessment
    FROM personality_scores ps
    WHERE ps.user_id = p_user_id
      AND ps.is_active = true
      AND ps.is_valid = true
    ORDER BY ps.assessment_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_recommendations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM recommendations_cache
    WHERE expires_at < NOW()
      AND is_valid = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert listening history (increment play count if exists)
CREATE OR REPLACE FUNCTION public.upsert_listening_history(
    p_user_id UUID,
    p_track_id TEXT,
    p_track_name TEXT,
    p_artist_name TEXT,
    p_played_at TIMESTAMPTZ,
    p_audio_features JSONB,
    p_duration_ms INTEGER DEFAULT NULL,
    p_listen_time_ms BIGINT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO listening_history (
        user_id, track_id, track_name, artist_name, played_at,
        danceability, energy, valence, tempo, acousticness, 
        instrumentalness, speechiness, liveness, loudness,
        duration_ms, total_listen_time_ms, play_count, last_played_at
    ) VALUES (
        p_user_id, p_track_id, p_track_name, p_artist_name, p_played_at,
        (p_audio_features->>'danceability')::NUMERIC,
        (p_audio_features->>'energy')::NUMERIC,
        (p_audio_features->>'valence')::NUMERIC,
        (p_audio_features->>'tempo')::NUMERIC,
        (p_audio_features->>'acousticness')::NUMERIC,
        (p_audio_features->>'instrumentalness')::NUMERIC,
        (p_audio_features->>'speechiness')::NUMERIC,
        (p_audio_features->>'liveness')::NUMERIC,
        (p_audio_features->>'loudness')::NUMERIC,
        p_duration_ms, COALESCE(p_listen_time_ms, 0), 1, p_played_at
    )
    ON CONFLICT (user_id, track_id, played_at) DO UPDATE SET
        play_count = listening_history.play_count + 1,
        total_listen_time_ms = listening_history.total_listen_time_ms + COALESCE(p_listen_time_ms, 0),
        last_played_at = GREATEST(listening_history.last_played_at, p_played_at),
        updated_at = NOW()
    RETURNING listening_history.history_id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listening_history_updated_at
    BEFORE UPDATE ON listening_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_cache_updated_at
    BEFORE UPDATE ON recommendations_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_scores_updated_at
    BEFORE UPDATE ON personality_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE listening_history IS 'User Spotify listening history with audio features (target: 50 tracks per user for recommendations)';
COMMENT ON TABLE recommendations_cache IS 'Cached music recommendations with 24h TTL (per spec)';
COMMENT ON TABLE personality_scores IS 'Big Five personality assessment scores (44-item inventory, 0-100 scale)';

COMMENT ON FUNCTION get_user_top_50_tracks IS 'Returns user''s top 50 most played tracks with audio features for recommendations';
COMMENT ON FUNCTION get_active_personality_profile IS 'Returns user''s most recent active personality assessment';
COMMENT ON FUNCTION clean_expired_recommendations IS 'Maintenance function to delete expired recommendation cache entries';
COMMENT ON FUNCTION upsert_listening_history IS 'Insert or update listening history entry, incrementing play count if exists';

-- ============================================================================
-- INITIAL DATA CLEANUP (Optional - for migration)
-- ============================================================================

-- Clean up any test data or expired entries
-- DELETE FROM recommendations_cache WHERE expires_at < NOW();

-- ============================================================================
-- COMPLETED
-- ============================================================================
-- Schema version: 1.0
-- Last updated: 2025-10-09
-- Compatible with: Spotify Personality-Based Music Recommender Spec v1.0
-- ============================================================================
