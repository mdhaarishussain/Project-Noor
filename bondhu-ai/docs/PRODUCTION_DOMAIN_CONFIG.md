# 🌐 Production Domain Configuration Guide

## Your Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🌍 FRONTEND (Vercel)                                      │
│  Domain: https://bondhu-landing.vercel.app                 │
│  OR: https://yourdomain.com (custom domain)                │
│                                                             │
│       ↓ API Calls (Chat, YouTube, etc.)                    │
│                                                             │
│  🖥️  BACKEND (Azure VM)                                    │
│  URL: http://<your-azure-vm-public-ip>:8000               │
│  OR: https://api.yourdomain.com (with reverse proxy)       │
│                                                             │
│       ↓ Database Queries                                   │
│                                                             │
│  🗄️  DATABASE (Supabase)                                   │
│  URL: https://eilvtjkqmvmhkfzocrzs.supabase.co            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Production Deployment Timeline

**Total Time: ~5 hours** (mostly waiting for DNS propagation)

```
Hour 0:     Add DNS A record at registrar
            - Type: A, Name: api, Value: 57.159.29.168, TTL: 7200
            ⏳ Start DNS propagation (2-4 hours)

Hour 0-4:   OPTIONAL: Test Spotify with Ngrok while waiting
            - Install ngrok (2 min)
            - Get temporary HTTPS URL
            - Test Spotify OAuth immediately
            ✅ Spotify working (temporary)

Hour 2-4:   Check DNS propagation
            - nslookup api.bondhu.tech 8.8.8.8
            - Wait until shows: 57.159.29.168
            ✅ DNS propagated

Hour 4:     Install SSL (Caddy or Nginx)
            - Caddy: 10 minutes (2-line config) ⭐ RECOMMENDED
            - Nginx: 20 minutes (35+ line config)
            ✅ SSL certificate obtained automatically

Hour 4.5:   Update all configurations
            - Backend .env (5 min)
            - Vercel environment variables (2 min)
            - OAuth providers: Spotify, Google (5 min)
            - Azure NSG ports 80, 443 (2 min)
            ✅ All configs updated

Hour 5:     Test everything
            - Frontend: https://bondhu.tech
            - Backend: https://api.bondhu.tech
            - Spotify OAuth: Working with HTTPS
            ✅ Production ready! 🎉
```

**Key Constraint:** DNS propagation (2-4 hours) due to TTL 7200 requirement

---

## 📋 Complete Checklist

### Step 1: Get Your URLs

**Frontend URL (Vercel):**
- Go to: https://vercel.com/dashboard
- Find your project: `bondhu-landing`
- Copy the deployment URL (looks like: `https://bondhu-landing-xyz123.vercel.app`)
- **OR** your custom domain if configured

**Backend URL (Azure VM):**
- Go to: https://portal.azure.com
- Navigate to: Virtual Machines → Your VM
- Copy the **Public IP address**
- Your backend URL will be: `http://<public-ip>:8000`

Example:
```
Frontend: https://bondhu.tech
Backend:  https://api.bondhu.tech (with SSL certificate)
          OR http://57.159.29.168:8000 (without SSL - not recommended for production)

Note: DNS A record for api.bondhu.tech requires TTL 7200 (2 hours)
      Allow 2-4 hours for DNS propagation before setting up SSL
```

---

## 🔧 Configuration Changes Needed

### FRONTEND (Vercel) - 5 Places to Update

#### 1. Vercel Environment Variables (MOST IMPORTANT)

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

Add/Update these:

```bash
# Backend API URL - CRITICAL
# Production (with SSL - RECOMMENDED):
NEXT_PUBLIC_API_URL=https://api.bondhu.tech

# OR for testing without SSL (not recommended):
# NEXT_PUBLIC_API_URL=http://57.159.29.168:8000

# Supabase (already correct, but verify)
NEXT_PUBLIC_SUPABASE_URL=https://eilvtjkqmvmhkfzocrzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbHZ0amtxbXZtaGtmem9jcnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDAxMDYsImV4cCI6MjA3NDA3NjEwNn0.mzQ52ds8H3LBDPjv7cIVai04AriswI2UXZPSDa3ldz0

# Upstash Redis (already correct)
UPSTASH_REDIS_REST_URL=https://romantic-terrapin-16956.upstash.io
UPSTASH_REDIS_REST_TOKEN=AUI8AAIncDI1MmJhMjA1YzU3OTk0M2ZkYWI2YjhiZWFmM2MyM2QxMnAyMTY5NTY
```

