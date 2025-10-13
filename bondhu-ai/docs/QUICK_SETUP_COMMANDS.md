# 🚀 Quick Setup Commands - bondhu.tech

## Your Production URLs
```
Frontend: https://bondhu.tech
Backend:  http://57.159.29.168:8000
```

---

## Step 1: Update Backend (5 minutes)

```bash
# SSH into your Azure VM
ssh Bondhu_backend@57.159.29.168

# Navigate to project
cd ~/Project-Noor/bondhu-ai

# Edit .env file
nano .env

# Find and update these 3 lines:
GOOGLE_REDIRECT_URI=http://57.159.29.168:8000/api/v1/auth/youtube/callback
SPOTIFY_REDIRECT_URI=http://57.159.29.168:8000/api/v1/agents/music/callback
CORS_ORIGINS=https://bondhu.tech,https://*.vercel.app,http://localhost:3000

# Save: Ctrl+X, Y, Enter

# Restart containers
docker-compose down
docker-compose up -d

# Verify containers are running
docker-compose ps

# Test backend locally
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Exit SSH
exit
```

---

## Step 2: Test Backend from Your Machine

```powershell
# From Windows PowerShell
curl http://57.159.29.168:8000/health

# Expected response: {"status":"healthy"}
# If this fails, port 8000 is not open in Azure NSG
```

---

## Step 3: Open Port 8000 in Azure (if needed)

If the above test failed:

```
1. Go to: https://portal.azure.com
2. Navigate to: Virtual Machines → Your VM
3. Click: Networking → Network Settings
4. Click: Add inbound port rule
5. Configure:
   - Priority: 1000
   - Name: AllowAPI
   - Port: 8000
   - Protocol: TCP
   - Source: Any
   - Action: Allow
6. Click: Save
7. Wait 1 minute, then test again
```

---

## Step 4: Update Vercel Environment Variables

```
1. Go to: https://vercel.com/dashboard
2. Find your project: bondhu-landing
3. Click: Settings → Environment Variables
4. Find or Add: NEXT_PUBLIC_API_URL
5. Set value to: http://57.159.29.168:8000
6. Click: Save
7. Go to: Deployments tab
8. Click: "..." on latest deployment → Redeploy
9. Wait for deployment to complete
```

---

## Step 5: Update Supabase OAuth URLs

```
1. Go to: https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs
2. Navigate to: Authentication → URL Configuration
3. Set Site URL to:
   https://bondhu.tech

4. In Redirect URLs section, add:
   https://bondhu.tech/auth/callback
   https://bondhu.tech/**
   https://*.vercel.app/auth/callback
   https://*.vercel.app/**
   http://localhost:3000/auth/callback
   http://localhost:3000/**

5. Click: Save
```

---

## Step 6: Update Google OAuth Redirect URIs

```
1. Go to: https://console.cloud.google.com
2. Navigate to: APIs & Services → Credentials
3. Find: OAuth 2.0 Client ID (for your project)
4. Click: Edit (pencil icon)
5. Under Authorized redirect URIs, add:
   https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
   http://57.159.29.168:8000/api/v1/auth/youtube/callback
   https://bondhu.tech/auth/callback

6. Click: Save
```

---

## Step 7: Test Everything

### Test 1: Backend Health
```powershell
# From PowerShell
curl http://57.159.29.168:8000/health
```
✅ Should return: `{"status":"healthy"}`

### Test 2: Frontend Loads
```
Open: https://bondhu.tech
```
✅ Should load without errors

### Test 3: Google Sign-In
```
1. Go to: https://bondhu.tech/sign-in
2. Click: "Continue with Google"
3. Complete OAuth flow
```
✅ Should redirect to dashboard and be logged in

### Test 4: Chat Works
```
1. Go to dashboard
2. Open chat interface
3. Send a message
```
✅ Should get AI response

### Test 5: YouTube Connect
```
1. Go to Settings
2. Click: "Connect YouTube"
3. Complete OAuth
```
✅ Should show "Connected"

---

## 🎯 Verification Commands

```bash
# Check if backend is accessible
curl http://57.159.29.168:8000/health

# Check API documentation
# Open in browser: http://57.159.29.168:8000/docs

# Check frontend
# Open in browser: https://bondhu.tech

# SSH and check backend logs
ssh Bondhu_backend@57.159.29.168
cd ~/Project-Noor/bondhu-ai
docker-compose logs -f
```

---

## 🔥 If Something Goes Wrong

### Backend not accessible from outside
```bash
# Check NSG rule exists
→ Azure Portal → VM → Networking
→ Verify port 8000 inbound rule

# Check containers are running
ssh Bondhu_backend@57.159.29.168
docker-compose ps
# All should show "Up (healthy)"
```

### CORS errors in browser
```bash
ssh Bondhu_backend@57.159.29.168
cd ~/Project-Noor/bondhu-ai
nano .env

# Verify this line:
CORS_ORIGINS=https://bondhu.tech,https://*.vercel.app,http://localhost:3000

# Restart
docker-compose restart bondhu-api
```

### OAuth not working
```
1. Check Supabase Site URL = https://bondhu.tech
2. Check all redirect URLs added
3. Clear browser cache
4. Try incognito mode
```

### Vercel still using old URL
```
→ Trigger a new deployment!
→ Vercel Dashboard → Deployments → Redeploy
(Env vars only apply to NEW builds)
```

---

## ✅ Final Checklist

- [ ] Backend .env updated with production URLs
- [ ] Docker containers restarted
- [ ] Port 8000 open in Azure NSG
- [ ] Backend accessible: `curl http://57.159.29.168:8000/health`
- [ ] Vercel env var: `NEXT_PUBLIC_API_URL=http://57.159.29.168:8000`
- [ ] Vercel redeployed
- [ ] Supabase Site URL: `https://bondhu.tech`
- [ ] Supabase redirect URLs added
- [ ] Google OAuth redirect URIs added
- [ ] Frontend loads: `https://bondhu.tech`
- [ ] Google sign-in works
- [ ] Chat works (requires backend)
- [ ] YouTube connect works (requires backend)

---

## 📞 Support

If you need help:
1. Check logs: `docker-compose logs -f`
2. Review: `PRODUCTION_DOMAIN_CONFIG.md`
3. Follow: `DEPLOYMENT_CHECKLIST.md`

Your app should now be live at **https://bondhu.tech**! 🎉
