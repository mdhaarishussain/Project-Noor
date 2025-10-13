# 🖥️ Bondhu AI - Compute Requirements & Scaling Guide

## 📊 Current Infrastructure Analysis

### **Azure VM Configuration**
- **VM Type:** B2s (Standard B2s)
- **vCPUs:** 2 cores
- **RAM:** 4 GB
- **Storage:** Standard SSD
- **Network:** Standard
- **Cost:** ~$30-40/month
- **IP:** 57.159.29.168 (Static recommended)

---

## 🐳 Docker Container Resource Allocation

### **Current Configuration (Optimized for 4GB RAM)**

| Container | Memory Limit | Memory Reserved | CPU Limit | CPU Reserved |
|-----------|-------------|-----------------|-----------|--------------|
| **Redis** | 128 MB | 64 MB | 0.25 cores | 0.1 cores |
| **API (FastAPI)** | 1536 MB (1.5 GB) | 512 MB | 0.75 cores | 0.25 cores |
| **Celery Worker** | 1024 MB (1 GB) | 256 MB | 0.5 cores | 0.15 cores |
| **System Overhead** | ~512 MB | - | - | - |
| **Total** | **~3.2 GB** | **~832 MB** | **1.5 cores** | **0.5 cores** |

### **Memory Breakdown**

```
Total 4 GB RAM:
├─ Redis:           128 MB  (3.1%)   - Cache & message broker
├─ FastAPI API:    1536 MB (38.4%)  - Main application + AI workers
├─ Celery Worker:  1024 MB (25.6%)  - Background task processor
├─ System (Linux):  512 MB (12.8%)  - OS overhead
└─ Buffer:          800 MB (20.0%)  - Headroom for spikes
```

---

## 📦 Application Components

### **1. FastAPI Backend (bondhu-api)**
```yaml
Purpose: Main REST API server
Workers: 1 uvicorn worker
Concurrent Requests: ~10 simultaneous
Memory per Request: ~50-100 MB (AI inference)
Response Time: 1-5 seconds (AI generation)
```

**What consumes memory:**
- ✅ Gemini API calls (100-150 MB per request)
- ✅ Spotify/YouTube API integrations (20-30 MB)
- ✅ LangChain orchestration (50-80 MB)
- ✅ Redis connection pool (10-20 MB)
- ✅ Request parsing & validation (5-10 MB)

### **2. Redis Cache (bondhu-redis)**
```yaml
Purpose: Session cache, rate limiting, Celery broker
Max Memory: 64 MB (with LRU eviction)
Persistence: Disabled (in-memory only)
Connections: Max 100 concurrent
Eviction Policy: allkeys-lru (least recently used)
```

**What's stored:**
- User session data (~1-5 KB per user)
- Rate limit counters (~100 bytes per user)
- Celery task queue (~1-10 KB per task)
- Cache keys (~500 bytes - 5 KB each)

### **3. Celery Worker (bondhu-celery-worker)**
```yaml
Purpose: Background task processing
Concurrency: 1 worker (solo pool)
Max Tasks per Child: 50 (prevents memory leaks)
Task Time Limit: 300 seconds (5 minutes)
Pool Type: solo (single-threaded)
```

**Background tasks:**
- Video recommendations refresh
- Music playlist updates
- Personality analysis
- Memory extraction
- Stats aggregation

---

## 🔢 Current Capacity Estimates

### **Concurrent Users**
```
Optimistic: 50-100 concurrent users
Realistic:  20-50 concurrent users
Peak Load:  10-20 active AI conversations
```

### **Request Throughput**
```
API Requests:     ~10 req/sec sustained
                  ~25 req/sec burst (30 seconds)
                  
AI Chat:          ~2-3 conversations/sec
Background Tasks: ~5-10 tasks/minute
Redis Operations: ~500-1000 ops/sec
```

### **Response Times (Current)**
```
Health Check:        < 50ms
Simple API:          100-300ms
Chat (AI):          1,000-3,000ms (1-3 sec)
Video Recommendations: 2,000-5,000ms (2-5 sec)
Music Analysis:      3,000-8,000ms (3-8 sec)
```

---

## 📈 Scaling Projections

### **Growth Scenario 1: 100-200 Active Users**

**Required Infrastructure:**
```yaml
VM Type: B2ms or Standard_D2s_v3
vCPUs: 2-4 cores
RAM: 8 GB
Monthly Cost: ~$70-100

Container Adjustments:
  Redis:
    Memory: 256 MB
    CPU: 0.5 cores
  
  FastAPI:
    Workers: 2-3
    Memory: 3 GB (1 GB per worker)
    CPU: 1.5 cores
  
  Celery Worker:
    Workers: 2
    Memory: 2 GB (1 GB per worker)
    CPU: 1 core
```

