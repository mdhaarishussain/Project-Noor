# 🔴 CORS Error Fixed

## Problem

Frontend at `https://www.bondhu.tech` was blocked by CORS policy when trying to access `https://api.bondhu.tech`:

```
Access to fetch at 'https://api.bondhu.tech/api/v1/chat/history/...' 
from origin 'https://www.bondhu.tech' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

Backend CORS configuration in `main.py` only allowed:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Missing:
- ❌ `https://bondhu.tech`
- ❌ `https://www.bondhu.tech` (www subdomain)
- ❌ `https://api.bondhu.tech`
- ❌ Vercel preview deployments (`*.vercel.app`)

## Solution

### 1. Updated `main.py` CORS Configuration

**Before:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

**After:**
```python
# Get CORS origins from environment variable
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    cors_origins = [origin.strip() for origin in cors_origins_env.split(",")]
else:
    cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

# Always add production domains
production_domains = [
    "https://bondhu.tech",
    "https://www.bondhu.tech",  # www subdomain
    "https://api.bondhu.tech",
]
for domain in production_domains:
    if domain not in cors_origins:
        cors_origins.append(domain)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel previews
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

### 2. Environment Variable Support

Backend now supports `CORS_ORIGINS` environment variable in `.env`:

```bash
CORS_ORIGINS=https://bondhu.tech,https://www.bondhu.tech,https://api.bondhu.tech,http://localhost:3000
```

**Optional:** Set this in backend `.env` file for explicit control, or leave empty to use defaults.

### 3. Vercel Domain Regex

Added `allow_origin_regex=r"https://.*\.vercel\.app"` to support:
- Preview deployments: `https://bondhu-landing-abc123.vercel.app`
- Production: `https://bondhu-landing.vercel.app`

---

## What Changed

### ✅ Now Allows:
- `https://bondhu.tech` (production without www)
- `https://www.bondhu.tech` (production with www) ⭐ **This was the issue!**
- `https://api.bondhu.tech` (API subdomain)
- `https://*.vercel.app` (all Vercel deployments via regex)
- `http://localhost:3000` (local development)
- `http://127.0.0.1:3000` (local development)

### ✅ Added:
- `OPTIONS` method for CORS preflight requests
- `expose_headers=["*"]` to expose response headers

---

## Deployment Steps

### 1. SSH to Azure VM and Update Backend

```bash
# SSH to VM
ssh Bondhu_backend@57.159.29.168

# Navigate to project
cd ~/Project-Noor/bondhu-ai

# Pull latest changes (with CORS fix)
git pull origin main

# Restart Docker containers to apply changes
docker-compose down
docker-compose up -d

# Check logs to verify restart
docker-compose logs -f bondhu-api
# Press Ctrl+C to exit

# Verify backend is running
curl http://localhost:8000/health
```

### 2. Test CORS from Browser

Open browser console on `https://bondhu.tech` or `https://www.bondhu.tech`:

```javascript
// Test API connection
fetch('https://api.bondhu.tech/health')
  .then(res => res.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(err => console.error('❌ CORS error:', err));
```

### 3. Verify Chat Functionality

1. Visit: https://bondhu.tech or https://www.bondhu.tech
2. Sign in with Google
3. Open chat
4. Send a message
5. **Should work now!** ✅

---

## Understanding CORS

### What is CORS?

**Cross-Origin Resource Sharing (CORS)** is a browser security feature that blocks requests from one domain to another unless explicitly allowed by the server.

### Why Does It Happen?

- **Frontend:** `https://www.bondhu.tech` (Port 443)
- **Backend:** `https://api.bondhu.tech` (Different subdomain)
- **Browser:** "These are different origins! Block it unless server says it's OK."

### CORS Preflight Request

Before making the actual request, browser sends an `OPTIONS` request (preflight) asking:
```
"Is https://www.bondhu.tech allowed to access this API?"
```

Backend must respond with:
```
Access-Control-Allow-Origin: https://www.bondhu.tech
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
```

---

## Troubleshooting

### Issue: Still seeing CORS errors

**Solution 1: Clear browser cache**
```
Chrome: Ctrl+Shift+Delete → Clear cached images and files
```

**Solution 2: Hard reload**
```
Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

**Solution 3: Check backend logs**
```bash
ssh Bondhu_backend@57.159.29.168
cd ~/Project-Noor/bondhu-ai
docker-compose logs -f bondhu-api
# Look for CORS-related errors
```

### Issue: Vercel preview deployments not working

**Check:** Backend `.env` should include Vercel domains in `CORS_ORIGINS`:
```bash
CORS_ORIGINS=https://bondhu.tech,https://www.bondhu.tech,https://*.vercel.app
```

Or use the regex pattern (already implemented):
```python
allow_origin_regex=r"https://.*\.vercel\.app"
```

### Issue: localhost development not working

**Check:** CORS configuration includes:
```python
"http://localhost:3000",
"http://127.0.0.1:3000",
```

Already included by default! ✅

---

## Summary

| What | Before | After |
|------|--------|-------|
| **CORS Origins** | Only localhost | Production domains + Vercel + localhost |
| **www.bondhu.tech** | ❌ Blocked | ✅ Allowed |
| **bondhu.tech** | ❌ Blocked | ✅ Allowed |
| **api.bondhu.tech** | ❌ Blocked | ✅ Allowed |
| **Vercel previews** | ❌ Blocked | ✅ Allowed (regex) |
| **OPTIONS method** | ❌ Not included | ✅ Included |

---

## Next Steps

1. **SSH to Azure VM** and pull latest code ✅
2. **Restart Docker containers** (`docker-compose restart`) ✅
3. **Test on production** (https://bondhu.tech) ✅
4. **Verify all features work:**
   - ✅ Chat functionality
   - ✅ YouTube OAuth
   - ✅ Video recommendations
   - ✅ User stats

**CORS error should be resolved!** 🎉
