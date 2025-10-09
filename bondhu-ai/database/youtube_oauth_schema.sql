-- YouTube OAuth Integration Schema
-- Stores OAuth tokens for YouTube API access per user

-- Create user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('youtube', 'spotify', 'steam', 'google')),
    
    -- OAuth tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    token_expiry TIMESTAMPTZ,
    
    -- Scopes and permissions
    scopes TEXT[],
    
    -- Provider-specific user info
    provider_user_id TEXT,
    provider_user_email TEXT,
    provider_user_name TEXT,
    
    -- Metadata
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Ensure one integration per provider per user
    UNIQUE(user_id, provider)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id 
ON user_integrations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_integrations_provider 
ON user_integrations(provider);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_provider 
ON user_integrations(user_id, provider);

-- Enable Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own integrations
CREATE POLICY user_integrations_select_policy ON user_integrations
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own integrations
CREATE POLICY user_integrations_insert_policy ON user_integrations
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own integrations
CREATE POLICY user_integrations_update_policy ON user_integrations
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own integrations
CREATE POLICY user_integrations_delete_policy ON user_integrations
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Service role bypass (for backend operations)
CREATE POLICY user_integrations_service_policy ON user_integrations
    USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER user_integrations_updated_at_trigger
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_integrations_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_integrations IS 'Stores OAuth integrations for external services (YouTube, Spotify, Steam)';
COMMENT ON COLUMN user_integrations.access_token IS 'OAuth access token for API calls';
COMMENT ON COLUMN user_integrations.refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN user_integrations.token_expiry IS 'When the access token expires';
COMMENT ON COLUMN user_integrations.scopes IS 'Array of granted OAuth scopes';
COMMENT ON COLUMN user_integrations.provider_user_id IS 'User ID from the OAuth provider';
COMMENT ON COLUMN user_integrations.provider_user_email IS 'User email from the OAuth provider';

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_integrations TO authenticated;
GRANT ALL ON user_integrations TO service_role;
