-- ============================================================================
-- BONDHU APP - MUSIC RECOMMENDATION SYSTEM SCHEMA
-- ============================================================================
-- This script adds the music-specific tables needed for the music recommendation
-- and RL learning system with 6 popular GenZ genres. Run this AFTER the base entertainment schema.
-- Supported genres: Lo-fi Chill, Pop Anthems, Hype Beats, Indie Vibes, R&B Feels, Sad Boy Hours
-- ============================================================================

-- Music recommendations table
CREATE TABLE IF NOT EXISTS music_recommendations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    recommendation_id uuid references entertainment_recommendations on delete cascade,
    
    -- Spotify track information
    spotify_track_id text not null,
    track_name text not null,
    artists text[] not null,
    album_name text,
    preview_url text,
    spotify_url text not null,
    
    -- Genre categorization
    genz_genre text not null,  -- GenZ-friendly genre name
    spotify_genres text[],     -- Original Spotify genres
    
    -- Audio features (for RL learning)
    energy numeric(5, 3) check (energy >= 0 AND energy <= 1),
    valence numeric(5, 3) check (valence >= 0 AND valence <= 1),
    danceability numeric(5, 3) check (danceability >= 0 AND danceability <= 1),
    acousticness numeric(5, 3) check (acousticness >= 0 AND acousticness <= 1),
    instrumentalness numeric(5, 3) check (instrumentalness >= 0 AND instrumentalness <= 1),
    tempo numeric(6, 2),
    
    -- Metadata
    duration_ms integer,
    popularity integer check (popularity >= 0 AND popularity <= 100),
    
    -- Recommendation scoring
    rl_score numeric(5, 3),
    personality_match_score numeric(5, 3) check (
        personality_match_score >= 0 AND personality_match_score <= 1
    ),
    
    -- Timestamps
    recommended_at timestamp with time zone default now(),
    expires_at timestamp with time zone,
    is_active boolean default true,
    
    -- Unique constraint to prevent duplicate recommendations
    UNIQUE(user_id, spotify_track_id, recommended_at)
);

-- Music interactions table (track user feedback for RL)
CREATE TABLE IF NOT EXISTS music_interactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    recommendation_id uuid references music_recommendations on delete cascade,
    
    -- Spotify track information
    spotify_track_id text not null,
    track_name text,
    genz_genre text,
    
    -- Interaction type
    interaction_type text not null check (
        interaction_type in (
            'like',
            'dislike',
            'play',          -- User clicked play on Spotify
            'skip',
            'save',          -- User saved to their library
            'add_to_playlist',
            'repeat',        -- User replayed the track
            'share'
        )
    ),
    
    -- RL learning data
    rl_reward numeric(5, 3),
    q_value numeric(8, 5),
    state_features text,  -- Serialized state for RL system
    
    -- Additional context
    listen_duration_ms integer,
    track_duration_ms integer,
    completion_percentage numeric(5, 2),
    time_to_action_seconds numeric(6, 2),
    listening_context text,  -- e.g., 'workout', 'study', 'party'
    
    -- Personality state at interaction time
    personality_snapshot jsonb,
    
    -- Timestamps
    interacted_at timestamp with time zone default now(),
    
    -- Index for RL training queries
    created_at timestamp with time zone default now()
);

-- Music genre preferences table (learned from history and interactions)
CREATE TABLE IF NOT EXISTS music_genre_preferences (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    
    -- Genre information
    genz_genre text not null,
    spotify_genres text[],
    
    -- Preference scoring
    preference_score numeric(5, 3) default 0.5 check (
        preference_score >= 0 AND preference_score <= 1
    ),
    avg_rl_reward numeric(5, 3),
    interaction_count integer default 0,
    positive_interactions integer default 0,
    negative_interactions integer default 0,
    
    -- Learning metadata
    learned_from text not null check (
        learned_from in ('spotify_history', 'user_feedback', 'rl_learning', 'personality_analysis')
    ),
    confidence numeric(5, 3) default 0.5,
    
    -- Timestamps
    first_learned_at timestamp with time zone default now(),
    last_updated_at timestamp with time zone default now(),
    
    UNIQUE(user_id, genz_genre)
);

