"""
Chat API endpoints for Bondhu AI conversational interface.
Integrates personality context with LLM for personalized responses.
Enhanced with music recommendations on session initialization per spec.
"""

import asyncio
import logging
import uuid
import json
import time
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field

from core.chat.gemini_service import get_chat_service
from core.database.supabase_client import get_supabase_client
from core.cache.redis_client import get_redis
from core.config import get_config
from core.database.personality_service import get_personality_service
from core.database.memory_service import get_memory_service
from core.memory_extractor import MemoryExtractor
from core.memory.memory_retriever import get_memory_retriever
from core.memory.conversation_memory import get_conversation_memory_manager
from api.models.schemas import APIResponse

logger = logging.getLogger("bondhu.api.chat")

# Cache TTLs (in seconds)
CHAT_HISTORY_CACHE_TTL = 86400  # 24 hours
CHAT_SEARCH_CACHE_TTL = 3600    # 1 hour

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


# Request/Response Models
class ChatRequest(BaseModel):
    """Request model for sending a chat message."""
    message: str = Field(..., min_length=1, max_length=5000, description="User's message")
    user_id: str = Field(..., description="User's unique ID")
    session_id: Optional[str] = Field(None, description="Session ID for conversation tracking")


class ChatResponse(BaseModel):
    """Response model for chat messages."""
    response: str = Field(..., description="AI's response message")
    has_personality_context: bool = Field(..., description="Whether personality context was used")
    timestamp: str = Field(..., description="Response timestamp")
    message_id: Optional[str] = Field(None, description="Stored message ID (if saved)")


class ChatHistoryItem(BaseModel):
    """Single chat history item."""
    id: str
    message: str
    response: str
    has_personality_context: bool
    created_at: str


class ChatHistoryResponse(BaseModel):
    """Response model for chat history."""
    messages: list[ChatHistoryItem]
    total: int
    user_id: str


class ChatSearchRequest(BaseModel):
    """Request model for searching chat history."""
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    limit: int = Field(default=20, ge=1, le=100, description="Max results to return")


class ChatMessage(BaseModel):
    """Internal model for chat messages."""
    id: str
    user_id: str
    sender_type: str = Field(default="user", description="Either 'user' or 'assistant'")
    message_text: str
    session_id: str
    timestamp: datetime
    message: Optional[str] = None  # Alias for message_text
    

# Cache Helper Functions
def get_chat_history_cache_key(user_id: str, limit: int, offset: int) -> str:
    """Generate cache key for chat history."""
    return f"chat:history:{user_id}:{limit}:{offset}"


def get_chat_search_cache_key(user_id: str, query: str, limit: int) -> str:
    """Generate cache key for chat search."""
    return f"chat:search:{user_id}:{query}:{limit}"


def invalidate_user_chat_cache(user_id: str):
    """Invalidate all chat caches for a user."""
    try:
        redis = get_redis()
        # Delete all keys matching pattern
        pattern = f"chat:*:{user_id}:*"
        cursor = 0
        deleted = 0
        
        while True:
            cursor, keys = redis.scan(cursor, match=pattern, count=100)
            if keys:
                deleted += redis.delete(*keys)
            if cursor == 0:
                break
                
        logger.info(f"Invalidated {deleted} cache keys for user {user_id}")
    except Exception as e:
        logger.warning(f"Failed to invalidate cache for user {user_id}: {e}")


async def validate_session_ownership(session_id: str, user_id: str) -> bool:
    """
    Validate that a session belongs to the specified user.
    Prevents session hijacking and cross-user data access.
    
    Args:
        session_id: Session ID to validate
        user_id: User ID claiming ownership
        
    Returns:
        bool: True if session belongs to user or is new, False otherwise
    """
    try:
        supabase = get_supabase_client()
        
        # Query first message in this session
        response = supabase.table('chat_messages') \
            .select('user_id') \
            .eq('session_id', session_id) \
            .limit(1) \
            .execute()
        
        # If no messages exist, this is a new session - allow
        if not response.data or len(response.data) == 0:
            return True
        
        # Verify the session belongs to the requesting user
        session_owner_id = response.data[0]['user_id']
        if session_owner_id != user_id:
            logger.warning(
                f"🚨 Session hijacking attempt: user {user_id} tried to access "
                f"session {session_id} owned by {session_owner_id}"
            )
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating session ownership: {e}")
        # Fail open for new sessions, but log the error
        return True


