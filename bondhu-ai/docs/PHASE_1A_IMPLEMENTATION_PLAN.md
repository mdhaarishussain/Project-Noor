# 🚨 Phase 1A - Critical Fixes Implementation Plan

**Date:** October 9, 2025  
**Priority:** 🔴 P0 - URGENT  
**Estimated Time:** 14 hours (~2 days)

---

## 📋 Issues Summary

You identified **2 CRITICAL problems** that block the video system:

1. **❌ No Authentication** - Can't track users, history, or preferences
2. **❌ API Quota Exhaustion** - System breaks after 2-3 requests

Both must be fixed before video recommendations can work properly.

---

## 🎯 Implementation Order

### **Phase 1A: Authentication (URGENT) - 4 hours**

#### **Task 1.1: Add Login to Landing Page** (2 hours)

**File:** `bondhu-landing/src/app/page.tsx`

**Changes Needed:**
1. Add login button to Navigation
2. Add "Get Started" button that opens login modal
3. Create AuthModal component for login/signup

**Implementation:**
```tsx
// src/components/auth/auth-modal.tsx
export function AuthModal({ 
  isOpen, 
  onClose, 
  defaultView = 'signin' 
}: AuthModalProps) {
  const [view, setView] = useState<'signin' | 'signup'>(defaultView)
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {view === 'signin' ? (
          <SignInForm onSuccess={() => {
            onClose()
            window.location.href = '/dashboard'
          }} />
        ) : (
          <SignUpForm onSuccess={() => {
            onClose()
            window.location.href = '/onboarding'
          }} />
        )}
        
        <Button 
          variant="ghost" 
          onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
        >
          {view === 'signin' ? 'Create account' : 'Sign in'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

// src/app/page.tsx
import { AuthModal } from '@/components/auth/auth-modal'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation /> {/* Add login button here */}
      <main>
        <HeroSection /> {/* Add "Get Started" → open auth modal */}
        {/* ... */}
      </main>
      <AuthModal />
    </div>
  )
}
```

#### **Task 1.2: Protect Entertainment Routes** (1 hour)

**File:** `bondhu-landing/src/app/entertainment/page.tsx`

