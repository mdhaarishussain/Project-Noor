"""
Conversation Memory Manager

Handles the creation, storage, and retrieval of conversational memories
from chat history. Provides semantic search and summarization capabilities.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from core.database.supabase_client import SupabaseClient

logger = logging.getLogger("bondhu.memory.conversation")


class ConversationMemoryManager:
    """
    Manages conversational memories extracted from chat history.
    Provides methods for creating memory summaries, searching past conversations,
    and retrieving relevant context for the LLM.
    """

    def __init__(self, supabase_client: SupabaseClient):
        self._client = supabase_client
        self.logger = logging.getLogger("bondhu.memory.conversation")

    def create_conversation_memory(
        self,
        user_id: str,
        conversation_summary: str,
        topics: List[str],
        emotions: List[str],
        key_points: List[str],
        session_id: str,
        message_ids: List[str],
        start_time: datetime,
        end_time: datetime,
    ) -> bool:
        """
        Create a conversation memory entry that summarizes a conversation.

        Args:
            user_id: User's ID
            conversation_summary: Human-readable summary of the conversation
            topics: List of topics discussed (e.g., ["work stress", "relationships"])
            emotions: List of emotions detected (e.g., ["anxious", "hopeful"])
            key_points: Important points from the conversation
            session_id: Session ID of the conversation
            message_ids: IDs of messages included in this memory
            start_time: When the conversation started
            end_time: When the conversation ended

        Returns:
            True if successful, False otherwise
        """
        try:
            memory_data = {
                "user_id": user_id,
                "conversation_summary": conversation_summary,
                "topics": topics,
                "emotions": emotions,
                "key_points": key_points,
                "session_id": session_id,
                "message_ids": message_ids,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "created_at": datetime.now().isoformat(),
            }

            self._client.supabase.table("conversation_memories").insert(
                memory_data
            ).execute()

            self.logger.info(
                f"Created conversation memory for user {user_id}, session {session_id}"
            )
            return True

        except Exception as e:
            self.logger.error(f"Error creating conversation memory: {e}")
            return False

    def get_recent_conversations(
        self, user_id: str, days: int = 7, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent conversation memories for a user.

        Args:
            user_id: User's ID
            days: How many days back to search
            limit: Maximum number of conversations to return

        Returns:
            List of conversation memory dictionaries
        """
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

            response = (
                self._client.supabase.table("conversation_memories")
                .select("*")
                .eq("user_id", user_id)
                .gte("start_time", cutoff_date)
                .order("start_time", desc=True)
                .limit(limit)
                .execute()
            )

            return response.data

        except Exception as e:
            self.logger.error(f"Error getting recent conversations: {e}")
            return []

    def search_conversations_by_topic(
        self, user_id: str, topic: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search conversation memories by topic.

        Args:
            user_id: User's ID
            topic: Topic to search for (e.g., "work stress")
            limit: Maximum number of results

        Returns:
            List of matching conversation memories
        """
        try:
            # Search using PostgreSQL array contains operator
            response = (
                self._client.supabase.table("conversation_memories")
                .select("*")
                .eq("user_id", user_id)
                .contains("topics", [topic])
                .order("start_time", desc=True)
                .limit(limit)
                .execute()
            )

            return response.data

        except Exception as e:
            self.logger.error(f"Error searching conversations by topic: {e}")
            return []

    def search_conversations_by_emotion(
        self, user_id: str, emotion: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search conversation memories by emotion.

        Args:
            user_id: User's ID
            emotion: Emotion to search for (e.g., "anxious")
            limit: Maximum number of results

        Returns:
            List of matching conversation memories
        """
        try:
            response = (
                self._client.supabase.table("conversation_memories")
                .select("*")
                .eq("user_id", user_id)
                .contains("emotions", [emotion])
                .order("start_time", desc=True)
                .limit(limit)
                .execute()
            )

            return response.data

        except Exception as e:
            self.logger.error(f"Error searching conversations by emotion: {e}")
            return []

    def get_conversation_by_session(
        self, user_id: str, session_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific conversation memory by session ID.

        Args:
            user_id: User's ID
            session_id: Session ID to retrieve

        Returns:
            Conversation memory dict or None if not found
        """
        try:
            response = (
                self._client.supabase.table("conversation_memories")
                .select("*")
                .eq("user_id", user_id)
                .eq("session_id", session_id)
                .single()
                .execute()
            )

            return response.data

        except Exception as e:
            self.logger.error(f"Error getting conversation by session: {e}")
            return None

    def search_conversations_by_text(
        self, user_id: str, query: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search conversation summaries and key points by text.

        Args:
            user_id: User's ID
            query: Text query to search for
            limit: Maximum number of results

        Returns:
            List of matching conversation memories
        """
        try:
            search_term = f"%{query.lower()}%"

            response = (
                self._client.supabase.table("conversation_memories")
                .select("*")
                .eq("user_id", user_id)
                .or_(f"conversation_summary.ilike.{search_term}")
                .order("start_time", desc=True)
                .limit(limit)
                .execute()
            )

            return response.data

        except Exception as e:
            self.logger.error(f"Error searching conversations by text: {e}")
            return []

    def get_conversation_context_for_llm(
        self, user_id: str, current_message: str, max_memories: int = 3
    ) -> str:
        """
        Generate conversation context from past memories for LLM prompt.
        This is the key method that enables the LLM to reference past conversations.

        Args:
            user_id: User's ID
            current_message: Current user message (to find relevant memories)
            max_memories: Maximum number of past conversations to include

        Returns:
            Formatted string with relevant past conversation context
        """
        try:
            # Get recent conversations (last 7 days)
            recent = self.get_recent_conversations(user_id, days=7, limit=5)

            if not recent:
                return ""

            # Build context string
            context_parts = []
            context_parts.append(
                "\n=== RELEVANT PAST CONVERSATIONS ===\n"
                "The user may reference these previous discussions:"
            )

            for idx, conv in enumerate(recent[:max_memories], 1):
                # Format timestamp
                start_time = datetime.fromisoformat(
                    conv["start_time"].replace("Z", "+00:00")
                )
                time_str = start_time.strftime("%B %d, %Y at %I:%M %p")

                context_parts.append(f"\n{idx}. Conversation from {time_str}:")
                context_parts.append(f"   Summary: {conv['conversation_summary']}")

                if conv.get("topics"):
                    topics_str = ", ".join(conv["topics"])
                    context_parts.append(f"   Topics: {topics_str}")

                if conv.get("key_points"):
                    context_parts.append("   Key Points:")
                    for point in conv["key_points"][:3]:  # Limit to 3 key points
                        context_parts.append(f"   • {point}")

                if conv.get("emotions"):
                    emotions_str = ", ".join(conv["emotions"])
                    context_parts.append(f"   Emotions: {emotions_str}")

            context_parts.append(
                "\nIf the user references 'last time', 'before', 'we discussed', "
                "or similar phrases, they are likely referring to these conversations. "
                "Use this context to provide continuity and show that you remember."
            )

            return "\n".join(context_parts)

        except Exception as e:
            self.logger.error(f"Error generating conversation context: {e}")
            return ""

    def summarize_session(
        self, user_id: str, session_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Summarize a chat session and extract key information.
        This should be called periodically or at session end.

        Args:
            user_id: User's ID
            session_id: Session ID to summarize

        Returns:
            Summary dictionary with topics, emotions, and key points
        """
        try:
            # Get all messages from this session
            response = (
                self._client.supabase.table("chat_messages")
                .select("*")
                .eq("user_id", user_id)
                .eq("session_id", session_id)
                .order("timestamp", desc=False)
                .execute()
            )

            messages = response.data
            if not messages:
                return None

            # Extract user and AI messages
            user_messages = [
                msg for msg in messages if msg["sender_type"] == "user"
            ]
            ai_messages = [msg for msg in messages if msg["sender_type"] == "ai"]

            # Extract topics (simple keyword extraction for now)
            topics = self._extract_topics(user_messages)

            # Extract emotions from mood_detected fields
            emotions = self._extract_emotions(user_messages)

            # Generate simple summary
            conversation_summary = self._generate_simple_summary(
                user_messages, ai_messages
            )

            # Extract key points (last 3 user messages)
            key_points = [
                msg["message_text"] for msg in user_messages[-3:]
            ]

            return {
                "conversation_summary": conversation_summary,
                "topics": topics,
                "emotions": emotions,
                "key_points": key_points,
                "message_ids": [msg["id"] for msg in messages],
                "start_time": datetime.fromisoformat(
                    messages[0]["timestamp"].replace("Z", "+00:00")
                ),
                "end_time": datetime.fromisoformat(
                    messages[-1]["timestamp"].replace("Z", "+00:00")
                ),
            }

        except Exception as e:
            self.logger.error(f"Error summarizing session: {e}")
            return None

    def _extract_topics(self, messages: List[Dict[str, Any]]) -> List[str]:
        """
        Extract topics from messages using keyword matching and key phrase extraction.
        Now extracts both generic categories AND specific subjects mentioned.
        """
        topics = set()
        
        # Combine all message texts
        all_text = " ".join([msg["message_text"] for msg in messages]).lower()

        # Generic topic categories
        topic_keywords = {
            "work": ["work", "job", "career", "office", "colleague", "boss"],
            "relationships": ["relationship", "friend", "family", "partner"],
            "anxiety": ["anxious", "worried", "stress", "nervous"],
            "depression": ["sad", "depressed", "down", "hopeless"],
            "goals": ["goal", "plan", "achieve", "want to"],
            "health": ["health", "exercise", "sleep", "tired", "energy"],
            "education": ["study", "learn", "school", "course", "exam"],
        }

        # Specific topic patterns (entertainment, hobbies, etc.)
        specific_topics = {
            # Anime & Entertainment
            "anime": ["anime", "manga"],
            "attack on titan": ["attack on titan", "shingeki no kyojin", "aot"],
            "re:zero": ["re:zero", "rezero", "natsuki subaru"],
            "gaming": ["game", "gaming", "play", "playstation", "xbox"],
            "music": ["music", "song", "album", "artist", "band"],
            "movies": ["movie", "film", "cinema"],
            "tv shows": ["tv show", "series", "season", "episode"],
            
            # Tech & Programming
            "python": ["python", "django", "flask"],
            "javascript": ["javascript", "js", "react", "node"],
            "programming": ["code", "coding", "program", "software"],
            
            # Other common topics
            "sports": ["sports", "football", "basketball", "soccer"],
            "travel": ["travel", "trip", "vacation", "visit"],
            "food": ["food", "cook", "recipe", "restaurant"],
            "books": ["book", "read", "novel", "author"],
        }

        # Extract generic categories
        for topic, keywords in topic_keywords.items():
            if any(keyword in all_text for keyword in keywords):
                topics.add(topic)

        # Extract specific topics (these are more valuable)
        for topic, keywords in specific_topics.items():
            if any(keyword in all_text for keyword in keywords):
                topics.add(topic)
                
        # If we found specific topics, prioritize them over generic ones
        specific_found = [t for t in topics if t in specific_topics.keys()]
        generic_found = [t for t in topics if t in topic_keywords.keys()]
        
        # Return specific topics first, then generic, limit to 8 total
        result = specific_found + generic_found
        return result[:8] if result else ["general conversation"]

    def _extract_emotions(self, messages: List[Dict[str, Any]]) -> List[str]:
        """Extract emotions from messages."""
        emotions = set()

        for msg in messages:
            if msg.get("mood_detected"):
                emotions.add(msg["mood_detected"])

        return list(emotions)

    def _generate_simple_summary(
        self, user_messages: List[Dict[str, Any]], ai_messages: List[Dict[str, Any]]
    ) -> str:
        """Generate a simple conversation summary."""
        if not user_messages:
            return "No conversation"

        # Count message exchanges
        num_exchanges = len(user_messages)

        # Get first and last user messages
        first_msg = user_messages[0]["message_text"][:100]
        last_msg = user_messages[-1]["message_text"][:100]

        summary = (
            f"Conversation with {num_exchanges} message exchanges. "
            f"Started with: '{first_msg}...'. "
        )

        if num_exchanges > 1:
            summary += f"Ended with: '{last_msg}...'."

        return summary


# Global singleton
_conversation_memory_manager: Optional[ConversationMemoryManager] = None


def get_conversation_memory_manager() -> ConversationMemoryManager:
    """Get singleton instance of ConversationMemoryManager."""
    global _conversation_memory_manager
    if _conversation_memory_manager is None:
        from core.database.supabase_client import get_supabase_client

        supabase_client = get_supabase_client()
        _conversation_memory_manager = ConversationMemoryManager(supabase_client)
    return _conversation_memory_manager
