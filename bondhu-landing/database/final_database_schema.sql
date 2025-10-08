-- ============================================================================
-- BONDHU SCHEMA HEADACHE
-- ============================================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================================================
-- CORE TABLES - PRESERVING EXACT EXISTING STRUCTURE
-- ============================================================================
-- Create user profiles table with all required columns (preserving your exact structure)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid references auth.users on delete cascade not null primary key,
    updated_at timestamp with time zone DEFAULT now(),
    full_name text,
    avatar_url text,
    onboarding_completed boolean default false,
    personality_traits jsonb default '{}'::jsonb,
    personality_data jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now()
);
-- Create onboarding answers table
CREATE TABLE IF NOT EXISTS onboarding_answers (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    question_id integer not null,
    answer_text text,
    answer_value integer,
    created_at timestamp with time zone default now()
);
-- Create personality traits table
CREATE TABLE IF NOT EXISTS personality_traits (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    trait_name text not null,
    trait_value numeric(5, 2) not null,
    confidence_score numeric(5, 2),
    last_updated timestamp with time zone default now()
);
-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    message_text text not null,
    sender_type text not null check (sender_type in ('user', 'ai')),
    timestamp timestamp with time zone default now(),
    mood_detected text,
    sentiment_score numeric(5, 2)
);
-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    content_type text not null check (
        content_type in ('music', 'video', 'article', 'activity')
    ),
    title text not null,
    description text,
    url text,
    tags text [],
    mood_context text,
    created_at timestamp with time zone default now()
);
-- ============================================================================
-- ADD MISSING COLUMNS FOR NEW FEATURES (SAFE ADDITIONS ONLY)
-- ============================================================================
-- Add personality assessment columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_openness INTEGER;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_conscientiousness INTEGER;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_extraversion INTEGER;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_agreeableness INTEGER;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_neuroticism INTEGER;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_completed_at TIMESTAMPTZ;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_llm_context JSONB;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS personality_raw_responses JSONB;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_name_change timestamp with time zone;

-- Add Spotify OAuth integration columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMPTZ;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_user_id TEXT;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_user_email TEXT;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS spotify_connected_at TIMESTAMPTZ;

