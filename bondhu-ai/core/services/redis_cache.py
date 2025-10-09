"""
Redis-based cache service for high-performance distributed caching.
Replaces in-memory CacheManager with Redis for scalability to 500-1000 users.

Cache TTL Configuration (per spec):
- Recommendations: 24 hours
- Audio features: 7 days  
- API responses: 6 hours
"""

import redis
import json
import logging
import pickle
from typing import Any, Optional, Dict
from datetime import timedelta
from core.config import get_config

logger = logging.getLogger("bondhu.redis_cache")


class RedisCache:
    """
    Redis-based cache with automatic serialization and TTL management.
    Supports both JSON and pickle serialization for flexibility.
    """
    
    def __init__(
        self, 
        host: Optional[str] = None,
        port: Optional[int] = None,
        db: int = 0,
        password: Optional[str] = None,
        max_connections: int = 100,  # Connection pool for 500-1000 users
        socket_timeout: int = 5,
        socket_connect_timeout: int = 5,
        decode_responses: bool = False,  # We'll handle encoding ourselves
    ):
        """
        Initialize Redis cache with connection pooling.
        
        Args:
            host: Redis host (default from config)
            port: Redis port (default from config)
            db: Redis database number
            password: Redis password
            max_connections: Max connections in pool (100 for 500-1000 concurrent users)
            socket_timeout: Socket timeout in seconds
            socket_connect_timeout: Connection timeout in seconds
            decode_responses: Auto-decode responses (we handle manually)
        """
        try:
            config = get_config()
            
            # Use provided values or fall back to config/defaults
            self.host = host or getattr(config.redis if hasattr(config, 'redis') else None, 'host', 'localhost')
            self.port = port or getattr(config.redis if hasattr(config, 'redis') else None, 'port', 6379)
            self.password = password or getattr(config.redis if hasattr(config, 'redis') else None, 'password', None)
            
            # Create connection pool for scalability
            self.pool = redis.ConnectionPool(
                host=self.host,
                port=self.port,
                db=db,
                password=self.password,
                max_connections=max_connections,
                socket_timeout=socket_timeout,
                socket_connect_timeout=socket_connect_timeout,
                decode_responses=decode_responses,
            )
            
            self.client = redis.Redis(connection_pool=self.pool)
            
            # Test connection
            self.client.ping()
            logger.info(f"Redis cache connected: {self.host}:{self.port} (pool size: {max_connections})")
            
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            logger.warning("Falling back to Redis defaults (localhost:6379)")
            
            # Fallback to basic connection
            self.pool = redis.ConnectionPool(
                host='localhost',
                port=6379,
                db=db,
                max_connections=max_connections,
                decode_responses=decode_responses,
            )
            self.client = redis.Redis(connection_pool=self.pool)
        
        # Cache hit/miss statistics
        self.stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0,
            'errors': 0
        }
    
    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """Create cache key from arguments."""
        key_parts = [prefix]
        key_parts.extend(str(arg) for arg in args)
        key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return ":".join(key_parts)
    
    def get(self, prefix: str, *args, use_json: bool = True, **kwargs) -> Optional[Any]:
        """
        Get cached value.
        
        Args:
            prefix: Cache key prefix
            use_json: Use JSON serialization (True) or pickle (False)
            *args, **kwargs: Additional key components
            
        Returns:
            Cached value or None if not found/expired
        """
        try:
            key = self._make_key(prefix, *args, **kwargs)
            value = self.client.get(key)
            
            if value is None:
                self.stats['misses'] += 1
                return None
            
            self.stats['hits'] += 1
            
            # Deserialize
            if use_json:
                return json.loads(value.decode('utf-8'))
            else:
                return pickle.loads(value)
                
        except Exception as e:
            logger.error(f"Redis get error for key {prefix}: {e}")
            self.stats['errors'] += 1
            return None
    
    def set(
        self, 
        prefix: str, 
        value: Any, 
        ttl: Optional[int] = None,
        use_json: bool = True,
        *args, 
        **kwargs
    ) -> bool:
        """
        Set cached value with TTL.
        
        Args:
            prefix: Cache key prefix
            value: Value to cache
            ttl: Time-to-live in seconds (None = no expiration)
            use_json: Use JSON serialization (True) or pickle (False)
            *args, **kwargs: Additional key components
            
        Returns:
            True if successful
        """
        try:
            key = self._make_key(prefix, *args, **kwargs)
            
            # Serialize
            if use_json:
                serialized = json.dumps(value, default=str)
            else:
                serialized = pickle.dumps(value)
            
            # Set with optional TTL
            if ttl:
                self.client.setex(key, ttl, serialized)
            else:
                self.client.set(key, serialized)
            
            self.stats['sets'] += 1
            return True
            
        except Exception as e:
            logger.error(f"Redis set error for key {prefix}: {e}")
            self.stats['errors'] += 1
            return False
    
    def delete(self, prefix: str, *args, **kwargs) -> bool:
        """
        Delete cached value.
        
        Args:
            prefix: Cache key prefix
            *args, **kwargs: Additional key components
            
        Returns:
            True if deleted
        """
        try:
            key = self._make_key(prefix, *args, **kwargs)
            deleted = self.client.delete(key)
            self.stats['deletes'] += 1
            return bool(deleted)
            
        except Exception as e:
            logger.error(f"Redis delete error for key {prefix}: {e}")
            self.stats['errors'] += 1
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all keys matching pattern.
        
        Args:
            pattern: Redis key pattern (e.g., "user:123:*")
            
        Returns:
            Number of keys deleted
        """
        try:
            keys = self.client.keys(pattern)
            if keys:
                deleted = self.client.delete(*keys)
                self.stats['deletes'] += deleted
                return deleted
            return 0
            
        except Exception as e:
            logger.error(f"Redis pattern invalidation error: {e}")
            self.stats['errors'] += 1
            return 0
    
    def exists(self, prefix: str, *args, **kwargs) -> bool:
        """Check if key exists."""
        try:
            key = self._make_key(prefix, *args, **kwargs)
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis exists check error: {e}")
            return False
    
    def get_ttl(self, prefix: str, *args, **kwargs) -> int:
        """
        Get remaining TTL for key.
        
        Returns:
            Remaining TTL in seconds, -1 if no expiration, -2 if key doesn't exist
        """
        try:
            key = self._make_key(prefix, *args, **kwargs)
            return self.client.ttl(key)
        except Exception as e:
            logger.error(f"Redis TTL check error: {e}")
            return -2
    
    def increment(self, prefix: str, amount: int = 1, *args, **kwargs) -> int:
        """
        Increment counter.
        
        Args:
            prefix: Cache key prefix
            amount: Amount to increment by
            
        Returns:
            New value after increment
        """
        try:
            key = self._make_key(prefix, *args, **kwargs)
            return self.client.incr(key, amount)
        except Exception as e:
            logger.error(f"Redis increment error: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        try:
            # Get Redis server info
            info = self.client.info('stats')
            memory_info = self.client.info('memory')
            
            return {
                'cache_hits': self.stats['hits'],
                'cache_misses': self.stats['misses'],
                'cache_sets': self.stats['sets'],
                'cache_deletes': self.stats['deletes'],
                'cache_errors': self.stats['errors'],
                'hit_rate_percent': round(hit_rate, 2),
                'total_requests': total_requests,
                'redis_connected_clients': info.get('connected_clients', 0),
                'redis_total_commands': info.get('total_commands_processed', 0),
                'redis_memory_used_mb': round(memory_info.get('used_memory', 0) / 1024 / 1024, 2),
                'redis_memory_peak_mb': round(memory_info.get('used_memory_peak', 0) / 1024 / 1024, 2),
            }
        except Exception as e:
            logger.error(f"Failed to get Redis stats: {e}")
            return {
                'cache_hits': self.stats['hits'],
                'cache_misses': self.stats['misses'],
                'hit_rate_percent': round(hit_rate, 2),
                'error': str(e)
            }
    
    def clear_all(self) -> bool:
        """
        Clear all cache entries (use with caution!).
        
        Returns:
            True if successful
        """
        try:
            self.client.flushdb()
            logger.warning("Redis cache cleared completely")
            return True
        except Exception as e:
            logger.error(f"Failed to clear Redis cache: {e}")
            return False
    
    def close(self):
        """Close Redis connection pool."""
        try:
            self.pool.disconnect()
            logger.info("Redis connection pool closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")


# Global cache instances with TTL per spec
# Recommendations cache: 24 hours
recommendations_cache = RedisCache(db=0)
RECOMMENDATIONS_TTL = 86400  # 24 hours

# Audio features cache: 7 days
audio_features_cache = RedisCache(db=1)
AUDIO_FEATURES_TTL = 604800  # 7 days

# API responses cache: 6 hours
api_cache = RedisCache(db=2)
API_CACHE_TTL = 21600  # 6 hours

# User data cache: 30 minutes (for frequently changing data)
user_data_cache = RedisCache(db=3)
USER_DATA_TTL = 1800  # 30 minutes

logger.info("Redis cache instances initialized with TTL configs per spec")
