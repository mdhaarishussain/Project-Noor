# Quick Deployment Steps for Azure VM

## 🚨 Run These Commands on Your Azure VM

```bash
# 1. SSH into your Azure VM
ssh Bondhu_backend@<your-vm-ip>

# 2. Navigate to project directory
cd ~/Project-Noor/bondhu-ai

# 3. Pull the latest changes (with memory fixes)
git pull origin main

# 4. Make scripts executable
chmod +x fix-azure-vm-memory.sh
chmod +x monitor-containers.sh

# 5. FIX CRITICAL: Run memory configuration script
./fix-azure-vm-memory.sh

# 6. Stop all containers
docker-compose down

# 7. Clean up old images to free space
docker system prune -af

# 8. Rebuild with new memory limits
docker-compose build --no-cache

# 9. Start containers with new configuration
docker-compose up -d

# 10. Watch the logs (Ctrl+C to exit)
docker-compose logs -f
```

## ✅ What to Look For

### Good Signs (After 2 minutes):
```
✅ bondhu-redis: No "memory overcommit" warnings
✅ bondhu-celery-worker: "celery@... ready"
✅ bondhu-api: "Application startup complete"
✅ All containers show "Up (healthy)"
```

### Bad Signs:
```
❌ "Worker terminated by SIGKILL" → Memory still too low
❌ Container keeps restarting → Check logs
❌ "Out of memory" → Run fix-azure-vm-memory.sh again
```

## 📊 Monitor Health

```bash
# Check container status
docker-compose ps

# Check memory usage (should be < 80% per container)
docker stats

# Run health monitor script
./monitor-containers.sh

# Check for OOM kills
dmesg | grep -i "killed process"

# Test API
curl http://localhost:8000/health
```

## Expected Memory Usage After Fix

```
Container             Memory Usage    Limit       Status
-------------------------------------------------------------
bondhu-redis          50-70 MB        128 MB      ✅ Healthy
bondhu-api            500-800 MB      1536 MB     ✅ Healthy
bondhu-celery-worker  300-500 MB      1024 MB     ✅ Healthy
-------------------------------------------------------------
Total:                ~1.2 GB         2.7 GB      ✅ 44% usage
```

## 🔧 If Still Having Issues

### Issue: Celery still restarting
```bash
# Check OOM kills
dmesg | tail -50

# If OOM kills present, increase Celery memory:
# Edit docker-compose.yml
nano docker-compose.yml

# Find celery-worker section, change:
#   memory: 1024M  →  memory: 1536M

# Restart
docker-compose down
docker-compose up -d
```

### Issue: Redis warnings persist
```bash
# Manually fix kernel settings
sudo sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf

# Restart Redis
docker-compose restart redis
```

### Issue: Not enough disk space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -af --volumes

# Remove old logs
rm -rf logs/*
```

## 🎯 Production Checklist

After deployment, verify:
- [ ] All 3 containers running (redis, api, celery-worker)
- [ ] No container restarts in last 10 minutes
- [ ] Memory usage < 70% per container
- [ ] API responds: `curl http://localhost:8000/health`
- [ ] No OOM kills: `dmesg | grep -i "killed process"`
- [ ] Swap usage < 500MB: `free -h`
- [ ] Redis no warnings: `docker logs bondhu-redis | tail -20`
- [ ] Celery worker ready: `docker logs bondhu-celery-worker | tail -20`

## 📱 Configure Azure NSG (Allow External Access)

If you want to access the API from outside:

```bash
# In Azure Portal:
1. Go to your VM → Network Settings
2. Add Inbound Port Rule:
   - Port: 8000
   - Protocol: TCP
   - Source: Any (or specific IPs)
   - Name: AllowAPI

# Then test from your local machine:
curl http://<your-vm-public-ip>:8000/health
```

## 🔄 Auto-restart on Reboot

To make containers start automatically after VM reboot:

```bash
# Add to crontab
crontab -e

# Add this line:
@reboot cd ~/Project-Noor/bondhu-ai && docker-compose up -d
```

## Summary

**What Changed:**
- ❌ Old: 256MB total limits → OOM kills every 30 seconds
- ✅ New: 2.7GB total limits → Stable for hours

**Memory Allocation:**
- Redis: 48MB → 128MB (167% increase)
- API: 128MB → 1536MB (1200% increase!) 🚀
- Celery: 80MB → 1024MB (1280% increase!) 🚀

**Your containers should now run stably without restarts!** 🎉

Need help? Run `./monitor-containers.sh` to diagnose issues.
