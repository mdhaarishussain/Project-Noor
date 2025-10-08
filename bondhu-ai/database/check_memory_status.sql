-- Check memory auto-summarization status
-- Run this to debug why memories aren't being created

-- 1. Check message counts per session
SELECT 
    session_id,
    user_id,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE sender_type = 'user') as user_messages,
    COUNT(*) FILTER (WHERE sender_type = 'ai') as ai_messages,
    MIN(timestamp) as first_message,
    MAX(timestamp) as last_message
FROM chat_messages
WHERE user_id = '8eebd292-186f-4afd-a33f-ef57ae0e1d17'
GROUP BY session_id, user_id
ORDER BY last_message DESC
LIMIT 10;

-- 2. Check which sessions should have triggered summarization (>= 10 messages)
SELECT 
    session_id,
    COUNT(*) as message_count,
    COUNT(*) / 10 as should_have_triggered_times,
    MAX(timestamp) as latest_message
FROM chat_messages
WHERE user_id = '8eebd292-186f-4afd-a33f-ef57ae0e1d17'
GROUP BY session_id
HAVING COUNT(*) >= 10
ORDER BY message_count DESC;

-- 3. Check existing conversation memories
SELECT 
    id,
    session_id,
    LEFT(conversation_summary, 100) as summary_preview,
    topics,
    emotions,
    start_time,
    end_time,
    created_at
FROM conversation_memories
WHERE user_id = '8eebd292-186f-4afd-a33f-ef57ae0e1d17'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Find sessions with 10+ messages but NO conversation memory
SELECT 
    cm.session_id,
    COUNT(*) as message_count,
    MAX(cm.timestamp) as latest_message,
    CASE 
        WHEN cmem.id IS NULL THEN 'NO MEMORY CREATED' 
        ELSE 'HAS MEMORY' 
    END as memory_status
FROM chat_messages cm
LEFT JOIN conversation_memories cmem ON cm.session_id = cmem.session_id
WHERE cm.user_id = '8eebd292-186f-4afd-a33f-ef57ae0e1d17'
GROUP BY cm.session_id, cmem.id
HAVING COUNT(*) >= 10
ORDER BY message_count DESC;

-- 5. Count total memories vs should-have-been-created
SELECT 
    'Total sessions with 10+ messages' as metric,
    COUNT(DISTINCT session_id) as count
FROM chat_messages
WHERE user_id = '8eebd292-186f-4afd-a33f-ef57ae0e1d17'
GROUP BY user_id
HAVING COUNT(*) >= 10

UNION ALL

SELECT 
    'Total conversation memories created' as metric,
    COUNT(*) as count
FROM conversation_memories
WHERE user_id = '8eebd292-186f-4afd-a33f-ef57ae0e1d17';
