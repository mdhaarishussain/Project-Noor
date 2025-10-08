"""
Music Intelligence Agent for analyzing user music preferences and personality insights.
Integrates with Spotify API to gather listening data and patterns.
Enhanced with rate limiting and caching for production scale (1000+ users).
"""

import asyncio
import spotipy
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone

from agents.base_agent import BaseAgent
from core.config import get_config
from api.models.schemas import DataSource, PersonalityTrait, MusicPreferences
from core.rl.music_recommendation_rl import MusicRecommendationRL
from core.services.rate_limiter import spotify_rate_limiter, spotify_cache, user_data_cache

class MusicIntelligenceAgent(BaseAgent):
    """
    Agent specialized in analyzing music preferences for personality insights.
    Uses Spotify API to gather listening data and correlate with Big Five traits.
    Enhanced with RL-based recommendation system and GenZ-friendly genre categorization.
    """
    
    def __init__(self, user_id: str, spotify_token: Optional[str] = None, **kwargs):
        """
        Initialize Music Intelligence Agent.
        
        Args:
            user_id: User ID for this agent session
            spotify_token: OAuth token for Spotify API access
            **kwargs: Additional arguments passed to BaseAgent
        """
        super().__init__(
            agent_type=DataSource.MUSIC,
            user_id=user_id,
            **kwargs
        )
        
        self.spotify_token = spotify_token
        self.spotify_client = None
        
        # Load existing tokens from database if not provided
        if not self.spotify_token:
            asyncio.create_task(self._load_existing_tokens())
        
        self._initialize_spotify_client()
        
        # Initialize RL system for personalized recommendations
        self.rl_system = MusicRecommendationRL(user_id=user_id)
        
        # GenZ-friendly genre mapping (6 most popular genres)
        self.genz_genre_map = {
            "Lo-fi Chill": ["lo-fi", "chillhop", "study beats", "ambient", "chill"],
            "Pop Anthems": ["pop", "dance pop", "electropop", "synth-pop", "indie pop"],
            "Hype Beats": ["hip hop", "trap", "rap", "drill", "hip-hop"],
            "Indie Vibes": ["indie", "indie rock", "bedroom pop", "alternative", "indie folk"],
            "R&B Feels": ["r&b", "rnb", "neo-soul", "contemporary r&b", "soul"],
            "Sad Boy Hours": ["emo", "sad", "melancholic", "emo rap", "alternative emo"]
        }
        
        # Reverse mapping for quick lookup
        self.spotify_to_genz = {}
        for genz_name, spotify_genres in self.genz_genre_map.items():
            for genre in spotify_genres:
                self.spotify_to_genz[genre.lower()] = genz_name

        # Cache for Spotify available seed genres
        self._seed_genres_cache: Optional[List[str]] = None
        
        # Genre-to-personality mappings based on research
        self.genre_personality_map = {
            # Openness correlations
            "jazz": {"openness": 0.8, "conscientiousness": 0.3},
            "classical": {"openness": 0.7, "conscientiousness": 0.6},
            "experimental": {"openness": 0.9, "neuroticism": 0.4},
            "indie": {"openness": 0.7, "extraversion": -0.2},
            "world": {"openness": 0.8, "agreeableness": 0.5},
            
            # Extraversion correlations
            "pop": {"extraversion": 0.6, "agreeableness": 0.4},
            "dance": {"extraversion": 0.8, "openness": 0.3},
            "hip-hop": {"extraversion": 0.7, "neuroticism": 0.3},
            "electronic": {"extraversion": 0.5, "openness": 0.6},
            
            # Conscientiousness correlations
            "country": {"conscientiousness": 0.6, "agreeableness": 0.5},
            "folk": {"conscientiousness": 0.5, "agreeableness": 0.6},
            
            # Agreeableness correlations
            "r&b": {"agreeableness": 0.6, "extraversion": 0.4},
            "soul": {"agreeableness": 0.7, "openness": 0.5},
            "gospel": {"agreeableness": 0.8, "conscientiousness": 0.6},
            
            # Neuroticism correlations
            "metal": {"neuroticism": 0.6, "openness": 0.4},
            "punk": {"neuroticism": 0.7, "openness": 0.5},
            "emo": {"neuroticism": 0.8, "extraversion": -0.3},
            "blues": {"neuroticism": 0.5, "openness": 0.6}
        }
        
        # Audio features to personality mappings
        self.audio_feature_map = {
            "energy": {"extraversion": 0.6, "neuroticism": 0.3},
            "valence": {"extraversion": 0.5, "neuroticism": -0.7},
            "danceability": {"extraversion": 0.7, "agreeableness": 0.3},
            "acousticness": {"openness": 0.4, "conscientiousness": 0.3},
            "instrumentalness": {"openness": 0.6, "extraversion": -0.4},
            "complexity": {"openness": 0.8, "conscientiousness": 0.4}
        }
    
    def _initialize_spotify_client(self):
        """Initialize Spotify API client."""
        try:
            if self.spotify_token:
                # Use user token (full features)
                self.spotify_client = spotipy.Spotify(auth=self.spotify_token)
                self.logger.info("Spotify client initialized with user token")
            else:
                # Fallback to app-only credentials for non-user queries
                creds = SpotifyClientCredentials(
                    client_id=self.config.spotify.client_id,
                    client_secret=self.config.spotify.client_secret,
                )
                self.spotify_client = spotipy.Spotify(auth_manager=creds)
                self.logger.info("Spotify client initialized with app credentials (no user token)")
        except Exception as e:
            self.logger.warning(f"Failed to initialize Spotify client: {e}")
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the Music Intelligence Agent."""
        return """You are a Music Intelligence Agent specialized in analyzing music preferences for personality insights.

Your capabilities include:
- Analyzing Spotify listening data and patterns
- Correlating music genres with Big Five personality traits
- Interpreting audio features for personality insights
- Understanding listening behavior patterns
- Providing music-based personality assessments

You have access to:
- User's Spotify listening history
- Audio feature analysis (energy, valence, danceability, etc.)
- Genre preferences and distributions
- Listening time patterns and habits
- Artist and track preferences

When analyzing music data, consider:
- Genre diversity indicates openness to experience
- High-energy music often correlates with extraversion
- Complex music (jazz, classical) suggests openness
- Repetitive listening may indicate conscientiousness
- Mood-based listening patterns reflect emotional stability

