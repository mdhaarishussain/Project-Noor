"""
Spotify Personality-Based Music Recommendation Scoring Engine.
Implements the weighted scoring algorithm per spec:
- history_similarity: 0.4
- personality_match: 0.4
- diversity_bonus: 0.1
- novelty_factor: 0.1

Integrates RL scores as an additional component for continuous improvement.
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from sklearn.metrics.pairwise import cosine_similarity

from core.database.models import PersonalityTrait

logger = logging.getLogger("bondhu.recommendation_scoring")


class RecommendationScorer:
    """
    Advanced recommendation scoring engine implementing spec-compliant
    weighted scoring with history similarity, personality matching,
    diversity, novelty, and RL integration.
    """
    
    # Scoring weights per spec
    WEIGHTS = {
        'history_similarity': 0.4,
        'personality_match': 0.4,
        'diversity_bonus': 0.1,
        'novelty_factor': 0.1
    }
    
    # Personality-to-audio feature mappings per spec
    TRAIT_AUDIO_MAPPING = {
        PersonalityTrait.OPENNESS: {
            'target_valence': 0.5,
            'target_acousticness': 0.6,
            'genres': ['classical', 'folk', 'world', 'jazz', 'experimental'],
            'negative_genres': ['mainstream pop'],
            'weight': 0.25
        },
        PersonalityTrait.CONSCIENTIOUSNESS: {
            'target_energy': 0.4,
            'target_tempo': 100,
            'negative_genres': ['rock', 'metal', 'punk'],
            'weight': 0.15
        },
        PersonalityTrait.EXTRAVERSION: {
            'target_energy': 0.75,
            'target_danceability': 0.7,
            'target_valence': 0.8,
            'genres': ['pop', 'dance', 'hip-hop', 'electronic'],
            'weight': 0.25
        },
        PersonalityTrait.AGREEABLENESS: {
            'genres': ['jazz', 'country', 'soul', 'r&b'],
            'negative_genres': ['death-metal', 'hardcore'],
            'weight': 0.15
        },
        PersonalityTrait.NEUROTICISM: {
            'target_valence': 0.7,
            'genres': ['soul', 'pop', 'indie'],
            'negative_genres': ['metal', 'hard rock'],
            'weight': 0.20
        }
    }
    
    # Audio features for vector similarity
    AUDIO_FEATURES = [
        'danceability', 'energy', 'valence', 'tempo', 
        'acousticness', 'instrumentalness', 'speechiness'
    ]
    
    def __init__(self):
        """Initialize recommendation scorer."""
        logger.info("RecommendationScorer initialized with spec-compliant weights")
    
    def normalize_tempo(self, tempo: float) -> float:
        """Normalize tempo to 0-1 scale (40-200 BPM range)."""
        return np.clip((tempo - 40) / 160, 0, 1)
    
    def extract_audio_vector(self, track: Dict[str, Any]) -> np.ndarray:
        """
        Extract audio feature vector from track for similarity calculations.
        
        Args:
            track: Track dict with audio features
            
        Returns:
            Normalized feature vector
        """
        features = []
        for feature_name in self.AUDIO_FEATURES:
            value = track.get(feature_name, 0.5)
            
            # Normalize tempo specially
            if feature_name == 'tempo':
                value = self.normalize_tempo(value if value else 120)
            
            # Ensure value is in [0, 1]
            features.append(np.clip(float(value) if value is not None else 0.5, 0, 1))
        
        return np.array(features)
    
    def calculate_history_similarity(
        self, 
        candidate_track: Dict[str, Any], 
        listening_history: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate similarity between candidate track and user's listening history.
        Uses cosine similarity on audio feature vectors.
        
        Args:
            candidate_track: Candidate track with audio features
            listening_history: User's top 50 listening history
            
        Returns:
            Similarity score [0, 1]
        """
        if not listening_history:
            return 0.5  # Neutral score if no history
        
        try:
            # Extract candidate vector
            candidate_vector = self.extract_audio_vector(candidate_track).reshape(1, -1)
            
            # Extract history vectors
            history_vectors = np.array([
                self.extract_audio_vector(track) 
                for track in listening_history
            ])
            
            # Calculate cosine similarity with all history tracks
            similarities = cosine_similarity(candidate_vector, history_vectors)[0]
            
            # Use weighted average (recent tracks weighted more)
            weights = np.linspace(1.0, 0.5, len(similarities))  # Decay weights
            weighted_sim = np.average(similarities, weights=weights)
            
            # Normalize to [0, 1]
            return float(np.clip(weighted_sim, 0, 1))
            
        except Exception as e:
            logger.error(f"Error calculating history similarity: {e}")
            return 0.5
    
    def calculate_personality_match(
        self, 
        candidate_track: Dict[str, Any], 
        personality_profile: Dict[PersonalityTrait, float]
    ) -> float:
        """
        Calculate how well track matches user's personality profile.
        Uses trait-audio mapping per spec.
        
        Args:
            candidate_track: Candidate track with audio features
            personality_profile: User's Big Five scores (0-1 scale)
            
        Returns:
            Personality match score [0, 1]
        """
        try:
            total_score = 0.0
            total_weight = 0.0
            
            for trait, trait_value in personality_profile.items():
                if trait not in self.TRAIT_AUDIO_MAPPING:
                    continue
                
                mapping = self.TRAIT_AUDIO_MAPPING[trait]
                trait_weight = mapping['weight']
                trait_score = 0.0
                score_components = 0
                
                # Target audio features
                for target_feature in ['target_valence', 'target_energy', 'target_danceability', 'target_acousticness', 'target_tempo']:
                    if target_feature in mapping:
                        feature_name = target_feature.replace('target_', '')
                        target_value = mapping[target_feature]
                        
                        actual_value = candidate_track.get(feature_name, 0.5)
                        if feature_name == 'tempo':
                            actual_value = self.normalize_tempo(actual_value if actual_value else 120)
                        
                        # Distance from target (closer is better)
                        distance = abs(float(actual_value) - target_value)
                        component_score = 1.0 - distance
                        
                        # Weight by trait value
                        trait_score += component_score * trait_value
                        score_components += 1
                
                # Genre matching
                if 'genres' in mapping:
                    track_genres = candidate_track.get('genres', [])
                    if isinstance(track_genres, list):
                        genre_match = any(
                            preferred_genre in ' '.join(track_genres).lower()
                            for preferred_genre in mapping['genres']
                        )
                        if genre_match:
                            trait_score += trait_value * 0.5
                            score_components += 1
                
                # Negative genre penalty
                if 'negative_genres' in mapping:
                    track_genres = candidate_track.get('genres', [])
                    if isinstance(track_genres, list):
                        genre_mismatch = any(
                            neg_genre in ' '.join(track_genres).lower()
                            for neg_genre in mapping['negative_genres']
                        )
                        if genre_mismatch:
                            trait_score -= trait_value * 0.3
                
                # Average trait score
                if score_components > 0:
                    trait_score /= score_components
                
                total_score += trait_score * trait_weight
                total_weight += trait_weight
            
            # Normalize
            if total_weight > 0:
                final_score = total_score / total_weight
            else:
                final_score = 0.5
            
            return float(np.clip(final_score, 0, 1))
            
        except Exception as e:
            logger.error(f"Error calculating personality match: {e}")
            return 0.5
    
    def calculate_diversity_bonus(
        self, 
        candidate_track: Dict[str, Any], 
        current_recommendations: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate diversity bonus for adding variety to recommendations.
        Penalizes similar tracks already in recommendation set.
        
        Args:
            candidate_track: Candidate track
            current_recommendations: Already selected recommendations
            
        Returns:
            Diversity score [0, 1]
        """
        if not current_recommendations:
            return 1.0  # Max diversity for first track
        
        try:
            candidate_vector = self.extract_audio_vector(candidate_track).reshape(1, -1)
            
            # Calculate similarity to existing recommendations
            existing_vectors = np.array([
                self.extract_audio_vector(track) 
                for track in current_recommendations
            ])
            
            similarities = cosine_similarity(candidate_vector, existing_vectors)[0]
            
            # Diversity = inverse of average similarity
            avg_similarity = np.mean(similarities)
            diversity_score = 1.0 - avg_similarity
            
            # Bonus for different artists
            candidate_artist = candidate_track.get('artist_name', '').lower()
            existing_artists = {track.get('artist_name', '').lower() for track in current_recommendations}
            
            if candidate_artist not in existing_artists:
                diversity_score += 0.2
            
            return float(np.clip(diversity_score, 0, 1))
            
        except Exception as e:
            logger.error(f"Error calculating diversity: {e}")
            return 0.5
    
    def calculate_novelty_factor(
        self, 
        candidate_track: Dict[str, Any], 
        listening_history: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate novelty factor (discovery bonus).
        Higher score for tracks that are different from listening history.
        
        Args:
            candidate_track: Candidate track
            listening_history: User's listening history
            
        Returns:
            Novelty score [0, 1]
        """
        if not listening_history:
            return 0.8  # High novelty if no history
        
        try:
            # Check if track is in history
            candidate_id = candidate_track.get('track_id', '') or candidate_track.get('id', '')
            history_ids = {track.get('track_id', '') or track.get('id', '') for track in listening_history}
            
            if candidate_id in history_ids:
                return 0.2  # Low novelty for already heard track
            
            # Check if artist is new
            candidate_artist = candidate_track.get('artist_name', '').lower()
            history_artists = {track.get('artist_name', '').lower() for track in listening_history}
            
            if candidate_artist not in history_artists:
                novelty = 0.9  # High novelty for new artist
            else:
                novelty = 0.6  # Medium novelty for known artist, new track
            
            # Popularity penalty (less popular = more novel)
            popularity = candidate_track.get('popularity', 50)
            if popularity:
                popularity_factor = 1.0 - (popularity / 100) * 0.3  # Max 30% penalty
                novelty *= popularity_factor
            
            return float(np.clip(novelty, 0, 1))
            
        except Exception as e:
            logger.error(f"Error calculating novelty: {e}")
            return 0.5
    
    def calculate_composite_score(
        self,
        candidate_track: Dict[str, Any],
        listening_history: List[Dict[str, Any]],
        personality_profile: Dict[PersonalityTrait, float],
        current_recommendations: List[Dict[str, Any]],
        rl_score: Optional[float] = None
    ) -> Dict[str, float]:
        """
        Calculate composite recommendation score using all components.
        
        Args:
            candidate_track: Candidate track to score
            listening_history: User's top 50 listening history
            personality_profile: User's Big Five personality scores
            current_recommendations: Already selected recommendations
            rl_score: Optional RL score to integrate
            
        Returns:
            Dict with component scores and final weighted score
        """
        # Calculate all components
        history_sim = self.calculate_history_similarity(candidate_track, listening_history)
        personality_match = self.calculate_personality_match(candidate_track, personality_profile)
        diversity = self.calculate_diversity_bonus(candidate_track, current_recommendations)
        novelty = self.calculate_novelty_factor(candidate_track, listening_history)
        
        # Weighted sum per spec
        weighted_score = (
            self.WEIGHTS['history_similarity'] * history_sim +
            self.WEIGHTS['personality_match'] * personality_match +
            self.WEIGHTS['diversity_bonus'] * diversity +
            self.WEIGHTS['novelty_factor'] * novelty
        )
        
        # Integrate RL score if available (10% boost/penalty)
        if rl_score is not None:
            rl_adjustment = (rl_score - 0.5) * 0.1  # Scale RL to ±0.05
            weighted_score += rl_adjustment
            weighted_score = np.clip(weighted_score, 0, 1)
        
        return {
            'final_score': float(weighted_score),
            'history_similarity': float(history_sim),
            'personality_match': float(personality_match),
            'diversity_bonus': float(diversity),
            'novelty_factor': float(novelty),
            'rl_score': float(rl_score) if rl_score is not None else None,
            'rl_adjusted': rl_score is not None
        }
    
    def rank_candidates(
        self,
        candidate_tracks: List[Dict[str, Any]],
        listening_history: List[Dict[str, Any]],
        personality_profile: Dict[PersonalityTrait, float],
        max_results: int = 50,
        use_rl_scores: bool = True
    ) -> List[Tuple[Dict[str, Any], Dict[str, float]]]:
        """
        Rank candidate tracks and return top N recommendations.
        
        Args:
            candidate_tracks: List of 200-500 candidate tracks
            listening_history: User's top 50 listening history
            personality_profile: User's Big Five scores
            max_results: Number of final recommendations (spec: 50)
            use_rl_scores: Whether to integrate RL scores
            
        Returns:
            List of (track, scores_dict) tuples, sorted by score
        """
        scored_tracks = []
        current_recommendations = []
        
        for candidate in candidate_tracks:
            # Get RL score if available and enabled
            rl_score = candidate.get('rl_score') if use_rl_scores else None
            
            # Calculate composite score
            scores = self.calculate_composite_score(
                candidate,
                listening_history,
                personality_profile,
                current_recommendations,
                rl_score
            )
            
            scored_tracks.append((candidate, scores))
            
            # Add to current recommendations for diversity calculation
            if len(current_recommendations) < max_results:
                current_recommendations.append(candidate)
        
        # Sort by final score
        scored_tracks.sort(key=lambda x: x[1]['final_score'], reverse=True)
        
        # Return top N
        return scored_tracks[:max_results]


# Global scorer instance
recommendation_scorer = RecommendationScorer()
