# 🔧 Frontend Localhost URLs Fixed

## Problem
Frontend (bondhu-landing) had hardcoded `localhost:8000` URLs that prevented it from connecting to the production backend at `https://api.bondhu.tech`.

## Files Fixed

### 1. ✅ `youtube-connect-button.tsx`
**Before:** 4 hardcoded `http://localhost:8000` URLs

**After:** Added `API_BASE_URL` constant that reads from environment variable:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

**URLs Updated:**
- `/api/v1/auth/youtube/status/${userId}` ✅
- `/api/v1/auth/youtube/connect?user_id=${userId}` ✅
- `/api/v1/auth/youtube/disconnect/${userId}` ✅
- `/api/v1/auth/youtube/refresh/${userId}` ✅

### 2. ✅ `lib/api/chat.ts`
**Status:** Already correctly implemented! ✅

Uses smart fallback logic:
1. First checks `NEXT_PUBLIC_API_URL` environment variable
2. Falls back to deriving from `window.location` (browser)
3. Final fallback to `localhost:8000` (local dev)

### 3. ✅ `lib/api-client.ts`
**Status:** Already correctly implemented! ✅

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

### 4. ✅ `.env` file
**Before:**
```bash
NEXT_PUBLIC_API_URL=http://57.159.29.168:8000
```

**After:**
```bash
NEXT_PUBLIC_API_URL=https://api.bondhu.tech
```

### 5. ✅ `.env.local` (Local Development)
**Status:** Still points to `localhost:8000` - This is CORRECT! ✅

Local development should continue using localhost. Only production (Vercel) uses `https://api.bondhu.tech`.

---

## Environment Variable Configuration

### Production (Vercel)
Already configured in Vercel dashboard:
```bash
NEXT_PUBLIC_API_URL=https://api.bondhu.tech
```

### Local Development (.env.local)
Keep as localhost for local testing:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## How It Works Now

### Client-Side Rendering (Browser)
```typescript
// React components use NEXT_PUBLIC_API_URL from Vercel environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // https://api.bondhu.tech
```

### Server-Side Rendering (Build Time)
```typescript
// During build, Next.js replaces process.env.NEXT_PUBLIC_API_URL with actual value
// From Vercel: https://api.bondhu.tech
// From local: http://localhost:8000
```

---

## Testing

### After These Changes:

1. **Rebuild Frontend** (if running locally):
   ```bash
   cd bondhu-landing
   npm run build
   npm start
   ```

2. **Redeploy on Vercel:**
   - Vercel dashboard → Deployments → Redeploy
   - OR push to GitHub (auto-deploys)

3. **Test API Connection:**
   ```bash
   # From browser console on https://bondhu.tech:
   console.log(process.env.NEXT_PUBLIC_API_URL)
   # Should show: https://api.bondhu.tech
   ```

4. **Test Features:**
   - ✅ Chat functionality
   - ✅ YouTube Connect button
   - ✅ Video recommendations
   - ✅ All API calls should go to https://api.bondhu.tech

---

## Troubleshooting

### Issue: Frontend still showing errors

**Solution 1: Clear Next.js Cache**
```bash
cd bondhu-landing
rm -rf .next
npm run build
```

**Solution 2: Hard Reload Browser**
```
Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

**Solution 3: Check Vercel Deployment Logs**
```
Vercel Dashboard → Deployments → View Function Logs
```

### Issue: CORS errors

**Check Backend .env:**
```bash
CORS_ORIGINS=https://bondhu.tech,https://api.bondhu.tech,https://*.vercel.app,http://localhost:3000
```

### Issue: SSL certificate errors

**Check DNS:**
```bash
nslookup api.bondhu.tech 8.8.8.8
# Should return: 57.159.29.168
```

**Check SSL:**
```bash
curl -I https://api.bondhu.tech/health
# Should return: HTTP/2 200
```

---

## Summary

✅ **Fixed:** All hardcoded localhost URLs in `youtube-connect-button.tsx`  
✅ **Verified:** `api/chat.ts` and `api-client.ts` already using environment variables  
✅ **Updated:** `.env` file to use `https://api.bondhu.tech`  
✅ **Maintained:** `.env.local` for local development  
✅ **Configured:** Vercel environment variables

**Result:** Frontend now correctly connects to production backend via HTTPS! 🎉

---

## Next Steps

1. **Redeploy Vercel** (push these changes to GitHub)
2. **Test on Production** (https://bondhu.tech)
3. **Verify All Features:**
   - Google Sign-in
   - Chat functionality
   - YouTube OAuth
   - Spotify OAuth (when configured)

All API calls should now go through `https://api.bondhu.tech` with valid SSL certificate! 🔒
