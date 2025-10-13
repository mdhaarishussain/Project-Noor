# 🚀 Quick Start - Docker Deployment

## One-Command Deploy

```powershell
cd "C:\Users\mdhaa\Desktop\Project Noor\bondhu-ai"
.\deploy.ps1
```

## What Was Fixed

### ❌ Before:
```
bondhu-api   | Failed to connect to Redis: Error 111 connecting to localhost:6379
celery-worker | Process 'ForkPoolWorker-1' exited with 'signal 9 (SIGKILL)'
```

### ✅ After:
```
bondhu-api   | ✅ Connected to Redis at redis:6379
celery-worker | [INFO/MainProcess] celery@hostname ready.
```

## Key Changes

1. **Redis Connection:** `localhost` → `redis` (Docker service name)
2. **Celery Pool:** `prefork` → `solo` (Windows compatible)
3. **Memory Limits:** 128MB → 4GB (API), 80MB → 2GB (Celery)
4. **Health Checks:** 6h → 10s intervals

## Verify Deployment

```powershell
# Check all containers running
docker ps

# Check Redis connection
docker exec -it bondhu-api python test_redis_connection.py

# Check API health
curl http://localhost:8000/health

# View logs
docker compose logs -f
```

## Common Commands

```powershell
# Start
docker compose up -d

# Stop
docker compose down

# Restart
docker compose restart bondhu-api

# Clean rebuild
docker compose down -v && docker compose build --no-cache && docker compose up -d

# View logs
docker logs -f bondhu-api
docker logs -f bondhu-celery-worker

# Monitor resources
docker stats
```

## Troubleshooting

### Still seeing "Connection refused"?
```powershell
# Check Redis is running
docker ps | findstr redis

# Test Redis directly
docker exec -it bondhu-api redis-cli -h redis ping
```

### Celery still crashing?
```powershell
# Check memory usage
docker stats bondhu-celery-worker

# View detailed logs
docker logs bondhu-celery-worker --tail 50
```

## Files Modified

- ✅ `docker-compose.yml` - Fixed service connections
- ✅ `core/config/settings.py` - Added Redis host/port config
- ✅ `core/services/redis_cache.py` - Improved connection logic
- ✅ `core/celery_app.py` - Better connection settings

## New Files

- ✅ `test_redis_connection.py` - Redis test utility
- ✅ `deploy.ps1` - Deployment automation
- ✅ `DOCKER_FIXES_COMPLETE.md` - Full documentation
- ✅ `IMPLEMENTATION_SUMMARY.md` - Detailed summary

## Success Checklist

- [ ] 3 containers running (redis, api, celery)
- [ ] No "Connection refused" in logs
- [ ] No "SIGKILL" in logs
- [ ] `curl http://localhost:8000/health` works
- [ ] Redis test passes: `docker exec -it bondhu-api python test_redis_connection.py`

## Next Steps

1. Run `.\deploy.ps1`
2. Verify checklist above
3. Test YouTube OAuth
4. Test video recommendations
5. Ready for Azure deployment!

---

**Need help?** Check `DOCKER_FIXES_COMPLETE.md` for detailed guide.