**Scaling Changes:**
1. Increase uvicorn workers from 1 → 2-3
2. Add second Celery worker container
3. Upgrade Redis to 256 MB
4. Enable Redis persistence (AOF)
5. Add load balancer (Azure App Gateway)

---

### **Growth Scenario 2: 500-1000 Active Users**

**Required Infrastructure:**
```yaml
Architecture: Multi-node with load balancing

API Nodes (2x):
  VM Type: Standard_D4s_v3
  vCPUs: 4 cores each
  RAM: 16 GB each
  Monthly Cost: ~$150/each = $300

Database:
  Managed Supabase: Already scales automatically
  Connection Pooling: PgBouncer (100 connections)

Cache:
  Azure Cache for Redis (Basic C1)
  Memory: 1 GB
  Monthly Cost: ~$30

Load Balancer:
  Azure Load Balancer or Application Gateway
  Monthly Cost: ~$20-50

Total: ~$400-450/month
```

**Container Configuration per API Node:**
```yaml
Redis: Replaced by Azure Cache for Redis (managed)

FastAPI (per node):
  Workers: 4
  Memory: 10 GB (2.5 GB per worker)
  CPU: 3 cores
  Concurrent Requests: 40-50

Celery Workers (per node):
  Workers: 4
  Memory: 4 GB (1 GB per worker)
  CPU: 2 cores
  Concurrency: 2 per worker = 8 total
```

**Performance Targets:**
```
Concurrent Users:    500-1000
Requests/sec:       100-200
Chat Conversations: 20-30/sec
Background Tasks:   50-100/minute
Response Time (p95): < 2 seconds
```

---

### **Growth Scenario 3: 5,000-10,000 Active Users**

**Required Infrastructure:**
```yaml
Architecture: Kubernetes (AKS) with auto-scaling

Kubernetes Cluster:
  Node Pool: 3-5 Standard_D8s_v3 (8 cores, 32 GB each)
  Monthly Cost: ~$500-800

API Pods:
  Replicas: 5-10 (auto-scale)
  Resources per pod:
    CPU: 2 cores
    Memory: 4 GB
  Total Capacity: 10-20 cores, 20-40 GB

Celery Workers:
  Replicas: 5-15 (auto-scale based on queue)
  Resources per pod:
    CPU: 1 core
    Memory: 2 GB

Redis:
  Azure Cache for Redis (Premium P1)
  Memory: 6 GB
  Replicas: 2 (HA)
  Monthly Cost: ~$500

Database:
  Supabase Pro Plan
  Connection Pooling: 500 connections
  Monthly Cost: ~$200-500

CDN:
  Azure CDN or Cloudflare
  Monthly Cost: ~$50-100

Total: ~$1,500-2,500/month
```

**Performance Targets:**
```
Concurrent Users:    5,000-10,000
Requests/sec:       1,000-2,000
Chat Conversations: 100-200/sec
Background Tasks:   500-1000/minute
Response Time (p95): < 1.5 seconds
Availability:       99.9% (SLA)
```

---

## 🔧 Optimization Strategies

### **Immediate Optimizations (Current Setup)**

1. **Enable Response Caching**
```python
# Cache chat responses for repeated questions
Cache TTL:
  - Similar queries: 5 minutes
  - Video recommendations: 30 minutes
  - User stats: 15 minutes
  - Genre lists: 24 hours
```

2. **Database Connection Pooling**
```python
# Reduce connection overhead
Max Connections: 10 (current)
Min Connections: 2
Connection Timeout: 30 seconds
```

3. **Async All The Things**
```python
# Already using FastAPI async
# Ensure all I/O is non-blocking:
  - Supabase queries ✅
  - Redis operations ✅
  - External APIs (Spotify/YouTube) ✅
  - AI inference (Gemini) ✅
```

4. **Rate Limiting**
```python
# Current: 100 requests/minute per user
# Prevents abuse and ensures fair usage
Rate Limit Tiers:
  - Free: 50 req/min
  - Premium: 200 req/min
  - Admin: Unlimited
```

---

### **Medium-Term Optimizations (100-500 Users)**

1. **Add Redis Cluster**
   - Sharding across 3 nodes
   - Replicas for high availability
   - Persistent storage (RDB + AOF)

2. **Horizontal Scaling**
   - Multiple FastAPI instances
   - Nginx load balancer
   - Session affinity (sticky sessions)

3. **CDN for Static Assets**
   - Azure CDN or Cloudflare
   - Cache frontend assets
   - Reduce latency globally

4. **Database Read Replicas**
   - Supabase read replicas
   - Route read queries to replicas
   - Reduce primary DB load