# Endpoints
@router.post("/send", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def send_chat_message(request: ChatRequest):
    """
    Send a chat message and get AI response with personality context.
    
    Args:
        request: Chat message request with user message and context
        
    Returns:
        Chat response with AI reply and personality insights
    """
    start_time = asyncio.get_event_loop().time()
    
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # 🔒 SECURITY: Validate session ownership to prevent hijacking
        if request.session_id:  # Only validate existing sessions, not new ones
            is_valid = await validate_session_ownership(request.session_id, request.user_id)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Session does not belong to user. Possible session hijacking attempt."
                )
        
        config = get_config()
        personality_service = get_personality_service()
        memory_service = get_memory_service()
        memory_extractor = MemoryExtractor()
        
        # NEW: Initialize memory retriever for conversational memory
        memory_retriever = get_memory_retriever()

        # --- Memory Extraction ---
        extracted_memories = memory_extractor.extract_memories(request.message)
        if extracted_memories:
            memory_service.add_memories_batch(request.user_id, extracted_memories)
        
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Create user message record
        user_message = ChatMessage(
            id=str(uuid.uuid4()),
            user_id=request.user_id,
            sender_type="user",
            message_text=request.message,
            session_id=session_id,
            timestamp=datetime.now()
        )
        
        # --- ENHANCED Memory Retrieval with Conversational Context ---
        # Get user's personality context for LLM
        personality_context = await personality_service.get_llm_system_prompt(request.user_id)
        
        # NEW: Get comprehensive context including past conversations
        # This enables the LLM to reference previous discussions
        comprehensive_context = memory_retriever.retrieve_relevant_context(
            user_id=request.user_id,
            current_message=request.message,
            max_items=5
        )
        
        # Combine personality context with comprehensive memory context
        enriched_personality_context = personality_context
        if comprehensive_context:
            enriched_personality_context = f"{personality_context}\n\n{comprehensive_context}"
            logger.info(f"Added conversational memory context for user {request.user_id}")

        # Get recent conversation history (last 5 messages)
        conversation_history = await _get_conversation_history(request.user_id, session_id)
        
        # Generate AI response using personality-aware LLM
        chat_service = get_chat_service()
        result = await chat_service.send_message(
            user_id=request.user_id,
            message=request.message,
            include_history=False,
            session_id=session_id
        )
        
        # Extract response text from result
        ai_response_text = result.get('response', result.get('content', 'Sorry, I could not generate a response.'))
        
        # Store in database
        message_id = None
        try:
            message_id = _store_chat_message(
                user_id=request.user_id,
                message=request.message,
                response=ai_response_text,
                mood_detected=result.get('mood_detected'),
                sentiment_score=result.get('sentiment_score'),
                session_id=session_id
            )
            logger.info(f"Chat message stored with ID: {message_id}")
            
            # Invalidate cache after storing new message
            invalidate_user_chat_cache(request.user_id)
            
            # --- AUTOMATIC CONVERSATION SUMMARIZATION ---
            # Trigger summarization after every 5 messages in a session
            try:
                logger.info(f"🔄 Creating auto-summarization task for session {session_id}")
                task = asyncio.create_task(_auto_summarize_if_needed(request.user_id, session_id))
                # Add callback to log any exceptions
                task.add_done_callback(lambda t: logger.error(f"❌ Auto-summarization task error: {t.exception()}") if t.exception() else None)
            except Exception as sum_err:
                logger.warning(f"⚠️ Failed to trigger auto-summarization: {sum_err}")
            
        except Exception as e:
            logger.warning(f"Failed to store chat message: {e}")
            # Continue even if storage fails
        
        return ChatResponse(
            response=ai_response_text,
            has_personality_context=result.get('has_personality_context', False),
            timestamp=datetime.now().isoformat(),
            message_id=message_id
        )
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )


