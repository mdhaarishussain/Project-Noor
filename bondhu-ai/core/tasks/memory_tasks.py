"""
Background Tasks for Memory Management

Handles periodic summarization of conversations and memory indexing.
"""

import logging
from typing import Optional
from datetime import datetime, timedelta
from core.memory.conversation_memory import get_conversation_memory_manager
from core.memory.memory_index import get_memory_index_manager

logger = logging.getLogger("bondhu.tasks.memory")


async def summarize_and_store_conversation(user_id: str, session_id: str) -> bool:
    """
    Summarize a conversation session and store it as a conversation memory.
    
    This should be called:
    - After a chat session ends (user closes chat or after period of inactivity)
    - Periodically for long sessions (every 20-30 messages)
    
    Args:
        user_id: User's ID
        session_id: Session ID to summarize
        
    Returns:
        True if successful, False otherwise
    """
    try:
        conversation_mgr = get_conversation_memory_manager()
        index_mgr = get_memory_index_manager()
        
        # Summarize the session
        summary = conversation_mgr.summarize_session(user_id, session_id)
        
        if not summary:
            logger.warning(f"No summary generated for session {session_id}")
            return False
        
        # Create conversation memory
        success = conversation_mgr.create_conversation_memory(
            user_id=user_id,
            conversation_summary=summary["conversation_summary"],
            topics=summary["topics"],
            emotions=summary["emotions"],
            key_points=summary["key_points"],
            session_id=session_id,
            message_ids=summary["message_ids"],
            start_time=summary["start_time"],
            end_time=summary["end_time"],
        )
        
        if not success:
            logger.error(f"Failed to create conversation memory for session {session_id}")
            return False
        
        # Index the conversation
        index_mgr.index_conversation(
            user_id=user_id,
            session_id=session_id,
            topics=summary["topics"],
            entities=[],  # TODO: Extract entities from messages
            timestamp=summary["end_time"],
        )
        
        logger.info(
            f"Successfully summarized and indexed conversation {session_id} "
            f"for user {user_id}"
        )
        return True
        
    except Exception as e:
        logger.error(f"Error summarizing conversation: {e}")
        return False


async def cleanup_old_memories(days: int = 90) -> int:
    """
    Clean up very old conversation memories to save space.
    Keeps only the most important ones.
    
    Args:
        days: Delete memories older than this many days
        
    Returns:
        Number of memories deleted
    """
    try:
        # This would require admin access or service role key
        # Implementation depends on retention policy
        logger.info(f"Cleanup task: Would delete memories older than {days} days")
        return 0
        
    except Exception as e:
        logger.error(f"Error cleaning up old memories: {e}")
        return 0


async def reindex_user_memories(user_id: str) -> bool:
    """
    Reindex all memories for a user (rebuild memory index).
    Useful for maintenance or after schema changes.
    
    Args:
        user_id: User's ID
        
    Returns:
        True if successful
    """
    try:
        logger.info(f"Reindexing memories for user {user_id}")
        # Implementation would iterate through all conversations
        # and rebuild the index
        return True
        
    except Exception as e:
        logger.error(f"Error reindexing memories: {e}")
        return False
