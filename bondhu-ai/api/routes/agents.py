"""
FastAPI routes for agent management and external API integrations.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse, RedirectResponse

from core import get_config
from agents import MusicIntelligenceAgent, VideoIntelligenceAgent, GamingIntelligenceAgent
from api.models.schemas import APIIntegrationStatus, HealthCheckResponse

# Create router
agents_router = APIRouter(prefix="/api/v1/agents", tags=["agents"])

@agents_router.get("/status", response_model=HealthCheckResponse)
async def get_agents_status() -> HealthCheckResponse:
    """
    Get health status of all agents and their integrations.
    
    Returns:
        Health check response with agent and integration status
    """
    try:
        config = get_config()
        
        # Check agent availability
        agents_status = {
            "music": True,  # Agents are always available if properly configured
            "video": True,
            "gaming": True,
            "personality": True
        }
        
        # Check API integrations
        api_integrations = {
            "spotify": bool(config.spotify.client_id and config.spotify.client_secret),
            "youtube": bool(config.youtube.api_key),
            "steam": bool(config.steam.api_key),
            "openai": bool(config.openai.api_key)
        }
        
        # Check database connection (placeholder)
        database_connected = bool(config.database.url and config.database.key)
        
        # Calculate memory usage (placeholder)
        memory_usage = {
            "total": 0.0,
            "agents": 0.0,
            "orchestrator": 0.0
        }
        
        return HealthCheckResponse(
            status="healthy" if all(agents_status.values()) else "degraded",
            agents=agents_status,
            database_connected=database_connected,
            api_integrations=api_integrations,
            memory_usage=memory_usage
        )
        
    except Exception as e:
        logging.error(f"Error getting agents status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get status: {str(e)}"
        )

@agents_router.get("/music/connect")
async def get_spotify_auth_url(user_id: str) -> JSONResponse:
    """
    Get Spotify OAuth authorization URL for music agent integration.
    
    Args:
        user_id: User ID for the integration
        
    Returns:
        Spotify authorization URL
    """
    try:
        # Create temporary music agent to get auth URL
        music_agent = MusicIntelligenceAgent(user_id=user_id)
        auth_url = music_agent.get_spotify_auth_url()
        
        if not auth_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate Spotify authorization URL"
            )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "auth_url": auth_url,
                "user_id": user_id,
                "service": "spotify"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting Spotify auth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get auth URL: {str(e)}"
        )

@agents_router.get("/music/callback")
async def handle_spotify_callback(
    code: str,
    state: Optional[str] = None,
    user_id: Optional[str] = None
) -> RedirectResponse:
    """
    Handle Spotify OAuth callback and complete authentication.
    
    Args:
        code: Authorization code from Spotify
        state: Optional state parameter
        user_id: User ID for the integration
        
    Returns:
        Redirect to frontend with success/error status
    """
    try:
        if not user_id:
            # Try to extract user_id from state parameter (we set it during /music/connect)
            if state:
                user_id = state
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User ID required for callback"
                )
        
        # Create music agent and handle callback
        music_agent = MusicIntelligenceAgent(user_id=user_id)
        success = await music_agent.handle_spotify_callback(code)
        
        if success:
            # Store integration status in database (placeholder)
            # await update_integration_status(user_id, "spotify", True)
            
            # Redirect to frontend success page
            return RedirectResponse(
                url=f"http://localhost:3000/dashboard?spotify_connected=true",
                status_code=status.HTTP_302_FOUND
            )
        else:
            # Redirect to frontend error page
            return RedirectResponse(
                url=f"http://localhost:3000/dashboard?spotify_error=auth_failed",
                status_code=status.HTTP_302_FOUND
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error handling Spotify callback: {e}")
        return RedirectResponse(
            url=f"http://localhost:3000/dashboard?spotify_error=callback_failed",
            status_code=status.HTTP_302_FOUND
        )

@agents_router.post("/music/disconnect/{user_id}")
async def disconnect_spotify(user_id: str) -> JSONResponse:
    """
    Disconnect Spotify integration for a user.
    
    Args:
        user_id: User ID to disconnect
        
    Returns:
        Disconnection confirmation
    """
    try:
        # Remove stored Spotify tokens (placeholder)
        # await remove_spotify_tokens(user_id)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Spotify disconnected successfully",
                "user_id": user_id,
                "service": "spotify",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logging.error(f"Error disconnecting Spotify: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect: {str(e)}"
        )

@agents_router.get("/music/genres")
async def get_available_genres() -> JSONResponse:
    """
    Get list of available GenZ-friendly music genres.
    
    Returns:
        List of genre names
    """
    try:
        # Create temporary music agent to get genres
        music_agent = MusicIntelligenceAgent(user_id="temp")
        genres = music_agent.get_available_genres()
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "genres": genres,
                "total_count": len(genres)
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting genres: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get genres: {str(e)}"
        )

@agents_router.get("/music/history/{user_id}")
async def get_music_history_by_genre(
    user_id: str,
    spotify_token: str,
    time_range: str = "medium_term"
) -> JSONResponse:
    """
    Get user's Spotify listening history organized by GenZ genres.
    
    Args:
        user_id: User ID
        spotify_token: Spotify access token
        time_range: "short_term", "medium_term", or "long_term"
        
    Returns:
        Genre-organized listening history
    """
    try:
        # Create music agent with token
        music_agent = MusicIntelligenceAgent(user_id=user_id, spotify_token=spotify_token)
        
        # Fetch genre-based history
        genre_history = await music_agent.fetch_genre_based_history(time_range=time_range)
        
        # Calculate statistics
        total_tracks = sum(len(tracks) for tracks in genre_history.values())
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "user_id": user_id,
                "genre_history": genre_history,
                "total_tracks": total_tracks,
                "total_genres": len(genre_history),
                "time_range": time_range,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting music history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get music history: {str(e)}"
        )

@agents_router.post("/music/recommendations/{user_id}")
async def get_music_recommendations(
    user_id: str,
    request_data: Dict[str, Any]
) -> JSONResponse:
    """
    Get personalized music recommendations by genre.
    
    Args:
        user_id: User ID
        request_data: {
            "spotify_token": str,
            "personality_profile": Dict[str, float],
            "genres": Optional[List[str]],
            "songs_per_genre": int (default 3),
            "use_history": bool (default True)
        }
        
    Returns:
        Genre-organized music recommendations with Spotify links
    """
    try:
        spotify_token = request_data.get("spotify_token")
        personality_profile = request_data.get("personality_profile", {})
        genres = request_data.get("genres")
        songs_per_genre = request_data.get("songs_per_genre", 3)
        use_history = request_data.get("use_history", True)
        refresh_salt = request_data.get("refresh_salt")
        
        # Convert personality profile to enum keys
        from api.models.schemas import PersonalityTrait
        profile = {}
        for trait_name, score in personality_profile.items():
            try:
                trait_enum = PersonalityTrait(trait_name.lower())
                profile[trait_enum] = float(score)
            except ValueError:
                logging.warning(f"Invalid personality trait: {trait_name}")
        
        # Create music agent (will use user token if provided, else app credentials)
        music_agent = MusicIntelligenceAgent(user_id=user_id, spotify_token=spotify_token)

        # If no token, first attempt real Spotify recommendations using app credentials
        recommendations = await music_agent.get_recommendations_by_genre(
            personality_profile=profile,
            genres=genres,
            songs_per_genre=songs_per_genre,
            use_history=bool(spotify_token) and use_history,
            refresh_salt=refresh_salt
        )

        # Fallback to persona-only placeholders if nothing returned
        if not recommendations:
            # If no token, try to fetch personality from DB if not provided
            if not personality_profile:
                try:
                    from core.database.supabase_client import SupabaseClient
                    supabase = SupabaseClient()
                    pdata = await supabase.get_user_personality(user_id)
                    if pdata and pdata.get('scores'):
                        personality_profile = pdata['scores']
                except Exception:
                    pass

            recommendations = await music_agent.get_persona_only_recommendations(
                personality_profile=profile,
                genres=genres,
                songs_per_genre=songs_per_genre,
                refresh_salt=refresh_salt
            )
        
        # Format response with action buttons metadata
        formatted_recommendations = {}
        for genre, songs in recommendations.items():
            formatted_recommendations[genre] = [
                {
                    **song,
                    "actions": {
                        "like": f"/api/v1/agents/music/feedback/{user_id}",
                        "dislike": f"/api/v1/agents/music/feedback/{user_id}",
                        "play": song.get("external_url", "#"),
                    }
                }
                for song in songs
            ]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "user_id": user_id,
                "recommendations": formatted_recommendations,
                "total_genres": len(formatted_recommendations),
                "songs_per_genre": songs_per_genre,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting music recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )

@agents_router.post("/music/feedback/{user_id}")
async def record_music_feedback(
    user_id: str,
    feedback_data: Dict[str, Any]
) -> JSONResponse:
    """
    Record user feedback on music recommendations (like/dislike/play).
    Feeds into RL system for personalized learning.
    
    Args:
        user_id: User ID
        feedback_data: {
            "song_id": str,
            "song_data": Dict[str, Any],
            "feedback_type": str ("like", "dislike", "play", "skip", "save"),
            "personality_profile": Dict[str, float],
            "additional_data": Optional[Dict] (listen_duration, etc.)
        }
        
    Returns:
        Feedback processing confirmation
    """
    try:
        song_data = feedback_data.get("song_data", {})
        feedback_type = feedback_data.get("feedback_type")
        personality_profile = feedback_data.get("personality_profile", {})
        additional_data = feedback_data.get("additional_data")
        spotify_token = feedback_data.get("spotify_token")
        
        if not feedback_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Feedback type required"
            )
        
        if not song_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Song data required"
            )
        
        # Convert personality profile to enum keys
        from api.models.schemas import PersonalityTrait
        profile = {}
        for trait_name, score in personality_profile.items():
            try:
                trait_enum = PersonalityTrait(trait_name.lower())
                profile[trait_enum] = float(score)
            except ValueError:
                pass
        
        # Create music agent
        music_agent = MusicIntelligenceAgent(user_id=user_id, spotify_token=spotify_token)
        
        # Process feedback through RL system
        success = await music_agent.process_user_feedback(
            song_data=song_data,
            personality_profile=profile,
            feedback_type=feedback_type,
            additional_data=additional_data
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process feedback"
            )
        
        # Get updated RL statistics
        rl_stats = music_agent.get_rl_statistics()
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Feedback recorded successfully",
                "user_id": user_id,
                "feedback_type": feedback_type,
                "song_name": song_data.get("name"),
                "rl_stats": {
                    "training_episodes": rl_stats.get("training_episodes"),
                    "average_reward": rl_stats.get("average_reward")
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error recording music feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record feedback: {str(e)}"
        )

@agents_router.get("/music/insights/{user_id}")
async def get_music_insights(
    user_id: str,
    spotify_token: str
) -> JSONResponse:
    """
    Get music learning insights and genre performance statistics.
    
    Args:
        user_id: User ID
        spotify_token: Spotify access token
        
    Returns:
        RL statistics and genre insights
    """
    try:
        # Create music agent
        music_agent = MusicIntelligenceAgent(user_id=user_id, spotify_token=spotify_token)
        
        # Get RL statistics and genre insights
        rl_stats = music_agent.get_rl_statistics()
        genre_insights = music_agent.get_genre_insights()
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "user_id": user_id,
                "rl_statistics": rl_stats,
                "genre_insights": genre_insights,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting music insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get insights: {str(e)}"
        )

@agents_router.post("/video/data/{user_id}")
async def submit_video_data(
    user_id: str,
    video_data: Dict[str, Any]
) -> JSONResponse:
    """
    Submit manual video consumption data for analysis.
    
    Args:
        user_id: User ID submitting data
        video_data: Video consumption data
        
    Returns:
        Submission confirmation
    """
    try:
        # Validate video data
        if not video_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty video data"
            )
        
        # Store video data (placeholder)
        # await store_video_data(user_id, video_data)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Video data submitted successfully",
                "user_id": user_id,
                "data_points": len(video_data.get("favorite_channels", [])),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error submitting video data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit data: {str(e)}"
        )

@agents_router.post("/gaming/data/{user_id}")
async def submit_gaming_data(
    user_id: str,
    gaming_data: Dict[str, Any]
) -> JSONResponse:
    """
    Submit manual gaming data for analysis.
    
    Args:
        user_id: User ID submitting data
        gaming_data: Gaming behavior and preference data
        
    Returns:
        Submission confirmation
    """
    try:
        # Validate gaming data
        if not gaming_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty gaming data"
            )
        
        # Store gaming data (placeholder)
        # await store_gaming_data(user_id, gaming_data)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Gaming data submitted successfully",
                "user_id": user_id,
                "games_count": len(gaming_data.get("favorite_games", [])),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error submitting gaming data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit data: {str(e)}"
        )

@agents_router.get("/{user_id}/integrations", response_model=APIIntegrationStatus)
async def get_user_integrations(user_id: str) -> APIIntegrationStatus:
    """
    Get the current API integration status for a user.
    
    Args:
        user_id: User ID to check integrations for
        
    Returns:
        User's API integration status
    """
    try:
        # Note: In a real implementation, this would fetch from database
        # For now, returning default status
        
        return APIIntegrationStatus(
            user_id=user_id,
            spotify_connected=False,
            youtube_connected=False,
            steam_connected=False
        )
        
    except Exception as e:
        logging.error(f"Error getting user integrations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get integrations: {str(e)}"
        )

@agents_router.post("/{agent_type}/{user_id}/reset")
async def reset_agent_data(
    agent_type: str,
    user_id: str
) -> JSONResponse:
    """
    Reset collected data for a specific agent.
    
    Args:
        agent_type: Type of agent (music, video, gaming)
        user_id: User ID to reset data for
        
    Returns:
        Reset confirmation
    """
    try:
        valid_agents = ["music", "video", "gaming"]
        if agent_type not in valid_agents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid agent type. Must be one of: {valid_agents}"
            )
        
        # Reset agent data (placeholder)
        # await reset_agent_data_for_user(user_id, agent_type)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"{agent_type.title()} agent data reset successfully",
                "user_id": user_id,
                "agent_type": agent_type,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error resetting agent data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset data: {str(e)}"
        )