"""
YouTube OAuth authentication routes.
Handles Google OAuth flow for YouTube API access.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from typing import Dict, Any
import secrets
import logging
from datetime import datetime

from core.services.google_oauth_service import get_google_oauth_service
from core.config import get_config
from core.database.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/v1/auth/youtube", tags=["youtube-auth"])
logger = logging.getLogger(__name__)

# In-memory state store (use Redis in production)
oauth_states: Dict[str, str] = {}


@router.get("/connect")
async def connect_youtube(user_id: str):
    """
    Initiate YouTube OAuth flow.
    
    Args:
        user_id: User identifier
        
    Returns:
        Authorization URL for user to visit
    """
    try:
        config = get_config()
        oauth_service = get_google_oauth_service(config)
        
        # Generate state token for CSRF protection
        state = secrets.token_urlsafe(32)
        oauth_states[state] = user_id
        
        # Get authorization URL
        auth_url = oauth_service.get_authorization_url(state)
        
        logger.info(f"🔗 Generated YouTube OAuth URL for user {user_id}")
        
        return {
            "authorization_url": auth_url,
            "state": state
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating YouTube OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate OAuth URL: {str(e)}")


@router.get("/callback")
async def youtube_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State token for CSRF protection"),
    error: str = Query(None, description="Error from OAuth provider"),
    supabase=Depends(get_supabase_client)
):
    """
    Handle YouTube OAuth callback.
    
    Exchanges authorization code for access token and stores in database.
    """
    try:
        # Check for OAuth errors
        if error:
            logger.error(f"❌ OAuth error: {error}")
            config = get_config()
            return RedirectResponse(
                url=f"{config.frontend_url}/entertainment?youtube_error={error}"
            )
        
        # Verify state token
        if state not in oauth_states:
            logger.error(f"❌ Invalid state token: {state}")
            raise HTTPException(status_code=400, detail="Invalid state token")
        
        user_id = oauth_states.pop(state)
        logger.info(f"✅ Valid state token for user {user_id}")
        
        # Exchange code for token
        config = get_config()
        oauth_service = get_google_oauth_service(config)
        token_data = await oauth_service.exchange_code_for_token(code)
        
        # Get user info from Google
        user_info = await oauth_service.get_user_info(token_data['access_token'])
        
        # Store token in Supabase
        integration_data = {
            'user_id': user_id,
            'provider': 'youtube',
            'access_token': token_data['access_token'],
            'refresh_token': token_data.get('refresh_token'),
            'token_type': token_data['token_type'],
            'token_expiry': token_data['expiry'],
            'scopes': token_data['scope'].split(' ') if isinstance(token_data['scope'], str) else token_data['scope'],
            'provider_user_id': user_info.get('id') if user_info else None,
            'provider_user_email': user_info.get('email') if user_info else None,
            'connected_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        result = supabase.table('user_integrations').upsert(
            integration_data,
            on_conflict='user_id,provider'
        ).execute()
        
        logger.info(f"✅ YouTube connected for user {user_id} ({user_info.get('email') if user_info else 'unknown'})")
        
        # Redirect back to frontend
        return RedirectResponse(
            url=f"{config.frontend_url}/entertainment?youtube_connected=true&tab=video"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in YouTube OAuth callback: {e}", exc_info=True)
        config = get_config()
        return RedirectResponse(
            url=f"{config.frontend_url}/entertainment?youtube_error={str(e)}"
        )


@router.get("/status/{user_id}")
async def youtube_connection_status(
    user_id: str,
    supabase=Depends(get_supabase_client)
):
    """
    Check if user has connected YouTube.
    
    Args:
        user_id: User identifier
        
    Returns:
        Connection status and details
    """
    try:
        result = supabase.table('user_integrations')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('provider', 'youtube')\
            .execute()
        
        if result.data and len(result.data) > 0:
            integration = result.data[0]
            
            # Check if token is expired
            token_expiry = integration.get('token_expiry')
            is_expired = False
            if token_expiry:
                try:
                    expiry_dt = datetime.fromisoformat(token_expiry.replace('Z', '+00:00'))
                    is_expired = datetime.now(expiry_dt.tzinfo) > expiry_dt
                except Exception as e:
                    logger.warning(f"⚠️ Could not parse token expiry: {e}")
            
            return {
                "connected": True,
                "connected_at": integration.get('connected_at'),
                "provider_user_email": integration.get('provider_user_email'),
                "needs_refresh": is_expired,
                "scopes": integration.get('scopes', [])
            }
        else:
            return {
                "connected": False,
                "needs_refresh": False
            }
            
    except Exception as e:
        logger.error(f"❌ Error checking YouTube status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")


@router.post("/disconnect/{user_id}")
async def disconnect_youtube(
    user_id: str,
    supabase=Depends(get_supabase_client)
):
    """
    Disconnect YouTube integration.
    
    Args:
        user_id: User identifier
        
    Returns:
        Success message
    """
    try:
        # Get token to revoke
        result = supabase.table('user_integrations')\
            .select('access_token, refresh_token')\
            .eq('user_id', user_id)\
            .eq('provider', 'youtube')\
            .execute()
        
        if result.data and len(result.data) > 0:
            integration = result.data[0]
            
            # Revoke token with Google
            config = get_config()
            oauth_service = get_google_oauth_service(config)
            
            # Try to revoke refresh token (more permanent)
            if integration.get('refresh_token'):
                await oauth_service.revoke_token(integration['refresh_token'])
            else:
                # Fallback to access token
                await oauth_service.revoke_token(integration['access_token'])
        
        # Delete from database
        supabase.table('user_integrations')\
            .delete()\
            .eq('user_id', user_id)\
            .eq('provider', 'youtube')\
            .execute()
        
        logger.info(f"✅ YouTube disconnected for user {user_id}")
        
        return {
            "success": True,
            "message": "YouTube disconnected successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Error disconnecting YouTube: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to disconnect: {str(e)}")


@router.post("/refresh/{user_id}")
async def refresh_youtube_token(
    user_id: str,
    supabase=Depends(get_supabase_client)
):
    """
    Refresh YouTube access token.
    
    Args:
        user_id: User identifier
        
    Returns:
        New token data
    """
    try:
        # Get refresh token
        result = supabase.table('user_integrations')\
            .select('refresh_token')\
            .eq('user_id', user_id)\
            .eq('provider', 'youtube')\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="YouTube not connected")
        
        refresh_token = result.data[0].get('refresh_token')
        if not refresh_token:
            raise HTTPException(
                status_code=400,
                detail="No refresh token available. Please reconnect YouTube."
            )
        
        # Refresh token
        config = get_config()
        oauth_service = get_google_oauth_service(config)
        token_data = await oauth_service.refresh_access_token(refresh_token)
        
        # Update in database
        update_data = {
            'access_token': token_data['access_token'],
            'token_expiry': token_data['expiry'],
            'updated_at': datetime.now().isoformat()
        }
        
        supabase.table('user_integrations')\
            .update(update_data)\
            .eq('user_id', user_id)\
            .eq('provider', 'youtube')\
            .execute()
        
        logger.info(f"✅ YouTube token refreshed for user {user_id}")
        
        return {
            "success": True,
            "message": "Token refreshed successfully",
            "expires_in": token_data['expires_in']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error refreshing YouTube token: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}")
