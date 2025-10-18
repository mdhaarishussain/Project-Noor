-- Add encryption support to existing chat_messages table

-- Add columns for encryption metadata
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS session_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS nonce TEXT;

-- Add indexes for efficient querying of encrypted messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_encrypted ON chat_messages(is_encrypted);
CREATE INDEX IF NOT EXISTS idx_chat_messages_encryption_version ON chat_messages(encryption_version);

-- Add comments for documentation
COMMENT ON COLUMN chat_messages.is_encrypted IS 'Whether the message content is encrypted';
COMMENT ON COLUMN chat_messages.encryption_version IS 'Version of encryption used';
COMMENT ON COLUMN chat_messages.session_key_encrypted IS 'Session key encrypted with recipient''s public key (hex encoded)';
COMMENT ON COLUMN chat_messages.nonce IS 'Nonce used for AES-GCM encryption (hex encoded)';

-- Update existing messages to mark them as unencrypted for backward compatibility
UPDATE chat_messages 
SET is_encrypted = FALSE, encryption_version = 0 
WHERE is_encrypted IS NULL;

-- Add constraint to ensure proper encryption metadata
ALTER TABLE chat_messages 
ADD CONSTRAINT check_encryption_metadata 
CHECK (
    (is_encrypted = FALSE AND session_key_encrypted IS NULL AND nonce IS NULL) OR
    (is_encrypted = TRUE AND session_key_encrypted IS NOT NULL AND nonce IS NOT NULL)
);
