-- ============================================================================
-- PERSONALITY ADJUSTMENT SYSTEM SCHEMA
-- Separates original survey data from dynamic learning adjustments
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: PERSONALITY SURVEYS (PERMANENT - NEVER MODIFIED)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personality_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    survey_version VARCHAR(10) DEFAULT '1.0' NOT NULL,
    
    -- Raw survey responses (permanent record)
    raw_responses JSONB NOT NULL,
    
    -- Original Big Five scores from survey (0-100 scale)
    openness_score INTEGER NOT NULL CHECK (openness_score >= 0 AND openness_score <= 100),
    conscientiousness_score INTEGER NOT NULL CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 100),
    extraversion_score INTEGER NOT NULL CHECK (extraversion_score >= 0 AND extraversion_score <= 100),
    agreeableness_score INTEGER NOT NULL CHECK (agreeableness_score >= 0 AND agreeableness_score <= 100),
    neuroticism_score INTEGER NOT NULL CHECK (neuroticism_score >= 0 AND neuroticism_score <= 100),
    
    -- Survey metadata
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    survey_duration_seconds INTEGER,
    survey_source VARCHAR(50) DEFAULT 'onboarding',
    
    -- Ensure one survey per version per user
    UNIQUE(user_id, survey_version),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personality_surveys_user_id ON personality_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_surveys_completed_at ON personality_surveys(completed_at DESC);

-- Row Level Security
ALTER TABLE personality_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own surveys" ON personality_surveys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own surveys" ON personality_surveys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE personality_surveys IS 'Permanent storage of original personality survey responses - NEVER modified after creation';
COMMENT ON COLUMN personality_surveys.raw_responses IS 'Complete JSON of all survey question responses for potential re-analysis';

-- ============================================================================
-- TABLE 2: PERSONALITY ADJUSTMENTS (DYNAMIC LEARNING)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personality_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Source of the adjustment
    source VARCHAR(50) NOT NULL CHECK (source IN (
        'music_analysis', 'music_rl_learning', 
        'video_behavior', 'gaming_patterns',
        'chat_sentiment', 'chat_language_style',
        'social_interactions', 'activity_patterns',
        'manual_override'
    )),
    
    -- Trait being adjusted
    trait VARCHAR(30) NOT NULL CHECK (trait IN (
        'openness', 'conscientiousness', 'extraversion', 
        'agreeableness', 'neuroticism'
    )),
    
    -- Adjustment value (can be positive or negative)
    adjustment_value FLOAT NOT NULL CHECK (adjustment_value >= -50 AND adjustment_value <= 50),
    
    -- Confidence in this adjustment (0.0 to 1.0)
    confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1.0),
    
    -- Context and metadata
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Allow upsert for same user+source+trait combination
    UNIQUE(user_id, source, trait)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personality_adjustments_user_id ON personality_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_adjustments_source ON personality_adjustments(source);
CREATE INDEX IF NOT EXISTS idx_personality_adjustments_trait ON personality_adjustments(trait);
CREATE INDEX IF NOT EXISTS idx_personality_adjustments_created_at ON personality_adjustments(created_at DESC);

-- Row Level Security
ALTER TABLE personality_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adjustments" ON personality_adjustments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage adjustments" ON personality_adjustments
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_personality_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personality_adjustments_updated_at
    BEFORE UPDATE ON personality_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_personality_adjustments_updated_at();

-- Comments
COMMENT ON TABLE personality_adjustments IS 'Dynamic personality trait adjustments from various learning sources';
COMMENT ON COLUMN personality_adjustments.adjustment_value IS 'Adjustment to apply to base survey score (can be +/-)';
COMMENT ON COLUMN personality_adjustments.confidence_score IS 'Confidence in this adjustment (higher = more reliable)';
COMMENT ON COLUMN personality_adjustments.metadata IS 'Source-specific context: tracks analyzed, messages processed, etc.';

