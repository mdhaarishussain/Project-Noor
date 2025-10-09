"""
Google OAuth service for YouTube API integration.
Handles OAuth flow, token management, and YouTube API access.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import aiohttp
from urllib.parse import urlencode

logger = logging.getLogger(__name__)


class GoogleOAuthService:
    """Handle Google OAuth for YouTube API."""
    
    def __init__(self, config):
        """Initialize with configuration."""
        self.client_id = config.google.client_id
        self.client_secret = config.google.client_secret
        self.redirect_uri = config.google.redirect_uri
        self.scopes = config.google.scopes
        
        # OAuth endpoints
        self.auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.revoke_url = "https://oauth2.googleapis.com/revoke"
        
        logger.info("✅ GoogleOAuthService initialized")
    
    def get_authorization_url(self, state: str) -> str:
        """
        Generate Google OAuth authorization URL.
        
        Args:
            state: State token for CSRF protection
            
        Returns:
            Authorization URL for user to visit
        """
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': ' '.join(self.scopes),
            'access_type': 'offline',  # Get refresh token
            'prompt': 'consent',  # Force consent screen for refresh token
            'state': state,
            'include_granted_scopes': 'true'
        }
        
        auth_url = f"{self.auth_url}?{urlencode(params)}"
        logger.info(f"🔗 Generated OAuth URL for state: {state[:10]}...")
        
        return auth_url
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.
        
        Args:
            code: Authorization code from OAuth callback
            
        Returns:
            Token data including access_token, refresh_token, expiry
        """
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': self.redirect_uri
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.token_url, data=data) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"❌ Token exchange failed: {error_text}")
                        raise Exception(f"Token exchange failed: {error_text}")
                    
                    token_data = await response.json()
            
            # Calculate expiry time
            expires_in = token_data.get('expires_in', 3600)
            expiry = datetime.now() + timedelta(seconds=expires_in)
            
            result = {
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token'),  # May not always be present
                'token_type': token_data.get('token_type', 'Bearer'),
                'expires_in': expires_in,
                'expiry': expiry.isoformat(),
                'scope': token_data.get('scope', ' '.join(self.scopes))
            }
            
            logger.info(f"✅ Token exchange successful (expires in {expires_in}s)")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error exchanging code for token: {e}")
            raise
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New token data
        """
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.token_url, data=data) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"❌ Token refresh failed: {error_text}")
                        raise Exception(f"Token refresh failed: {error_text}")
                    
                    token_data = await response.json()
            
            # Calculate expiry time
            expires_in = token_data.get('expires_in', 3600)
            expiry = datetime.now() + timedelta(seconds=expires_in)
            
            result = {
                'access_token': token_data['access_token'],
                'token_type': token_data.get('token_type', 'Bearer'),
                'expires_in': expires_in,
                'expiry': expiry.isoformat()
            }
            
            logger.info(f"✅ Token refreshed successfully (expires in {expires_in}s)")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error refreshing token: {e}")
            raise
    
    async def revoke_token(self, token: str) -> bool:
        """
        Revoke an access or refresh token.
        
        Args:
            token: Token to revoke
            
        Returns:
            True if successful
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.revoke_url,
                    data={'token': token},
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                ) as response:
                    success = response.status == 200
                    
                    if success:
                        logger.info("✅ Token revoked successfully")
                    else:
                        logger.warning(f"⚠️ Token revocation returned status {response.status}")
                    
                    return success
                    
        except Exception as e:
            logger.error(f"❌ Error revoking token: {e}")
            return False
    
    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from Google.
        
        Args:
            access_token: Valid access token
            
        Returns:
            User info or None if failed
        """
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers=headers
                ) as response:
                    if response.status == 200:
                        user_info = await response.json()
                        logger.info(f"✅ Retrieved user info for: {user_info.get('email')}")
                        return user_info
                    else:
                        logger.error(f"❌ Failed to get user info: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"❌ Error getting user info: {e}")
            return None
    
    async def validate_token(self, access_token: str) -> bool:
        """
        Validate if an access token is still valid.
        
        Args:
            access_token: Token to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={access_token}'
                ) as response:
                    if response.status == 200:
                        token_info = await response.json()
                        # Check if token is for our app
                        is_valid = token_info.get('audience') == self.client_id
                        
                        if is_valid:
                            logger.info("✅ Token is valid")
                        else:
                            logger.warning("⚠️ Token is for different client")
                        
                        return is_valid
                    else:
                        logger.warning(f"⚠️ Token validation failed: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"❌ Error validating token: {e}")
            return False


# Singleton instance
_oauth_service: Optional[GoogleOAuthService] = None


def get_google_oauth_service(config=None) -> GoogleOAuthService:
    """Get or create Google OAuth service instance."""
    global _oauth_service
    
    if _oauth_service is None:
        if config is None:
            from core.config import get_config
            config = get_config()
        _oauth_service = GoogleOAuthService(config)
    
    return _oauth_service
