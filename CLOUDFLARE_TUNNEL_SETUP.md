# ☁️ Alternative: Cloudflare Tunnel for HTTPS

## Overview
Use Cloudflare Tunnel to get HTTPS without configuring Nginx/SSL manually.

## Prerequisites
- Domain managed by Cloudflare (free)
- Azure VM running

---

## Step 1: Add Domain to Cloudflare

```
1. Go to: https://dash.cloudflare.com
2. Sign up (free account)
3. Add Site → Enter: bondhu.tech
4. Choose: Free plan
5. Follow nameserver update instructions
6. Wait for activation (5-10 minutes)
```

---

## Step 2: Install Cloudflared on Azure VM

```bash
# SSH into VM
ssh Bondhu_backend@57.159.29.168

# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify
cloudflared --version
```

---

## Step 3: Authenticate Cloudflare

```bash
# Login to Cloudflare
cloudflared tunnel login

# This will open a browser link
# Copy the link and open in your browser
# Select your domain (bondhu.tech)
# Authorize
```

---

## Step 4: Create Tunnel

```bash
# Create tunnel
cloudflared tunnel create bondhu-api

# Note the Tunnel ID (copy it)
# Example: abc123-def456-ghi789

# Create config directory
mkdir -p ~/.cloudflared

# Create config file
nano ~/.cloudflared/config.yml

# Paste this (replace TUNNEL_ID):
tunnel: abc123-def456-ghi789
credentials-file: /home/Bondhu_backend/.cloudflared/abc123-def456-ghi789.json

ingress:
  - hostname: api.bondhu.tech
    service: http://localhost:8000
  - service: http_status:404

# Save: Ctrl+X, Y, Enter
```

---

## Step 5: Add DNS Record in Cloudflare

```bash
# Run this command (replace TUNNEL_ID)
cloudflared tunnel route dns abc123-def456-ghi789 api.bondhu.tech

# Or manually in Cloudflare dashboard:
# DNS → Add Record
# Type: CNAME
# Name: api
# Target: abc123-def456-ghi789.cfargotunnel.com
# Proxy: Enabled (orange cloud)
```

---

## Step 6: Run Tunnel

```bash
# Test tunnel
cloudflared tunnel run bondhu-api

# If works, stop (Ctrl+C) and install as service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

---

## Step 7: Update Backend .env

```bash
cd ~/Project-Noor/bondhu-ai
nano .env

# Update:
GOOGLE_REDIRECT_URI=https://api.bondhu.tech/api/v1/auth/youtube/callback
SPOTIFY_REDIRECT_URI=https://api.bondhu.tech/api/v1/agents/music/callback
CORS_ORIGINS=https://bondhu.tech,https://*.vercel.app,http://localhost:3000

# Save and restart
docker-compose restart bondhu-api
```

---

## Step 8: Update OAuth Providers

Same as Option 2 - use `https://api.bondhu.tech` URLs

---

## ✅ Benefits

- ✅ No Nginx configuration needed
- ✅ Automatic SSL
- ✅ DDoS protection (Cloudflare)
- ✅ Analytics included
- ✅ Always-on tunnel

## ❌ Cons

- ❌ Adds Cloudflare dependency
- ❌ Slight latency (traffic through Cloudflare)
- ❌ Less control vs Nginx

---

This is a good alternative if you don't want to manage SSL certificates manually!