**Important:** After adding/updating environment variables in Vercel, you MUST redeploy!

**How to Redeploy:**
```
Vercel Dashboard → Deployments → Click "..." → Redeploy
```

#### 2. Local `.env.local` (For Local Development)

**File:** `bondhu-landing/.env.local`

Update line 6:
```bash
# Before:
NEXT_PUBLIC_API_URL=http://localhost:8000

# After (production with SSL):
NEXT_PUBLIC_API_URL=https://api.bondhu.tech

# OR without SSL (testing only):
# NEXT_PUBLIC_API_URL=http://57.159.29.168:8000
```

**Note:** Only update this if you want local development to use production backend. Otherwise keep localhost for local testing.

#### 3. Supabase OAuth Redirect URLs

**Location:** https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs → Authentication → URL Configuration

**Site URL:**
```
https://bondhu.tech
```

**Redirect URLs (add all):**
```
https://bondhu.tech/auth/callback
https://bondhu.tech/**
https://api.bondhu.tech/**
https://*.vercel.app/auth/callback
https://*.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```

#### 4. Google OAuth (YouTube Integration)

**Location:** https://console.cloud.google.com → APIs & Services → Credentials

Find your OAuth 2.0 Client ID and add **Authorized redirect URIs:**

```
# Supabase callback (for user auth)
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback

# Backend callback (for YouTube integration)
https://api.bondhu.tech/api/v1/auth/youtube/callback

# Frontend domain
https://bondhu.tech
https://bondhu.tech/auth/callback
```

#### 5. vercel.json API Rewrites (Optional - For Custom Domain)

**File:** `bondhu-landing/vercel.json`

If you want to use custom domain for backend API:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.yourdomain.com/api/:path*"
    }
  ]
}
```

**Note:** This requires setting up a reverse proxy on your Azure VM. Skip for now if using IP address directly.

---

### BACKEND (Azure VM) - 3 Places to Update

#### 1. Backend `.env` File

**Location:** Azure VM → `~/Project-Noor/bondhu-ai/.env`

**SSH into your VM:**
```bash
ssh Bondhu_backend@<your-vm-ip>
cd ~/Project-Noor/bondhu-ai
nano .env
```

**Update these variables:**

```bash
# Google OAuth Redirect URI (for YouTube integration)
# Production with SSL:
GOOGLE_REDIRECT_URI=https://api.bondhu.tech/api/v1/auth/youtube/callback

# Spotify Redirect URI (REQUIRES HTTPS)
SPOTIFY_REDIRECT_URI=https://api.bondhu.tech/api/v1/agents/music/callback

# API Configuration (can stay localhost since it's running inside Docker)
API_HOST=localhost
API_PORT=8000

# IMPORTANT: Add CORS allowed origins for your frontend
CORS_ORIGINS=https://bondhu.tech,https://api.bondhu.tech,https://*.vercel.app,http://localhost:3000
```

**Save and restart containers:**
```bash
docker-compose down
docker-compose up -d
```

#### 2. Azure Network Security Group (NSG)

**Location:** Azure Portal → Virtual Machines → Your VM → Networking → Network Settings

**Add Inbound Port Rules:**

```
# Rule 1: Allow HTTPS (for SSL traffic)
Priority: 998
Name: AllowHTTPS
Port: 443
Protocol: TCP
Source: Any
Action: Allow

# Rule 2: Allow HTTP (for Let's Encrypt certificate renewal)
Priority: 999
Name: AllowHTTP
Port: 80
Protocol: TCP
Source: Any
Action: Allow

