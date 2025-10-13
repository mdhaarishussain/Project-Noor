#!/usr/bin/env python3
"""
Redis Connection Test Utility
Tests Redis connection with proper Docker service name resolution
"""

import sys
import os
import redis
import logging

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.config import get_config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_redis_connection():
    """Test Redis connection using configuration"""
    try:
        config = get_config()
        
        logger.info("=" * 60)
        logger.info("Redis Connection Test")
        logger.info("=" * 60)
        
        # Display configuration
        logger.info(f"Redis Host: {config.redis.host}")
        logger.info(f"Redis Port: {config.redis.port}")
        logger.info(f"Redis URL: {config.redis.url}")
        logger.info(f"Celery Broker: {config.celery.broker_url}")
        logger.info(f"Celery Backend: {config.celery.result_backend}")
        
        # Test connection
        logger.info("\n🔌 Attempting to connect to Redis...")
        
        client = redis.Redis(
            host=config.redis.host,
            port=config.redis.port,
            db=config.redis.db,
            password=config.redis.password,
            socket_connect_timeout=5,
            socket_timeout=5,
            decode_responses=True
        )
        
        # Ping test
        result = client.ping()
        logger.info(f"✅ Ping successful: {result}")
        
        # Set/Get test
        test_key = "bondhu:test:connection"
        test_value = "Connection successful!"
        
        client.set(test_key, test_value, ex=60)  # Expire in 60 seconds
        retrieved_value = client.get(test_key)
        
        logger.info(f"✅ Write test successful: Set '{test_key}' = '{test_value}'")
        logger.info(f"✅ Read test successful: Got '{test_key}' = '{retrieved_value}'")
        
        # Get server info
        info = client.info('server')
        logger.info(f"\n📊 Redis Server Info:")
        logger.info(f"   Version: {info.get('redis_version', 'N/A')}")
        logger.info(f"   Mode: {info.get('redis_mode', 'N/A')}")
        logger.info(f"   OS: {info.get('os', 'N/A')}")
        
        # Get memory info
        memory_info = client.info('memory')
        used_memory_mb = memory_info.get('used_memory', 0) / 1024 / 1024
        logger.info(f"   Memory Used: {used_memory_mb:.2f} MB")
        
        # Get connection info
        clients_info = client.info('clients')
        logger.info(f"   Connected Clients: {clients_info.get('connected_clients', 0)}")
        
        # Cleanup
        client.delete(test_key)
        client.close()
        
        logger.info("\n" + "=" * 60)
        logger.info("✅ ALL TESTS PASSED - Redis is working correctly!")
        logger.info("=" * 60)
        
        return True
        
    except redis.ConnectionError as e:
        logger.error("\n" + "=" * 60)
        logger.error(f"❌ CONNECTION FAILED: {e}")
        logger.error("=" * 60)
        logger.error("\n💡 Troubleshooting Tips:")
        logger.error("   1. Make sure Redis container is running:")
        logger.error("      docker ps | grep redis")
        logger.error("   2. Check Redis logs:")
        logger.error("      docker logs bondhu-redis")
        logger.error("   3. Verify environment variables:")
        logger.error("      REDIS_HOST should be 'redis' (Docker service name)")
        logger.error("      REDIS_URL should be 'redis://redis:6379/0'")
        logger.error("   4. Test Redis from another container:")
        logger.error("      docker exec -it bondhu-api redis-cli -h redis ping")
        return False
        
    except Exception as e:
        logger.error(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_redis_connection()
    sys.exit(0 if success else 1)