**Changes:**
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EntertainmentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/sign-in?redirect=/entertainment')
  }
  
  // NOW user.id is guaranteed to be valid
  const userId = user.id
  
  // All API calls now have valid user ID
  const recommendations = await fetch(
    `${API_URL}/video/simple-recommendations/${userId}`
  )
}
```

#### **Task 1.3: Update All Video API Calls** (1 hour)

**Files:**
- `bondhu-landing/src/lib/api/video.ts` (create if doesn't exist)
- `bondhu-landing/src/components/video-recommendations.tsx`

**Changes:**
```typescript
// src/lib/api/video.ts
export const videoApi = {
  getRecommendations: async (userId: string) => {
    if (!userId) {
      throw new Error('User ID required for recommendations')
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/video/simple-recommendations/${userId}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.status}`)
    }
    
    return response.json()
  },
  
  submitFeedback: async (userId: string, videoId: string, feedbackType: string) => {
    if (!userId) {
      throw new Error('User ID required for feedback')
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/video/feedback/${userId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, feedback_type: feedbackType })
      }
    )
    
    return response.json()
  }
}
```

---

### **Phase 1B: Quota Management (URGENT) - 6 hours**

#### **Task 2.1: Add Caching to Simple Recommender** (3 hours)

**File:** `bondhu-ai/simple_youtube_recommender.py`

**Changes:**
```python
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class SimpleYouTubeRecommender:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('YOUTUBE_API_KEY')
        
        # Add caching
        self._trending_cache = None
        self._trending_cache_time = None
        self._search_cache: Dict[str, tuple] = {}  # {query: (results, timestamp)}
        self._recommendation_cache: Dict[str, tuple] = {}  # {key: (results, timestamp)}
        
        # Cache durations
        self.TRENDING_CACHE_HOURS = 6
        self.SEARCH_CACHE_HOURS = 4
        self.RECOMMENDATION_CACHE_HOURS = 8
    
    async def get_trending_videos(self, max_results: int = 25):
        """Get trending videos with 6-hour cache."""
        now = datetime.now()
        
        # Check cache
        if self._trending_cache_time:
            age = (now - self._trending_cache_time).total_seconds() / 3600
            if age < self.TRENDING_CACHE_HOURS:
                logger.info(f"✅ Cache HIT: Trending videos (age: {age:.1f}h)")
                return self._trending_cache[:max_results]
        
        # Cache miss - fetch from API
        logger.info("🔄 Cache MISS: Fetching trending videos from API (cost: 1 unit)")
        videos = await self._fetch_trending_from_api(max_results)
        
        # Update cache
        self._trending_cache = videos
        self._trending_cache_time = now
        
        return videos
    
    async def get_personalized_recommendations(
        self, 
        user_personality: Dict[str, float],
        max_results: int = 20
    ):
        """Get recommendations with 8-hour cache."""
        
        # Create cache key (bucket similar personalities)
        cache_key = self._create_cache_key(user_personality)
        now = datetime.now()
        
        # Check cache
        if cache_key in self._recommendation_cache:
            cached_results, cached_time = self._recommendation_cache[cache_key]
            age = (now - cached_time).total_seconds() / 3600
            
            if age < self.RECOMMENDATION_CACHE_HOURS:
                logger.info(f"✅ Cache HIT: Recommendations (age: {age:.1f}h, saving ~421 units)")
                return cached_results[:max_results]
        
        # Cache miss - generate fresh
        logger.info("🔄 Cache MISS: Generating recommendations (cost: ~421 units)")
        recommendations = await self._generate_recommendations(user_personality, max_results)
        
        # Update cache
        self._recommendation_cache[cache_key] = (recommendations, now)
        
        return recommendations
    
    def _create_cache_key(self, personality: Dict[str, float]) -> str:
        """Create cache key by bucketing personality to nearest 0.2."""
        rounded = tuple(
            (trait, round(score * 5) / 5)  # Buckets: 0.0, 0.2, 0.4, 0.6, 0.8, 1.0
            for trait, score in sorted(personality.items())
        )
        return str(hash(rounded))
```

#### **Task 2.2: Create Quota Manager** (2 hours)

**File:** `bondhu-ai/core/services/youtube_quota_manager.py` (NEW)

**Implementation:**
```python
import os
import json
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class YouTubeQuotaManager:
    """Tracks YouTube API quota usage to prevent exhaustion."""
    
    DAILY_QUOTA = 10000
    WARNING_THRESHOLD = 8000  # Warn at 80%
    
    def __init__(self, quota_file: str = "youtube_quota.json"):
        self.quota_file = quota_file
        self.usage = self._load_usage()
    
    def _load_usage(self) -> dict:
        """Load usage from file, reset if new day."""
        try:
            if os.path.exists(self.quota_file):
                with open(self.quota_file, 'r') as f:
                    data = json.load(f)
                
                # Reset if different day
                last_date = datetime.fromisoformat(data['date']).date()
                today = datetime.now().date()
                
                if last_date < today:
                    logger.info(f"📅 New day detected, resetting quota")
                    return self._create_fresh_usage()
                
                return data
        except Exception as e:
            logger.error(f"Error loading quota: {e}")
        
        return self._create_fresh_usage()
    
    def _create_fresh_usage(self) -> dict:
        """Create fresh usage record."""
        return {
            'date': datetime.now().isoformat(),
            'used': 0,
            'calls': []
        }
    
    def _save_usage(self):
        """Save usage to file."""
        try:
            with open(self.quota_file, 'w') as f:
                json.dump(self.usage, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving quota: {e}")
    
    def track_call(self, endpoint: str, cost: int):
        """Track an API call."""
        self.usage['used'] += cost
        self.usage['calls'].append({
            'endpoint': endpoint,
            'cost': cost,
            'timestamp': datetime.now().isoformat()
        })
        self._save_usage()
        
        # Check thresholds
        if self.usage['used'] >= self.DAILY_QUOTA:
            logger.error(
                f"🚨 QUOTA EXHAUSTED: {self.usage['used']}/{self.DAILY_QUOTA} units"
            )
            raise QuotaExhaustedException(
                f"YouTube API quota exhausted ({self.usage['used']}/{self.DAILY_QUOTA})"
            )
        
        if self.usage['used'] >= self.WARNING_THRESHOLD:
            percent = (self.usage['used'] / self.DAILY_QUOTA) * 100
            logger.warning(
                f"⚠️ QUOTA WARNING: {percent:.0f}% used ({self.usage['used']}/{self.DAILY_QUOTA})"
            )
    
    def can_make_call(self, estimated_cost: int) -> bool:
        """Check if call is affordable."""
        return (self.usage['used'] + estimated_cost) <= self.DAILY_QUOTA
    
    def get_stats(self) -> dict:
        """Get usage statistics."""
        remaining = max(0, self.DAILY_QUOTA - self.usage['used'])
        percent = (self.usage['used'] / self.DAILY_QUOTA) * 100
        
        return {
            'used': self.usage['used'],
            'remaining': remaining,
            'total': self.DAILY_QUOTA,
            'percentage': round(percent, 1),
            'calls_today': len(self.usage['calls']),
            'date': self.usage['date']
        }

class QuotaExhaustedException(Exception):
    """Raised when quota is exhausted."""
    pass

# Global singleton
_quota_manager: Optional[YouTubeQuotaManager] = None

def get_quota_manager() -> YouTubeQuotaManager:
    global _quota_manager
    if _quota_manager is None:
        _quota_manager = YouTubeQuotaManager()
    return _quota_manager
```

#### **Task 2.3: Add Quota Checks to API Calls** (1 hour)

**File:** `bondhu-ai/simple_youtube_recommender.py`

**Changes:**
```python
from core.services.youtube_quota_manager import get_quota_manager, QuotaExhaustedException

class SimpleYouTubeRecommender:
    
    async def _fetch_trending_from_api(self, max_results: int):
        """Fetch trending with quota check."""
        quota = get_quota_manager()
        
        if not quota.can_make_call(1):
            logger.error("❌ Insufficient quota for trending")
            return self._trending_cache or []
        
        # Make API call
        quota.track_call('trending', 1)
        # ... existing API logic ...
    
    async def search_videos(self, query: str, max_results: int = 20):
        """Search with quota check."""
        quota = get_quota_manager()
        cost = 100 + max_results  # Search + details
        
        # Check cache first
        cache_key = f"{query}:{max_results}"
        if cache_key in self._search_cache:
            results, cached_time = self._search_cache[cache_key]
            age_hours = (datetime.now() - cached_time).total_seconds() / 3600
            
            if age_hours < self.SEARCH_CACHE_HOURS:
                logger.info(f"✅ Cache HIT: Search '{query}' (saving {cost} units)")
                return results
        
        # Check quota
        if not quota.can_make_call(cost):
            logger.error(f"❌ Insufficient quota for search (need {cost})")
            # Return cached if available
            if cache_key in self._search_cache:
                return self._search_cache[cache_key][0]
            return []
        
        # Make API call
        quota.track_call('search', 100)
        # ... search logic ...
        quota.track_call('video_details', max_results)
        # ... details logic ...
        
        # Cache results
        self._search_cache[cache_key] = (results, datetime.now())
        return results
```

---

### **Phase 1C: Scheduler Optimization (MEDIUM) - 2 hours**

#### **Task 3.1: Reduce Refresh Frequency** (1 hour)

**File:** `bondhu-ai/core/services/video_scheduler.py`

**Changes:**
```python
class VideoRecommendationScheduler:
    def __init__(self):
        # Change from 3x daily to 1x daily
        self.refresh_times = [
            time(6, 0),   # 6:00 AM only (was 8 AM, 2 PM, 8 PM)
        ]
        
        # Add user limit
        self.max_users_per_refresh = 15  # Limit batch size
```

#### **Task 3.2: Add Quota Awareness** (1 hour)

**File:** `bondhu-ai/core/services/video_scheduler.py`

**Changes:**
```python
async def refresh_all_users(self):
    """Refresh with quota check."""
    from core.services.youtube_quota_manager import get_quota_manager
    
    quota = get_quota_manager()
    stats = quota.get_stats()
    
    # Check if we have enough quota
    users = list(self.active_users.keys())[:self.max_users_per_refresh]
    estimated_cost = len(users) * 421
    
    if not quota.can_make_call(estimated_cost):
        logger.warning(
            f"⚠️ Skipping refresh - insufficient quota "
            f"(need {estimated_cost}, have {stats['remaining']})"
        )
        return {}
    
    logger.info(
        f"🔄 Starting refresh for {len(users)} users "
        f"(will use {estimated_cost} units, {stats['remaining']} remaining)"
    )
    
    # ... rest of refresh logic ...
```

---

### **Phase 1D: Frontend Polish (LOW) - 2 hours**

#### **Task 4.1: Add Quota Status Display** (1 hour)

**File:** `bondhu-landing/src/components/quota-status.tsx` (NEW)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface QuotaInfo {
  used: number
  remaining: number
  total: number
  percentage: number
}

export function QuotaStatus() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch('/api/v1/video/quota-status')
        const data = await response.json()
        setQuota(data)
      } catch (err) {
        setError('Failed to load quota status')
      }
    }
    
    fetchQuota()
    const interval = setInterval(fetchQuota, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])
  
  if (error) return null
  if (!quota) return null
  
  const isLow = quota.percentage > 80
  const isCritical = quota.percentage > 95
  
  return (
    <div className={`rounded-lg p-3 ${
      isCritical ? 'bg-red-50 border-red-200' : 
      isLow ? 'bg-yellow-50 border-yellow-200' : 
      'bg-blue-50 border-blue-200'
    } border`}>
      <div className="flex items-center gap-2">
        <AlertCircle className={`h-4 w-4 ${
          isCritical ? 'text-red-600' : 
          isLow ? 'text-yellow-600' : 
          'text-blue-600'
        }`} />
        <div className="flex-1">
          <p className="text-xs font-medium">YouTube API Quota</p>
          <p className="text-xs opacity-75">
            {quota.used.toLocaleString()} / {quota.total.toLocaleString()} units ({quota.percentage}%)
          </p>
        </div>
      </div>
      <div className="mt-2 bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all ${
            isCritical ? 'bg-red-600' : 
            isLow ? 'bg-yellow-600' : 
            'bg-blue-600'
          }`}
          style={{ width: `${quota.percentage}%` }}
        />
      </div>
    </div>
  )
}
```

