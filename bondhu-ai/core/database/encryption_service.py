"""
Database service for managing encryption keys in Bondhu AI

This module handles storage and retrieval of encryption keys from the database.
"""

import logging
import uuid
from typing import Optional, Dict, Any
from core.database.supabase_client import SupabaseClient

logger = logging.getLogger("bondhu.encryption_service")


class DatabaseEncryptionService:
    """
    Service for managing encryption keys in the database.
    """
    
    def __init__(self, supabase_client: SupabaseClient):
        self._client = supabase_client
        logger.info("DatabaseEncryptionService initialized")
    
    def store_user_public_key(self, user_id: str, public_key: bytes) -> bool:
        """
        Store a user's public key in the database.
        
        Args:
            user_id: User's ID
            public_key: User's public key in PEM format
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key_data = {
                "user_id": user_id,
                "public_key": public_key.decode('utf-8'),
                "key_type": "RSA-2048"
            }
            
            # Upsert the key (update if exists, insert if not)
            response = self._client.supabase.table("user_keys").upsert(
                key_data,
                on_conflict="user_id"
            ).execute()
            
            logger.info(f"Public key stored for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing public key for user {user_id}: {e}")
            return False
    
    def get_user_public_key(self, user_id: str) -> Optional[bytes]:
        """
        Retrieve a user's public key from the database.
        
        Args:
            user_id: User's ID
            
        Returns:
            User's public key in PEM format, or None if not found
        """
        try:
            response = self._client.supabase.table("user_keys").select(
                "public_key"
            ).eq("user_id", user_id).execute()
            
            if response.data and len(response.data) > 0:
                public_key = response.data[0]["public_key"]
                logger.info(f"Public key retrieved for user {user_id}")
                return public_key.encode('utf-8')
            else:
                logger.warning(f"No public key found for user {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving public key for user {user_id}: {e}")
            return None
    
    def store_session_key(self, session_id: str, user_id: str, 
                         encrypted_key: bytes, recipient_user_id: str) -> bool:
        """
        Store an encrypted session key in the database.
        
        Args:
            session_id: Session ID
            user_id: User who owns this key entry
            encrypted_key: Session key encrypted with recipient's public key
            recipient_user_id: User who can decrypt this key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key_data = {
                "session_id": session_id,
                "user_id": user_id,
                "encrypted_key": encrypted_key.hex(),
                "recipient_user_id": recipient_user_id
            }
            
            response = self._client.supabase.table("session_keys").insert(
                key_data
            ).execute()
            
            logger.info(f"Session key stored for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing session key for session {session_id}: {e}")
            return False
    
    def get_session_keys(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session keys for a user in a specific session.
        
        Args:
            session_id: Session ID
            user_id: User's ID
            
        Returns:
            Dictionary with session key information, or None if not found
        """
        try:
            response = self._client.supabase.table("session_keys").select(
                "encrypted_key", "recipient_user_id"
            ).eq("session_id", session_id).eq("user_id", user_id).execute()
            
            if response.data and len(response.data) > 0:
                key_data = response.data[0]
                # Convert hex back to bytes
                encrypted_key = bytes.fromhex(key_data["encrypted_key"])
                
                result = {
                    "encrypted_key": encrypted_key,
                    "recipient_user_id": key_data["recipient_user_id"]
                }
                
                logger.info(f"Session keys retrieved for session {session_id}, user {user_id}")
                return result
            else:
                logger.warning(f"No session keys found for session {session_id}, user {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving session keys for session {session_id}, user {user_id}: {e}")
            return None


# Global instance
_db_encryption_service: Optional[DatabaseEncryptionService] = None


def get_db_encryption_service() -> DatabaseEncryptionService:
    """
    Get singleton instance of DatabaseEncryptionService.
    
    Returns:
        DatabaseEncryptionService instance
    """
    global _db_encryption_service
    if _db_encryption_service is None:
        from core.database.supabase_client import get_supabase_client
        supabase_client = get_supabase_client()
        _db_encryption_service = DatabaseEncryptionService(supabase_client)
    return _db_encryption_service
