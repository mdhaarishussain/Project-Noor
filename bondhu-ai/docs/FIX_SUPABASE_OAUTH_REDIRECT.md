# Fix Supabase Google OAuth Redirect Issue

## 🚀 Quick Fix (TL;DR)

**Problem:** Redirecting to `http://localhost:3000/?code=...` instead of `/auth/callback`

**Solution:** Add these URLs to your Supabase project:

1. Go to: https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs
2. Navigate to: **Authentication** → **URL Configuration**
3. Set **Site URL** to:
   - Dev: `http://localhost:3000`
   - Production: `https://bondhu-landing.vercel.app`
4. Add to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   https://bondhu-landing.vercel.app/auth/callback
   https://bondhu-landing.vercel.app/**
   https://*.vercel.app/**
   ```
5. Save and test!

**Google Cloud Console:** Only needs `https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback` ✅

---

## Problem
After Google login, you're redirected to:
```
http://localhost:3000/?code=f279b3d9-7c3d-49dc-b59a-c4fb5a113ea4
```

Instead of:
```
http://localhost:3000/auth/callback?code=...
```

This causes the OAuth code to not be processed, leaving you stuck at home page.

---

## Root Cause

Your **Supabase project** doesn't have the correct redirect URL configured in its settings.

---

## Solution: Update Supabase Site URL & Redirect URLs

### Step 1: Go to Supabase Dashboard

1. Visit: https://app.supabase.com
2. Select your project: `eilvtjkqmvmhkfzocrzs`
3. Go to **Authentication** → **URL Configuration**

### Step 2: Update Site URL

**For development (localhost):**
```
http://localhost:3000
```

**For Vercel deployment:**
```
https://bondhu-landing.vercel.app
```

(Or whatever your actual Vercel URL is - check your Vercel dashboard)

### Step 3: Update Redirect URLs

**Add ALL of these to Supabase Redirect URLs:**

```
http://localhost:3000/auth/callback
http://localhost:3000/**
https://bondhu-landing.vercel.app/auth/callback
https://bondhu-landing.vercel.app/**
https://*.vercel.app/auth/callback
https://*.vercel.app/**
```

**Why the wildcards?** Vercel creates preview URLs for each git branch (like `bondhu-landing-git-feature-branch.vercel.app`), so `*.vercel.app` allows all your Vercel deployments to work.

### Step 4: Enable Google OAuth Provider

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** provider
3. Click **Enable**
4. Add your Google OAuth credentials:
   - **Client ID:** (from Google Cloud Console)
   - **Client Secret:** (from Google Cloud Console)

### Step 5: Configure Google Cloud Console

1. Go to: https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add **Authorized redirect URIs:**

```
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

**That's it!** You only need the Supabase callback URL in Google Cloud Console. Your app's URLs (localhost and Vercel) go in **Supabase settings**, not Google.

