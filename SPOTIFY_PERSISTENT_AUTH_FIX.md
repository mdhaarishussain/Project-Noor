# Spotify Persistent Authentication - Implementation Guide

## Problem
Users have to reconnect Spotify every time they log into Bondhu, even though Spotify tokens are stored in the database.

## Root Causes

1. **Token Expiration**: Spotify access tokens expire after 1 hour
2. **No Token Refresh**: System doesn't automatically refresh expired tokens
3. **Frontend doesn't persist connection state**: Connection status lost on page reload

## Solution

### 1. Backend: Automatic Token Refresh (PRIORITY)

The backend needs to automatically refresh expired Spotify tokens using the refresh token.

**File**: `bondhu-ai/agents/music/music_agent.py`

Add method to refresh tokens:

```python
async def refresh_spotify_token(self) -> bool:
    """
    Refresh expired Spotify access token using refresh token.
    Returns True if successful, False otherwise.
    """
    try:
        from core.database.supabase_client import get_supabase_client
        supabase = get_supabase_client()
        
        # Get current tokens
        token_data = await supabase.get_spotify_tokens(self.user_id)
        if not token_data or not token_data.get('refresh_token'):
            return False
        
        # Check if token needs refresh
        expires_at = datetime.fromisoformat(token_data['expires_at'].replace('Z', '+00:00'))
        if expires_at > datetime.now(timezone.utc) + timedelta(minutes=5):
            # Token still valid for > 5 minutes
            return True
        
        # Refresh the token
        refresh_token = token_data['refresh_token']
        
        import requests
        from core.config.settings import get_config
        config = get_config()
        
        response = requests.post(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': config.spotify_client_id,
                'client_secret': config.spotify_client_secret
            }
        )
        
        if response.status_code == 200:
            token_info = response.json()
            new_access_token = token_info['access_token']
            expires_in = token_info['expires_in']
            new_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            
            # Update stored tokens
            await supabase.update_spotify_tokens(
                user_id=self.user_id,
                access_token=new_access_token,
                expires_at=new_expires_at
            )
            
            self.logger.info(f"Successfully refreshed Spotify token for user {self.user_id}")
            return True
        else:
            self.logger.error(f"Failed to refresh Spotify token: {response.text}")
            return False
            
    except Exception as e:
        self.logger.error(f"Error refreshing Spotify token: {e}")
        return False
```

### 2. Update `/music/status` to Auto-Refresh

**File**: `bondhu-ai/api/routes/agents.py`

Modify the status check to automatically refresh expired tokens:

```python
@agents_router.get("/music/status/{user_id}")
async def get_spotify_status(user_id: str) -> JSONResponse:
    """
    Check if user has a valid Spotify connection.
    Automatically refreshes expired tokens.
    """
    try:
        from core.database.supabase_client import get_supabase_client
        from agents.music.music_agent import MusicIntelligenceAgent
        supabase = get_supabase_client()
        
        token_data = await supabase.get_spotify_tokens(user_id)
        
        if token_data and token_data.get('access_token'):
            # Check if token is expired or expiring soon
            if token_data['expires_at']:
                from datetime import datetime, timezone, timedelta
                expires_at = datetime.fromisoformat(token_data['expires_at'].replace('Z', '+00:00'))
                
                # If token expires in < 5 minutes, refresh it
                if expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
                    music_agent = MusicIntelligenceAgent(user_id=user_id)
                    refreshed = await music_agent.refresh_spotify_token()
                    
                    if not refreshed:
                        # Refresh failed, connection is dead
                        return JSONResponse(
                            status_code=status.HTTP_200_OK,
                            content={
                                "connected": False,
                                "reason": "token_refresh_failed"
                            }
                        )
                    
                    # Get updated token data
                    token_data = await supabase.get_spotify_tokens(user_id)
                
                # Token is valid
                return JSONResponse(
                    status_code=status.HTTP_200_OK,
                    content={
                        "connected": True,
                        "spotify_user_id": token_data.get('spotify_user_id'),
                        "spotify_user_email": token_data.get('spotify_user_email'),
                        "connected_at": token_data.get('connected_at'),
                        "expires_at": token_data.get('expires_at'),
                        "auto_refreshed": True
                    }
                )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"connected": False}
        )
        
    except Exception as e:
        logging.error(f"Error checking Spotify status for user {user_id}: {e}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"connected": False, "error": str(e)}
        )
```

### 3. Frontend: Check Connection on App Load

**File**: `bondhu-landing/src/components/music-recommendations.tsx`

Update to check connection immediately on mount:

