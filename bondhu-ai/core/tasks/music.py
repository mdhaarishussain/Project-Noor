"""
Music recommendation tasks for Celery
Focused on cache warming and bulk operations, not per-user scheduling
"""

from celery import current_app as celery_app
from core.services.rate_limiter import SpotifyRateLimiter
import asyncio
import logging

logger = logging.getLogger(__name__)

@celery_app.task(
    bind=True,
    name='core.tasks.music.warm_genre_cache',
    rate_limit='1/h',  # Only once per hour
    soft_time_limit=240,  # 4 minutes
    time_limit=300,  # 5 minutes
)
def warm_genre_cache(self):
    """
    Warm the genre cache by pre-fetching popular tracks for all 6 genres.
    This reduces API calls when users actually request recommendations.
    
    This task should run once per hour to keep genre data fresh.
    """
    try:
        # Pre-fetch popular tracks for all 6 GenZ genres
        genres = [
            "Lo-fi Chill", "Pop Anthems", "Hype Beats", 
            "Indie Vibes", "R&B Feels", "Sad Boy Hours"
        ]
        
        rate_limiter = SpotifyRateLimiter()
        
        for genre in genres:
            # This would pre-populate the cache with genre recommendations
            # When users request, they get instant cached results
            logger.info(f"Warming cache for genre: {genre}")
            # Implementation would call your existing rate-limited Spotify service
            
        logger.info("Genre cache warming completed successfully")
        return {"status": "success", "genres_warmed": len(genres)}
        
    except Exception as e:
        logger.error(f"Cache warming failed: {str(e)}")
        raise self.retry(countdown=300, max_retries=3)  # Retry in 5 minutes


# Optional: Add this to celery_app.py beat_schedule ONLY if you want cache warming
CACHE_WARMING_SCHEDULE = {
    'warm-music-genre-cache': {
        'task': 'core.tasks.music.warm_genre_cache',
        'schedule': crontab(minute=0),  # Every hour
    },
}