-- Add missing columns to other tables for new features
ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS is_completed boolean default false;
ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS completion_date timestamp with time zone;
ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS rating integer check (
        rating >= 1
        AND rating <= 5
    );
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS session_id uuid default uuid_generate_v4();
-- Create activity history table for dynamic stats tracking
CREATE TABLE IF NOT EXISTS activity_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    activity_type text not null check (
        activity_type in ('video', 'music', 'game', 'article', 'chat')
    ),
    activity_title text not null,
    activity_data jsonb default '{}'::jsonb,
    completed_at timestamp with time zone default now() not null,
    duration_minutes integer,
    mood_before text,
    mood_after text
);
-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_personality_completed ON profiles(personality_completed_at)
WHERE personality_completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name_change ON profiles(last_name_change)
WHERE last_name_change IS NOT NULL;
-- Onboarding answers indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_id ON onboarding_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_created_at ON onboarding_answers(created_at);
-- Personality traits indexes
CREATE INDEX IF NOT EXISTS idx_personality_traits_user_id ON personality_traits(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_traits_last_updated ON personality_traits(last_updated);
-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_content_type ON recommendations(content_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_completed ON recommendations(is_completed);
-- Activity history indexes
CREATE INDEX IF NOT EXISTS idx_activity_history_user_id ON activity_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_completed_at ON activity_history(completed_at);
CREATE INDEX IF NOT EXISTS idx_activity_history_activity_type ON activity_history(activity_type);
-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own answers" ON onboarding_answers;
DROP POLICY IF EXISTS "Users can manage own traits" ON personality_traits;
DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can manage own recommendations" ON recommendations;
DROP POLICY IF EXISTS "Users can manage own activity" ON activity_history;
-- Onboarding answers policies
CREATE POLICY "Users can manage own answers" ON onboarding_answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Personality traits policies
CREATE POLICY "Users can manage own traits" ON personality_traits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Chat messages policies
CREATE POLICY "Users can manage own messages" ON chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Recommendations policies
CREATE POLICY "Users can manage own recommendations" ON recommendations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Activity history policies
CREATE POLICY "Users can manage own activity" ON activity_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- ============================================================================
-- STORAGE SETUP FOR AVATARS
-- ============================================================================
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can update own avatars" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        onboarding_completed,
        personality_data,
        created_at,
        updated_at
    )
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        FALSE,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO
UPDATE
SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Function to auto-complete onboarding when personality is completed
CREATE OR REPLACE FUNCTION public.auto_complete_onboarding() RETURNS TRIGGER AS $$ BEGIN IF NEW.personality_completed_at IS NOT NULL
    AND (
        OLD.personality_completed_at IS NULL
        OR OLD.personality_completed_at != NEW.personality_completed_at
    ) THEN NEW.onboarding_completed = true;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Function to validate name change cooldown
CREATE OR REPLACE FUNCTION public.can_change_name(user_id UUID) RETURNS BOOLEAN AS $$
DECLARE last_change TIMESTAMP WITH TIME ZONE;
BEGIN
SELECT last_name_change INTO last_change
FROM profiles
WHERE id = user_id;
-- Allow if never changed or 30 days have passed
RETURN (
    last_change IS NULL
    OR last_change < NOW() - INTERVAL '30 days'
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to update personality assessment
CREATE OR REPLACE FUNCTION public.update_personality_assessment(
        user_id UUID,
        p_openness INTEGER,
        p_conscientiousness INTEGER,
        p_extraversion INTEGER,
        p_agreeableness INTEGER,
        p_neuroticism INTEGER,
        p_llm_context JSONB,
        p_raw_responses JSONB
    ) RETURNS BOOLEAN AS $$ BEGIN
UPDATE profiles
SET personality_openness = p_openness,
    personality_conscientiousness = p_conscientiousness,
    personality_extraversion = p_extraversion,
    personality_agreeableness = p_agreeableness,
    personality_neuroticism = p_neuroticism,
    personality_llm_context = p_llm_context,
    personality_raw_responses = p_raw_responses,
    personality_completed_at = NOW(),
    updated_at = NOW()
WHERE id = user_id
    AND auth.uid() = user_id;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get personality context for LLM
CREATE OR REPLACE FUNCTION public.get_personality_context(user_id UUID) RETURNS JSONB AS $$
DECLARE context JSONB;
BEGIN
SELECT personality_llm_context INTO context
FROM profiles
WHERE id = user_id
    AND personality_completed_at IS NOT NULL;
RETURN COALESCE(context, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_id UUID) RETURNS INTEGER AS $$
DECLARE completion_score INTEGER := 0;
total_fields INTEGER := 4;
BEGIN
SELECT CASE
        WHEN full_name IS NOT NULL
        AND full_name != '' THEN 1
        ELSE 0
    END + CASE
        WHEN avatar_url IS NOT NULL
        AND avatar_url != '' THEN 1
        ELSE 0
    END + CASE
        WHEN onboarding_completed = true THEN 1
        ELSE 0
    END + CASE
        WHEN personality_completed_at IS NOT NULL THEN 1
        ELSE 0
    END INTO completion_score
FROM profiles
WHERE id = user_id;
RETURN ROUND((completion_score::FLOAT / total_fields) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to add activity to history
CREATE OR REPLACE FUNCTION public.add_activity_to_history(
        user_id UUID,
        activity_type TEXT,
        activity_title TEXT,
        activity_data JSONB DEFAULT '{}'::JSONB,
        duration_minutes INTEGER DEFAULT NULL,
        mood_before TEXT DEFAULT NULL,
        mood_after TEXT DEFAULT NULL
    ) RETURNS UUID AS $$
DECLARE activity_id UUID;
BEGIN
INSERT INTO activity_history (
        user_id,
        activity_type,
        activity_title,
        activity_data,
        duration_minutes,
        mood_before,
        mood_after
    )
VALUES (
        user_id,
        activity_type,
        activity_title,
        activity_data,
        duration_minutes,
        mood_before,
        mood_after
    )
RETURNING id INTO activity_id;
RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS auto_complete_onboarding_trigger ON profiles;
DROP TRIGGER IF EXISTS personality_traits_updated_at ON personality_traits;
-- Create triggers
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER auto_complete_onboarding_trigger BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.auto_complete_onboarding();
CREATE TRIGGER personality_traits_updated_at BEFORE
UPDATE ON personality_traits FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- ============================================================================
-- VIEWS FOR EASY DATA ACCESS
-- ============================================================================
-- Drop existing views to prevent column name conflicts
DROP VIEW IF EXISTS personality_profiles;
DROP VIEW IF EXISTS user_activity_stats;
-- Comprehensive personality profile view
CREATE VIEW personality_profiles AS
SELECT p.id,
    p.full_name,
    p.avatar_url,
    p.personality_openness,
    p.personality_conscientiousness,
    p.personality_extraversion,
    p.personality_agreeableness,
    p.personality_neuroticism,
    p.personality_completed_at,
    p.personality_llm_context,
    p.onboarding_completed,
    CASE
        WHEN p.personality_completed_at IS NOT NULL THEN true
        ELSE false
    END as has_completed_personality_assessment,
    public.calculate_profile_completion(p.id) as profile_completion_percentage,
    p.created_at,
    p.updated_at
FROM profiles p;
-- User activity statistics view
CREATE VIEW user_activity_stats AS
SELECT user_id,
    COUNT(*) as total_activities,
    COUNT(
        CASE
            WHEN activity_type = 'video' THEN 1
        END
    ) as videos_watched,
    COUNT(
        CASE
            WHEN activity_type = 'music' THEN 1
        END
    ) as songs_listened,
    COUNT(
        CASE
            WHEN activity_type = 'game' THEN 1
        END
    ) as games_played,
    COUNT(
        CASE
            WHEN activity_type = 'chat' THEN 1
        END
    ) as chat_sessions,
    COALESCE(SUM(duration_minutes), 0) as total_minutes,
    MAX(completed_at) as last_activity_date
FROM activity_history
GROUP BY user_id;
-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant permissions to authenticated users
GRANT ALL ON profiles TO authenticated,
    service_role;
GRANT ALL ON onboarding_answers TO authenticated,
    service_role;
GRANT ALL ON personality_traits TO authenticated,
    service_role;
GRANT ALL ON chat_messages TO authenticated,
    service_role;
GRANT ALL ON recommendations TO authenticated,
    service_role;
GRANT ALL ON activity_history TO authenticated,
    service_role;
-- Grant permissions on views
GRANT SELECT ON personality_profiles TO authenticated,
    service_role;
GRANT SELECT ON user_activity_stats TO authenticated,
    service_role;
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.can_change_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_personality_assessment(
        UUID,
        INTEGER,
        INTEGER,
        INTEGER,
        INTEGER,
        INTEGER,
        JSONB,
        JSONB
    ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_personality_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_profile_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_activity_to_history(UUID, TEXT, TEXT, JSONB, INTEGER, TEXT, TEXT) TO authenticated;
-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE profiles IS 'User profiles with personality data and name change tracking';
COMMENT ON COLUMN profiles.last_name_change IS 'Timestamp of last name change for 30-day cooldown enforcement';
COMMENT ON COLUMN profiles.personality_openness IS 'Big Five Openness score (0-100)';
COMMENT ON COLUMN profiles.personality_conscientiousness IS 'Big Five Conscientiousness score (0-100)';
COMMENT ON COLUMN profiles.personality_extraversion IS 'Big Five Extraversion score (0-100)';
COMMENT ON COLUMN profiles.personality_agreeableness IS 'Big Five Agreeableness score (0-100)';
COMMENT ON COLUMN profiles.personality_neuroticism IS 'Big Five Neuroticism/Emotional Sensitivity score (0-100)';
COMMENT ON COLUMN profiles.personality_llm_context IS 'Generated LLM context based on personality scores';
COMMENT ON COLUMN profiles.personality_raw_responses IS 'Raw question responses for potential re-analysis';
COMMENT ON TABLE activity_history IS 'Tracks all user activities for dynamic statistics';
COMMENT ON FUNCTION public.can_change_name(UUID) IS 'Checks if user can change name (30-day cooldown)';
COMMENT ON FUNCTION public.calculate_profile_completion(UUID) IS 'Calculates profile completion percentage dynamically';
-- ============================================================================
-- FINAL OPTIMIZATIONS
-- ============================================================================
-- Analyze tables for better query planning
ANALYZE profiles;
ANALYZE onboarding_answers;
ANALYZE personality_traits;
ANALYZE chat_messages;
ANALYZE recommendations;
ANALYZE activity_history;
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
-- Drop existing entertainment policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own entertainment recommendations" ON entertainment_recommendations;
DROP POLICY IF EXISTS "Users can manage own entertainment recommendations" ON entertainment_recommendations;
DROP POLICY IF EXISTS "Users can manage own entertainment interactions" ON entertainment_interactions;
DROP POLICY IF EXISTS "Users can manage own entertainment sessions" ON entertainment_sessions;
DROP POLICY IF EXISTS "Users can manage own entertainment preferences" ON entertainment_preferences;
DROP POLICY IF EXISTS "Users can view own entertainment analytics" ON entertainment_analytics;
DROP POLICY IF EXISTS "System can manage entertainment analytics" ON entertainment_analytics;
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
-- Drop existing entertainment views to prevent conflicts
-- IMPORTANT: Drop dependent views FIRST, then base views to avoid dependency errors
DROP VIEW IF EXISTS user_entertainment_summary;
DROP VIEW IF EXISTS entertainment_activity_summary;
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
-- CHAT PERSONALITY INSIGHTS TABLE
-- ============================================================================
-- Add chat_personality_insights table for storing personality analysis from conversations
-- This table captures personality trait adjustments derived from chat message patterns

CREATE TABLE IF NOT EXISTS chat_personality_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    adjustments JSONB NOT NULL, -- Contains trait adjustments: {"openness": 0.3, "conscientiousness": 0.2, ...}
    message_context TEXT, -- Snippet of the message that triggered the insights
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_personality_insights_user_id ON chat_personality_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_personality_insights_timestamp ON chat_personality_insights(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_personality_insights_session ON chat_personality_insights(session_id);

-- Add Row Level Security
ALTER TABLE chat_personality_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own chat personality insights" ON chat_personality_insights;
DROP POLICY IF EXISTS "System can insert chat personality insights" ON chat_personality_insights;

-- Policy: Users can only view their own personality insights
CREATE POLICY "Users can view their own chat personality insights"
    ON chat_personality_insights
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System can insert insights for any user (backend service)
CREATE POLICY "System can insert chat personality insights"
    ON chat_personality_insights
    FOR INSERT
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE chat_personality_insights IS 'Stores personality trait adjustments derived from chat conversation analysis. Used for reinforcement learning and personality profile updates.';
COMMENT ON COLUMN chat_personality_insights.adjustments IS 'JSONB object containing Big Five trait adjustments: openness, conscientiousness, extraversion, agreeableness, neuroticism';
COMMENT ON COLUMN chat_personality_insights.message_context IS 'First 200 characters of the user message that triggered the personality analysis';

-- Grant permissions
GRANT ALL ON chat_personality_insights TO authenticated, service_role;

-- ============================================================================
-- SYSTEM TASKS TABLE
-- ============================================================================
-- Create system_tasks table for tracking scheduled task executions
-- This table logs all automated background tasks for monitoring and debugging

CREATE TABLE IF NOT EXISTS system_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_name TEXT NOT NULL, -- Name of the task (e.g., 'personality_update', 'insights_cleanup', 'rl_training')
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('completed', 'completed_with_errors', 'failed')),
    users_processed INTEGER DEFAULT 0,
    successful_updates INTEGER DEFAULT 0,
    failed_updates INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB, -- Additional task-specific metadata
    duration_seconds NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_tasks_task_name ON system_tasks(task_name);
CREATE INDEX IF NOT EXISTS idx_system_tasks_executed_at ON system_tasks(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_tasks_status ON system_tasks(status);

-- Add Row Level Security
ALTER TABLE system_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Service role can manage system tasks" ON system_tasks;

-- Policy: Only service role can read/write (admin access only)
CREATE POLICY "Service role can manage system tasks"
    ON system_tasks
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE system_tasks IS 'Logs scheduled background task executions for system monitoring';
COMMENT ON COLUMN system_tasks.task_name IS 'Identifier for the scheduled task (personality_update, insights_cleanup, rl_training, etc.)';
COMMENT ON COLUMN system_tasks.status IS 'Execution status: completed, completed_with_errors, failed';
COMMENT ON COLUMN system_tasks.users_processed IS 'Number of users processed in personality updates or RL training';
COMMENT ON COLUMN system_tasks.records_processed IS 'Number of records processed in cleanup tasks';
COMMENT ON COLUMN system_tasks.metadata IS 'Additional JSON metadata about the task execution (training stats, Q-values, etc.)';

-- Grant permissions
GRANT ALL ON system_tasks TO service_role;
GRANT SELECT ON system_tasks TO authenticated;


-- Complete User Memories Table with Enhanced Features
-- Creates the user_memories table and adds enhanced metadata columns

-- Create the base user_memories table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_memories (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add enhanced metadata columns for better memory management
ALTER TABLE user_memories 
ADD COLUMN IF NOT EXISTS importance TEXT CHECK (importance IN ('high', 'medium', 'low')) DEFAULT 'low',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add unique constraint to prevent duplicate memories per user
-- Check if constraint exists first, then add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_memory_key'
    ) THEN
        ALTER TABLE user_memories ADD CONSTRAINT unique_user_memory_key UNIQUE (user_id, key);
    END IF;
END $$;

-- Add trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_user_memories_updated_at ON user_memories;
CREATE TRIGGER update_user_memories_updated_at
BEFORE UPDATE ON user_memories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_key ON user_memories(key);
CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON user_memories(importance);
CREATE INDEX IF NOT EXISTS idx_user_memories_category ON user_memories(category);
CREATE INDEX IF NOT EXISTS idx_user_memories_updated_at ON user_memories(updated_at);

-- Add compound index for efficient session initialization queries
CREATE INDEX IF NOT EXISTS idx_user_memories_user_importance_updated 
ON user_memories(user_id, importance, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON user_memories;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own memories"
ON user_memories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
ON user_memories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
ON user_memories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
ON user_memories
FOR DELETE
USING (auth.uid() = user_id);

-- Update existing memories to have appropriate importance based on key patterns
-- This is a one-time update for existing data
UPDATE user_memories 
SET importance = 'high' 
WHERE importance = 'low' 
  AND (
    key ILIKE '%character%' OR 
    key ILIKE '%occupation%' OR 
    key ILIKE '%age%' OR 
    key ILIKE '%relationship%' OR
    key ILIKE '%favorite_anime%' OR
    key ILIKE '%favorite_game%' OR
    key = 'personal_info'
  );

UPDATE user_memories 
SET importance = 'medium'
WHERE importance = 'low' 
  AND (
    key ILIKE 'favorite_%' OR 
    key ILIKE 'hobby_%' OR 
    key ILIKE '%goal%'
  );

-- Update categories based on key patterns
UPDATE user_memories SET category = 'personal_fact' WHERE key IN ('occupation', 'age', 'personal_info');
UPDATE user_memories SET category = 'character_reference' WHERE key ILIKE '%character%';
UPDATE user_memories SET category = 'favorite' WHERE key ILIKE 'favorite_%';
UPDATE user_memories SET category = 'hobby_interest' WHERE key ILIKE 'hobby_%';
UPDATE user_memories SET category = 'relationship' WHERE key ILIKE 'relationship_%';
UPDATE user_memories SET category = 'goal_aspiration' WHERE key ILIKE '%goal%';

-- Add table and column comments for documentation
COMMENT ON TABLE user_memories IS 'Stores key-value pairs of memories for each user, allowing the AI to recall past information across sessions.';
COMMENT ON COLUMN user_memories.user_id IS 'The user this memory belongs to.';
COMMENT ON COLUMN user_memories.key IS 'The category or topic of the memory (e.g., favorite_anime, favorite_character).';
COMMENT ON COLUMN user_memories.value IS 'The content of the memory (e.g., Re:Zero, Natsuki Subaru).';
COMMENT ON COLUMN user_memories.importance IS 'Priority level for memory retrieval: high (always loaded), medium (frequently loaded), low (rarely loaded)';
COMMENT ON COLUMN user_memories.category IS 'Category of memory for organization and filtering';
COMMENT ON COLUMN user_memories.metadata IS 'Additional metadata in JSON format (timestamps, source, etc.)';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_memories TO authenticated;
GRANT USAGE ON SEQUENCE user_memories_id_seq TO authenticated;



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

-- ============================================================================
-- BONDHU APP - MUSIC RECOMMENDATION SYSTEM SCHEMA
-- ============================================================================
-- This script adds the music-specific tables needed for the music recommendation
-- and RL learning system. Run this AFTER the base entertainment schema.
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
-- Sample GenZ genres
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
    'Indie Vibes',
    'Hype Beats',
    'R&B Feels'
]) AS genre
WHERE NOT EXISTS (
    SELECT 1 FROM music_genre_preferences 
    WHERE user_id = auth.uid() AND genz_genre = genre
);
*/
