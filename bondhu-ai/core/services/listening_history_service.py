"""
Listening history and cold start management service.
Handles:
- Fetching top 50 user listening history from Spotify
- Storing in listening_history table
- Cold start strategy with dynamic weight adjustment based on user account age
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

from core.database.supabase_client import get_supabase_client
from core.database.models import PersonalityTrait
from agents.music.music_agent import MusicIntelligenceAgent

logger = logging.getLogger("bondhu.listening_history_service")


class ListeningHistoryService:
    """
    Service for managing user listening history and cold start recommendations.
    """
    
    # Cold start weight configurations per spec
    COLD_START_WEIGHTS = {
        'week_1': {
            'personality': 0.8,
            'popular_tracks': 0.2
        },
        'week_2_4': {
            'personality': 0.6,
            'history': 0.4
        },
        'month_2_plus': {
            'history': 0.4,
            'personality': 0.4,
            'other': 0.2  # diversity, novelty, etc.
        }
    }
    
    def __init__(self):
        """Initialize listening history service."""
        self.supabase = get_supabase_client()
        logger.info("ListeningHistoryService initialized with cold start strategy")
    
    def get_user_account_age_days(self, user_id: str) -> Optional[int]:
        """
        Get user account age in days.
        
        Args:
            user_id: User ID
            
        Returns:
            Account age in days, or None if error
        """
        try:
            result = self.supabase.supabase.table('profiles').select('created_at').eq('id', user_id).single().execute()
            
            if result.data:
                created_at = datetime.fromisoformat(result.data['created_at'].replace('Z', '+00:00'))
                age_days = (datetime.now(created_at.tzinfo) - created_at).days
                return age_days
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user account age: {e}")
            return None
    
    def get_cold_start_stage(self, account_age_days: int) -> str:
        """
        Determine cold start stage based on account age.
        
        Args:
            account_age_days: Account age in days
            
        Returns:
            Stage name: 'week_1', 'week_2_4', or 'month_2_plus'
        """
        if account_age_days <= 7:
            return 'week_1'
        elif account_age_days <= 28:
            return 'week_2_4'
        else:
            return 'month_2_plus'
    
    def get_recommendation_weights(self, user_id: str, account_age_days: Optional[int] = None) -> Dict[str, float]:
        """
        Get dynamic recommendation weights based on user account age (cold start strategy).
        
        Args:
            user_id: User ID
            account_age_days: Optional account age override
            
        Returns:
            Weight configuration dict
        """
        try:
            if account_age_days is None:
                account_age_days = self.get_user_account_age_days(user_id)
            
            if account_age_days is None:
                # Default to mature user weights
                stage = 'month_2_plus'
            else:
                stage = self.get_cold_start_stage(account_age_days)
            
            weights = self.COLD_START_WEIGHTS[stage].copy()
            weights['stage'] = stage
            weights['account_age_days'] = account_age_days
            
            logger.info(f"User {user_id} in cold start stage: {stage} (age: {account_age_days} days)")
            
            return weights
            
        except Exception as e:
            logger.error(f"Error getting recommendation weights: {e}")
            return self.COLD_START_WEIGHTS['month_2_plus']
    
    async def fetch_and_store_listening_history(
        self, 
        user_id: str, 
        spotify_token: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetch user's top tracks from Spotify and store in listening_history table.
        
        Args:
            user_id: User ID
            spotify_token: Spotify OAuth token
            limit: Number of tracks to fetch (spec: 50)
            
        Returns:
            List of stored listening history entries
        """
        try:
            # Initialize music agent with Spotify token
            agent = MusicIntelligenceAgent(user_id=user_id, spotify_token=spotify_token)
            
            # Fetch top tracks (medium_term = ~6 months)
            logger.info(f"Fetching top {limit} tracks for user {user_id}")
            top_tracks = await agent._get_top_tracks(time_range='medium_term')
            
            if not top_tracks:
                logger.warning(f"No top tracks found for user {user_id}")
                return []
            
            # Limit to requested number
            top_tracks = top_tracks[:limit]
            
            # Get audio features for tracks
            track_ids = [track['id'] for track in top_tracks]
            audio_features = await agent._get_audio_features(track_ids)
            
            # Store in database
            stored_entries = []
            
            for track in top_tracks:
                track_id = track['id']
                track_features = audio_features.get(track_id, {})
                
                # Prepare data for storage
                history_data = {
                    'user_id': user_id,
                    'track_id': track_id,
                    'track_name': track['name'],
                    'artist_name': ', '.join([artist['name'] for artist in track.get('artists', [])]),
                    'album_name': track.get('album', {}).get('name'),
                    'track_uri': track.get('uri'),
                    'external_url': track.get('external_urls', {}).get('spotify'),
                    'duration_ms': track.get('duration_ms'),
                    'popularity': track.get('popularity'),
                    'explicit': track.get('explicit', False),
                    'played_at': datetime.utcnow().isoformat(),
                    **track_features  # Add audio features
                }
                
                # Upsert using database function
                try:
                    result = self.supabase.supabase.rpc(
                        'upsert_listening_history',
                        {
                            'p_user_id': user_id,
                            'p_track_id': track_id,
                            'p_track_name': track['name'],
                            'p_artist_name': history_data['artist_name'],
                            'p_played_at': history_data['played_at'],
                            'p_audio_features': track_features,
                            'p_duration_ms': track.get('duration_ms')
                        }
                    ).execute()
                    
                    stored_entries.append(history_data)
                    
                except Exception as store_error:
                    logger.error(f"Error storing track {track_id}: {store_error}")
                    # Continue with other tracks
            
            logger.info(f"Stored {len(stored_entries)} tracks in listening history for user {user_id}")
            return stored_entries
            
        except Exception as e:
            logger.error(f"Error fetching and storing listening history: {e}")
            return []
    
    async def get_user_top_50_tracks(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get user's top 50 tracks from listening_history table.
        
        Args:
            user_id: User ID
            
        Returns:
            List of top 50 tracks with audio features
        """
        try:
            result = self.supabase.supabase.rpc(
                'get_user_top_50_tracks',
                {'p_user_id': user_id}
            ).execute()
            
            if result.data:
                logger.info(f"Retrieved {len(result.data)} tracks from listening history for user {user_id}")
                return result.data
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting top 50 tracks: {e}")
            return []
    
    async def refresh_listening_history(
        self, 
        user_id: str, 
        spotify_token: str,
        force: bool = False
    ) -> bool:
        """
        Refresh listening history if needed.
        
        Args:
            user_id: User ID
            spotify_token: Spotify OAuth token
            force: Force refresh regardless of last update
            
        Returns:
            True if refreshed successfully
        """
        try:
            # Check last update time
            if not force:
                result = self.supabase.supabase.table('listening_history') \
                    .select('updated_at') \
                    .eq('user_id', user_id) \
                    .order('updated_at', desc=True) \
                    .limit(1) \
                    .execute()
                
                if result.data:
                    last_update = datetime.fromisoformat(result.data[0]['updated_at'].replace('Z', '+00:00'))
                    time_since_update = datetime.now(last_update.tzinfo) - last_update
                    
                    # Only refresh if older than 6 hours (per spec: update_frequency)
                    if time_since_update < timedelta(hours=6):
                        logger.info(f"Listening history for user {user_id} is recent, skipping refresh")
                        return True
            
            # Fetch and store fresh data
            await self.fetch_and_store_listening_history(user_id, spotify_token)
            
            return True
            
        except Exception as e:
            logger.error(f"Error refreshing listening history: {e}")
            return False
    
    async def get_popular_tracks_for_cold_start(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get popular tracks for cold start (week 1 users with no history).
        
        Args:
            limit: Number of popular tracks to return
            
        Returns:
            List of popular tracks
        """
        try:
            # Get popular tracks from all users' listening history
            result = self.supabase.supabase.table('listening_history') \
                .select('*') \
                .order('popularity', desc=True) \
                .limit(limit) \
                .execute()
            
            if result.data:
                # Deduplicate by track_id
                seen_tracks = set()
                unique_tracks = []
                
                for track in result.data:
                    if track['track_id'] not in seen_tracks:
                        seen_tracks.add(track['track_id'])
                        unique_tracks.append(track)
                        
                        if len(unique_tracks) >= limit:
                            break
                
                logger.info(f"Retrieved {len(unique_tracks)} popular tracks for cold start")
                return unique_tracks
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting popular tracks: {e}")
            return []


# Global service instance
listening_history_service = ListeningHistoryService()
