# Frontend Standalone Mode Guide

## Overview

The Bondhu AI frontend can run **independently without the backend** for most features. Only specific integrations require the backend API.

---

## ✅ Features That Work WITHOUT Backend

### 1. **User Authentication (Supabase)**
- ✅ Sign up / Sign in
- ✅ Email verification
- ✅ Password reset
- ✅ Session management
- ✅ Protected routes

**Why:** Uses Supabase Auth directly from frontend

### 2. **Personality Assessment**
- ✅ Complete personality questionnaire
- ✅ Save responses to Supabase
- ✅ View personality insights
- ✅ Personality radar charts
- ✅ Big Five traits analysis

**Why:** Stores data directly in Supabase database

### 3. **Dashboard**
- ✅ View user profile
- ✅ Wellness score display
- ✅ Activity stats (Supabase)
- ✅ Streak tracking
- ✅ Goal setting

**Why:** All data in Supabase

### 4. **Settings**
- ✅ Update profile
- ✅ Change preferences
- ✅ Theme toggle (dark/light)
- ✅ Notification settings

**Why:** Supabase database operations

### 5. **Landing Page**
- ✅ Hero section
- ✅ Features showcase
- ✅ Pricing display
- ✅ FAQ section

**Why:** Static content, no backend needed

---

## ⚠️ Features That REQUIRE Backend

### 1. **Chat with Bondhu AI** 🤖
- ❌ Send messages to AI
- ❌ Receive AI responses
- ❌ Conversation memory
- ❌ Personality-aware responses

**Why:** Requires backend API with LLM integration

**Endpoint:** `POST /api/v1/chat`

**Fallback:** Shows "Backend unavailable" message

### 2. **YouTube Integration** 📺
- ❌ Connect YouTube account (OAuth)
- ❌ Personalized video recommendations
- ❌ Watch history analysis

**Why:** Requires backend OAuth flow and YouTube API calls

**Endpoints:**
- `GET /api/v1/auth/youtube/status/:userId`
- `GET /api/v1/auth/youtube/connect`
- `POST /api/v1/auth/youtube/disconnect/:userId`

**Fallback:** Button shows "Backend unavailable" message

### 3. **Music Recommendations** 🎵
- ❌ Spotify integration
- ❌ AI-powered music suggestions
- ❌ Genre preferences

**Why:** Requires backend Spotify API integration

**Endpoints:**
- `POST /api/v1/music/recommendations`
- `GET /api/v1/music/genres`

**Fallback:** Not yet implemented (optional feature)

### 4. **Gaming Recommendations** 🎮
- ❌ Game suggestions
- ❌ Gaming preferences

**Why:** Requires backend gaming API integration

**Fallback:** Not yet implemented (optional feature)

---

## How It Works

### Environment Variables

**Development (.env.local):**
```bash
# Frontend works without this
NEXT_PUBLIC_API_URL=http://localhost:8000

# These work standalone
NEXT_PUBLIC_SUPABASE_URL=https://eilvtjkqmvmhkfzocrzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Graceful Degradation

The frontend is designed to **gracefully degrade** when backend is unavailable:

**1. YouTube Button:**
```typescript
// Silently handles backend unavailability
try {
  const response = await fetch(
    `http://localhost:8000/api/v1/auth/youtube/status/${userId}`,
    { signal: AbortSignal.timeout(3000) }
  );
  // ... handle success
} catch (err) {
  // Show "Backend unavailable" message instead of error
  console.warn("Backend unavailable - YouTube integration disabled");
  setStatus({ connected: false });
}
```

**2. Chat Component:**
```typescript
// Shows friendly message when backend is down
if (chatError) {
  return (
    <div className="text-center p-4">
      <p className="text-muted-foreground">
        Chat requires backend API. Please start the backend:
      </p>
      <code className="text-xs">docker compose up -d</code>
    </div>
  );
}
```

---

## Running Frontend Standalone

### Start Frontend Only

```powershell
cd "C:\Users\mdhaa\Desktop\Project Noor\bondhu-landing"
npm run dev
```

**Access:** http://localhost:3000

**What works:**
- ✅ Login/Signup
- ✅ Personality test
- ✅ Dashboard
- ✅ Settings
- ❌ Chat (shows "Backend unavailable")
- ❌ YouTube (button disabled)

### Start Frontend + Backend

**Terminal 1 - Backend:**
```powershell
cd "C:\Users\mdhaa\Desktop\Project Noor\bondhu-ai"
docker compose up -d
```

**Terminal 2 - Frontend:**
```powershell
cd "C:\Users\mdhaa\Desktop\Project Noor\bondhu-landing"
npm run dev
```

**What works:**
- ✅ Everything from standalone mode
- ✅ Chat with AI
- ✅ YouTube integration
- ✅ Advanced recommendations

---

## Production Deployment

### Frontend (Vercel)
- Deploys independently
- Works standalone with Supabase
- Backend-dependent features show helpful messages

### Backend (Azure VM / Docker)
- Deploys separately
- Connects via `NEXT_PUBLIC_API_URL` env var
- Can be added later without frontend redeployment

### Architecture
```
┌─────────────────┐
│  Vercel CDN     │  Frontend (Always Available)
│  Next.js        │  
└────────┬────────┘
         │
         ├──────► Supabase (Auth, Database) ✅ Always works
         │
         └──────► Azure VM (Chat, Integrations) ⚠️ Optional
                  Docker Containers
```

---

## Testing Scenarios

### Scenario 1: First Time User (No Backend)
1. Visit site → Landing page loads ✅
2. Sign up → Supabase auth works ✅
3. Complete personality test → Saves to Supabase ✅
4. View dashboard → Shows profile ✅
5. Try chat → "Backend unavailable" message ⚠️
6. Try YouTube → Button shows "Connect (requires backend)" ⚠️

### Scenario 2: With Backend Running
1. All above features work ✅
2. Chat with AI → Real responses ✅
3. Connect YouTube → OAuth flow works ✅
4. Get recommendations → Personalized content ✅

---

## Developer Notes

### Adding New Features

**Frontend-Only Feature (No Backend):**
```typescript
// Store directly in Supabase
const { data, error } = await supabase
  .from('user_preferences')
  .insert({ user_id, preference_data })
```

**Backend-Required Feature:**
```typescript
// Add graceful error handling
try {
  const response = await fetch(`${API_URL}/api/v1/new-feature`, {
    signal: AbortSignal.timeout(3000) // Timeout
  });
  if (!response.ok) throw new Error('Backend unavailable');
  // Handle success
} catch (err) {
  // Show user-friendly message
  setError("This feature requires the backend. Please start Docker containers.");
}
```

---

## Quick Commands

```powershell
# Frontend only (development)
cd bondhu-landing && npm run dev

# Frontend + Backend (full stack)
cd bondhu-ai && docker compose up -d
cd ../bondhu-landing && npm run dev

# Stop backend
cd bondhu-ai && docker compose down

# Check backend status
docker ps
curl http://localhost:8000/health
```

---

## Summary

| Feature | Standalone | With Backend |
|---------|-----------|--------------|
| Auth (Supabase) | ✅ | ✅ |
| Personality Test | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| Settings | ✅ | ✅ |
| **Chat** | ❌ | ✅ |
| **YouTube OAuth** | ❌ | ✅ |
| **Music/Gaming** | ❌ | ✅ |

**Recommendation:** Deploy frontend to Vercel immediately. Add backend later when needed for advanced features.

🎉 **Your frontend is production-ready and can be used standalone!**
