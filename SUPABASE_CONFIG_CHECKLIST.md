# Supabase OAuth Configuration Checklist

## ✅ Step-by-Step Configuration

### 1️⃣ Supabase Dashboard - URL Configuration

🔗 **URL:** https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs/auth/url-configuration

#### Site URL
```
Production: https://bondhu-landing.vercel.app
```

#### Redirect URLs (Copy-paste all of these)
```
http://localhost:3000/auth/callback
http://localhost:3000/**
https://bondhu-landing.vercel.app/auth/callback
https://bondhu-landing.vercel.app/**
https://*.vercel.app/auth/callback
https://*.vercel.app/**
```

**Screenshot location:** Settings → Authentication → URL Configuration

---

### 2️⃣ Supabase Dashboard - Google Provider

🔗 **URL:** https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs/auth/providers

#### Enable Google OAuth
- [ ] Toggle **Google** provider to **Enabled**
- [ ] Enter **Client ID** from Google Cloud Console
- [ ] Enter **Client Secret** from Google Cloud Console
- [ ] Click **Save**

**Screenshot location:** Authentication → Providers → Google

---

### 3️⃣ Google Cloud Console - OAuth Credentials

🔗 **URL:** https://console.cloud.google.com/apis/credentials

#### Authorized Redirect URIs
```
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

**That's it!** Only add the Supabase URL here, NOT your app URLs.

**Screenshot location:** APIs & Services → Credentials → OAuth 2.0 Client IDs → Edit

---

### 4️⃣ Vercel Environment Variables

🔗 **URL:** https://vercel.com/dashboard (select your project → Settings → Environment Variables)

#### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://eilvtjkqmvmhkfzocrzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (your anon key)
```

**Screenshot location:** Project Settings → Environment Variables

---

## 🧪 Testing Checklist

### Test on Localhost

- [ ] Clear browser cache/cookies
- [ ] Visit: http://localhost:3000/sign-in
- [ ] Click "Continue with Google"
- [ ] Select Google account
- [ ] **Expected:** Redirect to `http://localhost:3000/auth/callback?code=...`
- [ ] **Expected:** Then redirect to `/dashboard` or `/onboarding/personality`
- [ ] **Expected:** You're logged in! ✅

### Test on Vercel

- [ ] Visit: https://bondhu-landing.vercel.app/sign-in
- [ ] Click "Continue with Google"
- [ ] Select Google account
- [ ] **Expected:** Redirect to `https://bondhu-landing.vercel.app/auth/callback?code=...`
- [ ] **Expected:** Then redirect to `/dashboard` or `/onboarding/personality`
- [ ] **Expected:** You're logged in! ✅

---

## 📍 Where to Find Configuration

### Supabase Project Details
```
Project Name: eilvtjkqmvmhkfzocrzs
Region: US East
URL: https://eilvtjkqmvmhkfzocrzs.supabase.co
```

### Vercel Deployment
```
Project: bondhu-landing
Production URL: https://bondhu-landing.vercel.app
Preview URLs: https://bondhu-landing-[branch].vercel.app
```

### Frontend Callback Route
```
File: src/app/auth/callback/route.ts
Path: /auth/callback
Handler: Exchanges OAuth code for session
```

---

## 🔧 Common Configuration Mistakes

### ❌ Wrong: Adding app URLs to Google Cloud Console
```
# DON'T DO THIS in Google Cloud Console:
http://localhost:3000/auth/callback ❌
https://bondhu-landing.vercel.app/auth/callback ❌
```

### ✅ Correct: Only Supabase callback in Google
```
# ONLY THIS in Google Cloud Console:
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback ✅
```

### ❌ Wrong: Forgetting wildcards for Vercel preview URLs
```
# Incomplete - won't work for preview deployments:
https://bondhu-landing.vercel.app/auth/callback
```

### ✅ Correct: Include wildcards
```
# Complete - works for all Vercel deployments:
https://bondhu-landing.vercel.app/auth/callback
https://bondhu-landing.vercel.app/**
https://*.vercel.app/auth/callback
https://*.vercel.app/**
```

---

## 🎯 Configuration Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Redirected to Google OAuth
    ↓
User selects account
    ↓
Google redirects to SUPABASE
    ↓
Supabase checks: "Is this redirect URL allowed?"
    ↓
    ├─ YES → Redirect to your app's /auth/callback
    │         (Must be in Supabase Redirect URLs list)
    │
    └─ NO  → Redirect to Site URL (home page) ❌
              (This is your current problem!)
    ↓
Your callback route processes the code
    ↓
Creates session & profile
    ↓
Redirects to dashboard
```

**Key insight:** The redirect URL must be configured in **Supabase settings**, not in your code!

---

## 🆘 Still Not Working?

### Check Supabase Logs
1. Go to: https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs/logs/explorer
2. Filter by: `auth`
3. Look for: `redirect_to` errors or `invalid_request` errors

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors related to `supabase` or `auth`

### Verify Environment Variables
```powershell
# In your project directory
cd "C:\Users\mdhaa\Desktop\Project Noor\bondhu-landing"

# Check .env.local file
cat .env.local

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://eilvtjkqmvmhkfzocrzs.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Test Supabase Connection
```powershell
# Run dev server
npm run dev

# In browser console (F12):
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
# Should output: https://eilvtjkqmvmhkfzocrzs.supabase.co
```

---

## 📝 Copy-Paste Values

### For Supabase Site URL
```
https://bondhu-landing.vercel.app
```

### For Supabase Redirect URLs (all of them)
```
http://localhost:3000/auth/callback
http://localhost:3000/**
https://bondhu-landing.vercel.app/auth/callback
https://bondhu-landing.vercel.app/**
https://*.vercel.app/auth/callback
https://*.vercel.app/**
```

### For Google Cloud Console Authorized Redirect URI
```
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

---

## ✨ After Configuration

Once everything is configured:

1. **Clear browser data** (Ctrl+Shift+Delete)
2. **Restart dev server** (if testing locally)
3. **Try OAuth login**
4. **Check URL after redirect** - should be `/auth/callback?code=...`
5. **Verify you're logged in** - should see user info in dashboard

If you see `/auth/callback?code=...` in the URL, then the configuration is working! 🎉

The callback route will automatically:
- Exchange the code for a session
- Create a user profile (if first time)
- Redirect to dashboard or onboarding
- Save the session in cookies

---

## 🔄 When You Add a Custom Domain

When your DNS is working and you add `yourdomain.com`:

### Update Supabase
```
Site URL: https://yourdomain.com

Add to Redirect URLs:
https://yourdomain.com/auth/callback
https://yourdomain.com/**
```

### Google Cloud Console
No changes needed! Still just:
```
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

### Keep Vercel URLs
Don't remove the Vercel URLs - keep them so preview deployments still work!

---

Good luck! 🚀