---

### **Long-Term Optimizations (1000+ Users)**

1. **Microservices Architecture**
```
Split services:
  - Chat API (high priority)
  - Music Agent (medium priority)
  - Video Agent (medium priority)
  - Gaming Agent (low priority)
  - Analytics Service (low priority)
```

2. **Message Queue (RabbitMQ/Kafka)**
   - Replace Celery with event-driven architecture
   - Better scalability for background tasks
   - Event sourcing for analytics

3. **AI Model Optimization**
   - Switch to self-hosted LLM (Llama 3, Mistral)
   - GPU instances for inference
   - Model quantization (4-bit/8-bit)
   - Reduces API costs significantly

4. **Edge Computing**
   - Deploy edge nodes globally
   - Reduce latency for international users
   - Cloudflare Workers for static responses

---

## 💰 Cost Breakdown by Scale

### **Current (20-50 Users)**
```
Azure VM B2s:        $35/month
Domain + DNS:        $15/month
Supabase Free:       $0/month
External APIs:       $10-20/month
Total:              ~$60-70/month
```

### **Medium (100-500 Users)**
```
Azure VM (8 GB):     $100/month
Redis (1 GB):        $30/month
Domain + SSL:        $15/month
Supabase Pro:        $25/month
External APIs:       $50-100/month
CDN:                 $20/month
Total:              ~$240-290/month
```

### **Large (1000-5000 Users)**
```
Azure VMs (3x):      $450/month
Redis Premium:       $500/month
Load Balancer:       $50/month
Supabase Pro:        $200/month
External APIs:       $200-500/month
CDN:                 $100/month
Monitoring:          $50/month
Total:              ~$1,550-1,850/month
```

### **Enterprise (10,000+ Users)**
```
Kubernetes (AKS):    $1,000/month
Redis HA:            $800/month
Database:            $500/month
External APIs:       $1,000-2,000/month
CDN + Edge:          $300/month
Monitoring:          $200/month
Support:             $500/month
Total:              ~$4,300-5,300/month
```

---

## 🚨 Bottlenecks & Solutions

### **Current Bottlenecks**

| Bottleneck | Symptom | Solution |
|------------|---------|----------|
| **Single uvicorn worker** | High latency under load | Add 2-3 workers |
| **Limited RAM (4 GB)** | Container OOM kills | Upgrade to 8 GB VM |
| **No caching** | Repeated AI calls | Add Redis caching |
| **Single VM** | No redundancy | Add second VM + LB |
| **Synchronous AI calls** | Blocks other requests | Use task queue |

### **Future Bottlenecks (Expected)**

| Scale | Bottleneck | Solution |
|-------|-----------|----------|
| **100 users** | Redis memory exhaustion | Upgrade Redis or add LRU eviction |
| **500 users** | Database connection limits | Connection pooling (PgBouncer) |
| **1000 users** | API response time | Add more API nodes |
| **5000 users** | Celery task backlog | Add dedicated task queue (RabbitMQ) |
| **10k users** | Database write throughput | Shard database or use write replicas |

---

## 📊 Monitoring Recommendations

### **Essential Metrics to Track**

```yaml
System Metrics:
  - CPU usage (per container)
  - Memory usage (per container)
  - Disk I/O
  - Network throughput
  
Application Metrics:
  - Request rate (req/sec)
  - Response time (p50, p95, p99)
  - Error rate (%)
  - Active users
  
Resource Metrics:
  - Redis memory usage
  - Redis connection count
  - Database connections
  - Celery queue length
  
Business Metrics:
  - Chat conversations/day
  - API calls per user
  - Feature usage (music/video/gaming)
  - User retention
```

### **Monitoring Tools**

**Free Tier:**
- Azure Monitor (built-in)
- Docker stats (`docker stats`)
- Uptime monitoring (UptimeRobot)
- Log aggregation (CloudWatch Logs)

**Paid Tier:**
- Datadog (~$15/month)
- New Relic (~$25/month)
- Grafana Cloud (~$50/month)

---

## 🎯 Scaling Decision Matrix

### **When to Scale Up (Vertical)**
```
Indicators:
  ✅ CPU usage > 70% sustained
  ✅ Memory usage > 80%
  ✅ Response time p95 > 3 seconds
  ✅ Container OOM kills
  ✅ Redis evictions increasing

Action: Upgrade VM size
Timeline: 1-2 hours (requires VM restart)
Cost Impact: +50-100% monthly cost
```

### **When to Scale Out (Horizontal)**
```
Indicators:
  ✅ Single VM at capacity
  ✅ Need redundancy/HA
  ✅ Response time still high after vertical scaling
  ✅ Background tasks queuing up
  ✅ Users > 100

Action: Add load balancer + second VM
Timeline: 1-2 days (infrastructure setup)
Cost Impact: +100-200% monthly cost
```