#### **Task 4.2: Add Quota Endpoint** (1 hour)

**File:** `bondhu-ai/api/routes/video_recommendations.py`

**Add new endpoint:**
```python
@router.get("/quota-status")
async def get_quota_status():
    """Get YouTube API quota usage status."""
    from core.services.youtube_quota_manager import get_quota_manager
    
    try:
        quota = get_quota_manager()
        stats = quota.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting quota: {str(e)}")
```

---

## ✅ Testing Checklist

After implementation, verify:

### **Authentication Tests:**
- [ ] Landing page shows login button
- [ ] Login modal opens and works
- [ ] Successful login redirects to dashboard
- [ ] Entertainment page requires login
- [ ] Unauthenticated access redirects to sign-in
- [ ] User ID passed to all API calls

### **Quota Tests:**
- [ ] Caching works (check logs for "Cache HIT")
- [ ] Quota tracking saves to file
- [ ] Quota resets at midnight
- [ ] Warning at 80% usage
- [ ] Error at 100% usage
- [ ] Cached results served when quota exhausted

### **Scheduler Tests:**
- [ ] Scheduler runs 1x per day (6 AM)
- [ ] Checks quota before refresh
- [ ] Skips refresh if insufficient quota
- [ ] Logs quota usage

### **Frontend Tests:**
- [ ] Quota status displays correctly
- [ ] Updates every minute
- [ ] Shows warning colors at thresholds
- [ ] Gracefully handles API errors

---

## 📊 Expected Results

### **Before Fixes:**
```
✗ No login system
✗ API called without user IDs
✗ Quota exhausted after 2-3 requests
✗ System unusable for >7 users
✗ No error messages when broken
```

### **After Fixes:**
```
✓ Login required for entertainment
✓ All APIs have valid user IDs
✓ Caching reduces API calls 60-70%
✓ System supports 20+ users/day
✓ Quota status visible to users
✓ Graceful degradation when quota low
```

---

## 🎯 Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Users per day | 7-8 | 20+ | ✅ |
| API calls per user | ~1,263/day | ~421/day | ✅ |
| Quota usage (10 users) | 126% (fails) | 42% | ✅ |
| Cache hit rate | 0% | 60-70% | ✅ |
| Authentication rate | 0% | 100% | ✅ |

---

## 🚀 Ready to Start?

I can begin implementing these fixes immediately. Which phase would you like me to start with?

**Recommended order:**
1. **Phase 1A (Authentication)** - Must have user IDs before anything else works
2. **Phase 1B (Quota Management)** - Prevents system from breaking
3. **Phase 1C (Scheduler)** - Optimizes automated refreshes
4. **Phase 1D (Frontend)** - Improves user visibility

Let me know and I'll start creating the files! 🚀
