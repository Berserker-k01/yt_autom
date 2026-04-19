
import os
import redis

def get_redis_client():
    """Returns a configured Redis client."""
    redis_url = os.getenv('REDIS_URL', 'redis://redis:6379/0')
    try:
        return redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
        return None
