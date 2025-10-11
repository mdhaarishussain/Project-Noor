# 🚀 Caddy SSL Setup Guide (Simpler Alternative to Nginx)

## Why Caddy?

Caddy is a modern web server that's **easier than Nginx** for SSL setup:

| Feature | Caddy | Nginx |
|---------|-------|-------|
| **SSL Certificate** | Automatic (zero config) | Manual (`certbot` commands) |
| **Certificate Renewal** | Automatic | Automatic (after certbot setup) |
| **Config Complexity** | 5 lines | 30+ lines |
| **Setup Time** | **10 minutes** | 20 minutes |
| **HTTP → HTTPS Redirect** | Automatic | Manual configuration |
| **HTTP/2** | Automatic | Manual configuration |

**Bottom Line:** Caddy does in 5 lines what Nginx needs 30+ lines for.

---

## 📋 Prerequisites

- Domain name: `bondhu.tech` (you already have this ✅)
- Azure VM with public IP: `57.159.29.168` (you have this ✅)
- Backend running on port 8000 inside Docker (you have this ✅)

---

## 🔧 Setup Steps

### Step 1: Add DNS A Record

**At your domain registrar** (where you bought bondhu.tech):

```
Type: A
Name: api
Value: 57.159.29.168
TTL: 300 (or Auto)
```

This creates: `api.bondhu.tech` → `57.159.29.168`

**Wait 5-10 minutes** for DNS propagation, then test:

```bash
nslookup api.bondhu.tech
# Should return: 57.159.29.168
```

### Step 2: Install Caddy on Azure VM

SSH into your Azure VM:

```bash
ssh Bondhu_backend@57.159.29.168
```

**Install Caddy:**

```bash
# Add Caddy repository
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Update and install
sudo apt update
sudo apt install caddy

# Verify installation
caddy version
# Should show: v2.x.x
```

### Step 3: Configure Caddy (5 Lines!)

Create/edit Caddy configuration:

```bash
sudo nano /etc/caddy/Caddyfile
```

**Replace everything with this:**

```caddy
api.bondhu.tech {
    reverse_proxy localhost:8000
}
```

**That's it!** 🎉 Just 2 lines! Caddy will automatically:
- Get SSL certificate from Let's Encrypt
- Configure HTTPS
- Redirect HTTP to HTTPS
- Enable HTTP/2
- Auto-renew certificates every 90 days

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Start Caddy

```bash
# Reload Caddy configuration
sudo systemctl reload caddy

# Check status
sudo systemctl status caddy
# Should show: Active: active (running)

# Enable auto-start on boot
sudo systemctl enable caddy
```

**Check Caddy logs** (to see it getting the SSL certificate):

```bash
sudo journalctl -u caddy -f
```

You should see:
```
certificate obtained successfully
```

Press `Ctrl+C` to exit log view.

### Step 5: Open Ports in Azure NSG

**Azure Portal → Virtual Machines → Your VM → Networking → Network Settings**

Add **TWO** inbound port rules:

**Rule 1: HTTPS**
```
Priority: 998
Name: AllowHTTPS
Port: 443
Protocol: TCP
Source: Any
Action: Allow
```

