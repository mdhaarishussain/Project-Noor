"""
Rate limiting utilities for external API calls.
Handles rate limiting for Spotify API and other services to ensure we stay within limits.
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
                
                # Check if it's a rate limit error
                if "429" in str(e) or "rate limit" in str(e).lower():
                    wait_time = (2 ** attempt) * 1.0  # Exponential backoff
                    logger.warning(f"Rate limited on {endpoint}, waiting {wait_time}s (attempt {attempt + 1})")
                    await asyncio.sleep(wait_time)
                    continue
                
                # For other errors, log and retry with shorter wait
                logger.warning(f"API error on {endpoint}: {e} (attempt {attempt + 1})")
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


# Global instances for the application
spotify_rate_limiter = SpotifyRateLimiter()
spotify_cache = CacheManager(default_ttl=300)  # 5 minutes for most API calls

# Longer cache for user data that changes less frequently
user_data_cache = CacheManager(default_ttl=1800)  # 30 minutes for user profiles, top tracks, etc.