# Rule 3: Allow Docker API (only if you need direct access without SSL)
Priority: 1000
Name: AllowAPI
Port: 8000
Protocol: TCP
Source: Any (or restrict to specific IPs for security)
Action: Allow
```

**Note:** With SSL setup using Nginx, external traffic comes through port 443 (HTTPS), and Nginx forwards it internally to port 8000.

**Test if ports are open:**
```bash
# Test HTTPS (after SSL setup):
curl https://api.bondhu.tech/health
# Should return: {"status":"healthy"}

# Test direct API (if port 8000 is open):
curl http://57.159.29.168:8000/health
# Should return: {"status":"healthy"}
```

#### 3. CORS Configuration in Backend Code

**File (on Azure VM):** `bondhu-ai/main.py`

Verify CORS allows your Vercel domain:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://bondhu.tech",  # Your custom domain
        "https://api.bondhu.tech",  # Your API subdomain
        "https://*.vercel.app",  # All Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If you need to update this, edit the file and restart containers.

---

## 🚀 Deployment Steps (In Order)

### Step 1: Configure DNS (Do This First - 2-4 Hour Wait)
```bash
# 1. Add DNS A record at your domain registrar
# Type: A
# Name: api
# Value: 57.159.29.168 (your Azure VM IP)
# TTL: 7200 (2 hours - minimum required by registrar)

# 2. Wait 2-4 hours for DNS propagation
# TTL 7200 = 2 hours cache time
# Full global propagation may take up to 4 hours

# 3. Verify DNS propagation (check every 30 minutes)
# Check with Google DNS (usually fastest):
nslookup api.bondhu.tech 8.8.8.8
# Should return: 57.159.29.168

# Check with Cloudflare DNS:
nslookup api.bondhu.tech 1.1.1.1
# Should return: 57.159.29.168

# Check online from multiple locations:
# Visit: https://dnschecker.org/#A/api.bondhu.tech
# Should show 57.159.29.168 with green checkmarks worldwide

# IMPORTANT: Only proceed with SSL setup once DNS shows correct IP!
```

### Step 1b: OPTIONAL - Test Spotify with Ngrok While Waiting
```bash
# While DNS propagates, you can test Spotify immediately with Ngrok

# SSH to Azure VM
ssh Bondhu_backend@57.159.29.168

# Install Ngrok (takes 2 minutes)
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Get free auth token from: https://dashboard.ngrok.com/get-started/setup/linux
ngrok config add-authtoken <YOUR_TOKEN>

# Start tunnel (creates instant HTTPS URL)
ngrok http 8000
# Copy the HTTPS URL: https://abc123.ngrok-free.app

# Update Spotify dashboard with this ngrok URL temporarily
# Later, replace with https://api.bondhu.tech after SSL setup

# See SPOTIFY_HTTPS_FIX.md for complete guide
```

### Step 2: Setup SSL Certificate (AFTER DNS Propagates)
```bash
# IMPORTANT: Only do this after Step 1 DNS shows 57.159.29.168!

# OPTION A: Caddy (RECOMMENDED - Easiest, 2-line config)
# See detailed guide: SETUP_CADDY_SSL.md

# Quick summary:
ssh Bondhu_backend@57.159.29.168
sudo apt update

# Install Caddy
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy -y

# Configure Caddy (just 2 lines!)
sudo nano /etc/caddy/Caddyfile
# Replace everything with:
# api.bondhu.tech {
#     reverse_proxy localhost:8000
# }

# Start Caddy (SSL certificate obtained automatically!)
sudo systemctl reload caddy
sudo systemctl enable caddy

# Check logs to see certificate being obtained
sudo journalctl -u caddy -f
# Press Ctrl+C to exit

# That's it! Caddy automatically:
# - Gets SSL certificate from Let's Encrypt
# - Configures HTTPS
# - Redirects HTTP to HTTPS
# - Enables HTTP/2
# - Auto-renews certificate every 90 days

# OR

