"""
Comprehensive Music Recommendation Service.
Ties together all components per spec:
- Fetches top 50 listening history
- Gets personality profile
- Generates 200-500 candidates
- Scores with weighted algorithm
- Caches with 24h TTL
- Returns top 50 recommendations
"""

import asyncio
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

from core.database.supabase_client import get_supabase_client
from core.database.models import PersonalityTrait
from core.services.listening_history_service import listening_history_service
from core.services.recommendation_scorer import recommendation_scorer
from core.services.redis_cache import recommendations_cache, RECOMMENDATIONS_TTL
from agents.music.music_agent import MusicIntelligenceAgent

logger = logging.getLogger("bondhu.music_recommendation_service")


class MusicRecommendationService:
    """
    Complete music recommendation service per spec.
    Handles candidate generation, scoring, caching, and recommendation delivery.
    """
    
    def __init__(self):
        """Initialize music recommendation service."""
        self.supabase = get_supabase_client()
        logger.info("MusicRecommendationService initialized")
    
    async def get_personality_profile(self, user_id: str) -> Dict[PersonalityTrait, float]:
        """
        Get user's personality profile from database.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict mapping PersonalityTrait to score (0-1 scale)
        """
        try:
            result = self.supabase.supabase.rpc(
                'get_active_personality_profile',
                {'p_user_id': user_id}
            ).execute()
            
            if result.data and len(result.data) > 0:
                profile_data = result.data[0]
                
                # Convert from 0-100 to 0-1 scale
                return {
                    PersonalityTrait.OPENNESS: profile_data['openness'] / 100.0,
                    PersonalityTrait.CONSCIENTIOUSNESS: profile_data['conscientiousness'] / 100.0,
                    PersonalityTrait.EXTRAVERSION: profile_data['extraversion'] / 100.0,
                    PersonalityTrait.AGREEABLENESS: profile_data['agreeableness'] / 100.0,
                    PersonalityTrait.NEUROTICISM: profile_data['neuroticism'] / 100.0
                }
            
            # Default balanced profile if none found
            logger.warning(f"No personality profile found for user {user_id}, using defaults")
            return {
                PersonalityTrait.OPENNESS: 0.5,
                PersonalityTrait.CONSCIENTIOUSNESS: 0.5,
                PersonalityTrait.EXTRAVERSION: 0.5,
                PersonalityTrait.AGREEABLENESS: 0.5,
                PersonalityTrait.NEUROTICISM: 0.5
            }
            
        except Exception as e:
            logger.error(f"Error getting personality profile: {e}")
            return {trait: 0.5 for trait in PersonalityTrait}
    
    async def generate_candidates(
        self,
        user_id: str,
        spotify_token: Optional[str],
        personality_profile: Dict[PersonalityTrait, float],
        listening_history: List[Dict[str, Any]],
        target_count: int = 300
    ) -> List[Dict[str, Any]]:
        """
        Generate 200-500 candidate tracks from various sources.
        
        Args:
            user_id: User ID
            spotify_token: Spotify OAuth token (optional)
            personality_profile: User's personality scores
            listening_history: User's top 50 tracks
            target_count: Target number of candidates (spec: 200-500)
            
        Returns:
            List of candidate tracks with audio features
        """
        candidates = []
        
        try:
            # Get cold start stage and weights
            cold_start_weights = listening_history_service.get_recommendation_weights(user_id)
            stage = cold_start_weights.get('stage', 'month_2_plus')
            
            logger.info(f"Generating {target_count} candidates for user {user_id} (stage: {stage})")
            
            if spotify_token:
                # Initialize music agent
                agent = MusicIntelligenceAgent(user_id=user_id, spotify_token=spotify_token)
                
                # Source 1: Spotify recommendations based on top tracks (if available)
                if listening_history and stage != 'week_1':
                    seed_tracks = [track['track_id'] for track in listening_history[:5]]
                    try:
                        spotify_recs = await agent._get_spotify_recommendations(
                            seed_tracks=seed_tracks,
                            limit=min(100, target_count // 3)
                        )
                        candidates.extend(spotify_recs)
                    except Exception as e:
                        logger.warning(f"Failed to get Spotify recommendations: {e}")
                
                # Source 2: Genre-based recommendations
                try:
                    # Get user's preferred genres
                    top_genres = await agent._get_top_genres(listening_history)
                    
                    for genre in top_genres[:3]:
                        genre_recs = await agent.get_recommendations_by_genre(
                            personality_profile=personality_profile,
                            genres=[genre],
                            songs_per_genre=min(50, target_count // 6)
                        )
                        # get_recommendations_by_genre returns a dict, extract the list
                        if genre in genre_recs:
                            candidates.extend(genre_recs[genre])
                except Exception as e:
                    logger.warning(f"Failed to get genre recommendations: {e}")
                
                # Source 3: Discovery (new releases, trending)
                try:
                    new_releases = await agent._get_new_releases(limit=50)
                    candidates.extend(new_releases)
                except Exception as e:
                    logger.warning(f"Failed to get new releases: {e}")
            
            # Source 4: Popular tracks for cold start
            if stage == 'week_1' or len(candidates) < target_count // 2:
                popular_tracks = await listening_history_service.get_popular_tracks_for_cold_start(
                    limit=min(100, target_count - len(candidates))
                )
                candidates.extend(popular_tracks)
            
            # Deduplicate by track_id
            seen_ids = set()
            unique_candidates = []
            
            for candidate in candidates:
                track_id = candidate.get('track_id') or candidate.get('id')
                if track_id and track_id not in seen_ids:
                    seen_ids.add(track_id)
                    unique_candidates.append(candidate)
            
            logger.info(f"Generated {len(unique_candidates)} unique candidates for user {user_id}")
            
            # Ensure we have minimum candidates
            if len(unique_candidates) < 200:
                logger.warning(f"Only {len(unique_candidates)} candidates generated (target: 200-500)")
            
            return unique_candidates
            
        except Exception as e:
            logger.error(f"Error generating candidates: {e}")
            return []
    
    async def generate_recommendations(
        self,
        user_id: str,
        spotify_token: Optional[str] = None,
        force_refresh: bool = False,
        max_results: int = 50
    ) -> Dict[str, Any]:
        """
        Generate comprehensive music recommendations per spec.
        
        Process:
        1. Check cache (24h TTL)
        2. Fetch listening history (top 50)
        3. Get personality profile
        4. Generate 200-500 candidates
        5. Score with weighted algorithm
        6. Return top 50, cache result
        
        Args:
            user_id: User ID
            spotify_token: Spotify OAuth token
            force_refresh: Skip cache
            max_results: Number of recommendations (spec: 50)
            
        Returns:
            Dict with recommendations and metadata
        """
        start_time = time.time()
        
        try:
            # Step 1: Check cache (unless force refresh)
            if not force_refresh:
                cached = recommendations_cache.get(f'recommendations_{user_id}', user_id=user_id)
                if cached:
                    logger.info(f"Returning cached recommendations for user {user_id}")
                    cached['from_cache'] = True
                    cached['response_time_ms'] = int((time.time() - start_time) * 1000)
                    return cached
            
            # Step 2: Fetch listening history
            listening_history = []
            if spotify_token:
                # Refresh from Spotify
                await listening_history_service.refresh_listening_history(user_id, spotify_token)
            
            # Get from database
            listening_history = await listening_history_service.get_user_top_50_tracks(user_id)
            
            # Step 3: Get personality profile
            personality_profile = await self.get_personality_profile(user_id)
            
            # Step 4: Generate candidates (200-500)
            candidates = await self.generate_candidates(
                user_id,
                spotify_token,
                personality_profile,
                listening_history,
                target_count=300
            )
            
            if not candidates:
                logger.warning(f"No candidates generated for user {user_id}")
                return {
                    'success': False,
                    'error': 'No candidates available',
                    'recommendations': [],
                    'total_count': 0
                }
            
            # Step 5: Score and rank candidates
            scored_recommendations = recommendation_scorer.rank_candidates(
                candidates,
                listening_history,
                personality_profile,
                max_results=max_results,
                use_rl_scores=True
            )
            
            # Extract recommendations with scores
            recommendations = []
            for track, scores in scored_recommendations:
                recommendations.append({
                    **track,
                    'recommendation_scores': scores
                })
            
            # Get cold start info
            cold_start_weights = listening_history_service.get_recommendation_weights(user_id)
            
            # Build response
            response_time_ms = int((time.time() - start_time) * 1000)
            
            result = {
                'success': True,
                'recommendations': recommendations,
                'total_count': len(recommendations),
                'metadata': {
                    'total_candidates': len(candidates),
                    'final_count': len(recommendations),
                    'cold_start_stage': cold_start_weights.get('stage'),
                    'account_age_days': cold_start_weights.get('account_age_days'),
                    'listening_history_size': len(listening_history),
                    'has_spotify_token': spotify_token is not None,
                    'generated_at': datetime.utcnow().isoformat(),
                    'response_time_ms': response_time_ms,
                    'scoring_weights': recommendation_scorer.WEIGHTS,
                    'cold_start_weights': cold_start_weights
                },
                'personality_profile': {trait.value: score for trait, score in personality_profile.items()},
                'from_cache': False
            }
            
            # Step 6: Cache result (24h TTL)
            recommendations_cache.set(
                f'recommendations_{user_id}',
                result,
                ttl=RECOMMENDATIONS_TTL,
                user_id=user_id
            )
            
            # Store in recommendations_cache table
            try:
                cache_data = {
                    'user_id': user_id,
                    'recommended_tracks_json': recommendations,
                    'scores_json': {
                        'avg_history_similarity': sum(r['recommendation_scores']['history_similarity'] for r in recommendations) / len(recommendations),
                        'avg_personality_match': sum(r['recommendation_scores']['personality_match'] for r in recommendations) / len(recommendations),
                        'avg_diversity_score': sum(r['recommendation_scores']['diversity_bonus'] for r in recommendations) / len(recommendations),
                        'avg_novelty_score': sum(r['recommendation_scores']['novelty_factor'] for r in recommendations) / len(recommendations)
                    },
                    'recommendation_type': 'standard' if cold_start_weights.get('stage') == 'month_2_plus' else 'cold_start',
                    'total_candidates': len(candidates),
                    'final_count': len(recommendations),
                    'generated_at': datetime.utcnow().isoformat(),
                    'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
                    'user_account_age_days': cold_start_weights.get('account_age_days'),
                    'personality_snapshot': {trait.value: score for trait, score in personality_profile.items()},
                    'listening_history_size': len(listening_history)
                }
                
                self.supabase.supabase.table('recommendations_cache').insert(cache_data).execute()
            except Exception as cache_error:
                logger.warning(f"Failed to store in recommendations_cache table: {cache_error}")
            
            logger.info(f"Generated {len(recommendations)} recommendations for user {user_id} in {response_time_ms}ms")
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return {
                'success': False,
                'error': str(e),
                'recommendations': [],
                'total_count': 0,
                'response_time_ms': int((time.time() - start_time) * 1000)
            }


# Global service instance
music_recommendation_service = MusicRecommendationService()
