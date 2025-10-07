-- Complete fix for check_achievements function
-- Drop ALL versions of the function first to ensure clean slate

-- Drop function with all possible signatures
DROP FUNCTION IF EXISTS check_achievements(UUID) CASCADE;

-- Recreate with proper column aliasing to avoid ambiguity
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS TABLE(newly_unlocked_achievement_id UUID, achievement_name VARCHAR)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_streak INT;
    v_achievement RECORD;
    v_unlocked_achievements JSONB;
    v_achievement_id UUID;
    v_achievement_name VARCHAR;
BEGIN
    -- Get current streak
    SELECT current_streak_days, achievement_unlocks
    INTO v_current_streak, v_unlocked_achievements
    FROM user_activity_stats
    WHERE user_id = p_user_id;

    -- Check each streak achievement
    FOR v_achievement IN 
        SELECT 
            a.id,
            a.achievement_name,
            a.requirement_value
        FROM achievements a
        WHERE a.achievement_type = 'streak'
            AND a.requirement_value <= v_current_streak
        ORDER BY a.requirement_value DESC
    LOOP
        -- Check if already unlocked
        IF NOT (v_unlocked_achievements ? v_achievement.id::TEXT) THEN
            -- Store values in local variables to avoid ambiguity
            v_achievement_id := v_achievement.id;
            v_achievement_name := v_achievement.achievement_name;
            
            -- Unlock achievement
            UPDATE user_activity_stats
            SET 
                achievement_unlocks = COALESCE(achievement_unlocks, '{}'::jsonb) || 
                    jsonb_build_object(
                        v_achievement_id::TEXT, 
                        jsonb_build_object(
                            'unlocked_at', NOW(),
                            'achievement_name', v_achievement_name,
                            'streak_value', v_current_streak
                        )
                    ),
                total_achievements = COALESCE(total_achievements, 0) + 1
            WHERE user_id = p_user_id;

            -- Return newly unlocked achievement using local variables
            newly_unlocked_achievement_id := v_achievement_id;
            achievement_name := v_achievement_name;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION check_achievements(UUID) IS 'Checks and unlocks achievements based on current stats - Fixed ambiguous column reference';

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO service_role;

-- Verify the function exists
SELECT 
    'check_achievements function recreated successfully! ✅' as status,
    proname as function_name,
    pg_get_functiondef(oid) as definition_preview
FROM pg_proc 
WHERE proname = 'check_achievements'
LIMIT 1;