# OPTION B: Nginx + Certbot (Traditional, 35+ lines config)
# See detailed guide: SETUP_SUBDOMAIN_SSL.md

# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/bondhu-api
# (See SETUP_SUBDOMAIN_SSL.md for full 35+ line config)

# Get free SSL certificate from Let's Encrypt
sudo certbot --nginx -d api.bondhu.tech
# Follow prompts, choose redirect HTTP to HTTPS
```

### Step 3: Update Backend (Azure VM)
```bash
# SSH into VM (if not already)
ssh Bondhu_backend@57.159.29.168

# Navigate to project
cd ~/Project-Noor/bondhu-ai

# Pull latest code
git pull origin main

# Edit .env file
nano .env

# Update these lines (MUST use HTTPS for Spotify):
GOOGLE_REDIRECT_URI=https://api.bondhu.tech/api/v1/auth/youtube/callback
SPOTIFY_REDIRECT_URI=https://api.bondhu.tech/api/v1/agents/music/callback
CORS_ORIGINS=https://bondhu.tech,https://api.bondhu.tech,https://*.vercel.app,http://localhost:3000

# Save (Ctrl+X, Y, Enter)

# Restart containers
docker-compose down
docker-compose up -d

# Test API (internally)
curl http://localhost:8000/health

# Test HTTPS (externally)
curl https://api.bondhu.tech/health
```

### Step 4: Open Ports in Azure NSG
```bash
→ Azure Portal
→ Virtual Machines → Your VM
→ Networking → Network Settings
→ Add THREE inbound port rules:
   1. Port 443 (HTTPS) - Priority 998
   2. Port 80 (HTTP for cert renewal) - Priority 999
   3. Port 8000 (Docker API - optional) - Priority 1000
→ Save
```

### Step 5: Update Vercel Environment Variables
```bash
→ vercel.com/dashboard
→ Your project → Settings → Environment Variables
→ Add/Update: NEXT_PUBLIC_API_URL=https://api.bondhu.tech
→ Save
→ Deployments → Redeploy latest
```

### Step 6: Update Supabase OAuth URLs
```bash
→ app.supabase.com/project/eilvtjkqmvmhkfzocrzs
→ Authentication → URL Configuration
→ Site URL: https://bondhu.tech
→ Redirect URLs: Add https://bondhu.tech/auth/callback and wildcards
→ Save
```

### Step 7: Update Google OAuth Redirect URIs
```bash
→ console.cloud.google.com
→ APIs & Services → Credentials
→ OAuth 2.0 Client ID
→ Authorized redirect URIs:
   - Add: https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
   - Add: https://api.bondhu.tech/api/v1/auth/youtube/callback
   - Add: https://bondhu.tech/auth/callback
→ Save
```

### Step 8: Update Spotify OAuth Redirect URI
```bash
→ developer.spotify.com/dashboard
→ Your App → Edit Settings
→ Redirect URIs:
   - Add: https://api.bondhu.tech/api/v1/agents/music/callback
→ Save
```

### Step 9: Test Everything
```bash
# Test backend API (HTTPS)
curl https://api.bondhu.tech/health

# Test SSL certificate
openssl s_client -connect api.bondhu.tech:443 -servername api.bondhu.tech

# Test frontend
→ Open: https://bondhu.tech
→ Try Google sign-in
→ Check if chat works (requires backend)
→ Check if YouTube connect works (requires backend)
→ Check if Spotify connect works (requires HTTPS backend)
```

---

## 🧪 Testing Checklist

After configuration, verify:

### Backend Tests (from your local machine)
```bash
# 1. Health check (HTTPS)
curl https://api.bondhu.tech/health
# Expected: {"status":"healthy"}

# 2. SSL certificate test
curl -vI https://api.bondhu.tech 2>&1 | grep -E "SSL|TLS|subject|issuer"
# Expected: Valid certificate from Let's Encrypt

# 3. CORS test
curl -H "Origin: https://bondhu.tech" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.bondhu.tech/api/v1/chat/send
# Expected: Headers with Access-Control-Allow-Origin

