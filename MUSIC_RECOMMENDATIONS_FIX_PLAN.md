# Music Recommendations - Complete Fix Guide

## Issues to Fix

1. ✅ **RL State Extraction Error**: `'<' not supported between instances of 'NoneType' and 'float'`
   - FIXED: Added None checks in `_extract_state_features()`

2. ❌ **RL Storage Error**: `'SupabaseClient' object has no attribute 'table'`
   - Need to fix: Use `supabase.supabase.table()` instead of `supabase.table()`

3. ❌ **Auto-refresh not working on session reload**
   - Need to fix: Browser refresh detection logic

4. ❌ **Refresh button not generating new recommendations**
   - Need to investigate: May be API or caching issue

5. ❌ **Like/Dislike buttons not responding**
   - Need to investigate: Button state and visual feedback

6. ❌ **Personality match stuck at 61%**
   - Need to enhance: Make calculation more dynamic

7. ❌ **Genre ordering not personalized**
   - Need to implement: Sort genres by personality match

## Implementation Plan

### Fix 1: RL Storage Supabase Client ✅
File: `bondhu-ai/core/rl/rl_storage.py`
Change: `self.supabase.table()` → `self.supabase.supabase.table()`

### Fix 2: Browser Refresh Detection
File: `bondhu-landing/src/components/music-recommendations.tsx`
Issue: useEffect dependencies causing re-triggers
Solution: Separate mount-only effect for browser refresh

### Fix 3: Enhanced Personality Match Calculation
File: `bondhu-ai/agents/music/music_agent.py`
Current: Small adjustments from 0.5 baseline
Needed: Larger range (30-95%) based on comprehensive matching

### Fix 4: Genre Ordering by Personality
File: `bondhu-ai/agents/music/music_agent.py`
Add method to score genres by personality match
Sort genres before returning to frontend

### Fix 5: Like/Dislike Button Feedback
File: `bondhu-landing/src/components/music-recommendations.tsx`
Check: State persistence, visual feedback, API calls
Fix: Ensure feedback state properly updates UI

### Fix 6: Refresh Button Generating New Recommendations
Check: API randomization, seed variation
Ensure: Each refresh gets different tracks