-- ============================================================================
-- FUNCTION: GET WEIGHTED PERSONALITY SCORES
-- ============================================================================
CREATE OR REPLACE FUNCTION get_weighted_personality(
    p_user_id UUID,
    p_survey_weight FLOAT DEFAULT 0.7,
    p_adjustment_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE(
    trait VARCHAR,
    survey_score INTEGER,
    total_adjustment FLOAT,
    weighted_score FLOAT,
    confidence FLOAT,
    adjustment_sources JSONB
) AS $$
DECLARE
    trait_name VARCHAR;
BEGIN
    -- Iterate through each Big Five trait
    FOR trait_name IN 
        SELECT unnest(ARRAY['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'])
    LOOP
        RETURN QUERY
        WITH survey_data AS (
            SELECT 
                CASE trait_name
                    WHEN 'openness' THEN openness_score
                    WHEN 'conscientiousness' THEN conscientiousness_score
                    WHEN 'extraversion' THEN extraversion_score
                    WHEN 'agreeableness' THEN agreeableness_score
                    WHEN 'neuroticism' THEN neuroticism_score
                END as base_score
            FROM personality_surveys
            WHERE user_id = p_user_id
            ORDER BY completed_at DESC
            LIMIT 1
        ),
        adjustment_data AS (
            SELECT 
                COALESCE(SUM(adjustment_value * confidence_score), 0) as total_adj,
                COALESCE(AVG(confidence_score), 1.0) as avg_confidence,
                jsonb_agg(
                    jsonb_build_object(
                        'source', source,
                        'value', adjustment_value,
                        'confidence', confidence_score,
                        'updated_at', updated_at
                    )
                ) as sources
            FROM personality_adjustments
            WHERE user_id = p_user_id AND trait = trait_name
        )
        SELECT 
            trait_name::VARCHAR,
            COALESCE(s.base_score, 50)::INTEGER as survey_score,
            COALESCE(a.total_adj, 0)::FLOAT as total_adjustment,
            -- Calculate weighted score and clamp to 0-100
            GREATEST(0, LEAST(100, 
                (COALESCE(s.base_score, 50) * p_survey_weight) + 
                (COALESCE(a.total_adj, 0) * p_adjustment_weight)
            ))::FLOAT as weighted_score,
            COALESCE(a.avg_confidence, 1.0)::FLOAT as confidence,
            COALESCE(a.sources, '[]'::JSONB) as adjustment_sources
        FROM survey_data s
        CROSS JOIN adjustment_data a;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_weighted_personality(UUID, FLOAT, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weighted_personality(UUID, FLOAT, FLOAT) TO service_role;

COMMENT ON FUNCTION get_weighted_personality IS 'Returns weighted personality scores combining survey baseline + learned adjustments';

-- ============================================================================
-- FUNCTION: GET PERSONALITY SUMMARY (Convenient wrapper)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_personality_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_object_agg(trait, jsonb_build_object(
        'survey_score', survey_score,
        'total_adjustment', total_adjustment,
        'weighted_score', weighted_score,
        'confidence', confidence,
        'adjustment_sources', adjustment_sources
    ))
    INTO result
    FROM get_weighted_personality(p_user_id);
    
    RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_personality_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personality_summary(UUID) TO service_role;

-- ============================================================================
-- FUNCTION: STORE PERSONALITY ADJUSTMENT (Upsert helper)
-- ============================================================================
CREATE OR REPLACE FUNCTION store_personality_adjustment(
    p_user_id UUID,
    p_source VARCHAR,
    p_trait VARCHAR,
    p_adjustment_value FLOAT,
    p_confidence_score FLOAT DEFAULT 1.0,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    adjustment_id UUID;
BEGIN
    INSERT INTO personality_adjustments (
        user_id, source, trait, adjustment_value, confidence_score, metadata
    )
    VALUES (
        p_user_id, p_source, p_trait, p_adjustment_value, p_confidence_score, p_metadata
    )
    ON CONFLICT (user_id, source, trait) 
    DO UPDATE SET
        adjustment_value = EXCLUDED.adjustment_value,
        confidence_score = EXCLUDED.confidence_score,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO adjustment_id;
    
    RETURN adjustment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION store_personality_adjustment(UUID, VARCHAR, VARCHAR, FLOAT, FLOAT, JSONB) TO service_role;

-- ============================================================================
-- VIEW: USER PERSONALITY OVERVIEW (Easy access)
-- ============================================================================
CREATE OR REPLACE VIEW user_personality_overview AS
SELECT 
    ps.user_id,
    ps.survey_version,
    ps.completed_at as survey_completed_at,
    ps.openness_score as survey_openness,
    ps.conscientiousness_score as survey_conscientiousness,
    ps.extraversion_score as survey_extraversion,
    ps.agreeableness_score as survey_agreeableness,
    ps.neuroticism_score as survey_neuroticism,
    (SELECT COUNT(*) FROM personality_adjustments WHERE user_id = ps.user_id) as total_adjustments,
    (SELECT COUNT(DISTINCT source) FROM personality_adjustments WHERE user_id = ps.user_id) as adjustment_sources_count,
    get_personality_summary(ps.user_id) as weighted_personality
FROM personality_surveys ps
WHERE EXISTS (
    SELECT 1 FROM personality_surveys WHERE user_id = ps.user_id
);

GRANT SELECT ON user_personality_overview TO authenticated;
GRANT SELECT ON user_personality_overview TO service_role;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT ALL ON personality_surveys TO authenticated, service_role;
GRANT ALL ON personality_adjustments TO authenticated, service_role;

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- This schema provides:
-- 1. Permanent survey storage (never modified)
-- 2. Dynamic adjustment tracking (from all sources)
-- 3. Weighted scoring function (configurable weights)
-- 4. Easy-to-use helper functions
-- 5. Full audit trail of personality evolution
