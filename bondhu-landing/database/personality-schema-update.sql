-- Update profiles table with personality assessment fields
-- Run this after the main schema.sql

-- Add personality-specific columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_openness INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_conscientiousness INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_extraversion INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_agreeableness INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_neuroticism INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_completed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_llm_context JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_raw_responses JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_personality_completed ON profiles(personality_completed_at) WHERE personality_completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- Update the existing personality_data column to be more specific if needed
COMMENT ON COLUMN profiles.personality_data IS 'Legacy personality data - consider migrating to specific columns';
COMMENT ON COLUMN profiles.personality_openness IS 'Big Five Openness score (0-100)';
COMMENT ON COLUMN profiles.personality_conscientiousness IS 'Big Five Conscientiousness score (0-100)';
COMMENT ON COLUMN profiles.personality_extraversion IS 'Big Five Extraversion score (0-100)';
COMMENT ON COLUMN profiles.personality_agreeableness IS 'Big Five Agreeableness score (0-100)';
COMMENT ON COLUMN profiles.personality_neuroticism IS 'Big Five Neuroticism/Emotional Sensitivity score (0-100)';
COMMENT ON COLUMN profiles.personality_llm_context IS 'Generated LLM context based on personality scores';
COMMENT ON COLUMN profiles.personality_raw_responses IS 'Raw question responses for potential re-analysis';

-- Create a view for easy personality data access
CREATE OR REPLACE VIEW personality_profiles AS
SELECT 
  id,
  full_name,
  personality_openness,
  personality_conscientiousness,
  personality_extraversion,
  personality_agreeableness,
  personality_neuroticism,
  personality_completed_at,
  personality_llm_context,
  CASE 
    WHEN personality_completed_at IS NOT NULL THEN true 
    ELSE false 
  END as has_completed_personality_assessment,
  created_at,
  updated_at
FROM profiles;

-- Create RLS policy for the view
CREATE POLICY "Users can view own personality profile" ON profiles
  FOR SELECT USING (auth.uid() = id AND personality_completed_at IS NOT NULL);

-- Grant permissions for the view
GRANT SELECT ON personality_profiles TO authenticated;

-- Create a function to get personality context for LLM
CREATE OR REPLACE FUNCTION get_personality_context(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  context JSONB;
BEGIN
  SELECT personality_llm_context INTO context
  FROM profiles 
  WHERE id = user_id AND personality_completed_at IS NOT NULL;
  
  RETURN COALESCE(context, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_personality_context(UUID) TO authenticated;

-- Create a function to update personality assessment
CREATE OR REPLACE FUNCTION update_personality_assessment(
  user_id UUID,
  p_openness INTEGER,
  p_conscientiousness INTEGER,
  p_extraversion INTEGER,
  p_agreeableness INTEGER,
  p_neuroticism INTEGER,
  p_llm_context JSONB,
  p_raw_responses JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles SET
    personality_openness = p_openness,
    personality_conscientiousness = p_conscientiousness,
    personality_extraversion = p_extraversion,
    personality_agreeableness = p_agreeableness,
    personality_neuroticism = p_neuroticism,
    personality_llm_context = p_llm_context,
    personality_raw_responses = p_raw_responses,
    personality_completed_at = NOW(),
    onboarding_completed = true,
    updated_at = NOW()
  WHERE id = user_id AND auth.uid() = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_personality_assessment(UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, JSONB) TO authenticated;

-- Create a trigger to automatically update onboarding_completed when personality is completed
CREATE OR REPLACE FUNCTION auto_complete_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.personality_completed_at IS NOT NULL AND OLD.personality_completed_at IS NULL THEN
    NEW.onboarding_completed = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_complete_onboarding_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_onboarding();
