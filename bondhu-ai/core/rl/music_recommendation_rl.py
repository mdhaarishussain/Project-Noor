"""
Reinforcement Learning system for music recommendation feedback processing.
Implements Q-learning for improving music suggestions based on user interactions.
"""

import numpy as np
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque
import asyncio

from core.database.models import PersonalityTrait
from core.rl.rl_storage import RLSupabaseStorage


class MusicRecommendationRL:
    """
    Reinforcement Learning system for music recommendations.
    Uses Q-learning to improve suggestions based on user feedback.
    """
    
    def __init__(self, user_id: str, learning_rate: float = 0.1, 
                 discount_factor: float = 0.95, epsilon: float = 0.1):
        """
        Initialize RL system for music recommendations.
        
        Args:
            user_id: User identifier
            learning_rate: Learning rate for Q-learning
            discount_factor: Discount factor for future rewards
            epsilon: Exploration rate for epsilon-greedy policy
        """
        self.user_id = user_id
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon
        
        self.logger = logging.getLogger("bondhu.music_rl")
        
        # Q-table for state-action values
        # State: (personality_profile, music_features, genre)
        # Action: (recommend, not_recommend)
        self.q_table = {}
        
        # Experience replay buffer
        self.experience_buffer = deque(maxlen=10000)
        
        # Reward mapping for music interactions
        self.reward_map = {
            'like': 1.0,
            'dislike': -1.0,
            'play': 0.8,          # User clicked play on Spotify
            'skip': -0.4,
            'save': 1.5,          # User saved to their library
            'add_to_playlist': 1.8,
            'repeat': 1.2,        # User replayed the track
            'share': 1.3
        }
        
        # Feature extractors
        self.personality_features = [trait.value for trait in PersonalityTrait]
        self.music_features = [
            'energy', 'valence', 'danceability', 'acousticness',
            'instrumentalness', 'tempo_normalized', 'genre_match',
            'popularity_normalized'
        ]
        
        # Training statistics
        self.training_episodes = 0
        self.total_reward = 0.0
        self.last_update = datetime.now()
        
        # Genre-specific learning
        self.genre_performance = {}  # Track performance per genre
        
        # Supabase storage for persistence
        self.storage = RLSupabaseStorage(user_id)

    async def process_feedback(self, music_data: Dict[str, Any], 
                             personality_profile: Dict[PersonalityTrait, float],
                             feedback_type: str, 
                             additional_data: Optional[Dict[str, Any]] = None) -> float:
        """
        Process user feedback and update Q-values.
        
        Args:
            music_data: Music metadata and features
            personality_profile: User's personality scores
            feedback_type: Type of feedback ('like', 'dislike', 'play', etc.)
            additional_data: Additional feedback context
            
        Returns:
            Updated Q-value for the state-action pair
        """
        try:
            # Extract state features
            state = self._extract_state_features(music_data, personality_profile)
            
            # Calculate reward
            reward = self._calculate_reward(feedback_type, additional_data)
            
            # Update Q-value
            updated_q_value = await self._update_q_value(state, reward)
            
            # Update genre-specific performance
            genre = music_data.get('genre', 'unknown')
            self._update_genre_performance(genre, reward)
            
            # Store experience for replay learning
            experience = {
                'state': state,
                'action': 'recommend',
                'reward': reward,
                'next_state': None,
                'timestamp': datetime.now(),
                'feedback_type': feedback_type,
                'genre': genre
            }
            
            # Store interaction in Supabase
            track_id = music_data.get('id', music_data.get('track_id', ''))
            await self.storage.store_music_interaction(
                track_id=track_id,
                action=feedback_type,
                reward=reward,
                confidence=1.0,
                track_features=music_data
            )
            
            self.experience_buffer.append(experience)
            
            # Update training statistics
            self.total_reward += reward
            self.training_episodes += 1
            
            # Periodic batch learning
            if len(self.experience_buffer) >= 32 and self.training_episodes % 10 == 0:
                await self._batch_learning()
            
            self.logger.info(f"Processed {feedback_type} feedback for {genre} with reward {reward:.2f}")
            return updated_q_value
            
        except Exception as e:
            self.logger.error(f"Error processing music feedback: {e}")
            return 0.0

    async def get_recommendation_scores(self, candidate_songs: List[Dict[str, Any]],
                                     personality_profile: Dict[PersonalityTrait, float],
                                     genre: Optional[str] = None) -> List[Tuple[Dict[str, Any], float]]:
        """
        Get RL-enhanced recommendation scores for candidate songs.
        
        Args:
            candidate_songs: List of candidate songs
            personality_profile: User's personality profile
            genre: Optional genre filter
            
        Returns:
            List of (song, rl_score) tuples sorted by score
        """
        try:
            scored_songs = []
            
            for song in candidate_songs:
                # Skip if genre filter doesn't match
                if genre and song.get('genre') != genre:
                    continue
                
                # Extract state features
                state = self._extract_state_features(song, personality_profile)
                
                # Get Q-value for recommending this song
                q_value = self._get_q_value(state, 'recommend')
                
                # Apply genre-specific performance bonus
                song_genre = song.get('genre', 'unknown')
                genre_bonus = self._get_genre_bonus(song_genre)
                
                # Apply epsilon-greedy exploration
                if np.random.random() < self.epsilon:
                    # Exploration: add some randomness
                    exploration_bonus = np.random.uniform(-0.1, 0.1)
                    rl_score = q_value + genre_bonus + exploration_bonus
                else:
                    # Exploitation: use learned values
                    rl_score = q_value + genre_bonus
                
                scored_songs.append((song, rl_score))
            
            # Sort by RL score
            scored_songs.sort(key=lambda x: x[1], reverse=True)
            
            return scored_songs
            
        except Exception as e:
            self.logger.error(f"Error getting music recommendation scores: {e}")
            return [(song, 0.0) for song in candidate_songs]

    def _extract_state_features(self, music_data: Dict[str, Any], 
                               personality_profile: Dict[PersonalityTrait, float]) -> str:
        """Extract state features for Q-learning."""
        try:
            # Personality features (discretized)
            personality_state = []
            for trait in PersonalityTrait:
                score = personality_profile.get(trait, 0.5)
                # Discretize into low, medium, high
                if score < 0.33:
                    personality_state.append(f"{trait.value}_low")
                elif score < 0.67:
                    personality_state.append(f"{trait.value}_med")
                else:
                    personality_state.append(f"{trait.value}_high")
            
            # Music features (discretized)
            music_state = []
            
            # Energy
            energy = music_data.get('energy', 0.5)
            if energy < 0.33:
                music_state.append("energy_low")
            elif energy < 0.67:
                music_state.append("energy_med")
            else:
                music_state.append("energy_high")
            
            # Valence (happiness)
            valence = music_data.get('valence', 0.5)
            if valence < 0.33:
                music_state.append("valence_low")
            elif valence < 0.67:
                music_state.append("valence_med")
            else:
                music_state.append("valence_high")
            
            # Danceability
            danceability = music_data.get('danceability', 0.5)
            if danceability < 0.33:
                music_state.append("dance_low")
            elif danceability < 0.67:
                music_state.append("dance_med")
            else:
                music_state.append("dance_high")
            
            # Tempo
            tempo = music_data.get('tempo', 120)
            if tempo < 90:
                music_state.append("tempo_slow")
            elif tempo < 140:
                music_state.append("tempo_medium")
            else:
                music_state.append("tempo_fast")
            
            # Genre
            genre = music_data.get('genre', 'unknown')
            music_state.append(f"genre_{genre.replace(' ', '_').lower()}")
            
            # Combine into state string
            state_features = personality_state + music_state
            state = "|".join(sorted(state_features))
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error extracting music state features: {e}")
            return "unknown_state"

    def _calculate_reward(self, feedback_type: str, 
                         additional_data: Optional[Dict[str, Any]] = None) -> float:
        """Calculate reward based on feedback type and additional context."""
        base_reward = self.reward_map.get(feedback_type, 0.0)
        
        # Apply modifiers based on additional data
        if additional_data:
            # Listen duration bonus/penalty
            if 'listen_duration' in additional_data and 'track_duration' in additional_data:
                listen_ratio = additional_data['listen_duration'] / additional_data['track_duration']
                if listen_ratio > 0.9:
                    base_reward += 0.4  # Bonus for full listen
                elif listen_ratio < 0.2:
                    base_reward -= 0.3  # Penalty for early skip
                elif listen_ratio > 0.5:
                    base_reward += 0.2  # Moderate bonus
            
            # Repeat listening bonus
            if additional_data.get('repeated', False):
                base_reward += 0.3
            
            # Time to action (quick positive feedback is good)
            if 'time_to_action' in additional_data:
                time_to_action = additional_data['time_to_action']
                if time_to_action < 3.0 and feedback_type in ['like', 'play']:
                    base_reward += 0.15
            
            # Context-based modifiers
            if 'listening_context' in additional_data:
                context = additional_data['listening_context']
                if context in ['workout', 'party'] and feedback_type == 'like':
                    base_reward += 0.1  # Genre-context fit bonus
        
        return base_reward

    def _get_q_value(self, state: str, action: str) -> float:
        """Get Q-value for state-action pair."""
        key = f"{state}_{action}"
        return self.q_table.get(key, 0.0)

    def _set_q_value(self, state: str, action: str, value: float) -> None:
        """Set Q-value for state-action pair."""
        key = f"{state}_{action}"
        self.q_table[key] = value

    async def _update_q_value(self, state: str, reward: float) -> float:
        """Update Q-value using Q-learning update rule."""
        try:
            action = 'recommend'
            current_q = self._get_q_value(state, action)
            
            # Q-learning update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
            # Simplified update without next state
            new_q = current_q + self.learning_rate * (reward - current_q)
            
            self._set_q_value(state, action, new_q)
            
            return new_q
            
        except Exception as e:
            self.logger.error(f"Error updating Q-value: {e}")
            return 0.0

    def _update_genre_performance(self, genre: str, reward: float) -> None:
        """Update performance tracking for a genre."""
        if genre not in self.genre_performance:
            self.genre_performance[genre] = {
                'total_reward': 0.0,
                'count': 0,
                'avg_reward': 0.0
            }
        
        self.genre_performance[genre]['total_reward'] += reward
        self.genre_performance[genre]['count'] += 1
        self.genre_performance[genre]['avg_reward'] = (
            self.genre_performance[genre]['total_reward'] / 
            self.genre_performance[genre]['count']
        )

    def _get_genre_bonus(self, genre: str) -> float:
        """Get performance-based bonus for a genre."""
        if genre not in self.genre_performance:
            return 0.0
        
        avg_reward = self.genre_performance[genre]['avg_reward']
        # Scale average reward to a bonus between -0.2 and 0.2
        return max(-0.2, min(0.2, avg_reward * 0.2))

    async def _batch_learning(self) -> None:
        """Perform batch learning from experience replay buffer."""
        try:
            if len(self.experience_buffer) < 16:
                return
            
            # Sample random batch from experience buffer
            batch_size = min(32, len(self.experience_buffer))
            batch_indices = np.random.choice(len(self.experience_buffer), batch_size, replace=False)
            batch = [self.experience_buffer[i] for i in batch_indices]
            
            # Process each experience in batch
            for experience in batch:
                state = experience['state']
                action = experience['action']
                reward = experience['reward']
                
                # Update Q-value
                current_q = self._get_q_value(state, action)
                new_q = current_q + self.learning_rate * (reward - current_q)
                self._set_q_value(state, action, new_q)
            
            # Decay exploration rate
            self.epsilon = max(0.01, self.epsilon * 0.995)
            
            self.logger.info(f"Completed batch learning with {batch_size} experiences")
            
        except Exception as e:
            self.logger.error(f"Error in batch learning: {e}")

    def get_learning_statistics(self) -> Dict[str, Any]:
        """Get learning statistics and metrics."""
        return {
            'training_episodes': self.training_episodes,
            'total_reward': self.total_reward,
            'average_reward': self.total_reward / max(1, self.training_episodes),
            'epsilon': self.epsilon,
            'q_table_size': len(self.q_table),
            'experience_buffer_size': len(self.experience_buffer),
            'last_update': self.last_update.isoformat(),
            'learning_rate': self.learning_rate,
            'discount_factor': self.discount_factor,
            'genre_performance': self.genre_performance
        }

    def get_genre_insights(self) -> Dict[str, Any]:
        """Get insights about genre performance."""
        sorted_genres = sorted(
            self.genre_performance.items(),
            key=lambda x: x[1]['avg_reward'],
            reverse=True
        )
        
        return {
            'best_genres': [
                {'genre': g, 'avg_reward': p['avg_reward'], 'count': p['count']}
                for g, p in sorted_genres[:5]
            ],
            'worst_genres': [
                {'genre': g, 'avg_reward': p['avg_reward'], 'count': p['count']}
                for g, p in sorted_genres[-3:]
            ],
            'total_genres_tracked': len(self.genre_performance)
        }

    async def save_model(self, filepath: str) -> bool:
        """Save Q-table and learning state to file."""
        try:
            import json
            
            model_data = {
                'user_id': self.user_id,
                'q_table': self.q_table,
                'learning_rate': self.learning_rate,
                'discount_factor': self.discount_factor,
                'epsilon': self.epsilon,
                'training_episodes': self.training_episodes,
                'total_reward': self.total_reward,
                'last_update': self.last_update.isoformat(),
                'genre_performance': self.genre_performance
            }
            
            with open(filepath, 'w') as f:
                json.dump(model_data, f, indent=2)
            
            self.logger.info(f"Saved music RL model to {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error saving music model: {e}")
            return False

    async def load_model(self, filepath: str) -> bool:
        """Load Q-table and learning state from file."""
        try:
            import json
            
            with open(filepath, 'r') as f:
                model_data = json.load(f)
            
            self.q_table = model_data.get('q_table', {})
            self.learning_rate = model_data.get('learning_rate', self.learning_rate)
            self.discount_factor = model_data.get('discount_factor', self.discount_factor)
            self.epsilon = model_data.get('epsilon', self.epsilon)
            self.training_episodes = model_data.get('training_episodes', 0)
            self.total_reward = model_data.get('total_reward', 0.0)
            self.genre_performance = model_data.get('genre_performance', {})
            
            last_update_str = model_data.get('last_update')
            if last_update_str:
                self.last_update = datetime.fromisoformat(last_update_str)
            
            self.logger.info(f"Loaded music RL model from {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading music model: {e}")
            return False