-- Music listening history (from Spotify)
CREATE TABLE IF NOT EXISTS music_listening_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    
    -- Spotify track information
    spotify_track_id text not null,
    track_name text not null,
    artists text[] not null,
    album_name text,
    
    -- Genre categorization
    genz_genre text,
    spotify_genres text[],
    
    -- Audio features (cached from Spotify)
    energy numeric(5, 3),
    valence numeric(5, 3),
    danceability numeric(5, 3),
    tempo numeric(6, 2),
    
    -- Metadata
    duration_ms integer,
    popularity integer,
    
    -- Listening context
    played_at timestamp with time zone not null,
    listen_duration_ms integer,
    time_range text check (time_range in ('short_term', 'medium_term', 'long_term')),
    
    -- Timestamps
    fetched_at timestamp with time zone default now(),
    
    -- Index for history queries
    created_at timestamp with time zone default now()
);

-- RL model snapshots (for versioning and recovery)
CREATE TABLE IF NOT EXISTS music_rl_models (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    
    -- Model data
    q_table jsonb not null,
    genre_performance jsonb,
    
    -- Model parameters
    learning_rate numeric(5, 3),
    discount_factor numeric(5, 3),
    epsilon numeric(5, 3),
    
    -- Training statistics
    training_episodes integer default 0,
    total_reward numeric(10, 3),
    average_reward numeric(8, 5),
    
    -- Timestamps
    created_at timestamp with time zone default now(),
    is_active boolean default true
);

-- ============================================================================
-- INDEXES FOR MUSIC TABLES
-- ============================================================================

