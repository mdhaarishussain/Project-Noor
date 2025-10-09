"""
Rate limiting utilities for external API calls and user-level rate limiting.
Handles rate limiting for Spotify API and other services to ensure we stay within limits.
Updated to support 500-1000 concurrent users with user-level rate limiting (100 req/min per user).
"""

import time
import asyncio
from typing import Dict, Any, Optional, Callable
from collections import defaultdict, deque
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Token bucket rate limiter with burst capacity.
    Suitable for API rate limiting with different tiers.
    """
    
    def __init__(
        self, 
        requests_per_second: float = 1.0,
        burst_capacity: int = 10,
        window_size: int = 60
    ):
        """
        Initialize rate limiter.
        
        Args:
            requests_per_second: Average requests allowed per second
            burst_capacity: Maximum burst requests allowed
            window_size: Time window in seconds for rate tracking
        """
        self.requests_per_second = requests_per_second
        self.burst_capacity = burst_capacity
        self.window_size = window_size
        
        # Token bucket state
        self.tokens = burst_capacity
        self.last_refill = time.time()
        
        # Request tracking for analytics
        self.request_times = deque()
        self.total_requests = 0
        self.rejected_requests = 0
        
    async def acquire(self, timeout: float = 30.0) -> bool:
        """
        Acquire permission to make a request.
        
        Args:
            timeout: Maximum time to wait for permission
            
        Returns:
            True if permission granted, False if timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            self._refill_tokens()
            
            if self.tokens >= 1:
                self.tokens -= 1
                self._record_request()
                return True
            
            # Calculate wait time until next token
            wait_time = 1.0 / self.requests_per_second
            await asyncio.sleep(min(wait_time, 0.1))
        
        self.rejected_requests += 1
        logger.warning(f"Rate limit timeout after {timeout}s")
        return False
    
    def _refill_tokens(self):
        """Refill tokens based on elapsed time."""
        now = time.time()
        elapsed = now - self.last_refill
        
        # Add tokens based on rate
        tokens_to_add = elapsed * self.requests_per_second
        self.tokens = min(self.burst_capacity, self.tokens + tokens_to_add)
        self.last_refill = now
    
    def _record_request(self):
        """Record request for analytics."""
        now = time.time()
        self.request_times.append(now)
        self.total_requests += 1
        
        # Clean old entries
        cutoff = now - self.window_size
        while self.request_times and self.request_times[0] < cutoff:
            self.request_times.popleft()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get rate limiter statistics."""
        now = time.time()
        recent_requests = len(self.request_times)
        
        return {
            "requests_per_second_limit": self.requests_per_second,
            "burst_capacity": self.burst_capacity,
            "current_tokens": self.tokens,
            "total_requests": self.total_requests,
            "rejected_requests": self.rejected_requests,
            "recent_requests": recent_requests,
            "current_rate": recent_requests / self.window_size if self.window_size > 0 else 0,
            "rejection_rate": self.rejected_requests / max(1, self.total_requests)
        }


class SpotifyRateLimiter:
    """
    Specialized rate limiter for Spotify API.
    Handles different endpoint limits and retry logic.
    """
    
    # Spotify API limits (conservative estimates)
    ENDPOINT_LIMITS = {
        "search": {"requests_per_second": 10.0, "burst": 20},
        "tracks": {"requests_per_second": 10.0, "burst": 20},
        "artists": {"requests_per_second": 10.0, "burst": 20},
        "audio_features": {"requests_per_second": 10.0, "burst": 20},
        "recommendations": {"requests_per_second": 5.0, "burst": 10},
        "user_data": {"requests_per_second": 3.0, "burst": 5},  # More restrictive for user data
        "playlists": {"requests_per_second": 5.0, "burst": 10}
    }
    
    def __init__(self):
        """Initialize Spotify rate limiter with endpoint-specific limits."""
        self.limiters = {}
        
        for endpoint, config in self.ENDPOINT_LIMITS.items():
            self.limiters[endpoint] = RateLimiter(
                requests_per_second=config["requests_per_second"],
                burst_capacity=config["burst"],
                window_size=60
            )
        
        # Global limiter for overall API usage
        self.global_limiter = RateLimiter(
            requests_per_second=20.0,  # Conservative global limit
            burst_capacity=50,
            window_size=60
        )
        
        logger.info("Spotify rate limiter initialized")
    
    async def acquire_for_endpoint(self, endpoint: str, timeout: float = 30.0) -> bool:
        """
        Acquire permission for specific endpoint.
        
        Args:
            endpoint: Spotify API endpoint category
            timeout: Maximum wait time
            
        Returns:
            True if permission granted
        """
        # Check global limit first
        if not await self.global_limiter.acquire(timeout=timeout/2):
            return False
        
        # Check endpoint-specific limit
        limiter = self.limiters.get(endpoint, self.limiters["tracks"])
        return await limiter.acquire(timeout=timeout/2)
    
    async def rate_limited_call(
        self, 
        endpoint: str, 
        func: Callable, 
        *args, 
        max_retries: int = 3,
        **kwargs
    ) -> Any:
        """
        Make a rate-limited API call with retries.
        
        Args:
            endpoint: API endpoint category
            func: Function to call
            max_retries: Maximum retry attempts
            
        Returns:
            Function result or None if failed
        """
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                # Acquire rate limit permission
                if not await self.acquire_for_endpoint(endpoint):
                    logger.warning(f"Rate limit timeout for {endpoint}")
                    return None
                
                # Make the API call
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = await asyncio.to_thread(func, *args, **kwargs)
                
                return result
                
            except Exception as e:
                last_exception = e

                # Try to extract richer error details (status codes, response body) when available
                status = None
                resp_text = None
                try:
                    # spotipy.SpotifyException uses .http_status and .msg in some versions
                    status = getattr(e, 'http_status', None) or getattr(e, 'status_code', None)
                    # Some exceptions carry a response or msg attribute with content
                    possible_resp = getattr(e, 'response', None) or getattr(e, 'msg', None)
                    if possible_resp is not None:
                        # If it's a requests.Response-like object
                        if hasattr(possible_resp, 'text'):
                            resp_text = possible_resp.text
                        else:
                            resp_text = str(possible_resp)
                except Exception:
                    # Best-effort only; don't fail on logging
                    status = None
                    resp_text = None

                # Check if it's a rate limit error and backoff if so
                if status and str(status) == '429' or '429' in str(e) or 'rate limit' in str(e).lower():
                    wait_time = (2 ** attempt) * 1.0  # Exponential backoff
                    logger.warning(f"Rate limited on {endpoint}, waiting {wait_time}s (attempt {attempt + 1})")
                    await asyncio.sleep(wait_time)
                    continue

                # For other errors, include richer context in logs and retry if attempts remain
                extra = ''
                if status:
                    extra += f" http_status={status}"
                if resp_text:
                    # Truncate very long responses for safety
                    truncated = (resp_text[:1000] + '...') if len(resp_text) > 1000 else resp_text
                    extra += f" response_body={truncated}"

                logger.warning(f"API error on {endpoint}: {e}{extra} (attempt {attempt + 1})")
                if attempt < max_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))
        
        logger.error(f"Failed {endpoint} after {max_retries + 1} attempts: {last_exception}")
        return None
    
    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all limiters."""
        stats = {
            "global": self.global_limiter.get_stats()
        }
        
        for endpoint, limiter in self.limiters.items():
            stats[endpoint] = limiter.get_stats()
        
        return stats


