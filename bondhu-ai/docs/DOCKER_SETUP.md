# Docker Setup Guide

## Option 1: Quick Start (Single Container - Development)
```bash
# Start Redis only (for local development)
docker run -d --name bondhu-redis -p 6379:6379 --restart always redis:alpine
```

## Option 2: Full Stack (Docker Compose - Production)
```bash
# Start entire application stack (optimized for free tier hosting)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

## Resource Usage (Production Setup)

### Total Memory Usage: ~256MB
- **Redis**: 48MB limit (32MB data + overhead)
- **API**: 128MB limit (perfect for Railway/Render free tier)
- **Celery**: 80MB limit (minimal background processing)

### CPU Usage: ~0.4 cores
- Optimized for free tier hosting platforms
- Single worker processes to minimize overhead
- Efficient task processing with limits

## Development vs Production

### For Development (Recommended)
- Use **Option 1** (single Redis container)
- Run FastAPI locally: `python -m uvicorn main:app --reload`
- Run Celery locally: `celery -A core.celery_app worker --loglevel=info --pool=solo`
- **Benefits**: Hot reload, easier debugging, faster development

### For Production/Team Testing/Deployment
- Use **Option 2** (Docker Compose)
- Everything runs in containers with resource limits
- Automatic restarts and health checks
- Security hardening enabled
- **Benefits**: Production-ready, scalable, isolated

## Security Features

- **Localhost binding**: Services only accessible locally (127.0.0.1)
- **No privilege escalation**: Containers run with restricted permissions
- **Non-root user**: Application runs as dedicated user
- **Resource limits**: Prevents container resource abuse
- **Health checks**: Automatic failure detection and restart

## Environment Variables

Your `.env` file works with both options:
- **Development**: Uses `REDIS_URL=redis://localhost:6379`
- **Production**: Docker Compose automatically uses internal networking

## Verification

Test the setup:
```bash
# Check containers
docker ps

# Check resource usage
docker stats

# Test Redis
docker exec -it bondhu-redis redis-cli ping

# Test API health
curl http://localhost:8000/health

# Test full API
curl http://localhost:8000/docs
```

## Deployment Ready

This configuration is optimized for:
- ✅ **Railway** (free tier: 512MB RAM, 1 vCPU)
- ✅ **Render** (free tier: 512MB RAM, 0.1 vCPU)
- ✅ **Heroku** (free tier equivalent)
- ✅ **DigitalOcean Apps** (basic tier)

## Requirements

- Docker Desktop
- Copy `.env.example` to `.env` with your API keys
- 512MB+ available system memory for production stack