Provide insights based on established music psychology research while being sensitive to individual differences and cultural contexts."""
    
    async def collect_data(self, force_refresh: bool = False, **kwargs) -> Dict[str, Any]:
        """
        Collect music data from Spotify API.
        
        Args:
            force_refresh: Whether to force refresh of cached data
            **kwargs: Additional arguments
            
        Returns:
            Dictionary containing music data
        """
        if not self.spotify_client:
            self.logger.warning("Spotify client not initialized")
            return {}
        
        try:
            data = {
                "recently_played": await self._get_recently_played(),
                "top_tracks": await self._get_top_tracks(),
                "top_artists": await self._get_top_artists(),
                "audio_features": {},
                "genre_analysis": {},
                "listening_patterns": {},
                "playlist_analysis": await self._analyze_playlists()
            }
            
            # Get audio features for top tracks
            if data["top_tracks"]:
                track_ids = [track["id"] for track in data["top_tracks"][:50]]
                data["audio_features"] = await self._get_audio_features(track_ids)
            
            # Analyze genres
            data["genre_analysis"] = await self._analyze_genres(data["top_artists"])
            
            # Analyze listening patterns
            data["listening_patterns"] = await self._analyze_listening_patterns(data["recently_played"])
            
            self.logger.info(f"Collected music data: {len(data['top_tracks'])} tracks, {len(data['top_artists'])} artists")
            return data
            
        except Exception as e:
            self.logger.error(f"Error collecting music data: {e}")
            return {}
    
    async def _get_recently_played(self) -> List[Dict[str, Any]]:
        """Get recently played tracks with rate limiting and caching."""
        cache_key = f"recently_played_{self.user_id}"
        
        # Check cache first (5 minute TTL for recently played)
        cached_result = spotify_cache.get(cache_key)
        if cached_result is not None:
            self.logger.info("Using cached recently played tracks")
            return cached_result
        
        try:
            # Make rate-limited API call
            results = await spotify_rate_limiter.rate_limited_call(
                "user_data",
                self.spotify_client.current_user_recently_played,
                limit=50
            )
            
            items = results.get("items", []) if results else []
            
            # Cache the result
            spotify_cache.set(cache_key, items, ttl=300)  # 5 minutes
            
            return items
        except Exception as e:
            self.logger.error(f"Error getting recently played: {e}")
            return []
    
    async def _get_top_tracks(self, time_range: str = "medium_term") -> List[Dict[str, Any]]:
        """Get user's top tracks with rate limiting and caching."""
        cache_key = f"top_tracks_{self.user_id}_{time_range}"
        
        # Check long-term cache (30 minutes for top tracks)
        cached_result = user_data_cache.get(cache_key)
        if cached_result is not None:
            self.logger.info(f"Using cached top tracks for {time_range}")
            return cached_result
        
        try:
            # Make rate-limited API call
            results = await spotify_rate_limiter.rate_limited_call(
                "user_data",
                self.spotify_client.current_user_top_tracks,
                limit=50,
                time_range=time_range
            )
            
            items = results.get("items", []) if results else []
            
            # Cache the result with longer TTL (top tracks change less frequently)
            user_data_cache.set(cache_key, items, ttl=1800)  # 30 minutes
            
            return items
        except Exception as e:
            self.logger.error(f"Error getting top tracks: {e}")
            return []
    
    async def _get_top_artists(self, time_range: str = "medium_term") -> List[Dict[str, Any]]:
        """Get user's top artists with rate limiting and caching."""
        cache_key = f"top_artists_{self.user_id}_{time_range}"
        
        # Check long-term cache (30 minutes for top artists)
        cached_result = user_data_cache.get(cache_key)
        if cached_result is not None:
            self.logger.info(f"Using cached top artists for {time_range}")
            return cached_result
        
        try:
            # Make rate-limited API call
            results = await spotify_rate_limiter.rate_limited_call(
                "user_data",
                self.spotify_client.current_user_top_artists,
                limit=50,
                time_range=time_range
            )
            
            items = results.get("items", []) if results else []
            
            # Cache the result with longer TTL
            user_data_cache.set(cache_key, items, ttl=1800)  # 30 minutes
            
            return items
        except Exception as e:
            self.logger.error(f"Error getting top artists: {e}")
            return []
    
    async def _get_audio_features(self, track_ids: List[str], salt: Optional[int] = None) -> Dict[str, Any]:
        """Get audio features for tracks with rate limiting and caching.

        Returns a mapping: { track_id: {energy, valence, danceability, tempo, ...} }
        """
        if not track_ids:
            return {}
        
        # Create cache key based on sorted track IDs
        # Include salt to avoid stale collisions when set
        cache_key = f"audio_features_{hash((tuple(sorted(track_ids)), salt))}"
        
        # Check cache first (longer TTL since audio features don't change)
        cached_result = spotify_cache.get(cache_key)
        if cached_result is not None:
            self.logger.info(f"Using cached audio features for {len(track_ids)} tracks")
            return cached_result
        
        try:
            # Process in batches of 100 (Spotify limit) with rate limiting
            all_features = []
            for i in range(0, len(track_ids), 100):
                batch = track_ids[i:i+100]
                
                # Make rate-limited API call
                features = await spotify_rate_limiter.rate_limited_call(
                    "audio_features",
                    self.spotify_client.audio_features,
                    batch
                )
                
                if features:
                    all_features.extend(features)
            
            if not all_features:
                return {}

            # Build mapping by track id
            feature_map: Dict[str, Dict[str, Any]] = {}
            feature_keys = [
                "energy", "valence", "danceability", "acousticness",
                "instrumentalness", "speechiness", "liveness", "tempo"
            ]
            for f in all_features:
                if not f or not f.get('id'):
                    continue
                feature_map[f['id']] = {k: f.get(k) for k in feature_keys if k in f}

            # Cache the result (longer TTL since audio features don't change)
            spotify_cache.set(cache_key, feature_map, ttl=3600)  # 1 hour

            return feature_map
            
        except Exception as e:
            self.logger.error(f"Error getting audio features: {e}")
            return {}
    
    async def _analyze_genres(self, artists: List[Dict[str, Any]]) -> Dict[str, float]:
        """Analyze genre distribution from artists."""
        genre_counts = {}
        total_genres = 0
        
        for artist in artists:
            for genre in artist.get("genres", []):
                genre_counts[genre] = genre_counts.get(genre, 0) + 1
                total_genres += 1
        
        # Calculate genre percentages
        if total_genres == 0:
            return {}
        
        genre_percentages = {
            genre: count / total_genres 
            for genre, count in genre_counts.items()
        }
        
        return genre_percentages
    
    async def _analyze_listening_patterns(self, recently_played: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze listening patterns and habits."""
        if not recently_played:
            return {}
        
        patterns = {
            "listening_times": [],
            "track_repetition": {},
            "session_lengths": [],
            "diversity_score": 0.0
        }
        
        # Analyze listening times
        for item in recently_played:
            played_at = item.get("played_at")
            if played_at:
                # Extract hour for time pattern analysis
                hour = datetime.fromisoformat(played_at.replace('Z', '+00:00')).hour
                patterns["listening_times"].append(hour)
        
        # Calculate track repetition
        track_ids = [item["track"]["id"] for item in recently_played if "track" in item]
        for track_id in track_ids:
            patterns["track_repetition"][track_id] = patterns["track_repetition"].get(track_id, 0) + 1
        
        # Calculate diversity score (unique tracks / total tracks)
        if track_ids:
            patterns["diversity_score"] = len(set(track_ids)) / len(track_ids)
        
        return patterns
    
    async def _analyze_playlists(self) -> Dict[str, Any]:
        """Analyze user's playlists for additional insights."""
        try:
            playlists = await asyncio.to_thread(
                self.spotify_client.current_user_playlists,
                limit=50
            )
            
            playlist_analysis = {
                "total_playlists": len(playlists.get("items", [])),
                "public_playlists": 0,
                "collaborative_playlists": 0,
                "playlist_names": []
            }
            
            for playlist in playlists.get("items", []):
                if playlist.get("public"):
                    playlist_analysis["public_playlists"] += 1
                if playlist.get("collaborative"):
                    playlist_analysis["collaborative_playlists"] += 1
                playlist_analysis["playlist_names"].append(playlist.get("name", ""))
            
            return playlist_analysis
            
        except Exception as e:
            self.logger.error(f"Error analyzing playlists: {e}")
            return {}
    
    async def analyze_personality(self, data: Dict[str, Any]) -> Dict[PersonalityTrait, float]:
        """
        Analyze personality traits from music data.
        
        Args:
            data: Music data collected from Spotify
            
        Returns:
            Dictionary mapping personality traits to scores (0-100)
        """
        personality_scores = {trait: 50.0 for trait in PersonalityTrait}
        
        if not data:
            return personality_scores
        
        # Analyze based on audio features
        audio_features = data.get("audio_features", {})
        self._apply_audio_feature_analysis(personality_scores, audio_features)
        
        # Analyze based on genres
        genre_analysis = data.get("genre_analysis", {})
        self._apply_genre_analysis(personality_scores, genre_analysis)
        
        # Analyze based on listening patterns
        listening_patterns = data.get("listening_patterns", {})
        self._apply_listening_pattern_analysis(personality_scores, listening_patterns)
        
        # Analyze based on playlist behavior
        playlist_analysis = data.get("playlist_analysis", {})
        self._apply_playlist_analysis(personality_scores, playlist_analysis)
        
        # Normalize scores to 0-100 range
        for trait in personality_scores:
            personality_scores[trait] = max(0, min(100, personality_scores[trait]))
        
        self.logger.info(f"Music personality analysis completed: {personality_scores}")
        return personality_scores
    
    def _apply_audio_feature_analysis(self, scores: Dict[PersonalityTrait, float], features: Dict[str, float]):
        """Apply audio feature analysis to personality scores."""
        for feature, value in features.items():
            if feature in self.audio_feature_map:
                for trait, correlation in self.audio_feature_map[feature].items():
                    trait_enum = PersonalityTrait(trait)
                    # Apply correlation with audio feature value
                    adjustment = correlation * (value - 0.5) * 20  # Scale to ±10 points
                    scores[trait_enum] += adjustment
    
    def _apply_genre_analysis(self, scores: Dict[PersonalityTrait, float], genres: Dict[str, float]):
        """Apply genre analysis to personality scores."""
        for genre, percentage in genres.items():
            # Find closest matching genre in our mapping
            matched_genre = self._find_closest_genre(genre)
            if matched_genre and matched_genre in self.genre_personality_map:
                for trait, correlation in self.genre_personality_map[matched_genre].items():
                    trait_enum = PersonalityTrait(trait)
                    # Apply correlation weighted by genre percentage
                    adjustment = correlation * percentage * 30  # Scale adjustment
                    scores[trait_enum] += adjustment
    
    def _apply_listening_pattern_analysis(self, scores: Dict[PersonalityTrait, float], patterns: Dict[str, Any]):
        """Apply listening pattern analysis to personality scores."""
        # Diversity score affects openness
        diversity = patterns.get("diversity_score", 0.5)
        scores[PersonalityTrait.OPENNESS] += (diversity - 0.5) * 20
        
        # Track repetition affects conscientiousness
        repetition_data = patterns.get("track_repetition", {})
        if repetition_data:
            avg_repetition = sum(repetition_data.values()) / len(repetition_data)
            if avg_repetition > 2:  # High repetition
                scores[PersonalityTrait.CONSCIENTIOUSNESS] += 10
        
        # Listening time patterns affect extraversion
        listening_times = patterns.get("listening_times", [])
        if listening_times:
            evening_listening = sum(1 for hour in listening_times if 18 <= hour <= 23) / len(listening_times)
            if evening_listening > 0.5:  # More evening listening
                scores[PersonalityTrait.EXTRAVERSION] += 5
    
    def _apply_playlist_analysis(self, scores: Dict[PersonalityTrait, float], playlist_data: Dict[str, Any]):
        """Apply playlist analysis to personality scores."""
        total_playlists = playlist_data.get("total_playlists", 0)
        public_playlists = playlist_data.get("public_playlists", 0)
        collaborative_playlists = playlist_data.get("collaborative_playlists", 0)
        
        # Many playlists suggest conscientiousness
        if total_playlists > 10:
            scores[PersonalityTrait.CONSCIENTIOUSNESS] += 5
        
        # Public playlists suggest extraversion
        if total_playlists > 0:
            public_ratio = public_playlists / total_playlists
            scores[PersonalityTrait.EXTRAVERSION] += public_ratio * 10
        
        # Collaborative playlists suggest agreeableness
        if collaborative_playlists > 0:
            scores[PersonalityTrait.AGREEABLENESS] += min(collaborative_playlists * 3, 10)
    
    def _find_closest_genre(self, genre: str) -> Optional[str]:
        """Find the closest matching genre in our personality mapping."""
        genre_lower = genre.lower()
        
        # Direct match
        if genre_lower in self.genre_personality_map:
            return genre_lower
        
        # Partial match
        for mapped_genre in self.genre_personality_map:
            if mapped_genre in genre_lower or genre_lower in mapped_genre:
                return mapped_genre
        
        return None
    
    async def _get_trait_confidence(self, trait: PersonalityTrait, data: Dict[str, Any]) -> float:
        """Calculate confidence for specific traits based on music data."""
        base_confidence = 0.2
        
        # Increase confidence based on data richness
        top_tracks = len(data.get("top_tracks", []))
        audio_features = len(data.get("audio_features", {}))
        genres = len(data.get("genre_analysis", {}))
        
        # More data = higher confidence
        if top_tracks > 20:
            base_confidence += 0.1
        if audio_features > 5:
            base_confidence += 0.1
        if genres > 3:
            base_confidence += 0.1
        
        # Trait-specific confidence adjustments
        if trait == PersonalityTrait.OPENNESS and genres > 5:
            base_confidence += 0.15  # Genre diversity is strong indicator for openness
        elif trait == PersonalityTrait.EXTRAVERSION and audio_features:
            energy = data.get("audio_features", {}).get("energy", 0)
            if energy > 0.7 or energy < 0.3:  # Strong energy signal
                base_confidence += 0.1
        
        return min(0.3, base_confidence)  # Cap additional confidence
    
    def get_spotify_auth_url(self) -> str:
        """Get Spotify OAuth authorization URL."""
        try:
            scope = self.config.spotify.scope
            sp_oauth = SpotifyOAuth(
                client_id=self.config.spotify.client_id,
                client_secret=self.config.spotify.client_secret,
                redirect_uri=self.config.spotify.redirect_uri,
                scope=scope
            )
            # Use user_id as OAuth state so we can correlate on callback
            return sp_oauth.get_authorize_url(state=str(self.user_id))
        except Exception as e:
            self.logger.error(f"Error generating Spotify auth URL: {e}")
            return ""
    
    async def handle_spotify_callback(self, code: str) -> bool:
        """Handle Spotify OAuth callback and initialize client."""
        try:
            sp_oauth = SpotifyOAuth(
                client_id=self.config.spotify.client_id,
                client_secret=self.config.spotify.client_secret,
                redirect_uri=self.config.spotify.redirect_uri,
                scope=self.config.spotify.scope
            )
            
            token_info = sp_oauth.get_access_token(code)
            if token_info:
                self.spotify_token = token_info["access_token"]
                self._initialize_spotify_client()
                
                # Store tokens in Supabase
                from core.database.supabase_client import get_supabase_client
                supabase = get_supabase_client()
                
                # Calculate token expiration
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_info.get("expires_in", 3600))
                
                # Get Spotify user profile for additional data
                user_profile = None
                try:
                    user_profile = self.spotify_client.current_user()
                except Exception as e:
                    self.logger.warning(f"Failed to fetch Spotify user profile: {e}")
                
                # Store tokens and user data
                success = await supabase.store_spotify_tokens(
                    user_id=self.user_id,
                    access_token=token_info["access_token"],
                    refresh_token=token_info["refresh_token"],
                    expires_at=expires_at,
                    user_data=user_profile
                )
                
                if success:
                    self.logger.info(f"Spotify authentication successful and tokens stored for user {self.user_id}")
                    
                    # Fetch and store user's listening history on first login
                    await self._fetch_and_store_listening_history()
                    
                    return True
                else:
                    self.logger.error(f"Failed to store Spotify tokens for user {self.user_id}")
                    return False
        except Exception as e:
            self.logger.error(f"Error handling Spotify callback: {e}")
        
        return False

    async def _load_existing_tokens(self) -> bool:
        """Load existing Spotify tokens from database."""
        try:
            from core.database.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            
            token_data = await supabase.get_spotify_tokens(self.user_id)
            if token_data:
                # Check if token is still valid
                if token_data['expires_at']:
                    expires_at = datetime.fromisoformat(token_data['expires_at'].replace('Z', '+00:00'))
                    current_time = datetime.now(timezone.utc)
                    
                    if expires_at > current_time:
                        self.spotify_token = token_data['access_token']
                        self._initialize_spotify_client()
                        self.logger.info(f"Loaded existing Spotify token for user {self.user_id}")
                        return True
                    else:
                        self.logger.info(f"Spotify token expired for user {self.user_id}, attempting refresh")
                        # Attempt to refresh the token
                        if token_data['refresh_token']:
                            refreshed = await self._refresh_spotify_token(token_data['refresh_token'])
                            if refreshed:
                                return True
                        
            return False
        except Exception as e:
            self.logger.error(f"Error loading existing tokens: {e}")
            return False
    
    async def _refresh_spotify_token(self, refresh_token: str) -> bool:
        """Refresh Spotify access token using refresh token."""
        try:
            sp_oauth = SpotifyOAuth(
                client_id=self.config.spotify.client_id,
                client_secret=self.config.spotify.client_secret,
                redirect_uri=self.config.spotify.redirect_uri,
                scope=self.config.spotify.scope
            )
            
            # Refresh the token
            token_info = sp_oauth.refresh_access_token(refresh_token)
            if token_info:
                self.spotify_token = token_info["access_token"]
                self._initialize_spotify_client()
                
                # Store updated tokens in Supabase
                from core.database.supabase_client import get_supabase_client
                supabase = get_supabase_client()
                
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_info.get("expires_in", 3600))
                
                success = await supabase.update_spotify_tokens(
                    user_id=self.user_id,
                    access_token=token_info["access_token"],
                    refresh_token=token_info.get("refresh_token", refresh_token),  # Use new or keep old
                    expires_at=expires_at
                )
                
                if success:
                    self.logger.info(f"Spotify token refreshed successfully for user {self.user_id}")
                    return True
                    
        except Exception as e:
            self.logger.error(f"Error refreshing Spotify token: {e}")
            
        return False
    
    async def _fetch_and_store_listening_history(self) -> bool:
        """Fetch user's Spotify listening history and store in database for personality analysis."""
        try:
            if not self.spotify_client:
                return False
                
            from core.database.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            
            # Check if history already exists to avoid duplicate fetching
            existing_check = await supabase.supabase.table('music_listening_history').select('id').eq('user_id', self.user_id).limit(1).execute()
            if existing_check.data:
                self.logger.info(f"Music history already exists for user {self.user_id}, skipping initial fetch")
                return True
            
            self.logger.info(f"Fetching initial Spotify listening history for user {self.user_id}")
            
            # Fetch different time ranges for comprehensive analysis
            time_ranges = ['short_term', 'medium_term', 'long_term']  # 4 weeks, 6 months, all time
            all_tracks = {}
            all_track_ids = []
            
            # First, collect all track metadata without audio features
            for time_range in time_ranges:
                try:
                    # Get top tracks for this time period
                    top_tracks = self.spotify_client.current_user_top_tracks(
                        limit=50, 
                        time_range=time_range
                    )
                    
                    if top_tracks and 'items' in top_tracks:
                        for track in top_tracks['items']:
                            track_id = track['id']
                            if track_id not in all_tracks:
                                # Store track metadata (without audio features for now)
                                track_data = {
                                    'user_id': self.user_id,
                                    'spotify_track_id': track_id,
                                    'track_name': track['name'],
                                    'artists': [artist['name'] for artist in track['artists']],
                                    'album_name': track['album']['name'],
                                    'genres': [],  # Spotify doesn't provide track-level genres
                                    'popularity': track['popularity'],
                                    'duration_ms': track['duration_ms'],
                                    'time_range': time_range,
                                    'play_count_estimate': 50 - top_tracks['items'].index(track),  # Rough estimate based on position
                                    'created_at': datetime.now(timezone.utc).isoformat()
                                }
                                
                                all_tracks[track_id] = track_data
                                all_track_ids.append(track_id)
                                
                    # Small delay to respect rate limits
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    self.logger.warning(f"Error fetching {time_range} tracks: {e}")
                    continue
            
            # Also get recently played tracks
            try:
                recent_tracks = self.spotify_client.current_user_recently_played(limit=50)
                if recent_tracks and 'items' in recent_tracks:
                    for item in recent_tracks['items']:
                        track = item['track']
                        track_id = track['id']
                        played_at = item['played_at']
                        
                        if track_id not in all_tracks:
                            track_data = {
                                'user_id': self.user_id,
                                'spotify_track_id': track_id,
                                'track_name': track['name'],
                                'artists': [artist['name'] for artist in track['artists']],
                                'album_name': track['album']['name'],
                                'genres': [],
                                'popularity': track['popularity'],
                                'duration_ms': track['duration_ms'],
                                'time_range': 'recent',
                                'last_played_at': played_at,
                                'created_at': datetime.now(timezone.utc).isoformat()
                            }
                            
                            all_tracks[track_id] = track_data
                            all_track_ids.append(track_id)
                            
            except Exception as e:
                self.logger.warning(f"Error fetching recent tracks: {e}")
            
            # Now fetch audio features for all tracks in batches using the rate-limited method
            if all_track_ids:
                try:
                    self.logger.info(f"Fetching audio features for {len(all_track_ids)} tracks")
                    audio_features_batch = await self._get_audio_features(all_track_ids)
                    
                    # Merge audio features into track data
                    for track_id, track_data in all_tracks.items():
                        if track_id in audio_features_batch:
                            features = audio_features_batch[track_id]
                            if features:  # features could be None if API call failed
                                track_data.update({
                                    'energy': features.get('energy'),
                                    'valence': features.get('valence'),
                                    'danceability': features.get('danceability'),
                                    'acousticness': features.get('acousticness'),
                                    'instrumentalness': features.get('instrumentalness'),
                                    'tempo': features.get('tempo')
                                })
                        else:
                            # Set default None values for audio features if not available
                            track_data.update({
                                'energy': None,
                                'valence': None,
                                'danceability': None,
                                'acousticness': None,
                                'instrumentalness': None,
                                'tempo': None
                            })
                except Exception as e:
                    self.logger.warning(f"Error fetching audio features: {e}")
                    # Continue without audio features if they fail
                    for track_data in all_tracks.values():
                        track_data.update({
                            'energy': None,
                            'valence': None,
                            'danceability': None,
                            'acousticness': None,
                            'instrumentalness': None,
                            'tempo': None
                        })
            
            # Store all tracks in database
            if all_tracks:
                track_list = list(all_tracks.values())
                
                # Insert in batches to avoid overwhelming the database
                batch_size = 50
                for i in range(0, len(track_list), batch_size):
                    batch = track_list[i:i + batch_size]
                    try:
                        result = await supabase.supabase.table('music_listening_history').insert(batch).execute()
                        if result.data:
                            self.logger.info(f"Stored batch of {len(batch)} tracks for user {self.user_id}")
                    except Exception as e:
                        self.logger.error(f"Error storing track batch: {e}")
                
                self.logger.info(f"Successfully stored {len(all_tracks)} tracks for user {self.user_id}")
                
                # Trigger personality analysis with the new music data
                await self._analyze_music_personality()
                
                return True
            else:
                self.logger.warning(f"No tracks found for user {self.user_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error fetching and storing listening history: {e}")
            return False
    
    async def _analyze_music_personality(self) -> bool:
        """Analyze user's music history to extract personality insights and merge with existing data."""
        try:
            from core.database.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            
            # Get user's music listening history
            history_result = await supabase.table('music_listening_history').select('*').eq('user_id', self.user_id).execute()
            if not history_result.data:
                self.logger.warning(f"No music history found for user {self.user_id}")
                return False
            
            tracks = history_result.data
            self.logger.info(f"Analyzing {len(tracks)} tracks for personality insights")
            
            # Initialize personality adjustments
            personality_adjustments = {
                'openness': 0.0,
                'conscientiousness': 0.0,
                'extraversion': 0.0,
                'agreeableness': 0.0,
                'neuroticism': 0.0
            }
            
            total_tracks = len(tracks)
            
            # Analyze audio features
            energy_scores = [t['energy'] for t in tracks if t['energy'] is not None]
            valence_scores = [t['valence'] for t in tracks if t['valence'] is not None]
            danceability_scores = [t['danceability'] for t in tracks if t['danceability'] is not None]
            acousticness_scores = [t['acousticness'] for t in tracks if t['acousticness'] is not None]
            instrumentalness_scores = [t['instrumentalness'] for t in tracks if t['instrumentalness'] is not None]
            
            if energy_scores:
                avg_energy = sum(energy_scores) / len(energy_scores)
                # High energy correlates with extraversion and lower neuroticism
                personality_adjustments['extraversion'] += (avg_energy - 0.5) * 10  # Scale to 0-10
                personality_adjustments['neuroticism'] -= (avg_energy - 0.5) * 5
            
            if valence_scores:
                avg_valence = sum(valence_scores) / len(valence_scores)
                # High valence (positivity) correlates with extraversion and lower neuroticism
                personality_adjustments['extraversion'] += (avg_valence - 0.5) * 8
                personality_adjustments['neuroticism'] -= (avg_valence - 0.5) * 8
            
            if danceability_scores:
                avg_danceability = sum(danceability_scores) / len(danceability_scores)
                # High danceability correlates with extraversion and agreeableness
                personality_adjustments['extraversion'] += (avg_danceability - 0.5) * 6
                personality_adjustments['agreeableness'] += (avg_danceability - 0.5) * 4
            
            if acousticness_scores:
                avg_acousticness = sum(acousticness_scores) / len(acousticness_scores)
                # High acousticness suggests appreciation for traditional/organic music (openness)
                personality_adjustments['openness'] += (avg_acousticness - 0.3) * 5
                personality_adjustments['conscientiousness'] += (avg_acousticness - 0.3) * 3
            
            if instrumentalness_scores:
                avg_instrumentalness = sum(instrumentalness_scores) / len(instrumentalness_scores)
                # High instrumentalness suggests openness to complex music
                personality_adjustments['openness'] += (avg_instrumentalness - 0.2) * 8
                personality_adjustments['extraversion'] -= (avg_instrumentalness - 0.2) * 4  # Introverts may prefer instrumental
            
            # Analyze genre diversity (proxy for openness)
            unique_artists = set()
            for track in tracks:
                if track['artists']:
                    unique_artists.update(track['artists'])
            
            artist_diversity = len(unique_artists) / max(total_tracks, 1)
            if artist_diversity > 0.5:  # High diversity
                personality_adjustments['openness'] += 8
            elif artist_diversity < 0.2:  # Low diversity
                personality_adjustments['openness'] -= 3
                personality_adjustments['conscientiousness'] += 2  # Preference for familiar
            
            # Analyze time patterns for conscientiousness
            recent_tracks = [t for t in tracks if t['time_range'] == 'recent']
            if recent_tracks:
                # Regular listening patterns suggest conscientiousness
                personality_adjustments['conscientiousness'] += 3
            
            # Popularity analysis
            popularity_scores = [t['popularity'] for t in tracks if t['popularity'] is not None]
            if popularity_scores:
                avg_popularity = sum(popularity_scores) / len(popularity_scores)
                if avg_popularity < 30:  # Preference for obscure music
                    personality_adjustments['openness'] += 6
                    personality_adjustments['extraversion'] -= 2
                elif avg_popularity > 70:  # Preference for mainstream music
                    personality_adjustments['agreeableness'] += 3
                    personality_adjustments['extraversion'] += 2
            
            # Cap adjustments to reasonable ranges (-10 to +10)
            for trait in personality_adjustments:
                personality_adjustments[trait] = max(-10, min(10, personality_adjustments[trait]))
            
            # Get current personality data
            profile_result = await supabase.table('profiles').select('personality_openness, personality_conscientiousness, personality_extraversion, personality_agreeableness, personality_neuroticism, personality_llm_context').eq('id', self.user_id).single().execute()
            
            if profile_result.data:
                current_personality = profile_result.data
                
                # Apply adjustments to existing scores
                new_personality = {}
                traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
                
                for trait in traits:
                    current_score = current_personality.get(f'personality_{trait}', 50)  # Default to 50 if not set
                    adjustment = personality_adjustments[trait]
                    new_score = max(0, min(100, current_score + adjustment))  # Keep within 0-100 range
                    new_personality[f'personality_{trait}'] = new_score
                
                # Update LLM context with music insights
                current_context = current_personality.get('personality_llm_context', {})
                if not isinstance(current_context, dict):
                    current_context = {}
                
                music_insights = {
                    'music_analysis_date': datetime.now(timezone.utc).isoformat(),
                    'tracks_analyzed': total_tracks,
                    'music_personality_adjustments': personality_adjustments,
                    'music_features': {
                        'avg_energy': sum(energy_scores) / len(energy_scores) if energy_scores else None,
                        'avg_valence': sum(valence_scores) / len(valence_scores) if valence_scores else None,
                        'avg_danceability': sum(danceability_scores) / len(danceability_scores) if danceability_scores else None,
                        'artist_diversity': artist_diversity,
                        'avg_popularity': sum(popularity_scores) / len(popularity_scores) if popularity_scores else None
                    }
                }
                
                current_context['music_insights'] = music_insights
                new_personality['personality_llm_context'] = current_context
                
                # Update the database
                update_result = await supabase.table('profiles').update(new_personality).eq('id', self.user_id).execute()
                
                if update_result.data:
                    self.logger.info(f"Successfully updated personality profile with music insights for user {self.user_id}")
                    self.logger.info(f"Personality adjustments: {personality_adjustments}")
                    return True
                else:
                    self.logger.error(f"Failed to update personality profile for user {self.user_id}")
                    return False
            else:
                self.logger.warning(f"No existing personality profile found for user {self.user_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error analyzing music personality: {e}")
            return False
    
    async def _get_stored_genre_history(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get user's listening history organized by GenZ genres from stored data."""
        try:
            from core.database.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            
            # Get stored listening history
            history_result = await supabase.supabase.table('music_listening_history').select('*').eq('user_id', self.user_id).order('play_count_estimate', desc=True).limit(200).execute()
            
            if not history_result.data:
                return {}
            
            tracks = history_result.data
            self.logger.info(f"Retrieved {len(tracks)} tracks from stored history for user {self.user_id}")
            
            # Organize tracks by GenZ genre
            genre_tracks = {genre: [] for genre in self.genz_genre_map.keys()}
            genre_tracks["Uncategorized"] = []
            
            for track in tracks:
                # Convert to format expected by recommendation system
                track_data = {
                    'id': track['spotify_track_id'],
                    'name': track['track_name'],
                    'artists': [{'name': artist} for artist in track['artists']] if track['artists'] else [],
                    'album': {'name': track['album_name']},
                    'popularity': track['popularity'],
                    'duration_ms': track['duration_ms'],
                    'energy': track['energy'],
                    'valence': track['valence'],
                    'danceability': track['danceability'],
                    'acousticness': track['acousticness'],
                    'instrumentalness': track['instrumentalness'],
                    'tempo': track['tempo'],
                    'play_count': track.get('play_count_estimate', 1),
                    'time_range': track.get('time_range', 'unknown')
                }
                
                # Try to classify by genre based on audio features and artist patterns
                classified_genre = await self._classify_track_genre(track_data)
                if classified_genre:
                    genre_tracks[classified_genre].append(track_data)
                else:
                    genre_tracks["Uncategorized"].append(track_data)
            
            # Remove empty genres and sort by play count
            final_genre_tracks = {}
            for genre, tracks_list in genre_tracks.items():
                if tracks_list:
                    # Sort by play count and keep top tracks
                    sorted_tracks = sorted(tracks_list, key=lambda x: x.get('play_count', 0), reverse=True)
                    final_genre_tracks[genre] = sorted_tracks[:20]  # Keep top 20 per genre
            
            self.logger.info(f"Organized stored history into {len(final_genre_tracks)} genres")
            return final_genre_tracks
            
        except Exception as e:
            self.logger.error(f"Error getting stored genre history: {e}")
            return {}
    
    async def _classify_track_genre(self, track_data: Dict[str, Any]) -> Optional[str]:
        """Classify a track into a GenZ genre based on audio features."""
        try:
            # Simple heuristic-based classification
            energy = track_data.get('energy', 0.5)
            valence = track_data.get('valence', 0.5)
            danceability = track_data.get('danceability', 0.5)
            acousticness = track_data.get('acousticness', 0.5)
            instrumentalness = track_data.get('instrumentalness', 0)
            tempo = track_data.get('tempo', 120)
            
            # Lo-fi Chill: Low energy, high acousticness, often instrumental
            if energy < 0.4 and acousticness > 0.3 and instrumentalness > 0.3:
                return 'Lo-fi Chill'
            
            # Pop Anthems: High energy, high danceability, moderate valence
            elif energy > 0.7 and danceability > 0.6 and valence > 0.5:
                return 'Pop Anthems'
            
            # Hype Beats: Very high energy, high danceability, fast tempo
            elif energy > 0.8 and danceability > 0.7 and tempo > 130:
                return 'Hype Beats'
            
            # Sad Boy Hours: Low valence, moderate energy
            elif valence < 0.3 and energy < 0.6:
                return 'Sad Boy Hours'
            
            # R&B Feels: Moderate energy, moderate danceability, soulful feel
            elif 0.4 < energy < 0.7 and 0.4 < danceability < 0.7 and acousticness < 0.5:
                return 'R&B Feels'
            
            # Indie Vibes: Moderate energy, low danceability, some acousticness
            elif 0.3 < energy < 0.6 and danceability < 0.6 and acousticness > 0.2:
                return 'Indie Vibes'
            
            # Default fallback
            return None
            
        except Exception as e:
            self.logger.error(f"Error classifying track genre: {e}")
            return None
    
    async def fetch_genre_based_history(self, time_range: str = "medium_term") -> Dict[str, List[Dict[str, Any]]]:
        """
        Fetch user's listening history organized by GenZ-friendly genres.
        
        Args:
            time_range: "short_term" (~4 weeks), "medium_term" (~6 months), "long_term" (years)
            
        Returns:
            Dictionary mapping GenZ genre names to lists of tracks
        """
        try:
            # Get top tracks
            top_tracks = await self._get_top_tracks(time_range=time_range)
            
            # Organize tracks by GenZ genre
            genre_tracks = {genre: [] for genre in self.genz_genre_map.keys()}
            genre_tracks["Uncategorized"] = []
            
            for track in top_tracks:
                # Get track's audio features
                track_id = track.get("id")
                if not track_id:
                    continue
                
                # Get artists and their genres
                artists = track.get("artists", [])
                artist_ids = [artist["id"] for artist in artists if "id" in artist]
                
                # Fetch artist details for genres
                track_genres = set()
                for artist_id in artist_ids:
                    try:
                        artist_info = await asyncio.to_thread(
                            self.spotify_client.artist, artist_id
                        )
                        track_genres.update(artist_info.get("genres", []))
                    except:
                        continue
                
                # Map to GenZ genre
                categorized = False
                for spotify_genre in track_genres:
                    genz_genre = self._map_to_genz_genre(spotify_genre)
                    if genz_genre:
                        genre_tracks[genz_genre].append({
                            "id": track_id,
                            "name": track.get("name"),
                            "artists": [a.get("name") for a in artists],
                            "album": track.get("album", {}).get("name"),
                            "preview_url": track.get("preview_url"),
                            "external_url": track.get("external_urls", {}).get("spotify"),
                            "duration_ms": track.get("duration_ms"),
                            "popularity": track.get("popularity"),
                            "spotify_genres": list(track_genres),
                            "genz_genre": genz_genre
                        })
                        categorized = True
                        break
                
                if not categorized:
                    genre_tracks["Uncategorized"].append({
                        "id": track_id,
                        "name": track.get("name"),
                        "artists": [a.get("name") for a in artists],
                        "external_url": track.get("external_urls", {}).get("spotify")
                    })
            
            # Remove empty categories
            genre_tracks = {k: v for k, v in genre_tracks.items() if v}
            
            self.logger.info(f"Fetched history across {len(genre_tracks)} genres")
            return genre_tracks
            
        except Exception as e:
            self.logger.error(f"Error fetching genre-based history: {e}")
            return {}
    
    def _map_to_genz_genre(self, spotify_genre: str) -> Optional[str]:
        """Map a Spotify genre to a GenZ-friendly genre name."""
        spotify_genre_lower = spotify_genre.lower()
        
        # Direct lookup
        if spotify_genre_lower in self.spotify_to_genz:
            return self.spotify_to_genz[spotify_genre_lower]
        
        # Fuzzy matching
        for genz_genre, spotify_genres in self.genz_genre_map.items():
            for genre in spotify_genres:
                if genre in spotify_genre_lower or spotify_genre_lower in genre:
                    return genz_genre
        
        return None
    
    async def get_recommendations_by_genre(
        self, 
        personality_profile: Dict[PersonalityTrait, float],
        genres: Optional[List[str]] = None,
        songs_per_genre: int = 3,
        use_history: bool = True,
        refresh_salt: Optional[int] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get song recommendations organized by GenZ genres.
        
        Args:
            personality_profile: User's personality scores
            genres: Specific genres to get recommendations for (None = all)
            songs_per_genre: Number of songs to recommend per genre (default 3)
            use_history: Whether to use listening history for recommendations
            
        Returns:
            Dictionary mapping genre names to lists of recommended songs
        """
        try:
            recommendations = {}
            
            # Get user's listening history by genre (prefer stored history, fallback to live fetch)
            if use_history:
                genre_history = await self._get_stored_genre_history()
                if not genre_history and self.spotify_token:
                    # Fallback to live fetch if no stored history
                    genre_history = await self.fetch_genre_based_history()
            else:
                genre_history = {}
            
            # Determine which genres to process
            target_genres = genres if genres else list(self.genz_genre_map.keys())
            # Light shuffle based on refresh salt to vary ordering
            if refresh_salt is not None:
                try:
                    import random
                    rnd = random.Random(refresh_salt)
                    rnd.shuffle(target_genres)
                except Exception:
                    pass
            
            for genz_genre in target_genres:
                # Get seed tracks from history for this genre
                seed_tracks = []
                if genz_genre in genre_history:
                    seed_tracks = genre_history[genz_genre][:2]  # Use top 2 from history
                
                # Map GenZ genre to valid Spotify seed genres
                spotify_genres = await self._get_valid_seed_genres_for_genz(genz_genre)
                
                # Get recommendations from Spotify
                candidate_songs = await self._get_spotify_recommendations(
                    seed_tracks=seed_tracks,
                    seed_genres=spotify_genres[:2],  # Spotify limits to 5 seeds total
                    limit=songs_per_genre * 3,  # Get more for RL filtering
                    salt=refresh_salt,
                )
                
                if not candidate_songs:
                    continue
                
                # Add genre and personality matching scores
                for song in candidate_songs:
                    song['genz_genre'] = genz_genre
                    song['genre'] = genz_genre  # For RL system
                    song['personality_match'] = self._calculate_personality_match(
                        song, personality_profile, genz_genre
                    )
                
                # Use RL system to rank and select best songs
                rl_scored_songs = await self.rl_system.get_recommendation_scores(
                    candidate_songs, personality_profile, genre=genz_genre
                )
                
                # Select top N songs
                top_songs = [song for song, score in rl_scored_songs[:songs_per_genre]]
                recommendations[genz_genre] = top_songs
            
            self.logger.info(f"Generated recommendations for {len(recommendations)} genres")
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Error getting recommendations by genre: {e}")
            return {}

    async def _get_available_seed_genres(self) -> List[str]:
        """Fetch and cache Spotify's available recommendation seed genres."""
        if self._seed_genres_cache is not None:
            return self._seed_genres_cache
        try:
            if not self.spotify_client:
                raise Exception("Spotify client not initialized")
            
            # Use rate limited call for consistency
            data = await spotify_rate_limiter.rate_limited_call(
                "genre_seeds",
                self.spotify_client.recommendation_genre_seeds
            )
            
            if data and 'genres' in data:
                genres = [g.lower() for g in data['genres']]
                self._seed_genres_cache = genres
                self.logger.info(f"Loaded {len(genres)} available seed genres from Spotify")
                return genres
            else:
                raise Exception("No genres returned from API")
                
        except Exception as e:
            self.logger.warning(f"Failed to load available seed genres: {e}")
            # Reasonable defaults if API fails
            defaults = [
                'pop','dance','electronic','hip-hop','r-n-b','soul','indie','chill','ambient','acoustic','emo','rock','alternative'
            ]
            self._seed_genres_cache = defaults
            return defaults

    def _normalize_seed(self, s: str) -> str:
        """Normalize a genre string to match Spotify's seed format."""
        s = s.lower()
        # Common replacements that Spotify uses
        replacements = {
            '&': 'n',  # r&b -> rnb
            ' ': '-',  # indie pop -> indie-pop
            '_': '-',  # alternative_rock -> alternative-rock
        }
        
        for old, new in replacements.items():
            s = s.replace(old, new)
        
        # Remove double hyphens
        while '--' in s:
            s = s.replace('--', '-')
            
        # Remove leading/trailing hyphens
        s = s.strip('-')
        
        # Keep only alphanumeric and hyphens
        s = ''.join(ch for ch in s if ch.isalnum() or ch == '-')
        
        return s

    async def _get_valid_seed_genres_for_genz(self, genz_genre: str) -> List[str]:
        """Translate a GenZ genre to valid Spotify recommendation seed genres."""
        available = set(await self._get_available_seed_genres())
        self.logger.info(f"Available Spotify seed genres count: {len(available)}")
        
        # Log first 20 available genres for debugging
        self.logger.info(f"Sample available genres: {sorted(list(available))[:20]}")

        # Exact Spotify seed names - these are known to work
        preferred: Dict[str, List[str]] = {
            'Lo-fi Chill': ['ambient', 'chill', 'acoustic', 'study', 'sleep'],
            'Pop Anthems': ['pop', 'dance', 'electro', 'synth-pop', 'electronic'],
            'Hype Beats': ['hip-hop', 'trap', 'rap', 'electronic', 'dance'],
            'Indie Vibes': ['indie', 'indie-pop', 'indie-rock', 'alternative', 'rock'],
            'R&B Feels': ['r-n-b', 'soul', 'funk', 'neo-soul', 'groove'],
            'Sad Boy Hours': ['emo', 'indie', 'alternative', 'sad', 'melancholy'],
        }

        seeds = []
        candidates = preferred.get(genz_genre, [])
        
        self.logger.info(f"Looking for seeds for {genz_genre}: candidates = {candidates}")
        
        # First try exact matches
        for candidate in candidates:
            if candidate in available:
                seeds.append(candidate)
                self.logger.info(f"Found exact match: {candidate}")
            else:
                self.logger.info(f"No exact match for: {candidate}")

        # If still empty, try normalized matches
        if not seeds:
            for candidate in candidates:
                norm = self._normalize_seed(candidate)
                if norm in available:
                    seeds.append(norm)
                    self.logger.info(f"Found normalized match: {candidate} -> {norm}")

        # If still empty, try substring matching
        if not seeds:
            for candidate in candidates:
                for available_genre in available:
                    if candidate.lower() in available_genre or available_genre in candidate.lower():
                        if available_genre not in seeds:
                            seeds.append(available_genre)
                            self.logger.info(f"Found substring match: {candidate} -> {available_genre}")

        # Ultimate fallback to guaranteed working genres
        if not seeds:
            fallbacks = ['pop', 'rock', 'electronic', 'hip-hop', 'dance']
            for fallback in fallbacks:
                if fallback in available:
                    seeds.append(fallback)
                    break
            
            # If even fallbacks don't work, just use the first available genre
            if not seeds and available:
                seeds.append(list(available)[0])
                self.logger.warning(f"Using first available genre as ultimate fallback: {seeds[0]}")

        final_seeds = seeds[:2]  # Limit to 2 seeds to avoid API limits
        self.logger.info(f"Final seeds for {genz_genre}: {final_seeds}")
        return final_seeds
    
    async def _get_spotify_recommendations(
        self,
        seed_tracks: Optional[List[Dict[str, Any]]] = None,
        seed_genres: Optional[List[str]] = None,
        limit: int = 10,
        salt: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get recommendations from Spotify API."""
        try:
            # Prepare seeds
            track_ids = [t["id"] for t in (seed_tracks or [])[:2]]
            
            # Validate genres against available seed genres
            available_genres = set(await self._get_available_seed_genres())
            valid_genres = [g for g in (seed_genres or []) if g in available_genres][:2]
            
            self.logger.info(f"Recommendations request - Requested genres: {seed_genres}, Valid genres: {valid_genres}, Track seeds: {len(track_ids)}")
            
            # Need at least one seed
            if not track_ids and not valid_genres:
                self.logger.warning(f"No valid seeds for recommendations!")
                self.logger.warning(f"Requested genres: {seed_genres}")
                self.logger.warning(f"Available genres sample: {sorted(list(available_genres))[:20]}")
                return []
            
            # Get recommendations with rate limiting and error handling
            try:
                results = await spotify_rate_limiter.rate_limited_call(
                    "recommendations",
                    self.spotify_client.recommendations,
                    seed_tracks=track_ids if track_ids else None,
                    seed_genres=valid_genres if valid_genres else None,
                    limit=limit
                )
                
                if not results:
                    self.logger.warning("Spotify recommendations API returned None")
                    return []
                    
            except Exception as api_error:
                self.logger.error(f"Spotify recommendations API error: {api_error}")
                self.logger.error(f"Request parameters - seed_tracks: {track_ids}, seed_genres: {valid_genres}, limit: {limit}")
                
                # Try fallback with just one genre if we had multiple
                if len(valid_genres) > 1:
                    self.logger.info("Retrying with single genre seed...")
                    try:
                        results = await spotify_rate_limiter.rate_limited_call(
                            "recommendations",
                            self.spotify_client.recommendations,
                            seed_genres=[valid_genres[0]],
                            limit=limit
                        )
                        if results:
                            self.logger.info("Fallback with single genre succeeded")
                        else:
                            return []
                    except Exception as fallback_error:
                        self.logger.error(f"Fallback also failed: {fallback_error}")
                        return []
                else:
                    return []
            
            tracks = results.get("tracks", [])

            # Enrich with audio features
            track_ids = [t.get("id") for t in tracks if t.get("id")]
            audio_features = await self._get_audio_features(track_ids, salt=salt)

            # Combine track info with audio features
            enriched_tracks = []
            for track in tracks:
                track_id = track.get("id")
                # Get album image (use largest available image)
                album_images = track.get("album", {}).get("images", [])
                album_image = None
                if album_images:
                    # Sort by size (largest first) and take the first one
                    sorted_images = sorted(album_images, key=lambda x: x.get('width', 0) * x.get('height', 0), reverse=True)
                    album_image = sorted_images[0].get('url') if sorted_images else None

                enriched_track = {
                    "id": track_id,
                    "name": track.get("name"),
                    "artists": [a.get("name") for a in track.get("artists", [])],
                    "album": track.get("album", {}).get("name"),
                    "album_image": album_image,
                    "preview_url": track.get("preview_url"),
                    "external_url": track.get("external_urls", {}).get("spotify"),
                    "duration_ms": track.get("duration_ms"),
                    "popularity": track.get("popularity"),
                }
                
                # Add audio features if available
                if audio_features and track_id in audio_features:
                    features = audio_features.get(track_id, {})
                    enriched_track.update({
                        "energy": features.get("energy", 0.5),
                        "valence": features.get("valence", 0.5),
                        "danceability": features.get("danceability", 0.5),
                        "acousticness": features.get("acousticness", 0.5),
                        "instrumentalness": features.get("instrumentalness", 0.5),
                        "tempo": features.get("tempo", 120),
                    })
                
                enriched_tracks.append(enriched_track)
            
            return enriched_tracks
            
        except Exception as e:
            self.logger.error(f"Error getting Spotify recommendations: {e}")
            return []

    async def get_persona_only_recommendations(
        self,
        personality_profile: Dict[PersonalityTrait, float],
        genres: Optional[List[str]] = None,
        songs_per_genre: int = 3,
        refresh_salt: Optional[int] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate personality-only recommendations WITHOUT using Spotify history.
        This mode is for users who continue without login.
        
        Uses pure personality trait scoring to recommend songs from Spotify's catalog
        based on audio features and genre mapping to personality traits.
        """
        try:
            self.logger.info(f"Generating personality-only recommendations for user {self.user_id}")
            recommendations: Dict[str, List[Dict[str, Any]]] = {}
            target_genres = genres if genres else list(self.genz_genre_map.keys())

            # Advanced personality-to-genre alignment scoring
            def calculate_personality_genre_alignment(genz_genre: str) -> float:
                """Calculate how well a GenZ genre aligns with user's personality profile."""
                alignment_score = 0.0
                
                # Map personality traits to audio features preferences
                personality_audio_preferences = {
                    PersonalityTrait.EXTRAVERSION: {
                        'energy': personality_profile.get(PersonalityTrait.EXTRAVERSION, 50) / 100,
                        'valence': personality_profile.get(PersonalityTrait.EXTRAVERSION, 50) / 100,
                        'danceability': personality_profile.get(PersonalityTrait.EXTRAVERSION, 50) / 100,
                    },
                    PersonalityTrait.OPENNESS: {
                        'instrumentalness': personality_profile.get(PersonalityTrait.OPENNESS, 50) / 100,
                        'acousticness': personality_profile.get(PersonalityTrait.OPENNESS, 50) / 100,
                    },
                    PersonalityTrait.NEUROTICISM: {
                        'valence': 1.0 - (personality_profile.get(PersonalityTrait.NEUROTICISM, 50) / 100),  # High neuroticism = low valence preference
                        'energy': 0.5 + (personality_profile.get(PersonalityTrait.NEUROTICISM, 50) / 200),  # Moderate energy for neurotic
                    }
                }
                
                # Genre-specific audio feature expectations
                genre_audio_profiles = {
                    'Lo-fi Chill': {'energy': 0.3, 'valence': 0.5, 'danceability': 0.3, 'acousticness': 0.7, 'instrumentalness': 0.6},
                    'Pop Anthems': {'energy': 0.8, 'valence': 0.8, 'danceability': 0.8, 'acousticness': 0.2, 'instrumentalness': 0.1},
                    'Hype Beats': {'energy': 0.9, 'valence': 0.7, 'danceability': 0.9, 'acousticness': 0.1, 'instrumentalness': 0.1},
                    'Indie Vibes': {'energy': 0.5, 'valence': 0.6, 'danceability': 0.4, 'acousticness': 0.5, 'instrumentalness': 0.3},
                    'R&B Feels': {'energy': 0.6, 'valence': 0.7, 'danceability': 0.7, 'acousticness': 0.3, 'instrumentalness': 0.2},
                    'Sad Boy Hours': {'energy': 0.3, 'valence': 0.2, 'danceability': 0.3, 'acousticness': 0.6, 'instrumentalness': 0.3},
                }
                
                expected_features = genre_audio_profiles.get(genz_genre, {})
                
                # Calculate alignment based on personality preferences vs genre characteristics
                for trait, preferences in personality_audio_preferences.items():
                    trait_score = personality_profile.get(trait, 50) / 100  # Normalize to 0-1
                    
                    for feature, preference_value in preferences.items():
                        if feature in expected_features:
                            genre_value = expected_features[feature]
                            # Higher score if personality preference matches genre characteristics
                            feature_alignment = 1.0 - abs(preference_value - genre_value)
                            alignment_score += feature_alignment * trait_score
                
                # Add bonus for genre-personality direct mappings
                for spotify_genre in self.genz_genre_map.get(genz_genre, []):
                    mapping = self.genre_personality_map.get(spotify_genre, {})
                    for trait_name, coeff in mapping.items():
                        try:
                            trait_enum = PersonalityTrait(trait_name)
                            trait_value = personality_profile.get(trait_enum, 50) / 100
                            alignment_score += abs(coeff) * trait_value * 0.5  # Weight direct mappings
                        except Exception:
                            continue
                
                return alignment_score

            # Rank genres by personality alignment
            ranked_genres = sorted(target_genres, key=calculate_personality_genre_alignment, reverse=True)
            
            # Apply refresh-based shuffling for variety while maintaining personality preference
            if refresh_salt is not None:
                try:
                    import random
                    rng = random.Random(refresh_salt)
                    # Keep top 3 personality-matched genres, shuffle the rest
                    top_genres = ranked_genres[:3]
                    other_genres = ranked_genres[3:]
                    rng.shuffle(other_genres)
                    ranked_genres = top_genres + other_genres
                except Exception:
                    pass
            
            self.logger.info(f"Personality-ranked genres: {ranked_genres[:5]}")
            
            for genz_genre in ranked_genres:
                # Get valid Spotify seed genres for this GenZ genre
                spotify_seeds = await self._get_valid_seed_genres_for_genz(genz_genre)
                
                # Generate personality-tuned recommendations
                candidate_tracks = await self._get_personality_tuned_recommendations(
                    genz_genre=genz_genre,
                    spotify_seeds=spotify_seeds,
                    personality_profile=personality_profile,
                    limit=songs_per_genre * 3,
                    refresh_salt=refresh_salt
                )

                # If recommendations API failed, fallback to simple search
                if not candidate_tracks:
                    try:
                        search_query = f"{spotify_seeds[0] if spotify_seeds else genz_genre}"
                        res = await asyncio.to_thread(self.spotify_client.search, q=search_query, type='track', limit=songs_per_genre * 3)
                        tracks = res.get('tracks', {}).get('items', [])
                        track_ids = [t.get('id') for t in tracks if t.get('id')]
                        audio_features = await self._get_audio_features(track_ids, salt=refresh_salt)
                        candidate_tracks = []
                        for track in tracks:
                            track_id = track.get('id')
                            features = audio_features.get(track_id, {}) if track_id else {}
                            
                            # Get album image
                            album_images = track.get("album", {}).get("images", [])
                            album_image = None
                            if album_images:
                                sorted_images = sorted(album_images, key=lambda x: x.get('width', 0) * x.get('height', 0), reverse=True)
                                album_image = sorted_images[0].get('url') if sorted_images else None
                            
                            candidate_tracks.append({
                                "id": track_id or f"search-{genz_genre}-{len(candidate_tracks)}",
                                "name": track.get('name', 'Unknown'),
                                "artists": [a.get('name') for a in track.get('artists', [])],
                                "album": track.get('album', {}).get('name'),
                                "album_image": album_image,
                                "preview_url": track.get('preview_url'),
                                "external_url": track.get('external_urls', {}).get('spotify', f"https://open.spotify.com/search/{search_query}"),
                                "duration_ms": track.get('duration_ms'),
                                "popularity": track.get('popularity'),
                                "energy": features.get('energy'),
                                "valence": features.get('valence'),
                                "danceability": features.get('danceability'),
                                "tempo": features.get('tempo'),
                            })
                    except Exception as e:
                        self.logger.warning(f"Error in fallback search for {genz_genre}: {e}")
                        candidate_tracks = []

                # Add personality/genre metadata to tracks
                for song in candidate_tracks:
                    song['genz_genre'] = genz_genre
                    song['genre'] = genz_genre
                    song['personality_match'] = self._calculate_personality_match(song, personality_profile, genz_genre)

                # Store top personality-matched tracks for this genre
                if candidate_tracks:
                    # Sort by personality match score and take top tracks
                    sorted_tracks = sorted(candidate_tracks, key=lambda x: x.get('personality_match', 0), reverse=True)
                    recommendations[genz_genre] = sorted_tracks[:songs_per_genre]

            self.logger.info(f"Generated personality-only recommendations for {len(recommendations)} genres")
            return recommendations

            return recommendations
        except Exception as e:
            self.logger.error(f"Error building persona-only recommendations: {e}")
            return {}

    async def _get_personality_tuned_recommendations(
        self,
        genz_genre: str,
        spotify_seeds: List[str],
        personality_profile: Dict[PersonalityTrait, float],
        limit: int = 10,
        refresh_salt: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get Spotify recommendations tuned specifically to personality traits.
        Uses personality profile to set target audio features for better matching.
        """
        try:
            if not spotify_seeds:
                return []

            # Convert personality traits to target audio features
            target_features = self._personality_to_audio_features(personality_profile)
            
            # Get recommendations with personality-tuned target features
            results = await spotify_rate_limiter.rate_limited_call(
                "recommendations",
                self.spotify_client.recommendations,
                seed_genres=spotify_seeds[:2],
                limit=limit,
                **target_features  # Pass target audio features based on personality
            )
            
            if not results:
                return []
            
            tracks = results.get("tracks", [])
            
            # Enrich with audio features and album images
            track_ids = [t.get("id") for t in tracks if t.get("id")]
            audio_features = await self._get_audio_features(track_ids, salt=refresh_salt)

            enriched_tracks = []
            for track in tracks:
                track_id = track.get("id")
                
                # Get album image
                album_images = track.get("album", {}).get("images", [])
                album_image = None
                if album_images:
                    sorted_images = sorted(album_images, key=lambda x: x.get('width', 0) * x.get('height', 0), reverse=True)
                    album_image = sorted_images[0].get('url') if sorted_images else None

                enriched_track = {
                    "id": track_id,
                    "name": track.get("name"),
                    "artists": [a.get("name") for a in track.get("artists", [])],
                    "album": track.get("album", {}).get("name"),
                    "album_image": album_image,
                    "preview_url": track.get("preview_url"),
                    "external_url": track.get("external_urls", {}).get("spotify"),
                    "duration_ms": track.get("duration_ms"),
                    "popularity": track.get("popularity"),
                }
                
                # Add audio features if available
                if audio_features and track_id in audio_features:
                    features = audio_features.get(track_id, {})
                    enriched_track.update({
                        "energy": features.get("energy", 0.5),
                        "valence": features.get("valence", 0.5),
                        "danceability": features.get("danceability", 0.5),
                        "acousticness": features.get("acousticness", 0.5),
                        "instrumentalness": features.get("instrumentalness", 0.5),
                        "tempo": features.get("tempo", 120),
                    })
                
                enriched_tracks.append(enriched_track)
            
            return enriched_tracks
            
        except Exception as e:
            self.logger.error(f"Error getting personality-tuned recommendations: {e}")
            return []

    def _personality_to_audio_features(self, personality_profile: Dict[PersonalityTrait, float]) -> Dict[str, float]:
        """Convert personality profile to Spotify API target audio features."""
        # Normalize personality scores to 0-1 range
        extraversion = personality_profile.get(PersonalityTrait.EXTRAVERSION, 50) / 100
        openness = personality_profile.get(PersonalityTrait.OPENNESS, 50) / 100
        neuroticism = personality_profile.get(PersonalityTrait.NEUROTICISM, 50) / 100
        agreeableness = personality_profile.get(PersonalityTrait.AGREEABLENESS, 50) / 100
        conscientiousness = personality_profile.get(PersonalityTrait.CONSCIENTIOUSNESS, 50) / 100

        # Map personality traits to target audio features for Spotify recommendations
        target_features = {}
        
        # Energy: Higher for extraverts, lower for introverts
        target_features["target_energy"] = max(0.1, min(0.9, 0.3 + (extraversion * 0.6)))
        
        # Valence (positivity): Lower for high neuroticism, higher for low neuroticism
        target_features["target_valence"] = max(0.1, min(0.9, 0.7 - (neuroticism * 0.5)))
        
        # Danceability: Higher for extraverts and agreeable people
        target_features["target_danceability"] = max(0.1, min(0.9, 0.4 + (extraversion * 0.3) + (agreeableness * 0.2)))
        
        # Acousticness: Higher for open and conscientious people
        target_features["target_acousticness"] = max(0.0, min(0.8, 0.2 + (openness * 0.3) + (conscientiousness * 0.2)))
        
        # Instrumentalness: Higher for highly open individuals
        target_features["target_instrumentalness"] = max(0.0, min(0.6, openness * 0.4))

        return target_features
    
    def _calculate_personality_match(
        self, 
        song: Dict[str, Any], 
        personality_profile: Dict[PersonalityTrait, float],
        genz_genre: str
    ) -> float:
        """Calculate how well a song matches the user's personality."""
        try:
            match_score = 0.5  # Base score
            
            # Genre-personality alignment
            spotify_genres = self.genz_genre_map.get(genz_genre, [])
            # Normalize function to match mapping keys like "hip-hop" vs "hip hop"
            def norm(g: str) -> str:
                g = g.lower().strip()
                g = g.replace('&', 'and')
                return g
            def hyphenate(g: str) -> str:
                return g.replace(' ', '-')

            for genre in spotify_genres:
                candidates = [norm(genre), hyphenate(norm(genre)), genre]
                # Find the right mapping for this genre
                mapping = {}
                for cand in candidates:
                    if cand in self.genre_personality_map:
                        mapping = self.genre_personality_map[cand]
                        break
                
                # Process the mapping if found
                for trait, correlation in mapping.items():
                    if correlation is not None and isinstance(correlation, (int, float)):  # Guard against None correlation
                        try:
                            trait_enum = PersonalityTrait(trait)
                            user_trait_score = personality_profile.get(trait_enum, 0.5)
                            if user_trait_score is not None and isinstance(user_trait_score, (int, float)):
                                # Positive correlation adds to match
                                match_score += correlation * user_trait_score * 0.1
                        except (ValueError, TypeError):
                            continue
            
            # Audio features alignment - guard against None values
            energy = song.get("energy")
            if energy is not None and isinstance(energy, (int, float)):
                # High energy for extraverts
                extraversion = personality_profile.get(PersonalityTrait.EXTRAVERSION, 0.5)
                if extraversion is not None and isinstance(extraversion, (int, float)):
                    match_score += (energy * extraversion - 0.25) * 0.15
            
            valence = song.get("valence")
            if valence is not None and isinstance(valence, (int, float)):
                # Happy music for emotionally stable (low neuroticism)
                neuroticism = personality_profile.get(PersonalityTrait.NEUROTICISM, 0.5)
                if neuroticism is not None and isinstance(neuroticism, (int, float)):
                    match_score += (valence * (1 - neuroticism) - 0.25) * 0.15
            
            # Normalize to 0-1 range
            return max(0.0, min(1.0, match_score))
            
        except Exception as e:
            self.logger.error(f"Error calculating personality match: {e}")
            return 0.5
    
    async def process_user_feedback(
        self,
        song_data: Dict[str, Any],
        personality_profile: Dict[PersonalityTrait, float],
        feedback_type: str,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Process user feedback (like, dislike, play) and update RL system.
        
        Args:
            song_data: Song metadata
            personality_profile: User's personality profile
            feedback_type: 'like', 'dislike', 'play', 'skip', 'save', etc.
            additional_data: Additional context (listen duration, etc.)
            
        Returns:
            Success status
        """
        try:
            # Feed into RL system
            await self.rl_system.process_feedback(
                music_data=song_data,
                personality_profile=personality_profile,
                feedback_type=feedback_type,
                additional_data=additional_data
            )
            
            self.logger.info(f"Processed {feedback_type} feedback for song: {song_data.get('name')}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error processing user feedback: {e}")
            return False
    
    def get_available_genres(self) -> List[str]:
        """Get list of available GenZ genre names."""
        return list(self.genz_genre_map.keys())
    
    def get_rl_statistics(self) -> Dict[str, Any]:
        """Get RL system statistics and insights."""
        return self.rl_system.get_learning_statistics()
    
    def get_genre_insights(self) -> Dict[str, Any]:
        """Get insights about genre performance and preferences."""
        return self.rl_system.get_genre_insights()