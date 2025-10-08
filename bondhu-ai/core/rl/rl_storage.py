"""
Supabase storage integration for Music RL system.
Stores Q-values, interactions, and model states in database.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from core.database.supabase_client import get_supabase_client

logger = logging.getLogger("bondhu.rl_storage")


class RLSupabaseStorage:
    """Handles storing RL data in Supabase for persistence."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.supabase = get_supabase_client()
    
    async def store_music_interaction(
        self,
        song_data: Dict[str, Any],
        interaction_type: str,
        rl_reward: float,
        q_value: float,
        state_features: str,
        personality_snapshot: Dict[str, Any]
    ) -> bool:
        """Store music interaction for RL learning."""
        try:
            interaction_data = {
                'user_id': self.user_id,
                'spotify_track_id': song_data.get('id', 'unknown'),
                'track_name': song_data.get('name', 'Unknown'),
                'genz_genre': song_data.get('genz_genre', 'unknown'),
                'interaction_type': interaction_type,
                'rl_reward': rl_reward,
                'q_value': q_value,
                'state_features': state_features,
                'personality_snapshot': personality_snapshot,
                'track_duration_ms': song_data.get('duration_ms'),
                'created_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('music_interactions').insert(interaction_data).execute()
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error storing music interaction: {e}")
            return False
    
    async def store_music_recommendation(
        self,
        song_data: Dict[str, Any],
        rl_score: float,
        personality_match_score: float
    ) -> Optional[str]:
        """Store music recommendation with RL scores."""
        try:
            rec_data = {
                'user_id': self.user_id,
                'spotify_track_id': song_data.get('id'),
                'track_name': song_data.get('name'),
                'artists': song_data.get('artists', []),
                'album_name': song_data.get('album'),
                'preview_url': song_data.get('preview_url'),
                'spotify_url': song_data.get('external_url'),
                'genz_genre': song_data.get('genz_genre'),
                'spotify_genres': song_data.get('spotify_genres', []),
                'energy': song_data.get('energy'),
                'valence': song_data.get('valence'),
                'danceability': song_data.get('danceability'),
                'acousticness': song_data.get('acousticness'),
                'instrumentalness': song_data.get('instrumentalness'),
                'tempo': song_data.get('tempo'),
                'duration_ms': song_data.get('duration_ms'),
                'popularity': song_data.get('popularity'),
                'rl_score': rl_score,
                'personality_match_score': personality_match_score,
                'recommended_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('music_recommendations').insert(rec_data).execute()
            if result.data:
                return result.data[0]['id']
            return None
            
        except Exception as e:
            logger.error(f"Error storing music recommendation: {e}")
            return None
    
    async def update_genre_preferences(
        self,
        genre_performance: Dict[str, Dict[str, Any]]
    ) -> bool:
        """Update learned genre preferences."""
        try:
            for genre, stats in genre_performance.items():
                pref_data = {
                    'user_id': self.user_id,
                    'genz_genre': genre,
                    'preference_score': min(100, max(0, (stats['avg_reward'] + 1) * 50)),  # Convert -1,1 to 0,100
                    'interaction_count': stats['count'],
                    'total_reward': stats['total_reward'],
                    'average_reward': stats['avg_reward'],
                    'learned_from': 'rl_learning',
                    'last_updated': datetime.utcnow().isoformat()
                }
                
                # Upsert genre preference
                result = self.supabase.table('music_genre_preferences').upsert(
                    pref_data, 
                    on_conflict='user_id,genz_genre'
                ).execute()
                
            return True
            
        except Exception as e:
            logger.error(f"Error updating genre preferences: {e}")
            return False
    
    async def store_rl_model_snapshot(
        self,
        q_table: Dict[str, float],
        training_episodes: int,
        total_reward: float,
        epsilon: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Store RL model snapshot for versioning."""
        try:
            model_data = {
                'user_id': self.user_id,
                'model_type': 'q_learning',
                'q_table': q_table,
                'training_episodes': training_episodes,
                'total_reward': total_reward,
                'average_reward': total_reward / max(1, training_episodes),
                'epsilon': epsilon,
                'model_version': f"v{training_episodes}",
                'metadata': metadata or {},
                'created_at': datetime.utcnow().isoformat(),
                'is_active': True
            }
            
            # Deactivate previous models
            self.supabase.table('music_rl_models').update({
                'is_active': False
            }).eq('user_id', self.user_id).execute()
            
            # Insert new model
            result = self.supabase.table('music_rl_models').insert(model_data).execute()
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error storing RL model snapshot: {e}")
            return False
    
    async def load_rl_model_snapshot(self) -> Optional[Dict[str, Any]]:
        """Load latest RL model snapshot."""
        try:
            result = self.supabase.table('music_rl_models').select('*').eq(
                'user_id', self.user_id
            ).eq(
                'is_active', True
            ).order('created_at', desc=True).limit(1).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error loading RL model snapshot: {e}")
            return None