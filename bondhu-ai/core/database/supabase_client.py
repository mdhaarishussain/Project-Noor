"""
Supabase database connection and client setup for Bondhu AI.
"""

from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from datetime import datetime, timezone
import json
import logging

from ..config.settings import get_config

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase client for database operations using REST API."""
    
    def __init__(self):
        config = get_config()
        # Prefer the service role key for backend/server operations when available.
        # This allows server-side RPCs/functions to run with elevated privileges
        # (e.g. perform writes that would otherwise be blocked by RLS for anon roles).
        key_to_use = config.database.service_role_key or config.database.key
        if config.database.service_role_key:
            logger.info("Using Supabase service role key for backend DB client")
        else:
            logger.warning("Supabase service role key not found; falling back to provided DB key. RLS may block some operations.")

        self.supabase: Client = create_client(
            config.database.url,
            key_to_use
        )
    
    async def close(self):
        """Close database connections (no-op for REST API)."""
        pass
    
    async def get_user_personality(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user's personality assessment data using weighted scoring.
        Now uses the new personality adjustment system.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Dictionary containing weighted personality scores and LLM context, or None if not found
        """
        try:
            # Check if user has completed personality assessment
            response = self.supabase.table('personality_profiles').select(
                'id, full_name, avatar_url, personality_llm_context, personality_completed_at, '
                'onboarding_completed, has_completed_personality_assessment, '
                'profile_completion_percentage, created_at, updated_at'
            ).eq('id', user_id).eq('has_completed_personality_assessment', True).execute()
            
            if not response.data or len(response.data) == 0:
                return None
            
            row = response.data[0]
            
            # Get weighted personality scores using the new system
            weighted_personality = await self.get_weighted_personality(
                user_id=user_id,
                survey_weight=0.7,  # 70% from original survey
                adjustment_weight=0.3  # 30% from learned adjustments
            )
            
            # If no weighted personality data available, fall back to profile scores
            if not weighted_personality:
                logger.warning(f"No personality survey found for user {user_id}, using profile scores")
                profile_response = self.supabase.table('profiles').select(
                    'personality_openness, personality_conscientiousness, '
                    'personality_extraversion, personality_agreeableness, personality_neuroticism'
                ).eq('id', user_id).execute()
                
                if profile_response.data and len(profile_response.data) > 0:
                    profile = profile_response.data[0]
                    scores = {
                        'openness': profile.get('personality_openness', 50),
                        'conscientiousness': profile.get('personality_conscientiousness', 50),
                        'extraversion': profile.get('personality_extraversion', 50),
                        'agreeableness': profile.get('personality_agreeableness', 50),
                        'neuroticism': profile.get('personality_neuroticism', 50)
                    }
                else:
                    # Default scores if nothing available
                    scores = {
                        'openness': 50,
                        'conscientiousness': 50,
                        'extraversion': 50,
                        'agreeableness': 50,
                        'neuroticism': 50
                    }
            else:
                # Extract weighted scores from the new system
                scores = {
                    trait: int(round(data['weighted_score']))
                    for trait, data in weighted_personality.items()
                }
            
            return {
                'user_id': str(row['id']),
                'full_name': row.get('full_name'),
                'avatar_url': row.get('avatar_url'),
                'scores': scores,
                'llm_context': row.get('personality_llm_context'),
                'completed_at': row.get('personality_completed_at'),
                'onboarding_completed': row.get('onboarding_completed'),
                'has_assessment': row.get('has_completed_personality_assessment'),
                'profile_completion_percentage': row.get('profile_completion_percentage'),
                'created_at': row.get('created_at'),
                'updated_at': row.get('updated_at'),
                # Include weighted personality details for transparency
                'weighted_personality': weighted_personality
            }
                
        except Exception as e:
            logger.error(f"Error fetching personality data for user {user_id}: {e}")
            return None
    
    async def get_personality_llm_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch the LLM context specifically for a user from personality_profiles view.
        
        Args:
            user_id: User's UUID
            
        Returns:
            LLM context dictionary or None
        """
        try:
            response = self.supabase.table('personality_profiles').select(
                'personality_llm_context'
            ).eq('id', user_id).eq('has_completed_personality_assessment', True).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0].get('personality_llm_context')
                
            return None
                
        except Exception as e:
            logger.error(f"Error fetching LLM context for user {user_id}: {e}")
            return None
    
    async def check_user_onboarding_status(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user has completed onboarding and personality assessment using personality_profiles view.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Dictionary with onboarding status information
        """
        try:
            response = self.supabase.table('personality_profiles').select(
                'id, full_name, avatar_url, onboarding_completed, personality_completed_at, '
                'has_completed_personality_assessment, profile_completion_percentage, '
                'created_at, updated_at'
            ).eq('id', user_id).execute()
            
            if response.data and len(response.data) > 0:
                row = response.data[0]
                return {
                    'user_id': str(row['id']),
                    'full_name': row.get('full_name'),
                    'avatar_url': row.get('avatar_url'),
                    'onboarding_completed': row.get('onboarding_completed', False),
                    'has_personality_assessment': row.get('has_completed_personality_assessment', False),
                    'personality_completed_at': row.get('personality_completed_at'),
                    'profile_completion_percentage': row.get('profile_completion_percentage', 0),
                    'user_exists': True,
                    'created_at': row.get('created_at'),
                    'updated_at': row.get('updated_at')
                }
            
            return {
                'user_id': user_id,
                'user_exists': False,
                'onboarding_completed': False,
                'has_personality_assessment': False
            }
                
        except Exception as e:
            logger.error(f"Error checking onboarding status for user {user_id}: {e}")
            return {
                'user_id': user_id,
                'user_exists': False,
                'onboarding_completed': False,
                'has_personality_assessment': False,
                'error': str(e)
            }
    
    async def store_agent_analysis(
        self, 
        user_id: str, 
        agent_type: str, 
        analysis_data: Dict[str, Any]
    ) -> bool:
        """
        Store agent analysis results for future reference.
        
        Args:
            user_id: User's UUID
            agent_type: Type of agent (music, video, gaming, personality)
            analysis_data: Analysis results
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Use Supabase client for this operation
            result = self.supabase.table('agent_analyses').upsert({
                'user_id': user_id,
                'agent_type': agent_type,
                'analysis_data': analysis_data,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error storing agent analysis for user {user_id}, agent {agent_type}: {e}")
            return False
    
    async def get_agent_analysis_history(
        self, 
        user_id: str, 
        agent_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get historical agent analysis data for a user.
        
        Args:
            user_id: User's UUID
            agent_type: Optional specific agent type to filter by
            
        Returns:
            List of analysis records
        """
        try:
            query = self.supabase.table('agent_analyses').select('*').eq('user_id', user_id)
            
            if agent_type:
                query = query.eq('agent_type', agent_type)
            
            result = query.order('created_at', desc=True).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error fetching agent analysis history for user {user_id}: {e}")
            return []

    # Spotify OAuth methods
    async def store_spotify_tokens(
        self,
        user_id: str,
        access_token: str,
        refresh_token: str,
        expires_at: datetime,
        user_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Store Spotify OAuth tokens and user data for a user.
        
        Args:
            user_id: User's UUID
            access_token: Spotify access token
            refresh_token: Spotify refresh token
            expires_at: Token expiration datetime
            user_data: Optional Spotify user profile data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {
                'spotify_access_token': access_token,
                'spotify_refresh_token': refresh_token,
                'spotify_token_expires_at': expires_at.isoformat(),
                'spotify_connected_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if user_data:
                update_data.update({
                    'spotify_user_id': user_data.get('id'),
                    'spotify_user_email': user_data.get('email')
                })
            
            result = self.supabase.table('profiles').update(update_data).eq('id', user_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error storing Spotify tokens for user {user_id}: {e}")
            return False

    async def get_spotify_tokens(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve Spotify OAuth tokens for a user.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Dictionary with token data or None if not found
        """
        try:
            response = self.supabase.table('profiles').select(
                'spotify_access_token, spotify_refresh_token, spotify_token_expires_at, '
                'spotify_user_id, spotify_user_email, spotify_connected_at'
            ).eq('id', user_id).execute()
            
            if response.data and len(response.data) > 0:
                row = response.data[0]
                if row.get('spotify_access_token'):
                    return {
                        'access_token': row['spotify_access_token'],
                        'refresh_token': row['spotify_refresh_token'],
                        'expires_at': row['spotify_token_expires_at'],
                        'spotify_user_id': row['spotify_user_id'],
                        'spotify_user_email': row['spotify_user_email'],
                        'connected_at': row['spotify_connected_at']
                    }
                    
            return None
            
        except Exception as e:
            logger.error(f"Error fetching Spotify tokens for user {user_id}: {e}")
            return None

    async def disconnect_spotify(self, user_id: str) -> bool:
        """
        Clear Spotify OAuth tokens and connection data for a user.
        
        Args:
            user_id: User's UUID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.supabase.table('profiles').update({
                'spotify_access_token': None,
                'spotify_refresh_token': None,
                'spotify_token_expires_at': None,
                'spotify_user_id': None,
                'spotify_user_email': None,
                'spotify_connected_at': None,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', user_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error disconnecting Spotify for user {user_id}: {e}")
            return False

    async def update_spotify_tokens(
        self,
        user_id: str,
        access_token: str,
        expires_at: datetime,
        refresh_token: Optional[str] = None
    ) -> bool:
        """
        Update Spotify access token after refresh.
        
        Args:
            user_id: User's UUID
            access_token: New access token
            expires_at: New expiration datetime
            refresh_token: Optional new refresh token (if provided by Spotify)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {
                'spotify_access_token': access_token,
                'spotify_token_expires_at': expires_at.isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Update refresh token only if provided
            if refresh_token:
                update_data['spotify_refresh_token'] = refresh_token
            
            result = self.supabase.table('profiles').update(update_data).eq('id', user_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error updating Spotify tokens for user {user_id}: {e}")
            return False

    # Personality Adjustment System Methods
    async def store_personality_survey(
        self,
        user_id: str,
        raw_responses: Dict[str, Any],
        scores: Dict[str, int],
        survey_version: str = "1.0",
        survey_duration_seconds: Optional[int] = None,
        survey_source: str = "onboarding"
    ) -> Optional[str]:
        """
        Store a completed personality survey (permanent record).
        
        Args:
            user_id: User's UUID
            raw_responses: Complete JSON of all survey question responses
            scores: Dictionary with Big Five scores (openness, conscientiousness, etc.)
            survey_version: Version of the survey taken
            survey_duration_seconds: Time taken to complete survey
            survey_source: Source of the survey (onboarding, retake, etc.)
            
        Returns:
            Survey UUID if successful, None otherwise
        """
        try:
            result = self.supabase.table('personality_surveys').insert({
                'user_id': user_id,
                'survey_version': survey_version,
                'raw_responses': raw_responses,
                'openness_score': scores.get('openness', 50),
                'conscientiousness_score': scores.get('conscientiousness', 50),
                'extraversion_score': scores.get('extraversion', 50),
                'agreeableness_score': scores.get('agreeableness', 50),
                'neuroticism_score': scores.get('neuroticism', 50),
                'completed_at': datetime.now(timezone.utc).isoformat(),
                'survey_duration_seconds': survey_duration_seconds,
                'survey_source': survey_source
            }).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]['id']
            return None
            
        except Exception as e:
            logger.error(f"Error storing personality survey for user {user_id}: {e}")
            return None
    
    async def store_personality_adjustment(
        self,
        user_id: str,
        source: str,
        trait: str,
        adjustment_value: float,
        confidence_score: float = 1.0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Store or update a personality trait adjustment from a learning source.
        Uses upsert to update existing adjustments for same user+source+trait.
        
        Args:
            user_id: User's UUID
            source: Source of adjustment (music_analysis, chat_sentiment, etc.)
            trait: Trait being adjusted (openness, conscientiousness, etc.)
            adjustment_value: Adjustment value (-50 to +50)
            confidence_score: Confidence in this adjustment (0.0 to 1.0)
            metadata: Source-specific context and data
            
        Returns:
            Adjustment UUID if successful, None otherwise
        """
        try:
            # Call the PostgreSQL function for upsert
            result = self.supabase.rpc('store_personality_adjustment', {
                'p_user_id': user_id,
                'p_source': source,
                'p_trait': trait,
                'p_adjustment_value': adjustment_value,
                'p_confidence_score': confidence_score,
                'p_metadata': metadata or {}
            }).execute()
            
            if result.data:
                return result.data
            return None
            
        except Exception as e:
            logger.error(f"Error storing personality adjustment for user {user_id}, source {source}, trait {trait}: {e}")
            return None
    
    async def get_weighted_personality(
        self,
        user_id: str,
        survey_weight: float = 0.7,
        adjustment_weight: float = 0.3
    ) -> Optional[Dict[str, Any]]:
        """
        Get weighted personality scores combining survey baseline + learned adjustments.
        
        Args:
            user_id: User's UUID
            survey_weight: Weight given to original survey scores (default 0.7 = 70%)
            adjustment_weight: Weight given to learned adjustments (default 0.3 = 30%)
            
        Returns:
            Dictionary with weighted scores for each trait, or None if no data
        """
        try:
            result = self.supabase.rpc('get_weighted_personality', {
                'p_user_id': user_id,
                'p_survey_weight': survey_weight,
                'p_adjustment_weight': adjustment_weight
            }).execute()
            
            if result.data:
                # Convert list of trait records to dictionary format
                personality_data = {}
                for trait_data in result.data:
                    trait = trait_data['trait']
                    personality_data[trait] = {
                        'survey_score': trait_data['survey_score'],
                        'total_adjustment': trait_data['total_adjustment'],
                        'weighted_score': trait_data['weighted_score'],
                        'confidence': trait_data['confidence'],
                        'adjustment_sources': trait_data['adjustment_sources']
                    }
                return personality_data
            return None
            
        except Exception as e:
            logger.error(f"Error getting weighted personality for user {user_id}: {e}")
            return None
    
    async def get_personality_summary(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get complete personality summary (convenient wrapper).
        
        Args:
            user_id: User's UUID
            
        Returns:
            Complete personality summary with all traits
        """
        try:
            result = self.supabase.rpc('get_personality_summary', {
                'p_user_id': user_id
            }).execute()
            
            if result.data:
                return result.data
            return None
            
        except Exception as e:
            logger.error(f"Error getting personality summary for user {user_id}: {e}")
            return None
    
    async def get_personality_adjustments(
        self,
        user_id: str,
        source: Optional[str] = None,
        trait: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get personality adjustments for a user, optionally filtered by source or trait.
        
        Args:
            user_id: User's UUID
            source: Optional source filter (music_analysis, chat_sentiment, etc.)
            trait: Optional trait filter (openness, conscientiousness, etc.)
            
        Returns:
            List of adjustment records
        """
        try:
            query = self.supabase.table('personality_adjustments').select('*').eq('user_id', user_id)
            
            if source:
                query = query.eq('source', source)
            if trait:
                query = query.eq('trait', trait)
            
            result = query.order('created_at', desc=True).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error fetching personality adjustments for user {user_id}: {e}")
            return []


# Global client instance
_supabase_client: Optional[SupabaseClient] = None


def get_supabase_client() -> SupabaseClient:
    """Get the global Supabase client instance."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client


async def cleanup_database():
    """Cleanup database connections."""
    global _supabase_client
    if _supabase_client:
        await _supabase_client.close()
        _supabase_client = None