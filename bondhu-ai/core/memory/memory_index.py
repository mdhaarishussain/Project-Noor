"""
Memory Index Manager

Manages an index of conversation topics, themes, and references
to enable fast lookups and semantic connections between memories.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict
from core.database.supabase_client import SupabaseClient

logger = logging.getLogger("bondhu.memory.index")


class MemoryIndexManager:
    """
    Manages an index of memory topics and themes for fast retrieval.
    Tracks what topics were discussed when and creates semantic links.
    """

    def __init__(self, supabase_client: SupabaseClient):
        self._client = supabase_client
        self.logger = logging.getLogger("bondhu.memory.index")

    def index_conversation(
        self,
        user_id: str,
        session_id: str,
        topics: List[str],
        entities: List[Dict[str, str]],
        timestamp: datetime,
    ) -> bool:
        """
        Index a conversation by its topics and entities.

        Args:
            user_id: User's ID
            session_id: Session ID of the conversation
            topics: List of topics discussed
            entities: List of named entities (people, places, things mentioned)
            timestamp: When the conversation occurred

        Returns:
            True if successful
        """
        try:
            # Index each topic
            for topic in topics:
                self._index_topic(user_id, session_id, topic, timestamp)

            # Index each entity
            for entity in entities:
                self._index_entity(
                    user_id,
                    session_id,
                    entity.get("name"),
                    entity.get("type"),
                    timestamp,
                )

            self.logger.info(
                f"Indexed conversation {session_id}: {len(topics)} topics, "
                f"{len(entities)} entities"
            )
            return True

        except Exception as e:
            self.logger.error(f"Error indexing conversation: {e}")
            return False

    def _index_topic(
        self, user_id: str, session_id: str, topic: str, timestamp: datetime
    ) -> bool:
        """Index a single topic."""
        try:
            index_data = {
                "user_id": user_id,
                "session_id": session_id,
                "topic": topic.lower(),
                "timestamp": timestamp.isoformat(),
                "index_type": "topic",
            }

            self._client.supabase.table("memory_index").insert(index_data).execute()
            return True

        except Exception as e:
            self.logger.error(f"Error indexing topic: {e}")
            return False

    def _index_entity(
        self,
        user_id: str,
        session_id: str,
        entity_name: str,
        entity_type: str,
        timestamp: datetime,
    ) -> bool:
        """Index a single entity."""
        try:
            index_data = {
                "user_id": user_id,
                "session_id": session_id,
                "entity_name": entity_name.lower(),
                "entity_type": entity_type,
                "timestamp": timestamp.isoformat(),
                "index_type": "entity",
            }

            self._client.supabase.table("memory_index").insert(index_data).execute()
            return True

        except Exception as e:
            self.logger.error(f"Error indexing entity: {e}")
            return False

    def find_sessions_by_topic(
        self, user_id: str, topic: str, limit: int = 10
    ) -> List[str]:
        """
        Find session IDs that discussed a specific topic.

        Args:
            user_id: User's ID
            topic: Topic to search for
            limit: Maximum number of sessions to return

        Returns:
            List of session IDs
        """
        try:
            response = (
                self._client.supabase.table("memory_index")
                .select("session_id")
                .eq("user_id", user_id)
                .eq("index_type", "topic")
                .ilike("topic", f"%{topic.lower()}%")
                .order("timestamp", desc=True)
                .limit(limit)
                .execute()
            )

            return [row["session_id"] for row in response.data]

        except Exception as e:
            self.logger.error(f"Error finding sessions by topic: {e}")
            return []

    def find_sessions_by_entity(
        self, user_id: str, entity_name: str, limit: int = 10
    ) -> List[str]:
        """
        Find session IDs that mentioned a specific entity.

        Args:
            user_id: User's ID
            entity_name: Entity name to search for
            limit: Maximum number of sessions to return

        Returns:
            List of session IDs
        """
        try:
            response = (
                self._client.supabase.table("memory_index")
                .select("session_id")
                .eq("user_id", user_id)
                .eq("index_type", "entity")
                .ilike("entity_name", f"%{entity_name.lower()}%")
                .order("timestamp", desc=True)
                .limit(limit)
                .execute()
            )

            return [row["session_id"] for row in response.data]

        except Exception as e:
            self.logger.error(f"Error finding sessions by entity: {e}")
            return []

    def get_topic_frequency(self, user_id: str) -> Dict[str, int]:
        """
        Get frequency of topics discussed by user.

        Args:
            user_id: User's ID

        Returns:
            Dictionary mapping topics to their frequency counts
        """
        try:
            response = (
                self._client.supabase.table("memory_index")
                .select("topic")
                .eq("user_id", user_id)
                .eq("index_type", "topic")
                .execute()
            )

            # Count topic frequencies
            topic_counts = defaultdict(int)
            for row in response.data:
                topic = row.get("topic")
                if topic:
                    topic_counts[topic] += 1

            return dict(topic_counts)

        except Exception as e:
            self.logger.error(f"Error getting topic frequency: {e}")
            return {}

    def get_most_discussed_topics(
        self, user_id: str, limit: int = 10
    ) -> List[tuple[str, int]]:
        """
        Get the most frequently discussed topics.

        Args:
            user_id: User's ID
            limit: Number of top topics to return

        Returns:
            List of (topic, count) tuples sorted by frequency
        """
        freq = self.get_topic_frequency(user_id)
        sorted_topics = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return sorted_topics[:limit]


# Global singleton
_memory_index_manager: Optional[MemoryIndexManager] = None


def get_memory_index_manager() -> MemoryIndexManager:
    """Get singleton instance of MemoryIndexManager."""
    global _memory_index_manager
    if _memory_index_manager is None:
        from core.database.supabase_client import get_supabase_client

        supabase_client = get_supabase_client()
        _memory_index_manager = MemoryIndexManager(supabase_client)
    return _memory_index_manager