```typescript
// In useEffect on mount
useEffect(() => {
    const initializeSpotify = async () => {
        // Check for existing connection FIRST
        await checkSpotifyConnection()
        
        // Then fetch genres
        fetchGenres()
        
        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('spotify_connected') === 'true') {
            setSpotifyConnected(true)
            toast.success('🎵 Spotify connected successfully!')
        }
        
        const error = urlParams.get('spotify_error')
        if (error) {
            toast.error(`Spotify connection failed: ${error}`)
        }
    }
    
    initializeSpotify()
}, [userId])
```

### 4. Add Background Token Refresh

Create a background service that periodically refreshes tokens for all users:

**File**: `bondhu-ai/core/tasks/spotify_refresh.py`

```python
"""
Background task to refresh Spotify tokens before they expire.
Runs every 30 minutes to ensure all tokens stay fresh.
"""

from core.celery_app import celery_app
from core.database.supabase_client import get_supabase_client
from agents.music.music_agent import MusicIntelligenceAgent
import logging

logger = logging.getLogger("bondhu.spotify_refresh")


@celery_app.task
def refresh_all_spotify_tokens():
    """
    Periodic task to refresh Spotify tokens for all connected users.
    Runs every 30 minutes via Celery Beat.
    """
    try:
        logger.info("Starting Spotify token refresh for all users")
        
        supabase = get_supabase_client()
        
        # Get all users with Spotify connections
        # This query needs to be added to supabase_client
        result = supabase.supabase.table('profiles').select(
            'id, spotify_token_expires_at'
        ).not_.is_('spotify_access_token', 'null').execute()
        
        users = result.data or []
        refreshed_count = 0
        failed_count = 0
        
        for user in users:
            user_id = user['id']
            try:
                music_agent = MusicIntelligenceAgent(user_id=user_id)
                success = await music_agent.refresh_spotify_token()
                
                if success:
                    refreshed_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"Failed to refresh token for user {user_id}: {e}")
                failed_count += 1
        
        logger.info(
            f"Spotify token refresh complete: "
            f"{refreshed_count} refreshed, {failed_count} failed, "
            f"{len(users)} total users"
        )
        
        return {
            'status': 'success',
            'refreshed': refreshed_count,
            'failed': failed_count,
            'total': len(users)
        }
        
    except Exception as e:
        logger.error(f"Spotify token refresh task failed: {e}")
        return {'status': 'error', 'error': str(e)}
```

Add to Celery Beat schedule in `bondhu-ai/core/celery_app.py`:

```python
celery_app.conf.beat_schedule = {
    # ... existing schedules ...
    'refresh-spotify-tokens': {
        'task': 'core.tasks.spotify_refresh.refresh_all_spotify_tokens',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
}
```

## Deployment Steps

1. **Add refresh method to music_agent.py**
2. **Update /music/status endpoint**
3. **Create spotify_refresh.py task**
4. **Update Celery Beat schedule**
5. **Restart services**

```bash
cd bondhu-ai
docker-compose restart bondhu-ai
docker-compose restart celery-worker
docker-compose restart celery-beat
```

## Testing

```bash
# Test token refresh manually
python -c "
from agents.music.music_agent import MusicIntelligenceAgent
agent = MusicIntelligenceAgent(user_id='YOUR_USER_ID')
success = await agent.refresh_spotify_token()
print(f'Refresh successful: {success}')
"

# Test status endpoint
curl http://localhost:8000/agents/music/status/YOUR_USER_ID
```

## Expected Behavior After Fix

1. ✅ User connects Spotify once
2. ✅ Tokens stored in database
3. ✅ User logs out and logs back in
4. ✅ Frontend checks `/music/status`
5. ✅ Backend auto-refreshes expired token
6. ✅ Frontend shows "Spotify connected" immediately
7. ✅ Background task keeps all tokens fresh
8. ✅ User never needs to reconnect (unless they revoke access)

## Monitoring

Add logs to track token refresh:

```python
logger.info(f"Token expires at: {expires_at}")
logger.info(f"Current time: {datetime.now(timezone.utc)}")
logger.info(f"Time until expiry: {expires_at - datetime.now(timezone.utc)}")
logger.info(f"Needs refresh: {expires_at < datetime.now(timezone.utc) + timedelta(minutes=5)}")
```

## Benefits

- ✅ No more repeated Spotify logins
- ✅ Seamless user experience
- ✅ Automatic token management
- ✅ Background refresh prevents expiration
- ✅ Reduces OAuth API calls to Spotify
- ✅ Better reliability

---

**Status**: Ready to implement
**Priority**: HIGH (UX issue)
**Effort**: ~2 hours
