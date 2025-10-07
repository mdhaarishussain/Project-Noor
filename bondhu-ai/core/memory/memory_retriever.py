"""
Memory Retriever

Intelligent retrieval of relevant memories and past conversations
based on current context. Combines multiple retrieval strategies.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from core.database.supabase_client import SupabaseClient
from core.memory.conversation_memory import get_conversation_memory_manager
from core.memory.memory_index import get_memory_index_manager
from core.database.memory_service import get_memory_service

logger = logging.getLogger("bondhu.memory.retriever")


class MemoryRetriever:
    """
    Intelligent memory retrieval system that combines multiple strategies
    to find the most relevant past conversations and user facts.
    """

    def __init__(self, supabase_client: SupabaseClient):
        self._client = supabase_client
        self.logger = logging.getLogger("bondhu.memory.retriever")
        self.conversation_mgr = get_conversation_memory_manager()
        self.index_mgr = get_memory_index_manager()
        self.memory_service = get_memory_service()

    def retrieve_relevant_context(
        self, user_id: str, current_message: str, max_items: int = 5
    ) -> str:
        """
        Retrieve relevant context for the current conversation.
        This is the main method to call when processing a new message.

        Args:
            user_id: User's ID
            current_message: Current user message
            max_items: Maximum number of context items to retrieve

        Returns:
            Formatted context string for LLM prompt
        """
        try:
            context_sections = []

            # 1. Get user facts (from user_memories)
            user_facts = self.memory_service.generate_session_context(user_id)
            if user_facts:
                context_sections.append(user_facts)

            # 2. Get recent conversation context
            conversation_context = (
                self.conversation_mgr.get_conversation_context_for_llm(
                    user_id, current_message, max_memories=3
                )
            )
            if conversation_context:
                context_sections.append(conversation_context)

            # 3. Detect if user is referencing past conversations
            reference_context = self._detect_conversation_reference(
                user_id, current_message
            )
            if reference_context:
                context_sections.append(reference_context)

            # Combine all context sections
            if context_sections:
                full_context = "\n\n".join(context_sections)
                return f"\n{'=' * 60}\nCONTEXT & MEMORY\n{'=' * 60}\n{full_context}\n{'=' * 60}\n"
            else:
                return ""

        except Exception as e:
            self.logger.error(f"Error retrieving relevant context: {e}")
            return ""

    def _detect_conversation_reference(
        self, user_id: str, message: str
    ) -> Optional[str]:
        """
        Detect if user is referencing a past conversation.
        Looks for phrases like "last time", "we talked about", "remember when", etc.

        Args:
            user_id: User's ID
            message: Current message

        Returns:
            Context string if reference detected, None otherwise
        """
        message_lower = message.lower()

        # Reference patterns
        reference_patterns = [
            "last time",
            "last session",
            "yesterday",
            "before",
            "earlier",
            "we talked about",
            "we discussed",
            "you said",
            "remember when",
            "i mentioned",
            "i told you",
            "as i said",
            "like i said",
            "the character i mentioned",
            "the anime i mentioned",
            "my favorite character",
        ]

        # Check if message contains any reference patterns
        has_reference = any(pattern in message_lower for pattern in reference_patterns)

        if not has_reference:
            return None

        # Extract potential topics from the message
        topics = self._extract_message_topics(message)

        # Search for relevant past conversations
        relevant_conversations = []

        # Search by topics
        for topic in topics[:3]:  # Check top 3 topics
            convs = self.conversation_mgr.search_conversations_by_topic(
                user_id, topic, limit=2
            )
            relevant_conversations.extend(convs)

        # Also get recent conversations
        recent = self.conversation_mgr.get_recent_conversations(
            user_id, days=7, limit=3
        )
        relevant_conversations.extend(recent)

        # Remove duplicates (by session_id)
        seen_sessions = set()
        unique_conversations = []
        for conv in relevant_conversations:
            session_id = conv.get("session_id")
            if session_id not in seen_sessions:
                seen_sessions.add(session_id)
                unique_conversations.append(conv)

        if not unique_conversations:
            return None

        # Format the context
        context_parts = [
            "\n=== USER IS REFERENCING PAST CONVERSATIONS ===",
            f"Detected reference phrase in user's message: '{message[:100]}'",
            "Here are the most relevant past conversations:",
        ]

        for idx, conv in enumerate(unique_conversations[:3], 1):
            start_time = datetime.fromisoformat(
                conv["start_time"].replace("Z", "+00:00")
            )
            time_str = start_time.strftime("%B %d at %I:%M %p")

            context_parts.append(f"\n{idx}. From {time_str}:")
            context_parts.append(f"   {conv['conversation_summary']}")

            if conv.get("key_points"):
                context_parts.append("   Key points mentioned:")
                for point in conv["key_points"][:2]:
                    context_parts.append(f"   • {point[:100]}")

        context_parts.append(
            "\nUSE THIS INFORMATION to provide continuity and show you remember "
            "what the user is referring to."
        )

        return "\n".join(context_parts)

    def _extract_message_topics(self, message: str) -> List[str]:
        """Extract potential topics from a message."""
        message_lower = message.lower()
        topics = []

        # Topic keywords (same as in conversation_memory)
        topic_keywords = {
            "work": ["work", "job", "career", "office"],
            "relationships": ["relationship", "friend", "family"],
            "anxiety": ["anxious", "worried", "stress"],
            "depression": ["sad", "depressed", "down"],
            "anime": ["anime", "manga", "character"],
            "gaming": ["game", "gaming", "play"],
            "music": ["music", "song", "band"],
            "health": ["health", "exercise", "sleep"],
        }

        for topic, keywords in topic_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                topics.append(topic)

        return topics

    def search_specific_memory(
        self, user_id: str, query: str
    ) -> Optional[Dict[str, Any]]:
        """
        Search for a specific memory or conversation.

        Args:
            user_id: User's ID
            query: Search query

        Returns:
            Most relevant memory/conversation or None
        """
        try:
            # Search conversations
            conversations = self.conversation_mgr.search_conversations_by_text(
                user_id, query, limit=1
            )

            if conversations:
                return {
                    "type": "conversation",
                    "data": conversations[0],
                }

            # Search user facts
            memories = self.memory_service.search_memories(user_id, query)

            if memories:
                return {
                    "type": "fact",
                    "data": memories[0],
                }

            return None

        except Exception as e:
            self.logger.error(f"Error searching specific memory: {e}")
            return None

    def get_conversation_timeline(
        self, user_id: str, days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get a timeline of conversations over time.

        Args:
            user_id: User's ID
            days: Number of days to look back

        Returns:
            List of conversation summaries ordered by time
        """
        try:
            conversations = self.conversation_mgr.get_recent_conversations(
                user_id, days=days, limit=50
            )

            # Format timeline
            timeline = []
            for conv in conversations:
                start_time = datetime.fromisoformat(
                    conv["start_time"].replace("Z", "+00:00")
                )

                timeline.append(
                    {
                        "date": start_time.strftime("%Y-%m-%d"),
                        "time": start_time.strftime("%I:%M %p"),
                        "summary": conv["conversation_summary"],
                        "topics": conv.get("topics", []),
                        "emotions": conv.get("emotions", []),
                    }
                )

            return timeline

        except Exception as e:
            self.logger.error(f"Error getting conversation timeline: {e}")
            return []


# Global singleton
_memory_retriever: Optional[MemoryRetriever] = None


def get_memory_retriever() -> MemoryRetriever:
    """Get singleton instance of MemoryRetriever."""
    global _memory_retriever
    if _memory_retriever is None:
        from core.database.supabase_client import get_supabase_client

        supabase_client = get_supabase_client()
        _memory_retriever = MemoryRetriever(supabase_client)
    return _memory_retriever