-- Music recommendations indexes
CREATE INDEX IF NOT EXISTS idx_music_recommendations_user_id ON music_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_music_recommendations_genre ON music_recommendations(genz_genre);
CREATE INDEX IF NOT EXISTS idx_music_recommendations_active ON music_recommendations(is_active, recommended_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_recommendations_spotify_track ON music_recommendations(spotify_track_id);
CREATE INDEX IF NOT EXISTS idx_music_recommendations_rl_score ON music_recommendations(rl_score DESC);

-- Music interactions indexes
CREATE INDEX IF NOT EXISTS idx_music_interactions_user_id ON music_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_music_interactions_recommendation_id ON music_interactions(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_music_interactions_type ON music_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_music_interactions_genre ON music_interactions(genz_genre);
CREATE INDEX IF NOT EXISTS idx_music_interactions_created_at ON music_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_interactions_spotify_track ON music_interactions(spotify_track_id);

-- Music genre preferences indexes
CREATE INDEX IF NOT EXISTS idx_music_genre_preferences_user_id ON music_genre_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_music_genre_preferences_genre ON music_genre_preferences(genz_genre);
CREATE INDEX IF NOT EXISTS idx_music_genre_preferences_score ON music_genre_preferences(preference_score DESC);
CREATE INDEX IF NOT EXISTS idx_music_genre_preferences_updated ON music_genre_preferences(last_updated_at DESC);

-- Music listening history indexes
CREATE INDEX IF NOT EXISTS idx_music_listening_history_user_id ON music_listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_music_listening_history_genre ON music_listening_history(genz_genre);
CREATE INDEX IF NOT EXISTS idx_music_listening_history_played_at ON music_listening_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_listening_history_spotify_track ON music_listening_history(spotify_track_id);

-- RL models indexes
CREATE INDEX IF NOT EXISTS idx_music_rl_models_user_id ON music_rl_models(user_id);
CREATE INDEX IF NOT EXISTS idx_music_rl_models_active ON music_rl_models(is_active, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY FOR MUSIC TABLES
-- ============================================================================

-- Enable RLS on music tables
ALTER TABLE music_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_genre_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_rl_models ENABLE ROW LEVEL SECURITY;

-- Music recommendations policies
CREATE POLICY "Users can view own music recommendations" 
    ON music_recommendations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own music recommendations" 
    ON music_recommendations FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Music interactions policies
CREATE POLICY "Users can manage own music interactions" 
    ON music_interactions FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Music genre preferences policies
CREATE POLICY "Users can manage own music genre preferences" 
    ON music_genre_preferences FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Music listening history policies
CREATE POLICY "Users can manage own music listening history" 
    ON music_listening_history FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- RL models policies
CREATE POLICY "Users can manage own RL models" 
    ON music_rl_models FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS FOR MUSIC SYSTEM
-- ============================================================================

-- Function to record music interaction and update RL data
CREATE OR REPLACE FUNCTION public.record_music_interaction(
    p_user_id UUID,
    p_recommendation_id UUID,
    p_spotify_track_id TEXT,
    p_track_name TEXT,
    p_genz_genre TEXT,
    p_interaction_type TEXT,
    p_rl_reward NUMERIC DEFAULT NULL,
    p_listen_duration_ms INTEGER DEFAULT NULL,
    p_track_duration_ms INTEGER DEFAULT NULL,
    p_personality_snapshot JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
    completion_pct NUMERIC;
BEGIN
    -- Calculate completion percentage if duration data provided
    IF p_listen_duration_ms IS NOT NULL AND p_track_duration_ms IS NOT NULL AND p_track_duration_ms > 0 THEN
        completion_pct := (p_listen_duration_ms::NUMERIC / p_track_duration_ms::NUMERIC) * 100;
    ELSE
        completion_pct := NULL;
    END IF;
    
    -- Insert interaction
    INSERT INTO music_interactions (
        user_id,
        recommendation_id,
        spotify_track_id,
        track_name,
        genz_genre,
        interaction_type,
        rl_reward,
        listen_duration_ms,
        track_duration_ms,
        completion_percentage,
        personality_snapshot
    ) VALUES (
        p_user_id,
        p_recommendation_id,
        p_spotify_track_id,
        p_track_name,
        p_genz_genre,
        p_interaction_type,
        p_rl_reward,
        p_listen_duration_ms,
        p_track_duration_ms,
        completion_pct,
        p_personality_snapshot
    ) RETURNING id INTO interaction_id;
    
    -- Update genre preferences
    INSERT INTO music_genre_preferences (
        user_id,
        genz_genre,
        interaction_count,
        positive_interactions,
        negative_interactions,
        avg_rl_reward,
        learned_from,
        last_updated_at
    ) VALUES (
        p_user_id,
        p_genz_genre,
        1,
        CASE WHEN p_interaction_type IN ('like', 'play', 'save', 'repeat') THEN 1 ELSE 0 END,
        CASE WHEN p_interaction_type IN ('dislike', 'skip') THEN 1 ELSE 0 END,
        COALESCE(p_rl_reward, 0),
        'user_feedback',
        NOW()
    )
    ON CONFLICT (user_id, genz_genre) DO UPDATE SET
        interaction_count = music_genre_preferences.interaction_count + 1,
        positive_interactions = music_genre_preferences.positive_interactions + 
            CASE WHEN p_interaction_type IN ('like', 'play', 'save', 'repeat') THEN 1 ELSE 0 END,
        negative_interactions = music_genre_preferences.negative_interactions + 
            CASE WHEN p_interaction_type IN ('dislike', 'skip') THEN 1 ELSE 0 END,
        avg_rl_reward = (
            (music_genre_preferences.avg_rl_reward * music_genre_preferences.interaction_count) + 
            COALESCE(p_rl_reward, 0)
        ) / (music_genre_preferences.interaction_count + 1),
        preference_score = GREATEST(0, LEAST(1, 
            0.5 + (
                (music_genre_preferences.positive_interactions + 
                 CASE WHEN p_interaction_type IN ('like', 'play', 'save', 'repeat') THEN 1 ELSE 0 END) - 
                (music_genre_preferences.negative_interactions + 
                 CASE WHEN p_interaction_type IN ('dislike', 'skip') THEN 1 ELSE 0 END)
            )::NUMERIC / (music_genre_preferences.interaction_count + 1) * 0.3
        )),
        last_updated_at = NOW();
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top recommended genres for a user
CREATE OR REPLACE FUNCTION public.get_top_music_genres(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    genz_genre TEXT,
    preference_score NUMERIC,
    interaction_count INTEGER,
    avg_reward NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mgp.genz_genre,
        mgp.preference_score,
        mgp.interaction_count,
        mgp.avg_rl_reward
    FROM music_genre_preferences mgp
    WHERE mgp.user_id = p_user_id
    ORDER BY mgp.preference_score DESC, mgp.interaction_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- This section can be used to insert sample genre preferences for testing
-- COMMENT OUT IN PRODUCTION

/*
-- Sample GenZ genres (6 most popular)
INSERT INTO music_genre_preferences (user_id, genz_genre, preference_score, learned_from, confidence)
SELECT 
    auth.uid(),
    genre,
    0.5,
    'personality_analysis',
    0.3
FROM unnest(ARRAY[
    'Lo-fi Chill',
    'Pop Anthems', 
    'Hype Beats',
    'Indie Vibes',
    'R&B Feels',
    'Sad Boy Hours'
]) AS genre
WHERE NOT EXISTS (
    SELECT 1 FROM music_genre_preferences 
    WHERE user_id = auth.uid() AND genz_genre = genre
);
*/