@router.get("/history/{user_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    user_id: str, 
    session_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> ChatHistoryResponse:
    """
    Get chat history for a user with Redis caching.
    
    Args:
        user_id: User ID to get history for
        session_id: Optional session ID to filter by
        limit: Maximum number of messages to return
        
    Returns:
        List of chat messages
    """
    try:
        logger.info(f"Fetching chat history for user {user_id}")
        
        # Try cache first
        redis = get_redis()
        cache_key = get_chat_history_cache_key(user_id, limit, offset)
        
        cached_data = redis.get(cache_key)
        if cached_data:
            logger.info(f"Cache HIT for chat history: {cache_key}")
            data = json.loads(cached_data)
            return ChatHistoryResponse(
                messages=[ChatHistoryItem(**msg) for msg in data['messages']],
                total=data['total'],
                user_id=user_id
            )
        
        logger.info(f"Cache MISS for chat history: {cache_key}")
        
        # Query database
        supabase = get_supabase_client()
        
        # Query chat history from chat_messages table
        try:
            response = supabase.supabase.table('chat_messages') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('timestamp', desc=True) \
                .range(offset, offset + limit * 2 - 1) \
                .execute()
            
            logger.info(f"Supabase query returned {len(response.data) if response.data else 0} messages")
        except Exception as db_error:
            logger.error(f"Supabase query failed: {db_error}")
            # Return empty result if query fails
            return ChatHistoryResponse(
                messages=[],
                total=0,
                user_id=user_id
            )
        
        # Group messages into conversation pairs (user message + AI response)
        # Group by unique message ID instead of overwriting by session_id
        # Sort messages by timestamp to maintain order
        sorted_messages = sorted(
            (response.data if response.data else []),
            key=lambda x: x.get('timestamp', '')
        )
        
        messages = []
        i = 0
        while i < len(sorted_messages):
            msg = sorted_messages[i]
            
            # If this is a user message, look for the next AI response
            if msg['sender_type'] == 'user':
                user_msg = msg
                ai_msg = None
                
                # Look ahead for matching AI response (same session_id, next message)
                if i + 1 < len(sorted_messages):
                    next_msg = sorted_messages[i + 1]
                    if (next_msg['sender_type'] == 'ai' and 
                        next_msg.get('session_id') == msg.get('session_id')):
                        ai_msg = next_msg
                        i += 1  # Skip the AI message in next iteration
                
                # Only add if we have both user and AI messages
                if ai_msg:
                    messages.append(ChatHistoryItem(
                        id=ai_msg['id'],
                        message=user_msg['message_text'],
                        response=ai_msg['message_text'],
                        has_personality_context=user_msg.get('mood_detected') is not None,
                        created_at=user_msg['timestamp']
                    ))
            
            i += 1
        
        logger.info(f"Created {len(messages)} conversation pairs from {len(sorted_messages)} raw messages")
        
        # Sort by timestamp (oldest first for chronological display - oldest at top, newest at bottom)
        messages.sort(key=lambda x: x.created_at, reverse=False)
        
        logger.info(f"Returning {len(messages)} messages in chronological order")
        
        # Cache the result
        result = ChatHistoryResponse(
            messages=messages,
            total=len(messages),  # TODO: Get actual total count
            user_id=user_id
        )
        
        try:
            cache_data = {
                'messages': [msg.model_dump() for msg in messages],
                'total': len(messages),
                'user_id': user_id
            }
            redis.setex(cache_key, CHAT_HISTORY_CACHE_TTL, json.dumps(cache_data))
            logger.info(f"Cached chat history for {CHAT_HISTORY_CACHE_TTL}s: {cache_key}")
        except Exception as cache_err:
            logger.warning(f"Failed to cache chat history: {cache_err}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat history: {str(e)}"
        )


@router.post("/session/initialize", response_model=APIResponse) 
async def initialize_chat_session(user_id: str, spotify_token: Optional[str] = None) -> APIResponse:
    """
    Initialize a new chat session and return music recommendations.
    Per spec: Returns full recommendations (50 tracks) on every session init/refresh.
    
    This endpoint:
    1. Clears previous chat history (fresh session)
    2. Generates personalized music recommendations (200-500 candidates → top 50)
    3. Uses top 50 listening history + personality profile
    4. Applies cold start strategy based on account age
    5. Caches recommendations (24h TTL)
    6. Returns comprehensive recommendation data
    
    Args:
        user_id: User ID to initialize session for
        spotify_token: Optional Spotify OAuth token for enhanced recommendations
        
    Returns:
        APIResponse with full recommendations data
    """
    try:
        logger.info(f"Initializing chat session for user {user_id}")
        start_time = time.time()
        
        supabase = get_supabase_client()
        
        # Clear chat history (fresh session)
        try:
            supabase.supabase.table('chat_messages') \
                .delete() \
                .eq('user_id', user_id) \
                .execute()
            
            # Invalidate chat cache
            invalidate_user_chat_cache(user_id)
            
            logger.info(f"Chat history cleared for user {user_id}")
        except Exception as clear_error:
            logger.warning(f"Failed to clear chat history: {clear_error}")
            # Continue even if clearing fails
        
        # Generate music recommendations per spec
        try:
            from core.services.music_recommendation_service import music_recommendation_service
            from core.services.rate_limiter import user_rate_limiter
            
            # Check user rate limit (100 req/min per user)
            allowed, retry_after = await user_rate_limiter.check_rate_limit(user_id)
            if not allowed:
                logger.warning(f"User {user_id} rate limited, retry after {retry_after}s")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )
            
            # Generate recommendations (200-500 candidates → top 50)
            recommendations_result = await music_recommendation_service.generate_recommendations(
                user_id=user_id,
                spotify_token=spotify_token,
                force_refresh=False,  # Use cache if available
                max_results=50
            )
            
            # Calculate total time
            total_time_ms = int((time.time() - start_time) * 1000)
            
            # Build response per spec
            return APIResponse(
                success=True,
                message=f"Session initialized with {recommendations_result.get('total_count', 0)} recommendations",
                data={
                    'session_id': str(uuid.uuid4()),
                    'session_initialized_at': datetime.utcnow().isoformat(),
                    'recommendations': recommendations_result.get('recommendations', []),
                    'metadata': {
                        **recommendations_result.get('metadata', {}),
                        'session_init_time_ms': total_time_ms,
                        'performance_target_met': total_time_ms < 3000,  # Spec: < 3s
                        'cache_status': 'hit' if recommendations_result.get('from_cache') else 'miss'
                    },
                    'personality_profile': recommendations_result.get('personality_profile', {}),
                    'cold_start_info': {
                        'stage': recommendations_result.get('metadata', {}).get('cold_start_stage'),
                        'account_age_days': recommendations_result.get('metadata', {}).get('account_age_days'),
                        'weights': recommendations_result.get('metadata', {}).get('cold_start_weights')
                    }
                }
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions (like rate limiting)
            raise
        except Exception as rec_error:
            logger.error(f"Failed to generate recommendations: {rec_error}")
            # Return session initialized but without recommendations
            return APIResponse(
                success=True,
                message="Session initialized (recommendations unavailable)",
                data={
                    'session_id': str(uuid.uuid4()),
                    'session_initialized_at': datetime.utcnow().isoformat(),
                    'recommendations': [],
                    'error': str(rec_error),
                    'total_count': 0
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize session: {str(e)}"
        )


@router.post("/session/end", response_model=APIResponse)
async def end_chat_session(user_id: str, session_id: str) -> APIResponse:
    """
    End a chat session and trigger summarization.
    
    This should be called when the user closes the chat or navigates away.
    It will automatically summarize the conversation for future reference.
    
    Args:
        user_id: User's ID
        session_id: Session ID to end and summarize
        
    Returns:
        Success response
    """
    try:
        from core.tasks.memory_tasks import summarize_and_store_conversation
        
        logger.info(f"Ending session {session_id} for user {user_id}")
        
        # Trigger summarization
        success = await summarize_and_store_conversation(user_id, session_id)
        
        if success:
            return APIResponse(
                success=True,
                message=f"Session ended and conversation summarized successfully"
            )
        else:
            return APIResponse(
                success=True,
                message="Session ended (no summarization needed - insufficient messages)"
            )
        
    except Exception as e:
        logger.error(f"Error ending chat session: {e}")
        # Don't fail the request even if summarization fails
        return APIResponse(
            success=True,
            message="Session ended (summarization failed but session was closed)"
        )


@router.get("/search/{user_id}", response_model=ChatHistoryResponse)
async def search_chat_history(
    user_id: str,
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    limit: int = Query(default=20, ge=1, le=100)
):
    """
    Search chat history for a user with Redis caching.
    
    Performs case-insensitive search across message and response text.
    
    Args:
        user_id: User's unique ID
        q: Search query string
        limit: Maximum number of results (default: 20, max: 100)
        
    Returns:
        ChatHistoryResponse with matching messages
        
    Raises:
        HTTPException: If search fails
    """
    try:
        logger.info(f"Searching chat history for user {user_id} with query: '{q}'")
        
        # Try cache first
        redis = get_redis()
        cache_key = get_chat_search_cache_key(user_id, q, limit)
        
        cached_data = redis.get(cache_key)
        if cached_data:
            logger.info(f"Cache HIT for chat search: {cache_key}")
            data = json.loads(cached_data)
            return ChatHistoryResponse(
                messages=[ChatHistoryItem(**msg) for msg in data['messages']],
                total=data['total'],
                user_id=user_id
            )
        
        logger.info(f"Cache MISS for chat search: {cache_key}")
        
        # Query database with text search
        supabase = get_supabase_client()
        
        # Search in message_text field (case-insensitive)
        search_term = f"%{q.lower()}%"
        response = supabase.supabase.table('chat_messages') \
            .select('*') \
            .eq('user_id', user_id) \
            .ilike('message_text', search_term) \
            .order('timestamp', desc=True) \
            .limit(limit) \
            .execute()
        
        # Group messages into conversation pairs
        messages = []
        user_messages = {}
        
        for msg in response.data:
            if msg['sender_type'] == 'user':
                user_messages[msg.get('session_id', msg['id'])] = msg
            elif msg['sender_type'] == 'ai':
                session_id = msg.get('session_id', '')
                user_msg = user_messages.get(session_id)
                if user_msg:
                    messages.append(ChatHistoryItem(
                        id=msg['id'],
                        message=user_msg['message_text'],
                        response=msg['message_text'],
                        has_personality_context=user_msg.get('mood_detected') is not None,
                        created_at=user_msg['timestamp']
                    ))
        
        # Cache the result
        result = ChatHistoryResponse(
            messages=messages,
            total=len(messages),
            user_id=user_id
        )
        
        try:
            cache_data = {
                'messages': [msg.model_dump() for msg in messages],
                'total': len(messages),
                'user_id': user_id
            }
            redis.setex(cache_key, CHAT_SEARCH_CACHE_TTL, json.dumps(cache_data))
            logger.info(f"Cached search results for {CHAT_SEARCH_CACHE_TTL}s: {cache_key}")
        except Exception as cache_err:
            logger.warning(f"Failed to cache search results: {cache_err}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error searching chat history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search chat history: {str(e)}"
        )


# Helper Functions
def _store_chat_message(
    user_id: str,
    message: str,
    response: str,
    mood_detected: Optional[str],
    sentiment_score: Optional[float],
    session_id: Optional[str]
) -> str:
    """
    Store chat message in database.
    
    Args:
        user_id: User's ID
        message: User's message
        response: AI's response
        mood_detected: Detected mood from user message
        sentiment_score: Sentiment score (0-1)
        session_id: Session ID for conversation tracking
        
    Returns:
        Stored message ID
    """
    supabase = get_supabase_client()
    
    # Insert user message (timestamp auto-generated by DB)
    user_message = supabase.supabase.table('chat_messages').insert({
        'user_id': user_id,
        'message_text': message,
        'sender_type': 'user',
        'mood_detected': mood_detected,
        'sentiment_score': sentiment_score,
        'session_id': session_id
    }).execute()
    
    logger.info(f"User message stored: {user_message.data[0]['id']}")
    
    # Insert AI response immediately (timestamp auto-generated by DB)
    ai_message = supabase.supabase.table('chat_messages').insert({
        'user_id': user_id,
        'message_text': response,
        'sender_type': 'ai',
        'mood_detected': None,
        'sentiment_score': None,
        'session_id': session_id
    }).execute()
    
    logger.info(f"AI message stored: {ai_message.data[0]['id']}, session: {session_id}")
    
    return ai_message.data[0]['id']


@router.get("/health")
async def chat_health_check():
    """Health check endpoint for chat service."""
    try:
        chat_service = get_chat_service()
        return {
            "status": "healthy",
            "service": "chat",
            "model": chat_service.config.gemini.model,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        # Fallback response
        fallback_responses = [
            "I'm here to listen and support you. Tell me more about what's on your mind.",
            "Thank you for sharing that with me. How are you feeling about this situation?",
            "I appreciate you opening up to me. What would be most helpful for you right now?",
            "That sounds meaningful to you. Can you help me understand more about your experience?",
            "I'm glad you feel comfortable sharing with me. What's been weighing on your heart lately?"
        ]
        
        import random
        fallback_response = random.choice(fallback_responses)
        
        return fallback_response, {
            "response_tone": "supportive",
            "fallback_used": True,
            "error": str(e)
        }


async def _get_conversation_history(
    user_id: str, 
    session_id: Optional[str] = None, 
    limit: int = 10
) -> list[ChatMessage]:
    """Get recent conversation history from database."""
    
    try:
        from core.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        
        # Build query
        query = client.supabase.table("chat_messages").select("*").eq("user_id", user_id)
        
        # Filter by session if provided
        if session_id:
            query = query.eq("session_id", session_id)
        
        # Order by timestamp and limit results
        response = query.order("timestamp", desc=True).limit(limit).execute()
        
        # Convert to ChatMessage objects
        messages = []
        for row in reversed(response.data):  # Reverse to get chronological order
            message = ChatMessage(
                id=row.get("id"),
                user_id=row.get("user_id"),
                sender_type=row.get("sender_type"),
                message_text=row.get("message_text"),
                session_id=row.get("session_id"),
                timestamp=datetime.fromisoformat(row.get("timestamp").replace('Z', '+00:00')) if row.get("timestamp") else datetime.now()
            )
            messages.append(message)
        
        return messages
        
    except Exception as e:
        logger.error(f"Error retrieving conversation history: {e}")
        return []


async def _store_chat_messages(messages: list[ChatMessage]) -> None:
    """Store chat messages in database."""
    
    try:
        from core.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        
        # Prepare message data for insertion
        message_data = []
        for msg in messages:
            data = {
                "id": msg.id,
                "user_id": msg.user_id,
                "sender_type": msg.sender_type,
                "message_text": msg.message_text,
                "session_id": msg.session_id,
                "timestamp": msg.timestamp.isoformat(),
            }
            
            # Add optional fields if they exist
            if hasattr(msg, 'mood_detected') and msg.mood_detected:
                data["mood_detected"] = msg.mood_detected
            if hasattr(msg, 'sentiment_score') and msg.sentiment_score:
                data["sentiment_score"] = msg.sentiment_score
                
            message_data.append(data)
        
        # Insert messages
        client.supabase.table("chat_messages").insert(message_data).execute()
        logger.info(f"Successfully stored {len(messages)} chat messages to database")
            
    except Exception as e:
        logger.error(f"Error storing chat messages: {e}")
        # Don't raise exception - chat should work even if storage fails


def _analyze_sentiment(message: str) -> str:
    """Simple sentiment analysis of user message."""
    
    positive_words = ['good', 'great', 'happy', 'excited', 'love', 'wonderful', 'amazing', 'better']
    negative_words = ['sad', 'angry', 'upset', 'worried', 'anxious', 'depressed', 'frustrated', 'terrible']
    
    message_lower = message.lower()
    
    positive_count = sum(1 for word in positive_words if word in message_lower)
    negative_count = sum(1 for word in negative_words if word in message_lower)
    
    if positive_count > negative_count:
        return "positive"
    elif negative_count > positive_count:
        return "negative"
    else:
        return "neutral"


def _extract_conversation_context(
    user_message: str, 
    ai_response: str, 
    personality_insights: Dict[str, Any]
) -> list[str]:
    """Extract conversation context keywords."""
    
    # Simple keyword extraction
    keywords = []
    
    # Check for common themes
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ['stress', 'anxiety', 'worried', 'anxious']):
        keywords.append("stress management")
    
    if any(word in message_lower for word in ['goal', 'goals', 'achieve', 'accomplish']):
        keywords.append("goal setting")
    
    if any(word in message_lower for word in ['relationship', 'friends', 'family', 'social']):
        keywords.append("relationships")
    
    if any(word in message_lower for word in ['work', 'job', 'career', 'workplace']):
        keywords.append("work life")
    
    if any(word in message_lower for word in ['sleep', 'tired', 'energy', 'rest']):
        keywords.append("wellness")
    
    # Add default contexts if none found
    if not keywords:
        keywords = ["mental wellness", "personal growth"]
    
    return keywords[:5]  # Limit to 5 keywords


async def _auto_summarize_if_needed(user_id: str, session_id: str) -> None:
    """
    Automatically summarize conversation if certain conditions are met.
    
    Triggers summarization after every 5 messages in a session to maintain
    memory continuity without overwhelming the system.
    
    Args:
        user_id: User's ID
        session_id: Session ID to check and potentially summarize
    """
    try:
        logger.info(f"📊 Checking if auto-summarization needed for session {session_id}")
        from core.tasks.memory_tasks import summarize_and_store_conversation
        
        # Get message count for this session
        supabase = get_supabase_client()
        response = (
            supabase.supabase.table("chat_messages")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("session_id", session_id)
            .execute()
        )
        
        message_count = response.count
        logger.info(f"📝 Session {session_id} has {message_count} messages")
        
        # Summarize after every 5 messages (10 including AI responses)
        # This means: 5 user messages + 5 AI responses = 10 total
        if message_count and message_count >= 10 and message_count % 10 == 0:
            logger.info(
                f"🎯 Auto-summarization TRIGGERED for session {session_id} "
                f"({message_count} messages) - Starting summarization..."
            )
            
            # Run summarization in background
            success = await summarize_and_store_conversation(user_id, session_id)
            
            if success:
                logger.info(f"✅ Auto-summarization COMPLETED for session {session_id}")
            else:
                logger.warning(f"⚠️ Auto-summarization FAILED for session {session_id}")
        else:
            logger.info(
                f"⏭️  Session {session_id}: Not triggering (count={message_count}, "
                f"need multiple of 10, >= 10)"
            )
                
    except Exception as e:
        logger.error(f"❌ ERROR in auto-summarization for session {session_id}: {e}", exc_info=True)
        # Don't raise - this is a background task
