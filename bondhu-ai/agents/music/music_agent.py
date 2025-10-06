"""
Music Intelligence Agent for analyzing user music preferences and personality insights.
Integrates with Spotify API to gather listening data and patterns.
Enhanced with rate limiting and caching for production scale (1000+ users).
"""

import asyncio
import spotipy
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

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
                self.logger.info("Spotify authentication successful")
                return True
        except Exception as e:
            self.logger.error(f"Error handling Spotify callback: {e}")
        
        return False
    
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
            
            # Get user's listening history by genre (only if we have user token)
            if use_history and self.spotify_token:
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
            data = await asyncio.to_thread(self.spotify_client.recommendations_genre_seeds)
            genres = [g.lower() for g in data.get('genres', [])]
            self._seed_genres_cache = genres
            return genres
        except Exception as e:
            self.logger.warning(f"Failed to load available seed genres: {e}")
            # Reasonable defaults if API fails
            defaults = [
                'pop','dance','electronic','hip-hop','r-n-b','soul','indie','chill','ambient','acoustic','emo','rock','alternative'
            ]
            self._seed_genres_cache = defaults
            return defaults

    def _normalize_seed(self, s: str) -> str:
        s = s.lower().replace('&', '-').replace(' ', '-')
        # Remove double hyphens
        while '--' in s:
            s = s.replace('--', '-')
        return ''.join(ch for ch in s if ch.isalnum() or ch == '-')

    async def _get_valid_seed_genres_for_genz(self, genz_genre: str) -> List[str]:
        """Translate a GenZ genre to valid Spotify recommendation seed genres."""
        available = set(await self._get_available_seed_genres())

        # Hand-tuned preferred seeds per GenZ genre
        preferred: Dict[str, List[str]] = {
            'Lo-fi Chill': ['chill','ambient','acoustic'],
            'Pop Anthems': ['pop','dance','electronic'],
            'Hype Beats': ['hip-hop','trap','electronic'],
            'Indie Vibes': ['indie','alternative','indie-pop'],
            'R&B Feels': ['r-n-b','soul'],
            'Sad Boy Hours': ['emo','indie','acoustic'],
        }

        seeds = []
        for cand in preferred.get(genz_genre, []):
            norm = self._normalize_seed(cand)
            if norm in available:
                seeds.append(norm)

        # If still empty, try to normalize our original map entries
        if not seeds:
            for raw in self.genz_genre_map.get(genz_genre, [])[:5]:
                norm = self._normalize_seed(raw)
                if norm in available and norm not in seeds:
                    seeds.append(norm)

        # Final fallback to broadly matching seeds
        if not seeds:
            generic = ['pop','indie','hip-hop','r-n-b','chill','electronic']
            seeds = [g for g in generic if g in available]

        # Ensure non-empty and max 3
        return seeds[:3] if seeds else ['pop']
    
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
            genres = seed_genres[:2] if seed_genres else []
            
            # Need at least one seed
            if not track_ids and not genres:
                return []
            
            # Get recommendations with rate limiting
            results = await spotify_rate_limiter.rate_limited_call(
                "recommendations",
                self.spotify_client.recommendations,
                seed_tracks=track_ids if track_ids else None,
                seed_genres=genres if genres else None,
                limit=limit
            )
            
            tracks = results.get("tracks", [])

            # Enrich with audio features
            track_ids = [t.get("id") for t in tracks if t.get("id")]
            audio_features = await self._get_audio_features(track_ids, salt=salt)

            # Combine track info with audio features
            enriched_tracks = []
            for track in tracks:
                track_id = track.get("id")
                enriched_track = {
                    "id": track_id,
                    "name": track.get("name"),
                    "artists": [a.get("name") for a in track.get("artists", [])],
                    "album": track.get("album", {}).get("name"),
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
        """Generate recommendations without a user token using app credentials.

        Uses Spotify recommendation seeds mapped from GenZ genres to return real tracks.
        Falls back to simple search if recommendations fail.
        """
        try:
            recommendations: Dict[str, List[Dict[str, Any]]] = {}
            target_genres = genres if genres else list(self.genz_genre_map.keys())

            # Simple heuristics: pick top-N genres by alignment to personality
            def genre_alignment(genz: str) -> float:
                score = 0.0
                for sp_genre in self.genz_genre_map.get(genz, []):
                    mapping = self.genre_personality_map.get(sp_genre, {})
                    for trait_name, coeff in mapping.items():
                        try:
                            trait_enum = PersonalityTrait(trait_name)
                            score += coeff * personality_profile.get(trait_enum, 0.5)
                        except Exception:
                            continue
                return score

            ranked = sorted(target_genres, key=genre_alignment, reverse=True)
            # Apply light shuffle with refresh_salt for diversity across refreshes
            if refresh_salt is not None:
                try:
                    import random as _rnd
                    r = _rnd.Random(refresh_salt)
                    r.shuffle(ranked)
                except Exception:
                    pass
            for genz in ranked:
                seeds = await self._get_valid_seed_genres_for_genz(genz)
                items = await self._get_spotify_recommendations(
                    seed_tracks=None,
                    seed_genres=seeds[:2],
                    limit=songs_per_genre * 3,
                    salt=refresh_salt,
                )

                # If recommendations API failed, fallback to simple search
                if not items:
                    try:
                        search_q = f"{seeds[0]}"
                        res = await asyncio.to_thread(self.spotify_client.search, q=search_q, type='track', limit=songs_per_genre * 3)
                        tracks = res.get('tracks', {}).get('items', [])
                        track_ids = [t.get('id') for t in tracks if t.get('id')]
                        feats = await self._get_audio_features(track_ids, salt=refresh_salt)
                        items = []
                        for t in tracks:
                            tid = t.get('id')
                            features = feats.get(tid, {}) if tid else {}
                            items.append({
                                "id": tid or f"search-{genz}",
                                "name": t.get('name', 'Unknown'),
                                "artists": [a.get('name') for a in t.get('artists', [])],
                                "album": t.get('album', {}).get('name'),
                                "preview_url": t.get('preview_url'),
                                "external_url": t.get('external_urls', {}).get('spotify', f"https://open.spotify.com/search/{search_q}"),
                                "duration_ms": t.get('duration_ms'),
                                "popularity": t.get('popularity'),
                                "energy": features.get('energy'),
                                "valence": features.get('valence'),
                                "danceability": features.get('danceability'),
                                "tempo": features.get('tempo'),
                            })
                    except Exception:
                        items = []

                # Add personality/genre metadata
                for song in items:
                    song['genz_genre'] = genz
                    song['genre'] = genz
                    song['personality_match'] = self._calculate_personality_match(song, personality_profile, genz)

                recommendations[genz] = items[:songs_per_genre]

            return recommendations
        except Exception as e:
            self.logger.error(f"Error building persona-only recommendations: {e}")
            return {}
    
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
                candidates = [norm(genre), hyphenate(norm(genre))]
                # Also check original genre_personality_map keys lowercased
                for cand in candidates:
                    if cand in self.genre_personality_map:
                        mapping = self.genre_personality_map[cand]
                    else:
                        # Try direct lookup if keys were defined without normalization
                        mapping = self.genre_personality_map.get(genre, {})
                    if not mapping:
                        continue
                    for trait, correlation in self.genre_personality_map[genre].items():
                        trait_enum = PersonalityTrait(trait)
                        user_trait_score = personality_profile.get(trait_enum, 0.5)
                        # Positive correlation adds to match
                        match_score += correlation * user_trait_score * 0.1
            
            # Audio features alignment
            if "energy" in song:
                # High energy for extraverts
                extraversion = personality_profile.get(PersonalityTrait.EXTRAVERSION, 0.5)
                match_score += (song["energy"] * extraversion - 0.25) * 0.15
            
            if "valence" in song:
                # Happy music for emotionally stable (low neuroticism)
                neuroticism = personality_profile.get(PersonalityTrait.NEUROTICISM, 0.5)
                match_score += (song["valence"] * (1 - neuroticism) - 0.25) * 0.15
            
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