### **When to Optimize First (Before Scaling)**
```
Indicators:
  ❌ Caching not implemented
  ❌ N+1 query problems
  ❌ Blocking I/O calls
  ❌ No connection pooling
  ❌ Unoptimized database queries

Action: Code optimization
Timeline: 1-2 weeks (development time)
Cost Impact: $0 (developer time only)
```

---

## 🛠️ Scaling Checklist

### **Phase 1: Optimize Current Setup (Free)**
- [ ] Enable response caching
- [ ] Add database query caching
- [ ] Optimize Supabase queries (indexes)
- [ ] Add request deduplication
- [ ] Enable gzip compression
- [ ] Minimize Docker image size
- [ ] Add health check endpoints
- [ ] Implement graceful shutdown

### **Phase 2: Vertical Scaling ($100/month)**
- [ ] Upgrade to 8 GB VM (B2ms)
- [ ] Increase uvicorn workers to 3
- [ ] Add second Celery worker
- [ ] Upgrade Redis to 256 MB
- [ ] Enable Redis persistence
- [ ] Add monitoring (Azure Monitor)
- [ ] Set up automated backups

### **Phase 3: Horizontal Scaling ($300-400/month)**
- [ ] Add second VM
- [ ] Set up Azure Load Balancer
- [ ] Migrate to Azure Cache for Redis
- [ ] Implement session persistence
- [ ] Add CDN (Azure/Cloudflare)
- [ ] Set up CI/CD pipeline
- [ ] Add auto-scaling rules
- [ ] Implement blue-green deployment

### **Phase 4: Microservices ($1000+/month)**
- [ ] Migrate to Kubernetes (AKS)
- [ ] Split into microservices
- [ ] Add API Gateway
- [ ] Implement service mesh
- [ ] Add distributed tracing
- [ ] Set up log aggregation
- [ ] Implement chaos engineering
- [ ] 99.9% SLA monitoring

---

## 📚 Key Takeaways

### **Current State (Good for MVP)**
✅ **4 GB RAM** is sufficient for **20-50 active users**  
✅ **2 vCPUs** handle **10 concurrent requests**  
✅ **$60-70/month** total operational cost  
✅ **Response times** are acceptable (1-3 seconds)  

### **First Upgrade Trigger (100 users)**
📈 Upgrade to **8 GB VM** (~$100/month)  
📈 Add **2-3 uvicorn workers**  
📈 Implement **response caching**  
📈 Monitor with **Azure Monitor**  

### **Second Upgrade Trigger (500 users)**
🚀 Add **second VM** + load balancer  
🚀 Use **managed Redis** (Azure Cache)  
🚀 Implement **CDN** for static assets  
🚀 Cost: **~$400/month**  

### **Third Upgrade Trigger (5000 users)**
🎯 Migrate to **Kubernetes (AKS)**  
🎯 Split into **microservices**  
🎯 Add **auto-scaling**  
🎯 Cost: **~$1,500-2,500/month**  

---

## 🔗 Useful Commands

### **Check Current Resource Usage**
```bash
# SSH to Azure VM
ssh Bondhu_backend@57.159.29.168

# Check Docker container stats
docker stats

# Check system resources
free -h                  # Memory
df -h                    # Disk
top                      # CPU
htop                     # Better CPU/Memory view

# Check logs
docker-compose logs -f bondhu-api
docker-compose logs -f celery-worker
docker-compose logs -f redis
```

### **Monitor Redis**
```bash
# Connect to Redis container
docker exec -it bondhu-redis redis-cli

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST

# Check keys
DBSIZE
```

### **Check API Health**
```bash
# Health check
curl http://localhost:8000/health

# Check response time
time curl http://localhost:8000/api/v1/chat/health
```

---

## 📞 Support & Escalation

**If you see these signs, it's time to scale:**

🔴 **Critical (Scale Immediately):**
- Memory usage > 90%
- CPU usage > 90% for > 5 minutes
- Container restart loops
- Response time p95 > 10 seconds
- Error rate > 5%

🟡 **Warning (Plan Scaling):**
- Memory usage > 75%
- CPU usage > 75% sustained
- Response time p95 > 5 seconds
- Error rate > 2%
- Queue length growing

🟢 **Healthy:**
- Memory usage < 70%
- CPU usage < 60%
- Response time p95 < 3 seconds
- Error rate < 1%
- No container restarts

---

**Last Updated:** October 13, 2025  
**Document Version:** 1.0  
**Author:** Bondhu AI DevOps Team
