"""
Memory Management API Endpoints

Provides endpoints for managing conversational memories, viewing memory stats,
and triggering memory operations.
"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field

from core.memory.conversation_memory import get_conversation_memory_manager
from core.memory.memory_index import get_memory_index_manager
from core.memory.memory_retriever import get_memory_retriever
from core.tasks.memory_tasks import summarize_and_store_conversation
from api.models.schemas import APIResponse

logger = logging.getLogger("bondhu.api.memory")

router = APIRouter(prefix="/api/v1/memory", tags=["memory"])


# Request/Response Models
class MemoryStatsResponse(BaseModel):
    """Memory statistics for a user."""
    user_id: str
    total_conversations: int
    total_user_facts: int
    recent_conversations: int  # Last 7 days
    top_topics: List[tuple[str, int]]  # (topic, count)
    recent_topics: List[str]  # Topics from recent conversations


class ConversationMemoryItem(BaseModel):
    """Single conversation memory."""
    session_id: str
    conversation_summary: str
    topics: List[str]
    emotions: List[str]
    key_points: List[str]
    start_time: str
    end_time: str


class ConversationMemoryListResponse(BaseModel):
    """List of conversation memories."""
    conversations: List[ConversationMemoryItem]
    total: int
    user_id: str


class SummarizeSessionRequest(BaseModel):
    """Request to summarize a conversation session."""
    user_id: str = Field(..., description="User's ID")
    session_id: str = Field(..., description="Session ID to summarize")


class ConversationTimelineResponse(BaseModel):
    """Conversation timeline."""
    timeline: List[dict]
    user_id: str


class SearchMemoryRequest(BaseModel):
    """Search memories by query."""
    user_id: str = Field(..., description="User's ID")
    query: str = Field(..., min_length=1, description="Search query")


# Endpoints
@router.get("/stats/{user_id}", response_model=MemoryStatsResponse)
async def get_memory_stats(user_id: str):
    """
    Get memory statistics for a user.
    
    Shows total conversations, facts, and trending topics.
    
    Args:
        user_id: User's unique ID
        
    Returns:
        Memory statistics
    """
    try:
        conversation_mgr = get_conversation_memory_manager()
        index_mgr = get_memory_index_manager()
        from core.database.memory_service import get_memory_service
        
        memory_service = get_memory_service()
        
        # Get conversation counts
        recent_conversations = conversation_mgr.get_recent_conversations(
            user_id, days=7, limit=100
        )
        all_recent_conversations = conversation_mgr.get_recent_conversations(
            user_id, days=365, limit=1000
        )
        
        # Get user facts count
        user_facts = memory_service.get_memories(user_id)
        
        # Get topic frequency
        top_topics = index_mgr.get_most_discussed_topics(user_id, limit=10)
        
        # Get recent topics
        recent_topics = []
        for conv in recent_conversations[:5]:
            recent_topics.extend(conv.get("topics", []))
        recent_topics = list(set(recent_topics))[:10]  # Unique topics
        
        return MemoryStatsResponse(
            user_id=user_id,
            total_conversations=len(all_recent_conversations),
            total_user_facts=len(user_facts),
            recent_conversations=len(recent_conversations),
            top_topics=top_topics,
            recent_topics=recent_topics,
        )
        
    except Exception as e:
        logger.error(f"Error getting memory stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get memory stats: {str(e)}"
        )


@router.get("/conversations/{user_id}", response_model=ConversationMemoryListResponse)
async def get_conversation_memories(
    user_id: str,
    days: int = Query(default=30, ge=1, le=365, description="Days to look back"),
    limit: int = Query(default=20, ge=1, le=100, description="Max results")
):
    """
    Get conversation memories for a user.
    
    Args:
        user_id: User's unique ID
        days: Number of days to look back
        limit: Maximum number of conversations to return
        
    Returns:
        List of conversation memories
    """
    try:
        conversation_mgr = get_conversation_memory_manager()
        
        conversations = conversation_mgr.get_recent_conversations(
            user_id, days=days, limit=limit
        )
        
        # Convert to response format
        conversation_items = [
            ConversationMemoryItem(
                session_id=conv["session_id"],
                conversation_summary=conv["conversation_summary"],
                topics=conv.get("topics", []),
                emotions=conv.get("emotions", []),
                key_points=conv.get("key_points", []),
                start_time=conv["start_time"],
                end_time=conv["end_time"],
            )
            for conv in conversations
        ]
        
        return ConversationMemoryListResponse(
            conversations=conversation_items,
            total=len(conversation_items),
            user_id=user_id,
        )
        
    except Exception as e:
        logger.error(f"Error getting conversation memories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation memories: {str(e)}"
        )


@router.get("/timeline/{user_id}", response_model=ConversationTimelineResponse)
async def get_conversation_timeline(
    user_id: str,
    days: int = Query(default=30, ge=1, le=365)
):
    """
    Get conversation timeline for a user.
    
    Shows conversations organized by date.
    
    Args:
        user_id: User's unique ID
        days: Number of days to look back
        
    Returns:
        Conversation timeline
    """
    try:
        retriever = get_memory_retriever()
        
        timeline = retriever.get_conversation_timeline(user_id, days=days)
        
        return ConversationTimelineResponse(
            timeline=timeline,
            user_id=user_id,
        )
        
    except Exception as e:
        logger.error(f"Error getting conversation timeline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation timeline: {str(e)}"
        )


@router.post("/summarize", response_model=APIResponse)
async def summarize_conversation(request: SummarizeSessionRequest):
    """
    Manually trigger summarization of a conversation session.
    
    This creates a conversation memory that can be referenced later.
    Normally this happens automatically, but this endpoint allows
    manual triggering.
    
    Args:
        request: Summarization request with user_id and session_id
        
    Returns:
        Success response
    """
    try:
        success = await summarize_and_store_conversation(
            user_id=request.user_id,
            session_id=request.session_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to summarize conversation"
            )
        
        return APIResponse(
            success=True,
            message=f"Conversation {request.session_id} summarized successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error summarizing conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to summarize conversation: {str(e)}"
        )


@router.post("/search", response_model=dict)
async def search_memories(request: SearchMemoryRequest):
    """
    Search through memories and conversations.
    
    Args:
        request: Search request with query
        
    Returns:
        Search results from conversations and user facts
    """
    try:
        retriever = get_memory_retriever()
        
        result = retriever.search_specific_memory(
            user_id=request.user_id,
            query=request.query
        )
        
        if not result:
            return {
                "found": False,
                "message": "No matching memories found"
            }
        
        return {
            "found": True,
            "type": result["type"],
            "data": result["data"]
        }
        
    except Exception as e:
        logger.error(f"Error searching memories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search memories: {str(e)}"
        )


@router.get("/topics/{user_id}")
async def get_user_topics(user_id: str):
    """
    Get all topics discussed by a user with frequency.
    
    Args:
        user_id: User's unique ID
        
    Returns:
        Dictionary of topics and their frequencies
    """
    try:
        index_mgr = get_memory_index_manager()
        
        topic_freq = index_mgr.get_topic_frequency(user_id)
        top_topics = index_mgr.get_most_discussed_topics(user_id, limit=20)
        
        return {
            "user_id": user_id,
            "total_topics": len(topic_freq),
            "topic_frequency": topic_freq,
            "top_topics": [
                {"topic": topic, "count": count}
                for topic, count in top_topics
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting user topics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user topics: {str(e)}"
        )


@router.get("/health")
async def memory_health_check():
    """Health check for memory service."""
    return {
        "status": "healthy",
        "service": "memory",
        "timestamp": datetime.utcnow().isoformat()
    }