class CacheManager:
    """
    Simple in-memory cache with TTL for API responses.
    Reduces API calls by caching frequent requests.
    """
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        """
        Initialize cache manager.
        
        Args:
            default_ttl: Default time-to-live in seconds
        """
        self.cache = {}
        self.default_ttl = default_ttl
        logger.info(f"Cache manager initialized with {default_ttl}s TTL")
    
    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """Create cache key from arguments."""
        key_parts = [prefix]
        key_parts.extend(str(arg) for arg in args)
        key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return ":".join(key_parts)
    
    def get(self, prefix: str, *args, **kwargs) -> Optional[Any]:
        """Get cached value if not expired."""
        key = self._make_key(prefix, *args, **kwargs)
        
        if key in self.cache:
            value, expire_time = self.cache[key]
            if time.time() < expire_time:
                return value
            else:
                # Expired, remove from cache
                del self.cache[key]
        
        return None
    
    def set(self, prefix: str, value: Any, ttl: Optional[int] = None, *args, **kwargs):
        """Set cached value with TTL."""
        key = self._make_key(prefix, *args, **kwargs)
        expire_time = time.time() + (ttl or self.default_ttl)
        self.cache[key] = (value, expire_time)
    
    def invalidate(self, prefix: str, *args, **kwargs):
        """Invalidate specific cache entry."""
        key = self._make_key(prefix, *args, **kwargs)
        self.cache.pop(key, None)
    
    def clear_expired(self):
        """Remove expired entries."""
        now = time.time()
        expired_keys = [
            key for key, (_, expire_time) in self.cache.items()
            if now >= expire_time
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        now = time.time()
        active_entries = sum(1 for _, expire_time in self.cache.values() if now < expire_time)
        
        return {
            "total_entries": len(self.cache),
            "active_entries": active_entries,
            "expired_entries": len(self.cache) - active_entries
        }



class UserRateLimiter:
    """
    Per-user rate limiter for API endpoints.
    Supports 500-1000 concurrent users with 100 requests/minute per user limit.
    Uses sliding window counter with Redis for distributed deployments.
    """
    
    def __init__(self, requests_per_minute: int = 100, window_seconds: int = 60):
        """
        Initialize user-level rate limiter.
        
        Args:
            requests_per_minute: Max requests per user per minute (spec: 100)
            window_seconds: Time window for counting requests
        """
        self.requests_per_minute = requests_per_minute
        self.window_seconds = window_seconds
        
        # Try to use Redis, fall back to in-memory
        try:
            from core.services.redis_cache import user_data_cache
            self.cache = user_data_cache
            self.use_redis = True
            logger.info(f"UserRateLimiter initialized with Redis (limit: {requests_per_minute} req/min)")
        except Exception as e:
            logger.warning(f"Redis not available for rate limiting, using in-memory: {e}")
            self.cache = {}
            self.use_redis = False
    
    async def check_rate_limit(self, user_id: str) -> tuple[bool, Optional[int]]:
        """
        Check if user is within rate limit.
        
        Args:
            user_id: User identifier
            
        Returns:
            Tuple of (is_allowed, retry_after_seconds)
        """
        try:
            now = time.time()
            window_start = now - self.window_seconds
            
            if self.use_redis:
                # Redis-based sliding window
                key_prefix = f"user_rate_limit:{user_id}"
                
                # Get current count
                current_count = self.cache.get(key_prefix, user_id=user_id) or 0
                
                if current_count >= self.requests_per_minute:
                    # Get TTL to tell user when they can retry
                    ttl = self.cache.get_ttl(key_prefix, user_id=user_id)
                    retry_after = max(1, ttl) if ttl > 0 else self.window_seconds
                    return False, retry_after
                
                # Increment counter
                new_count = self.cache.increment(key_prefix, 1, user_id=user_id)
                
                # Set expiry on first request in window
                if new_count == 1:
                    self.cache.set(key_prefix, 1, ttl=self.window_seconds, user_id=user_id)
                
                return True, None
                
            else:
                # In-memory fallback (not recommended for multi-instance)
                if user_id not in self.cache:
                    self.cache[user_id] = deque()
                
                user_requests = self.cache[user_id]
                
                # Remove old requests outside window
                while user_requests and user_requests[0] < window_start:
                    user_requests.popleft()
                
                if len(user_requests) >= self.requests_per_minute:
                    # Calculate retry_after based on oldest request
                    retry_after = int(self.window_seconds - (now - user_requests[0]))
                    return False, max(1, retry_after)
                
                # Add current request
                user_requests.append(now)
                return True, None
                
        except Exception as e:
            logger.error(f"Rate limit check error for user {user_id}: {e}")
            # Fail open (allow request) on errors
            return True, None
    
    async def acquire(self, user_id: str, timeout: float = 5.0) -> bool:
        """
        Acquire permission for user to make request (with retry).
        
        Args:
            user_id: User identifier
            timeout: Max time to wait
            
        Returns:
            True if permission granted
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            allowed, retry_after = await self.check_rate_limit(user_id)
            
            if allowed:
                return True
            
            # Wait before retry
            if retry_after:
                wait_time = min(retry_after, timeout - (time.time() - start_time))
                if wait_time > 0:
                    await asyncio.sleep(wait_time)
            else:
                await asyncio.sleep(0.5)
        
        logger.warning(f"User {user_id} rate limit timeout after {timeout}s")
        return False
    
    def get_stats(self, user_id: str) -> Dict[str, Any]:
        """Get rate limit stats for a user."""
        try:
            if self.use_redis:
                key_prefix = f"user_rate_limit:{user_id}"
                current_count = self.cache.get(key_prefix, user_id=user_id) or 0
                ttl = self.cache.get_ttl(key_prefix, user_id=user_id)
                
                return {
                    "user_id": user_id,
                    "current_requests": current_count,
                    "limit": self.requests_per_minute,
                    "window_seconds": self.window_seconds,
                    "reset_in_seconds": max(0, ttl) if ttl > 0 else 0,
                    "percentage_used": round((current_count / self.requests_per_minute) * 100, 1)
                }
            else:
                user_requests = self.cache.get(user_id, deque())
                now = time.time()
                window_start = now - self.window_seconds
                
                # Count recent requests
                recent_count = sum(1 for req_time in user_requests if req_time >= window_start)
                
                return {
                    "user_id": user_id,
                    "current_requests": recent_count,
                    "limit": self.requests_per_minute,
                    "window_seconds": self.window_seconds,
                    "percentage_used": round((recent_count / self.requests_per_minute) * 100, 1)
                }
        except Exception as e:
            logger.error(f"Failed to get rate limit stats for {user_id}: {e}")
            return {"error": str(e)}


# Global instances for the application

# Spotify rate limiter (endpoint-specific)
spotify_rate_limiter = SpotifyRateLimiter()

# User-level rate limiter (100 req/min per user, supports 500-1000 users)
user_rate_limiter = UserRateLimiter(requests_per_minute=100)

# Import Redis cache instances (replaces old CacheManager)
try:
    from core.services.redis_cache import (
        recommendations_cache,
        audio_features_cache, 
        api_cache,
        user_data_cache,
        RECOMMENDATIONS_TTL,
        AUDIO_FEATURES_TTL,
        API_CACHE_TTL,
        USER_DATA_TTL
    )
    
    # Legacy aliases for backward compatibility
    spotify_cache = audio_features_cache  # Maps to 7-day TTL Redis cache
    
    logger.info("Using Redis-based caching (24h recommendations, 7d audio features, 6h API responses)")
    
except ImportError as e:
    logger.warning(f"Redis cache not available, falling back to in-memory: {e}")
    
    # Fallback to in-memory CacheManager (development only)
    spotify_cache = CacheManager(default_ttl=300)
    user_data_cache = CacheManager(default_ttl=1800)
    recommendations_cache = CacheManager(default_ttl=86400)
    audio_features_cache = CacheManager(default_ttl=604800)
    api_cache = CacheManager(default_ttl=21600)
    
    # TTL constants
    RECOMMENDATIONS_TTL = 86400
    AUDIO_FEATURES_TTL = 604800
    API_CACHE_TTL = 21600
    USER_DATA_TTL = 1800
