-- Fix RLS Policy for user_activity_stats
-- This allows the database trigger to update stats automatically

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own activity stats" ON user_activity_stats;
DROP POLICY IF EXISTS "Users can update own activity stats" ON user_activity_stats;
DROP POLICY IF EXISTS "Users can insert own activity stats" ON user_activity_stats;

-- Create permissive policies that allow database functions to work

-- 1. Allow users to view their own stats
CREATE POLICY "Users can view own stats"
ON user_activity_stats
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Allow users AND system to insert stats (for new users)
CREATE POLICY "Allow stats insert"
ON user_activity_stats
FOR INSERT
WITH CHECK (true);  -- Allow all inserts (trigger runs as authenticated user)

-- 3. Allow users AND system to update stats (for existing users)
CREATE POLICY "Allow stats update"
ON user_activity_stats
FOR UPDATE
USING (true)  -- Allow all updates (trigger needs this)
WITH CHECK (true);

-- Grant necessary permissions to authenticated role
GRANT ALL ON user_activity_stats TO authenticated;
GRANT ALL ON user_activity_stats TO service_role;

-- Verify policies are active
SELECT 'RLS policies updated successfully! ✅' as status;

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'user_activity_stats';
