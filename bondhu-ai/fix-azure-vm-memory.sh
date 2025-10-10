#!/bin/bash
# Fix Azure VM Memory Settings for Docker
# Run this on your Azure VM to fix Redis warnings and prevent OOM kills

echo "🔧 Fixing Azure VM Memory Settings for Docker..."

# 1. Fix Redis memory overcommit warning
echo "📝 Setting vm.overcommit_memory=1..."
sudo sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf

# 2. Increase network connection limits for Redis
echo "📝 Setting net.core.somaxconn=511..."
sudo sysctl net.core.somaxconn=511
echo "net.core.somaxconn = 511" | sudo tee -a /etc/sysctl.conf

# 3. Disable Transparent Huge Pages (causes Redis slowdown)
echo "📝 Disabling Transparent Huge Pages..."
echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
echo never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag

# Make THP disable persistent across reboots
cat << 'EOF' | sudo tee /etc/rc.local
#!/bin/sh -e
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
exit 0
EOF
sudo chmod +x /etc/rc.local

# 4. Increase swap space (helps with memory pressure)
echo "📝 Checking swap space..."
SWAP_SIZE=$(free -m | awk '/Swap/ {print $2}')
if [ "$SWAP_SIZE" -lt 2048 ]; then
    echo "⚠️  Current swap: ${SWAP_SIZE}MB - Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created: 2GB"
else
    echo "✅ Swap already configured: ${SWAP_SIZE}MB"
fi

# 5. Set swappiness (how aggressively to use swap)
echo "📝 Setting vm.swappiness=10..."
sudo sysctl vm.swappiness=10
echo "vm.swappiness = 10" | sudo tee -a /etc/sysctl.conf

# 6. Reload sysctl settings
echo "🔄 Reloading sysctl settings..."
sudo sysctl -p

# 7. Clean up Docker to free space
echo "🧹 Cleaning up Docker..."
docker system prune -af --volumes

echo ""
echo "✅ Memory settings fixed!"
echo ""
echo "📊 Current Memory Status:"
free -h
echo ""
echo "📊 Current Swap Status:"
swapon --show
echo ""
echo "📊 Sysctl Settings:"
sysctl vm.overcommit_memory
sysctl net.core.somaxconn
sysctl vm.swappiness
echo ""
echo "🔄 Now restart your containers:"
echo "   cd ~/Project-Noor/bondhu-ai"
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""