**Important:** The Supabase callback URL must be exact:
```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

Replace `[YOUR-PROJECT-REF]` with `eilvtjkqmvmhkfzocrzs`

---

## Complete Configuration Checklist

### ✅ Supabase Dashboard

**Authentication → URL Configuration:**
- [x] Site URL: `http://localhost:3000` (for dev) or `https://bondhu-landing.vercel.app` (for production)
- [x] Redirect URLs: 
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/**
  https://bondhu-landing.vercel.app/auth/callback
  https://bondhu-landing.vercel.app/**
  https://*.vercel.app/auth/callback
  https://*.vercel.app/**
  ```

**Authentication → Providers → Google:**
- [x] Enabled: ✅
- [x] Client ID: `<from Google Cloud Console>`
- [x] Client Secret: `<from Google Cloud Console>`

### ✅ Google Cloud Console

**Credentials → OAuth 2.0 Client → Authorized redirect URIs:**
- [x] `https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback`

**Note:** You DON'T need to add your Vercel or localhost URLs to Google Cloud Console. Those go in Supabase only.

### ✅ Frontend Code (Already Done)

**Sign-in page:**
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard`
  }
})
```

**Callback route:** `/app/auth/callback/route.ts` ✅

---

## Testing After Configuration

1. **Clear browser cache and cookies** (important!)
   - Press `Ctrl+Shift+Delete`
   - Clear "Cookies and other site data"
   - Clear "Cached images and files"

2. **Restart your dev server:**
   ```powershell
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. **Test Google Sign-In:**
   - Go to: http://localhost:3000/sign-in
   - Click "Continue with Google"
   - Select your Google account
   - You should be redirected to: `http://localhost:3000/auth/callback?code=...`
   - Then automatically redirected to: `/onboarding/personality` (first time) or `/dashboard`

---

## Expected Flow

### Correct Flow ✅

```
1. Click "Continue with Google"
   ↓
2. Redirect to Google OAuth
   https://accounts.google.com/o/oauth2/v2/auth?...
   ↓
3. Select Google account
   ↓
4. Redirect to Supabase
   https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback?code=...
   ↓
5. Redirect to your app callback
   http://localhost:3000/auth/callback?code=...
   ↓
6. Exchange code for session
   ↓
7. Create profile if needed
   ↓
8. Redirect to dashboard or onboarding
   http://localhost:3000/dashboard
```

### Current (Broken) Flow ❌

```
1. Click "Continue with Google"
   ↓
2. Redirect to Google OAuth
   ↓
3. Select Google account
   ↓
4. Redirect to Supabase
   ↓
5. Redirect to HOME PAGE (wrong!)
   http://localhost:3000/?code=...
   ↓
6. Code never processed ❌
   ↓
7. User stuck at home page, not logged in ❌
```

---

## Quick Fix Command

If you want to test with **email/password** instead while fixing OAuth:

```typescript
// Use email/password sign in temporarily
await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'your-password'
})
```

This will work immediately without OAuth configuration.

---

## Troubleshooting

### Issue: Still redirecting to home page

**Solution:** Check Supabase logs
1. Supabase Dashboard → **Logs** → **Auth**
2. Look for redirect errors
3. Verify the redirect URL matches exactly

### Issue: "Invalid redirect URL"

**Solution:** Add wildcard to Supabase
```
http://localhost:3000/**
```

### Issue: "OAuth callback error"

**Solution:** Check Google Cloud Console
- Verify redirect URI is exact Supabase callback URL
- Check if Google OAuth credentials are correct in Supabase

### Issue: Code exchange fails

**Solution:** Check Supabase API keys
1. Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
3. Restart dev server after changing `.env.local`

---

## Production Deployment (Vercel) - Already Done! ✅

Your app is already on Vercel! Here's what you need to configure:

### 1. Get Your Vercel URL

Check your Vercel dashboard or use this default pattern:
```
https://bondhu-landing.vercel.app
```

Or find it by running:
```powershell
vercel --prod
```

### 2. Supabase Configuration

**Site URL:** Use your Vercel URL
```
https://bondhu-landing.vercel.app
```

**Redirect URLs:** (Should already include these from Step 3 above)
```
https://bondhu-landing.vercel.app/auth/callback
https://bondhu-landing.vercel.app/**
https://*.vercel.app/auth/callback
https://*.vercel.app/**
```

### 3. Vercel Environment Variables

Make sure these are set in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://eilvtjkqmvmhkfzocrzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**To verify:**
1. Go to: https://vercel.com/dashboard
2. Select your project: `bondhu-landing`
3. Go to **Settings** → **Environment Variables**
4. Check that Supabase keys are present

### 4. Google Cloud Console - No Changes Needed!

You only need the Supabase callback URL:
```
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

**DO NOT** add your Vercel URLs to Google Cloud Console.

---

## Testing on Vercel

Once Supabase is configured:

1. **Visit your Vercel app:**
   ```
   https://bondhu-landing.vercel.app
   ```

2. **Click "Sign in with Google"**

3. **Expected flow:**
   ```
   1. Redirect to Google OAuth
   2. Select Google account
   3. Redirect to: https://bondhu-landing.vercel.app/auth/callback?code=...
   4. Exchange code for session
   5. Redirect to: /dashboard or /onboarding/personality
   6. ✅ You're logged in!
   ```

---

## Custom Domain (When Ready)

When you get your DNS working and add a custom domain:

### Vercel Dashboard
1. Go to **Settings** → **Domains**
2. Add your domain: `yourdomain.com`
3. Follow Vercel's DNS instructions

### Supabase Dashboard
Update redirect URLs to include:
```
https://yourdomain.com/auth/callback
https://yourdomain.com/**
```

### Google Cloud Console
No changes needed - still just:
```
https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

---

## Summary

**Root Cause:** Supabase doesn't know where to redirect after Google OAuth.

**Fix:** Configure correct redirect URLs in:
1. ✅ Supabase Dashboard (Site URL + Redirect URLs)
2. ✅ Google Cloud Console (Authorized redirect URIs)

**Test:** Clear cache → Restart dev server → Try Google sign-in

**Expected:** Should redirect to `/auth/callback` and then `/dashboard`

---

## Need Help?

If still not working after following this guide:

1. Check Supabase logs (Auth section)
2. Check browser console for errors
3. Verify all URLs match exactly (no typos)
4. Make sure Google OAuth is enabled in Supabase
5. Try incognito mode to rule out cache issues

The most common mistake is a **typo in the redirect URL**. Double-check everything!