**Rule 2: HTTP** (for Let's Encrypt certificate validation)
```
Priority: 999
Name: AllowHTTP
Port: 80
Protocol: TCP
Source: Any
Action: Allow
```

**Optional Rule 3:** Keep port 8000 for direct Docker access (if needed)
```
Priority: 1000
Name: AllowDocker
Port: 8000
Protocol: TCP
Source: Any
Action: Allow
```

### Step 6: Test HTTPS

```bash
# Test from Azure VM
curl https://api.bondhu.tech/health

# Test SSL certificate
curl -vI https://api.bondhu.tech 2>&1 | grep -E "SSL|subject|issuer"

# Test from your local machine
# Open browser: https://api.bondhu.tech/docs
# Should see FastAPI Swagger UI with valid SSL (green padlock 🔒)
```

**Expected result:**
- ✅ Valid SSL certificate from Let's Encrypt
- ✅ HTTP automatically redirects to HTTPS
- ✅ API accessible at `https://api.bondhu.tech`

---

## 🔄 Update Backend Configuration

### Update Backend .env File

SSH into VM (if not already):

```bash
ssh Bondhu_backend@57.159.29.168
cd ~/Project-Noor/bondhu-ai
nano .env
```

**Update these lines:**

```bash
# Google OAuth Redirect URI (for YouTube integration)
GOOGLE_REDIRECT_URI=https://api.bondhu.tech/api/v1/auth/youtube/callback

# Spotify Redirect URI (REQUIRES HTTPS)
SPOTIFY_REDIRECT_URI=https://api.bondhu.tech/api/v1/agents/music/callback

# CORS Configuration (include api.bondhu.tech)
CORS_ORIGINS=https://bondhu.tech,https://api.bondhu.tech,https://*.vercel.app,http://localhost:3000
```

**Save:** `Ctrl+X`, `Y`, `Enter`

**Restart containers:**

```bash
docker-compose down
docker-compose up -d

# Verify containers are running
docker-compose ps
```

---

## 🌐 Update Frontend (Vercel)

### Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select project: `bondhu-landing`
3. Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL`:

```bash
# From:
NEXT_PUBLIC_API_URL=http://57.159.29.168:8000

# To:
NEXT_PUBLIC_API_URL=https://api.bondhu.tech
```

5. **Save**
6. **Deployments → Redeploy** (MUST redeploy for env changes to take effect!)

---

## 🔐 Update OAuth Providers

### 1. Spotify Dashboard

**URL:** https://developer.spotify.com/dashboard

1. Select your app
2. **Edit Settings**
3. **Redirect URIs** → Add:
   ```
   https://api.bondhu.tech/api/v1/agents/music/callback
   ```
4. **Save**

### 2. Google OAuth Console

**URL:** https://console.cloud.google.com

1. **APIs & Services → Credentials**
2. Select your OAuth 2.0 Client ID
3. **Authorized redirect URIs** → Update:
   ```
   # Change from:
   http://57.159.29.168:8000/api/v1/auth/youtube/callback
   
   # To:
   https://api.bondhu.tech/api/v1/auth/youtube/callback
   ```
4. **Save**

### 3. Supabase (Already Correct)

Your Supabase OAuth already uses HTTPS:
```
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

Just verify the **Site URL** is set to:
```
https://bondhu.tech
```

---

## ✅ Testing Checklist

### Backend Tests

```bash
# 1. Health check (HTTPS)
curl https://api.bondhu.tech/health
# Expected: {"status":"healthy"}

# 2. HTTP redirect test (should redirect to HTTPS)
curl -I http://api.bondhu.tech/health
# Expected: 301 Moved Permanently → https://api.bondhu.tech

# 3. SSL certificate test
openssl s_client -connect api.bondhu.tech:443 -servername api.bondhu.tech
# Expected: Certificate chain from Let's Encrypt

# 4. CORS test
curl -H "Origin: https://bondhu.tech" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.bondhu.tech/api/v1/chat/send
# Expected: Access-Control-Allow-Origin header

# 5. API docs
# Open browser: https://api.bondhu.tech/docs
# Expected: FastAPI Swagger UI with green padlock 🔒
```

### Frontend Tests

```bash
# Open: https://bondhu.tech

# 1. Google Sign-in
✅ Click "Sign in with Google"
✅ Should redirect and authenticate

# 2. Chat functionality
✅ Open chat
✅ Send message
✅ Should get AI response (tests backend connection)

# 3. YouTube Connect
✅ Go to settings
✅ Click "Connect YouTube"
✅ Should authenticate with Google

# 4. Spotify Connect (tests HTTPS requirement)
✅ Go to settings
✅ Click "Connect Spotify"
✅ Should authenticate with Spotify
```

---

## 🔧 Advanced Configuration

### Add WebSocket Support (if needed)

If you need WebSocket support later:

```caddy
api.bondhu.tech {
    reverse_proxy localhost:8000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### Add Multiple Domains

```caddy
api.bondhu.tech, api2.bondhu.tech {
    reverse_proxy localhost:8000
}
```

### Add Rate Limiting (DDoS protection)

You might want to add Cloudflare in front of Caddy for rate limiting and DDoS protection.

---

## 🐛 Troubleshooting

### Issue: Caddy can't get certificate

**Error:** `Failed to obtain certificate`

**Check:**

```bash
# 1. Is DNS configured correctly?
nslookup api.bondhu.tech
# Should return: 57.159.29.168

# 2. Are ports 80 and 443 open?
sudo netstat -tulpn | grep -E ':(80|443)'
# Should show Caddy listening on both

# 3. Check Caddy logs
sudo journalctl -u caddy -n 50
# Look for errors

# 4. Is port 80 accessible from internet?
# Test from your local machine:
curl http://api.bondhu.tech
# Should connect (even if redirects to HTTPS)
```

**Fix:**
- Verify Azure NSG has ports 80 and 443 open
- Wait for DNS propagation (up to 24 hours, usually 10 minutes)
- Check no other service is using port 80/443

### Issue: Backend returns 502 Bad Gateway

**Error:** Caddy returns 502 when accessing `https://api.bondhu.tech`

**Check:**

```bash
# 1. Is Docker backend running?
docker-compose ps
# All should show "Up (healthy)"

# 2. Can Caddy reach localhost:8000?
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# 3. Check Docker logs
docker-compose logs -f bondhu-api
```

**Fix:**
```bash
# Restart Docker containers
docker-compose restart

# Check Caddy can connect
sudo systemctl restart caddy
```

### Issue: Certificate renewal fails

**Caddy automatically renews** certificates 30 days before expiration.

**If renewal fails:**

```bash
# 1. Check Caddy logs
sudo journalctl -u caddy -n 100 | grep -i renew

# 2. Manually trigger renewal
sudo caddy reload --config /etc/caddy/Caddyfile

# 3. Verify ports 80 and 443 are accessible
# Let's Encrypt needs to reach your server
```

---

## 📊 Comparison: Caddy vs Nginx

### Caddy Configuration (2 lines)

```caddy
api.bondhu.tech {
    reverse_proxy localhost:8000
}
```

### Nginx Configuration (35+ lines)

```nginx
server {
    listen 80;
    server_name api.bondhu.tech;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bondhu.tech;

    ssl_certificate /etc/letsencrypt/live/api.bondhu.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bondhu.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Plus Nginx requires:**
- Installing `certbot` separately
- Running `sudo certbot --nginx -d api.bondhu.tech`
- Configuring auto-renewal cron job

**Caddy does all of this automatically!** 🎉

---

## 🚀 Quick Start Summary

**Complete setup in 10 minutes:**

```bash
# 1. Add DNS record (at domain registrar)
# Type: A, Name: api, Value: 57.159.29.168

# 2. Install Caddy
ssh Bondhu_backend@57.159.29.168
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy -y

# 3. Configure Caddy (2 lines!)
sudo nano /etc/caddy/Caddyfile
# Add:
# api.bondhu.tech {
#     reverse_proxy localhost:8000
# }

# 4. Start Caddy
sudo systemctl reload caddy
sudo systemctl enable caddy

# 5. Update backend .env
cd ~/Project-Noor/bondhu-ai
nano .env
# Update GOOGLE_REDIRECT_URI and SPOTIFY_REDIRECT_URI to use https://api.bondhu.tech
docker-compose restart

# 6. Test
curl https://api.bondhu.tech/health
```

**Done!** ✅ You now have:
- ✅ Free SSL certificate from Let's Encrypt
- ✅ Automatic certificate renewal
- ✅ HTTP → HTTPS redirect
- ✅ HTTP/2 enabled
- ✅ Production-ready HTTPS API

---

## 💡 Pro Tips

1. **Monitor Caddy logs:**
   ```bash
   sudo journalctl -u caddy -f
   ```

2. **Check certificate expiration:**
   ```bash
   echo | openssl s_client -servername api.bondhu.tech -connect api.bondhu.tech:443 2>/dev/null | openssl x509 -noout -dates
   ```

3. **Caddy admin API** (optional):
   ```bash
   curl localhost:2019/config/
   ```

4. **Test config before reloading:**
   ```bash
   caddy validate --config /etc/caddy/Caddyfile
   ```

5. **Backup your Caddyfile:**
   ```bash
   sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup
   ```

---

## 🆚 When to Use Nginx vs Caddy?

**Use Caddy if:**
- ✅ You want simplest SSL setup
- ✅ You value automatic certificate management
- ✅ You prefer clean, readable config
- ✅ Your traffic is <10k requests/sec (more than enough for your scale)

**Use Nginx if:**
- ✅ You need maximum performance (100k+ requests/sec)
- ✅ You have complex routing requirements
- ✅ You need advanced caching strategies
- ✅ Your team already knows Nginx

**For your project (Bondhu): Use Caddy!** 🎯

It's simpler, faster to set up, and does everything you need with automatic SSL.

---

## 📚 References

- **Caddy Docs:** https://caddyserver.com/docs/
- **Caddy vs Nginx:** https://caddyserver.com/docs/comparisons
- **Let's Encrypt:** https://letsencrypt.org/

---

**Need help?** Check the troubleshooting section above or see `HTTPS_SOLUTIONS_COMPARISON.md` for alternative approaches.
