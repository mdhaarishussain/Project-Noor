# Azure VM Deployment Fix - Memory & Celery Restart Issues

## Problem Summary

Your Azure B2s VM (2 vCPUs, 4GB RAM) is experiencing:
1. ❌ **Celery worker restarting repeatedly** - Out of Memory (OOM) kills
2. ⚠️  **Redis memory overcommit warning** - Can cause save failures
3. 🔴 **Insufficient memory allocation** - Containers fighting for resources

## Root Causes

### 1. Memory Limits Too Low
**Original docker-compose.yml:**
```yaml
bondhu-api: 128MB limit     # ❌ Too small for FastAPI
celery-worker: 80MB limit   # ❌ Too small, causes OOM kills
redis: 48MB limit           # ❌ Too restrictive
```

**With 4GB total RAM:**
- OS: ~500MB
- Docker: ~300MB
- Available for containers: ~3GB
- Your limits: Only 256MB total! ❌

### 2. Redis Memory Overcommit
Linux kernel setting prevents Redis from saving data properly.

### 3. Aggressive Healthchecks
6-hour intervals don't help detect crashes early.

---

## Solution

### Step 1: Fix Azure VM Memory Settings (CRITICAL)

**Run this on your Azure VM:**

```bash
# SSH into your VM
ssh Bondhu_backend@<your-vm-ip>

# Navigate to project
cd ~/Project-Noor/bondhu-ai

# Make script executable
chmod +x fix-azure-vm-memory.sh

# Run the fix script
./fix-azure-vm-memory.sh
```

This script will:
- ✅ Enable memory overcommit (`vm.overcommit_memory=1`)
- ✅ Increase network connection limits (`net.core.somaxconn=511`)
- ✅ Disable Transparent Huge Pages (improves Redis performance)
- ✅ Create 2GB swap file (prevents OOM kills)
- ✅ Set swappiness to 10 (prefer RAM over swap)
- ✅ Clean up Docker images/volumes

### Step 2: Update Docker Compose

**New memory allocation for Azure B2s (4GB RAM):**

```yaml
redis: 
  limits: 128MB    # 3% of RAM
  
bondhu-api: 
  limits: 1536MB   # 38% of RAM (main app)
  
celery-worker: 
  limits: 1024MB   # 26% of RAM (background tasks)
  
Total: ~2688MB (67% of 4GB) + OS/Docker overhead
```

