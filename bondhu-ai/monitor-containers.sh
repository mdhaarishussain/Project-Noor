#!/bin/bash
# Monitor Docker containers on Azure VM
# Run this to check if containers are healthy and identify memory issues

echo "🔍 Bondhu Docker Container Monitor"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo "📊 Container Status:"
echo "-------------------"
docker-compose ps
echo ""

echo "💾 Memory Usage:"
echo "----------------"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}"
echo ""

echo "🖥️  VM Memory Status:"
echo "--------------------"
free -h
echo ""

echo "💿 Swap Usage:"
echo "--------------"
swapon --show
echo ""

echo "📦 Disk Usage:"
echo "--------------"
df -h / | tail -1
echo ""

echo "🔧 Kernel Settings:"
echo "-------------------"
echo "vm.overcommit_memory: $(sysctl -n vm.overcommit_memory)"
echo "net.core.somaxconn: $(sysctl -n net.core.somaxconn)"
echo "vm.swappiness: $(sysctl -n vm.swappiness)"
echo ""

echo "🚨 Recent OOM Kills (last 10):"
echo "------------------------------"
OOMKILLS=$(dmesg | grep -i "killed process" | tail -10)
if [ -z "$OOMKILLS" ]; then
    echo -e "${GREEN}✅ No OOM kills detected${NC}"
else
    echo -e "${RED}$OOMKILLS${NC}"
fi
echo ""

echo "📋 Container Restart Counts:"
echo "---------------------------"
for container in $(docker ps -a --format '{{.Names}}'); do
    RESTARTS=$(docker inspect -f '{{.RestartCount}}' $container 2>/dev/null)
    if [ "$RESTARTS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $container: $RESTARTS restarts${NC}"
    else
        echo -e "${GREEN}✅ $container: No restarts${NC}"
    fi
done
echo ""

echo "🔍 Recent Celery Worker Logs (last 20 lines):"
echo "---------------------------------------------"
docker logs bondhu-celery-worker --tail 20 2>/dev/null || echo "Celery worker not running"
echo ""

echo "🔍 Recent Redis Logs (last 10 lines):"
echo "-------------------------------------"
docker logs bondhu-redis --tail 10 2>/dev/null || echo "Redis not running"
echo ""

echo "🧪 API Health Check:"
echo "-------------------"
HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API is responding: $HEALTH${NC}"
else
    echo -e "${RED}❌ API is not responding${NC}"
fi
echo ""

echo "📈 Top Memory Consuming Processes:"
echo "----------------------------------"
ps aux --sort=-%mem | head -6
echo ""

echo "🎯 Recommendations:"
echo "------------------"

# Check memory usage
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
USED_MEM=$(free -m | awk '/^Mem:/{print $3}')
MEM_PERCENT=$((USED_MEM * 100 / TOTAL_MEM))

if [ $MEM_PERCENT -gt 85 ]; then
    echo -e "${RED}⚠️  Memory usage is HIGH ($MEM_PERCENT%)${NC}"
    echo "   Consider:"
    echo "   1. Upgrading to B2ms (8GB RAM)"
    echo "   2. Reducing WORKERS in docker-compose.yml"
    echo "   3. Disabling ENABLE_RL and ENABLE_SCHEDULER"
elif [ $MEM_PERCENT -gt 70 ]; then
    echo -e "${YELLOW}⚠️  Memory usage is moderate ($MEM_PERCENT%)${NC}"
    echo "   Monitor for OOM kills during peak usage"
else
    echo -e "${GREEN}✅ Memory usage is healthy ($MEM_PERCENT%)${NC}"
fi

# Check for container restarts
TOTAL_RESTARTS=$(docker ps -a --format '{{.Names}}' | xargs -I {} docker inspect -f '{{.RestartCount}}' {} 2>/dev/null | awk '{s+=$1} END {print s}')
if [ "$TOTAL_RESTARTS" -gt 5 ]; then
    echo -e "${RED}⚠️  Containers have restarted $TOTAL_RESTARTS times${NC}"
    echo "   Check logs: docker-compose logs -f"
elif [ "$TOTAL_RESTARTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Containers have restarted $TOTAL_RESTARTS times${NC}"
    echo "   Monitor for stability"
else
    echo -e "${GREEN}✅ No container restarts${NC}"
fi

echo ""
echo "=================================="
echo "Monitor complete! Run this script periodically to track health."
echo "For live monitoring: docker stats"
