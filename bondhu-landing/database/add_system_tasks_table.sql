-- Create system_tasks table for tracking scheduled task executions
-- This table logs all automated background tasks for monitoring and debugging
CREATE TABLE IF NOT EXISTS system_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_name TEXT NOT NULL,
    -- Name of the task (e.g., 'personality_update', 'insights_cleanup')
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL,
    -- 'completed', 'completed_with_errors', 'failed'
    users_processed INTEGER DEFAULT 0,
    successful_updates INTEGER DEFAULT 0,
    failed_updates INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    -- Additional task-specific metadata
    duration_seconds NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for efficient querying
CREATE INDEX idx_system_tasks_task_name ON system_tasks(task_name);
CREATE INDEX idx_system_tasks_executed_at ON system_tasks(executed_at DESC);
CREATE INDEX idx_system_tasks_status ON system_tasks(status);
-- Add Row Level Security
ALTER TABLE system_tasks ENABLE ROW LEVEL SECURITY;
-- Policy: Only service role can read/write (admin access only)
CREATE POLICY "Service role can manage system tasks" ON system_tasks FOR ALL USING (auth.role() = 'service_role');
-- Add comments for documentation
COMMENT ON TABLE system_tasks IS 'Logs scheduled background task executions for system monitoring';
COMMENT ON COLUMN system_tasks.task_name IS 'Identifier for the scheduled task (personality_update, insights_cleanup, etc.)';
COMMENT ON COLUMN system_tasks.status IS 'Execution status: completed, completed_with_errors, failed';
COMMENT ON COLUMN system_tasks.users_processed IS 'Number of users processed in personality updates';
COMMENT ON COLUMN system_tasks.records_processed IS 'Number of records processed in cleanup tasks';
COMMENT ON COLUMN system_tasks.metadata IS 'Additional JSON metadata about the task execution';