# 4. API docs
→ Open: https://api.bondhu.tech/docs
# Should see FastAPI Swagger UI with valid SSL
```

### Frontend Tests
```bash
→ Open: https://bondhu.tech

# 1. Google Sign-in
→ Click "Sign in with Google"
→ Should redirect to Google
→ Should redirect back to dashboard

# 2. Chat (requires backend)
→ Go to dashboard
→ Open chat
→ Send message
→ Should get AI response

# 3. YouTube Connect (requires backend)
→ Go to settings
→ Click "Connect YouTube"
→ Should redirect to Google OAuth
→ Should connect successfully

# 4. Spotify Connect (requires HTTPS backend)
→ Go to settings
→ Click "Connect Spotify"
→ Should redirect to Spotify OAuth
→ Should connect successfully
```

---

## 🔒 Security Considerations

### ✅ Recommended Production Setup (With SSL)
```
Frontend: HTTPS (Vercel provides free SSL)
Backend:  HTTPS (Let's Encrypt SSL + Nginx reverse proxy)
          
URL Structure:
- Frontend: https://bondhu.tech
- Backend:  https://api.bondhu.tech
```

### 🔐 SSL Certificate Setup (REQUIRED for Spotify OAuth)

**Why HTTPS is Required:**
- ✅ Spotify OAuth requires HTTPS redirect URIs
- ✅ Prevents browser mixed content warnings
- ✅ Secures API communication
- ✅ Professional and SEO-friendly

**Recommended Solution: Let's Encrypt SSL (Free)**

See detailed guide: **SETUP_SUBDOMAIN_SSL.md**

**Quick Summary:**
```bash
# 1. Add DNS A record
Type: A, Name: api, Value: 57.159.29.168

# 2. Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# 3. Configure Nginx
sudo nano /etc/nginx/sites-available/bondhu-api
# (Full config in SETUP_SUBDOMAIN_SSL.md)

# 4. Get free SSL certificate
sudo certbot --nginx -d api.bondhu.tech
# Automatically:
# - Gets certificate from Let's Encrypt
# - Configures HTTPS
# - Sets up auto-renewal (every 90 days)
# - Redirects HTTP to HTTPS

# 5. Update all URLs to use https://api.bondhu.tech
```

**Alternative Solutions:**
- **Ngrok** (testing only): See SPOTIFY_HTTPS_FIX.md
- **Cloudflare Tunnel**: See CLOUDFLARE_TUNNEL_SETUP.md
- **Azure Application Gateway**: $125/month (not recommended for small projects)

**Cost Comparison:**
```
Let's Encrypt:         $0/month ✅ RECOMMENDED
Cloudflare Tunnel:     $0/month (with Cloudflare account)
Azure App Gateway:     ~$125/month
Azure Front Door:      ~$35/month + data transfer
```

---

## 📝 Summary of URLs to Update

### Get These First:
1. **Frontend Domain:** `https://bondhu.tech`
2. **Azure VM Public IP:** `57.159.29.168`

### Update These:

| Location | Variable/Setting | New Value |
|----------|-----------------|-----------|
| **Vercel Env Vars** | `NEXT_PUBLIC_API_URL` | `https://api.bondhu.tech` |
| **Backend .env** | `GOOGLE_REDIRECT_URI` | `https://api.bondhu.tech/api/v1/auth/youtube/callback` |
| **Backend .env** | `SPOTIFY_REDIRECT_URI` | `https://api.bondhu.tech/api/v1/agents/music/callback` |
| **Backend .env** | `CORS_ORIGINS` | `https://bondhu.tech,https://api.bondhu.tech,https://*.vercel.app` |
| **Supabase Site URL** | Site URL | `https://bondhu.tech` |
| **Supabase Redirects** | Redirect URLs | `https://bondhu.tech/auth/callback` + wildcards |
| **Google OAuth** | Authorized URIs | `https://api.bondhu.tech/api/v1/auth/youtube/callback` |
| **Google OAuth** | Authorized URIs | `https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback` |
| **Google OAuth** | Authorized URIs | `https://bondhu.tech/auth/callback` |
| **Spotify OAuth** | Redirect URIs | `https://api.bondhu.tech/api/v1/agents/music/callback` |
| **Azure NSG** | Inbound Port Rules | Port 443 (HTTPS), Port 80 (HTTP), Port 8000 (optional) |

---

## 🆘 Troubleshooting

### Issue: Frontend can't reach backend

**Error:** `Failed to fetch` or `Network error`

**Check:**
```bash
# 1. Is backend running?
ssh Bondhu_backend@57.159.29.168
docker-compose ps
# All should show "Up (healthy)"

# 2. Is HTTPS accessible?
curl https://api.bondhu.tech/health
# Should return {"status":"healthy"}

# 3. Is SSL certificate valid?
curl -vI https://api.bondhu.tech 2>&1 | grep -E "SSL|subject"
# Should show Let's Encrypt certificate

# 4. Is NSG configured?
→ Azure Portal → VM → Networking
→ Verify ports 443, 80, and 8000 are allowed

# 5. Check backend logs
docker-compose logs -f bondhu-api

# 6. Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: CORS errors in browser console

**Error:** `Access to fetch blocked by CORS policy`

**Fix:**
```bash
# Update backend .env
ssh Bondhu_backend@57.159.29.168
cd ~/Project-Noor/bondhu-ai
nano .env

# Add/update (include api.bondhu.tech):
CORS_ORIGINS=https://bondhu.tech,https://api.bondhu.tech,https://*.vercel.app,http://localhost:3000

# Restart
docker-compose restart bondhu-api
```

### Issue: OAuth redirects to wrong URL

**Error:** OAuth redirects to localhost instead of Vercel

**Fix:**
1. Check Supabase Site URL is set to your Vercel domain
2. Check all Redirect URLs include your Vercel domain
3. Clear browser cache and try again

### Issue: Environment variables not updating in Vercel

**Fix:**
1. Verify you saved the env vars in Vercel dashboard
2. **Trigger a new deployment** (env vars only apply to new builds)
3. Go to Deployments → Click "..." → Redeploy

---

## 🎯 Quick Start Commands

**Complete production setup with HTTPS:**

```bash
# 1. Setup SSL certificate (see SETUP_SUBDOMAIN_SSL.md for details)
# - Add DNS A record: api.bondhu.tech → 57.159.29.168
# - Install Nginx + Certbot
# - Get Let's Encrypt certificate

# 2. Update backend
ssh Bondhu_backend@57.159.29.168
cd ~/Project-Noor/bondhu-ai
nano .env
# Update to use HTTPS URLs:
# GOOGLE_REDIRECT_URI=https://api.bondhu.tech/api/v1/auth/youtube/callback
# SPOTIFY_REDIRECT_URI=https://api.bondhu.tech/api/v1/agents/music/callback
# CORS_ORIGINS=https://bondhu.tech,https://api.bondhu.tech,https://*.vercel.app
docker-compose down && docker-compose up -d

# 3. Test backend HTTPS
curl https://api.bondhu.tech/health

# 4. Update Vercel
→ vercel.com → Your Project → Settings → Environment Variables
→ NEXT_PUBLIC_API_URL = https://api.bondhu.tech
→ Redeploy

# 5. Update Supabase
→ app.supabase.com → Authentication → URL Configuration
→ Site URL: https://bondhu.tech
→ Add redirect URLs (including https://api.bondhu.tech/**)

# 6. Update Google OAuth
→ console.cloud.google.com → Credentials
→ Update redirect URI to: https://api.bondhu.tech/api/v1/auth/youtube/callback

# 7. Update Spotify OAuth
→ developer.spotify.com/dashboard
→ Add redirect URI: https://api.bondhu.tech/api/v1/agents/music/callback

# 8. Test frontend
→ Open: https://bondhu.tech
→ Test sign-in, chat, YouTube connect, and Spotify connect
```

Done! 🎉

Need help? Refer to the detailed sections above for specific issues.