**I've already updated your docker-compose.yml with:**
- ✅ Proper memory limits (won't get OOM killed)
- ✅ Memory reservations (guaranteed minimum)
- ✅ Reduced workers (1 instead of 2)
- ✅ Task time limits (prevent hung tasks)
- ✅ Max tasks per child (prevent memory leaks)
- ✅ Better healthchecks (30s intervals)

### Step 3: Deploy Updated Configuration

**On your Azure VM:**

```bash
# Stop all containers
docker-compose down

# Pull updated configuration (if pushed to git)
git pull origin main

# Or manually copy the new docker-compose.yml

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### Step 4: Monitor Memory Usage

```bash
# Check container memory usage
docker stats

# Check VM memory
free -h

# Check if swap is being used
swapon --show

# Check for OOM kills
dmesg | grep -i "out of memory"
```

---

## Updated docker-compose.yml Changes

### Redis
```yaml
# Before
memory: 48M         # ❌ Too small
maxmemory 32mb      # ❌ Too restrictive

# After
memory: 128M        # ✅ Proper size
maxmemory 64mb      # ✅ Room for operations
healthcheck: 30s    # ✅ Faster detection
```

### Bondhu API
```yaml
# Before
memory: 128M        # ❌ Causes crashes
workers: 2          # ❌ Too many for 4GB VM
LOG_LEVEL: INFO     # ❌ Extra memory for logs

# After
memory: 1536M       # ✅ Won't crash
workers: 1          # ✅ Sufficient for small load
LOG_LEVEL: WARNING  # ✅ Less logging overhead
ENABLE_RL: false    # ✅ Disable RL in production (saves memory)
```

### Celery Worker
```yaml
# Before
memory: 80M                    # ❌ OOM kills
loglevel: info                 # ❌ Extra memory
No task limits                 # ❌ Tasks can run forever

# After
memory: 1024M                  # ✅ Won't get killed
loglevel: warning              # ✅ Less overhead
max-tasks-per-child: 50        # ✅ Prevent memory leaks
time-limit: 300                # ✅ Kill hung tasks after 5min
soft-time-limit: 240           # ✅ Warning at 4min
```

---

## Verification Steps

### 1. Check Container Health

```bash
# All containers should be "Up" and healthy
docker-compose ps

# Expected output:
# bondhu-redis          Up (healthy)
# bondhu-api            Up (healthy)
# bondhu-celery-worker  Up
```

### 2. Check Logs for Errors

```bash
# Check Redis
docker logs bondhu-redis --tail 50

# Should NOT see:
# ❌ "WARNING Memory overcommit must be enabled"
# ❌ "OOM command not allowed"

# Check Celery
docker logs bondhu-celery-worker --tail 50

# Should see:
# ✅ "celery@... ready"
# ✅ "Task received"
# Should NOT see:
# ❌ "Worker terminated by SIGKILL"
# ❌ "Out of memory"
```

### 3. Monitor Memory Usage

```bash
# Watch live stats (Ctrl+C to exit)
docker stats

# Expected usage:
# bondhu-api:          500-800MB  (limit: 1536MB) ✅
# bondhu-celery-worker: 300-500MB  (limit: 1024MB) ✅
# bondhu-redis:         30-60MB   (limit: 128MB)  ✅
```

### 4. Test API Endpoint

```bash
# From your VM
curl http://localhost:8000/health

# Expected: {"status":"healthy"}

# From outside (if port 8000 is open in Azure NSG)
curl http://<your-vm-ip>:8000/health
```

---

## Memory Budget Breakdown (Azure B2s - 4GB RAM)

```
Total RAM: 4096 MB
├─ OS & System:           ~500 MB  (12%)
├─ Docker Engine:         ~300 MB  (7%)
├─ Swap cache:            ~200 MB  (5%)
└─ Available for apps:    ~3096 MB (76%)
    ├─ Redis:              128 MB  (4%)
    ├─ Bondhu API:        1536 MB  (49%)
    ├─ Celery Worker:     1024 MB  (33%)
    └─ Buffer:             408 MB  (14%) ✅ Safety margin
```

---

## Troubleshooting

### Issue: Celery Still Restarting

**Check OOM kills:**
```bash
dmesg | grep -i "killed process"
```

**If you see kills, increase Celery memory:**
```yaml
celery-worker:
  deploy:
    resources:
      limits:
        memory: 1536M  # Increase from 1024M
```

### Issue: Redis Warnings Persist

**Manually fix kernel settings:**
```bash
sudo sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf
```

### Issue: High Swap Usage

```bash
# Check swap usage
free -h

# If swap > 500MB, you need more RAM or less containers
# Consider upgrading to B2ms (8GB RAM)
```

### Issue: API Slow to Respond

**Reduce workers if memory is tight:**
```bash
# In docker-compose.yml
environment:
  - WORKERS=1          # Use 1 worker instead of 2
  - MAX_CONCURRENCY=5  # Reduce from 10
```

---

## Performance Tuning for B2s VM

### Option 1: Keep All Services (Current)
- ✅ Full functionality
- ⚠️  Moderate memory pressure
- 🔄 May use swap under load
- 📊 Good for < 10 concurrent users

### Option 2: Remove Celery (If Not Needed)
If you don't use background tasks:

```yaml
# Comment out celery-worker in docker-compose.yml
# celery-worker:
#   ...

# Remove from bondhu-api depends_on
depends_on:
  redis:
    condition: service_healthy
  # celery-worker:  # REMOVED
  #   condition: service_started
```

**Memory savings:** ~1GB freed

### Option 3: Upgrade to B2ms (Recommended)
- **B2s:** 2 vCPU, 4GB RAM, $0.0416/hr
- **B2ms:** 2 vCPU, 8GB RAM, $0.0832/hr (+$30/month)
- ✅ 2x memory = no OOM issues
- ✅ Better performance
- ✅ Room to grow

---

## Quick Reference Commands

### Deployment
```bash
# Full redeploy
cd ~/Project-Noor/bondhu-ai
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Watch logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Monitoring
```bash
# Memory usage
docker stats --no-stream

# VM memory
free -h

# Container logs
docker logs bondhu-celery-worker --tail 100 -f

# Check for OOM kills
dmesg | grep -i "memory"
```

### Cleanup (If disk is full)
```bash
# Remove unused images/containers
docker system prune -af

# Remove old volumes
docker volume prune -f

# Check disk space
df -h
```

---

## Expected Results After Fix

### Before (Broken)
```
❌ bondhu-celery-worker: Up 10s (restarting)
❌ Redis: WARNING Memory overcommit must be enabled
❌ docker stats: celery using 79MB/80MB (98% - OOM imminent)
❌ dmesg: Out of memory: Killed process 1234 (celery)
```

### After (Fixed)
```
✅ bondhu-celery-worker: Up 5 minutes (healthy)
✅ Redis: No warnings
✅ docker stats: celery using 350MB/1024MB (34% - healthy)
✅ dmesg: No OOM kills
✅ API responding in <500ms
```

---

## Summary

**What was wrong:**
1. Memory limits too small (80MB for Celery = instant OOM kill)
2. Redis kernel settings not optimized
3. No swap configured (OOM kills on memory spikes)

**What we fixed:**
1. ✅ Increased memory limits to realistic values (1536MB API, 1024MB Celery)
2. ✅ Added swap space (2GB buffer)
3. ✅ Fixed kernel settings (overcommit, somaxconn, THP)
4. ✅ Added task limits (prevent hung tasks)
5. ✅ Reduced logging (WARNING instead of INFO)

**Next steps:**
1. Run `fix-azure-vm-memory.sh` on VM
2. Deploy updated docker-compose.yml
3. Monitor with `docker stats`
4. Consider upgrading to B2ms if still tight

Your containers should now run stably without restarts! 🚀
