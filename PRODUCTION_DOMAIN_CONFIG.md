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
Frontend: https://bondhu-landing.vercel.app
Backend:  http://20.124.45.89:8000  (replace with your actual IP)
```

---

## 🔧 Configuration Changes Needed

### FRONTEND (Vercel) - 5 Places to Update

#### 1. Vercel Environment Variables (MOST IMPORTANT)

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

Add/Update these:

```bash
# Backend API URL - CRITICAL
NEXT_PUBLIC_API_URL=http://<YOUR-AZURE-VM-IP>:8000

# Example:
# NEXT_PUBLIC_API_URL=http://20.124.45.89:8000

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

# After (use Azure VM IP):
NEXT_PUBLIC_API_URL=http://<YOUR-AZURE-VM-IP>:8000
```

**Note:** Only update this if you want local development to use production backend. Otherwise keep localhost for local testing.

#### 3. Supabase OAuth Redirect URLs

**Location:** https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs → Authentication → URL Configuration

**Site URL:**
```
https://bondhu-landing.vercel.app
```
(or your custom domain)

**Redirect URLs (add all):**
```
https://bondhu-landing.vercel.app/auth/callback
https://bondhu-landing.vercel.app/**
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
http://<YOUR-AZURE-VM-IP>:8000/api/v1/auth/youtube/callback

# Vercel frontend
https://bondhu-landing.vercel.app
https://bondhu-landing.vercel.app/auth/callback
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
# Before:
GOOGLE_REDIRECT_URI=https://eolithic-meghan-overdiversely.ngrok-free.dev/api/v1/auth/youtube/callback

# After (use your Azure VM public IP):
GOOGLE_REDIRECT_URI=http://<YOUR-AZURE-VM-IP>:8000/api/v1/auth/youtube/callback

# Spotify Redirect URI (if using Spotify)
# Before:
SPOTIFY_REDIRECT_URI=https://maggie-fermentative-sherrill.ngrok-free.dev/api/v1/agents/music/callback

# After:
SPOTIFY_REDIRECT_URI=http://<YOUR-AZURE-VM-IP>:8000/api/v1/agents/music/callback

# API Configuration (can stay localhost since it's running inside Docker)
API_HOST=localhost
API_PORT=8000

# IMPORTANT: Add CORS allowed origins for your frontend
# Add this line if it doesn't exist:
CORS_ORIGINS=https://bondhu-landing.vercel.app,https://*.vercel.app,http://localhost:3000
```

**Save and restart containers:**
```bash
docker-compose down
docker-compose up -d
```

#### 2. Azure Network Security Group (NSG)

**Location:** Azure Portal → Virtual Machines → Your VM → Networking → Network Settings

**Add Inbound Port Rule:**

```
Priority: 1000
Name: AllowAPI
Port: 8000
Protocol: TCP
Source: Any (or restrict to specific IPs for security)
Action: Allow
```

This opens port 8000 so your Vercel frontend can access the backend API.

**Test if port is open:**
```bash
# From your local machine:
curl http://<your-azure-vm-ip>:8000/health

# Should return:
{"status":"healthy"}
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
        "https://bondhu-landing.vercel.app",  # Your Vercel domain
        "https://*.vercel.app",  # All Vercel preview deployments
        # Add your custom domain here if you have one
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If you need to update this, edit the file and restart containers.

---

## 🚀 Deployment Steps (In Order)

### Step 1: Get Your URLs
```bash
# 1. Get Vercel URL
→ Go to vercel.com/dashboard
→ Copy deployment URL

# 2. Get Azure VM IP
→ Go to portal.azure.com
→ Navigate to your VM
→ Copy Public IP address
```

### Step 2: Update Backend (Azure VM)
```bash
# SSH into VM
ssh Bondhu_backend@<your-vm-ip>

# Navigate to project
cd ~/Project-Noor/bondhu-ai

# Pull latest code
git pull origin main

# Edit .env file
nano .env

# Update these lines:
# GOOGLE_REDIRECT_URI=http://<YOUR-VM-IP>:8000/api/v1/auth/youtube/callback
# SPOTIFY_REDIRECT_URI=http://<YOUR-VM-IP>:8000/api/v1/agents/music/callback
# CORS_ORIGINS=https://bondhu-landing.vercel.app,https://*.vercel.app

# Save (Ctrl+X, Y, Enter)

# Restart containers
docker-compose down
docker-compose up -d

# Test API
curl http://localhost:8000/health
```

### Step 3: Open Port 8000 in Azure NSG
```bash
→ Azure Portal
→ Virtual Machines → Your VM
→ Networking → Network Settings
→ Add inbound port rule
→ Port: 8000, Protocol: TCP, Source: Any
→ Save
```

### Step 4: Update Vercel Environment Variables
```bash
→ vercel.com/dashboard
→ Your project → Settings → Environment Variables
→ Add/Update: NEXT_PUBLIC_API_URL=http://<YOUR-VM-IP>:8000
→ Save
→ Deployments → Redeploy latest
```

### Step 5: Update Supabase OAuth URLs
```bash
→ app.supabase.com/project/eilvtjkqmvmhkfzocrzs
→ Authentication → URL Configuration
→ Site URL: https://bondhu-landing.vercel.app
→ Redirect URLs: Add all Vercel URLs
→ Save
```

### Step 6: Update Google OAuth Redirect URIs
```bash
→ console.cloud.google.com
→ APIs & Services → Credentials
→ OAuth 2.0 Client ID
→ Authorized redirect URIs:
   - Add: https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
   - Add: http://<YOUR-VM-IP>:8000/api/v1/auth/youtube/callback
→ Save
```

### Step 7: Test Everything
```bash
# Test backend API
curl http://<YOUR-VM-IP>:8000/health

# Test frontend
→ Open: https://bondhu-landing.vercel.app
→ Try Google sign-in
→ Check if chat works (requires backend)
→ Check if YouTube connect works (requires backend)
```

---

## 🧪 Testing Checklist

After configuration, verify:

### Backend Tests (from your local machine)
```bash
# 1. Health check
curl http://<YOUR-VM-IP>:8000/health
# Expected: {"status":"healthy"}

# 2. CORS test
curl -H "Origin: https://bondhu-landing.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://<YOUR-VM-IP>:8000/api/v1/chat/send
# Expected: Headers with Access-Control-Allow-Origin

# 3. API docs
→ Open: http://<YOUR-VM-IP>:8000/docs
# Should see FastAPI Swagger UI
```

### Frontend Tests
```bash
→ Open: https://bondhu-landing.vercel.app

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
```

---

## 🔒 Security Considerations

### Current Setup (Development - HTTP)
```
Frontend: HTTPS (Vercel provides free SSL)
Backend:  HTTP (no SSL certificate)
          ⚠️ Browser may block mixed content (HTTPS→HTTP)
```

### Recommended Production Setup
```
Frontend: HTTPS (Vercel)
Backend:  HTTPS (SSL certificate + reverse proxy)

Options:
1. Use Azure Application Gateway (Azure's load balancer with SSL)
2. Use Nginx reverse proxy with Let's Encrypt SSL
3. Use Cloudflare in front of Azure VM
```

### Quick Fix: Nginx Reverse Proxy with SSL (Optional)

If you want HTTPS for your backend:

```bash
# On Azure VM
sudo apt install nginx certbot python3-certbot-nginx

# Get SSL certificate (requires domain name, not IP)
sudo certbot --nginx -d api.yourdomain.com

# Configure Nginx to proxy to Docker
sudo nano /etc/nginx/sites-available/bondhu-api

# Add:
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

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

# Enable and restart
sudo ln -s /etc/nginx/sites-available/bondhu-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Then update your Vercel env to use: `https://api.yourdomain.com`

---

## 📝 Summary of URLs to Update

### Get These First:
1. **Vercel Frontend URL:** `https://bondhu-landing.vercel.app` (or your custom domain)
2. **Azure VM Public IP:** `20.XXX.XXX.XXX` (get from Azure Portal)

### Update These:

| Location | Variable/Setting | New Value |
|----------|-----------------|-----------|
| **Vercel Env Vars** | `NEXT_PUBLIC_API_URL` | `http://<VM-IP>:8000` |
| **Backend .env** | `GOOGLE_REDIRECT_URI` | `http://<VM-IP>:8000/api/v1/auth/youtube/callback` |
| **Backend .env** | `SPOTIFY_REDIRECT_URI` | `http://<VM-IP>:8000/api/v1/agents/music/callback` |
| **Backend .env** | `CORS_ORIGINS` | `https://bondhu-landing.vercel.app,https://*.vercel.app` |
| **Supabase Site URL** | Site URL | `https://bondhu-landing.vercel.app` |
| **Supabase Redirects** | Redirect URLs | `https://bondhu-landing.vercel.app/auth/callback` + wildcards |
| **Google OAuth** | Authorized URIs | `http://<VM-IP>:8000/api/v1/auth/youtube/callback` |
| **Google OAuth** | Authorized URIs | `https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback` |
| **Azure NSG** | Inbound Port Rule | Port 8000, TCP, Allow |

---

## 🆘 Troubleshooting

### Issue: Frontend can't reach backend

**Error:** `Failed to fetch` or `Network error`

**Check:**
```bash
# 1. Is backend running?
ssh Bondhu_backend@<VM-IP>
docker-compose ps
# All should show "Up (healthy)"

# 2. Is port 8000 accessible?
curl http://<VM-IP>:8000/health
# Should return {"status":"healthy"}

# 3. Is NSG rule configured?
→ Azure Portal → VM → Networking
→ Verify port 8000 is allowed

# 4. Check backend logs
docker-compose logs -f bondhu-api
```

### Issue: CORS errors in browser console

**Error:** `Access to fetch blocked by CORS policy`

**Fix:**
```bash
# Update backend .env
ssh Bondhu_backend@<VM-IP>
cd ~/Project-Noor/bondhu-ai
nano .env

# Add/update:
CORS_ORIGINS=https://bondhu-landing.vercel.app,https://*.vercel.app,http://localhost:3000

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

**Replace `<VM-IP>` with your actual Azure VM public IP address!**

```bash
# 1. Update backend
ssh Bondhu_backend@<VM-IP>
cd ~/Project-Noor/bondhu-ai
nano .env
# Update GOOGLE_REDIRECT_URI and CORS_ORIGINS
docker-compose down && docker-compose up -d

# 2. Test backend
curl http://<VM-IP>:8000/health

# 3. Update Vercel
→ vercel.com → Your Project → Settings → Environment Variables
→ NEXT_PUBLIC_API_URL = http://<VM-IP>:8000
→ Redeploy

# 4. Update Supabase
→ app.supabase.com → Authentication → URL Configuration
→ Add your Vercel URLs

# 5. Update Google OAuth
→ console.cloud.google.com → Credentials
→ Add redirect URIs

# 6. Test frontend
→ Open: https://bondhu-landing.vercel.app
→ Test sign-in and features
```

Done! 🎉

Need help? Refer to the detailed sections above for specific issues.
