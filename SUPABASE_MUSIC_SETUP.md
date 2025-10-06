# Supabase Schema Setup for Music Recommendation System

## 📋 Overview

You need to add **5 new tables** to your Supabase database for the music recommendation system to work properly. These tables handle music recommendations, user feedback, RL learning, and genre preferences.

---

## 🗄️ Tables to Add

### 1. **music_recommendations**
Stores recommended tracks with audio features and scoring data.

**Key Columns:**
- `spotify_track_id` - Spotify track identifier
- `genz_genre` - GenZ-friendly genre (e.g., "Lo-fi Chill")
- `energy`, `valence`, `danceability` - Audio features
- `rl_score` - RL system score
- `personality_match_score` - Personality alignment score
- `spotify_url` - Direct link to play on Spotify

### 2. **music_interactions**
Tracks all user feedback for RL learning.

**Key Columns:**
- `interaction_type` - like, dislike, play, skip, save, etc.
- `rl_reward` - Calculated reward value
- `q_value` - Q-learning value
- `listen_duration_ms` - How long user listened
- `completion_percentage` - % of track completed
- `personality_snapshot` - User's personality at interaction time

### 3. **music_genre_preferences**
Learned genre preferences per user (auto-updated).

**Key Columns:**
- `genz_genre` - Genre name
- `preference_score` - 0-1 score (updated automatically)
- `avg_rl_reward` - Average reward for this genre
- `interaction_count` - Total interactions
- `positive_interactions` - Like/play/save count
- `negative_interactions` - Dislike/skip count

### 4. **music_listening_history**
Cached Spotify listening history by genre.

**Key Columns:**
- `spotify_track_id` - Track identifier
- `genz_genre` - Categorized genre
- `played_at` - When user listened
- `time_range` - short_term, medium_term, long_term
- Audio features (energy, valence, etc.)

### 5. **music_rl_models**
RL model snapshots for versioning and recovery.

**Key Columns:**
- `q_table` - JSONB of Q-learning table
- `genre_performance` - JSONB of genre stats
- `training_episodes` - Number of feedback instances
- `total_reward` - Cumulative reward
- `is_active` - Current active model

---

## 🔧 How to Add

### Option 1: Run SQL File (Recommended)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of: `bondhu-ai/database/music_recommendation_schema.sql`
5. Paste into the editor
6. Click **Run**

### Option 2: Manual Table Creation

If you prefer to create tables manually, see the SQL file for full schema.

---

## 🔐 Security (Row Level Security)

The schema includes RLS policies that ensure:
- ✅ Users can only access their own data
- ✅ All tables are protected by `auth.uid() = user_id`
- ✅ Both read and write operations are secured

**Policies Added:**
```sql
-- Example for music_recommendations
CREATE POLICY "Users can view own music recommendations" 
    ON music_recommendations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own music recommendations" 
    ON music_recommendations FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
```

---

## 📊 Indexes for Performance

The schema creates indexes for:
- User ID lookups (all tables)
- Genre filtering
- Time-based queries (created_at, played_at)
- Score sorting (rl_score, preference_score)
- Recommendation activity (is_active)

**Example:**
```sql
CREATE INDEX idx_music_recommendations_user_id ON music_recommendations(user_id);
CREATE INDEX idx_music_interactions_genre ON music_interactions(genz_genre);
```

---

## 🔄 Automatic Functions

Two helper functions are included:

### 1. `record_music_interaction()`
Automatically:
- Records user feedback
- Calculates completion percentage
- Updates `music_genre_preferences` table
- Increments interaction counts
- Updates preference scores

**Usage:**
```sql
SELECT record_music_interaction(
    user_id := 'uuid',
    recommendation_id := 'uuid',
    spotify_track_id := 'track_id',
    track_name := 'Song Name',
    genz_genre := 'Lo-fi Chill',
    interaction_type := 'like',
    rl_reward := 1.0
);
```

### 2. `get_top_music_genres()`
Returns user's top genres by preference score.

**Usage:**
```sql
SELECT * FROM get_top_music_genres('user_id', 5);
```

---

## 🧪 Verification Checklist

After running the SQL:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'music_%';
```

Should return:
- music_recommendations
- music_interactions
- music_genre_preferences
- music_listening_history
- music_rl_models

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'music_%';
```

All should have `rowsecurity = true`

### Test Function
```sql
-- Test that the function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('record_music_interaction', 'get_top_music_genres');
```

---

## 📝 Schema Relationships

```
auth.users (Supabase Auth)
    ↓ (user_id foreign key)
    ├── music_recommendations
    │       ↓ (recommendation_id)
    │   music_interactions
    │
    ├── music_genre_preferences (auto-updated by function)
    │
    ├── music_listening_history
    │
    └── music_rl_models
```

---

## 🔄 Data Flow

1. **User gets recommendations** → Data inserted into `music_recommendations`
2. **User clicks like/dislike** → Data inserted into `music_interactions`
3. **Function auto-triggers** → `music_genre_preferences` updated
4. **RL system learns** → `music_rl_models` snapshot saved
5. **History synced** → `music_listening_history` populated

---

## 🚨 Important Notes

### Before Running:
- ✅ Make sure base entertainment schema is already applied
- ✅ Backup your database (if production)
- ✅ Check that `uuid-ossp` extension is enabled

### After Running:
- ✅ Verify all 5 tables created
- ✅ Verify RLS is enabled
- ✅ Verify both functions exist
- ✅ Test with a sample insert

### Sample Test:
```sql
-- Test insert (will fail if RLS not configured for service role)
INSERT INTO music_recommendations (
    user_id,
    spotify_track_id,
    track_name,
    artists,
    genz_genre,
    spotify_url
) VALUES (
    auth.uid(),  -- Current user
    'test_track_123',
    'Test Song',
    ARRAY['Test Artist'],
    'Lo-fi Chill',
    'https://open.spotify.com/track/test'
);

-- Should return 1 row
SELECT * FROM music_recommendations WHERE user_id = auth.uid();
```

---

## 🆘 Troubleshooting

### Issue: "uuid-ossp extension not found"
**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue: "RLS policy prevents insert"
**Solution:** Make sure you're authenticated with a valid user in Supabase.

### Issue: "Function already exists"
**Solution:** The schema uses `CREATE OR REPLACE` so it's safe to re-run.

### Issue: "Foreign key constraint violation"
**Solution:** Make sure `auth.users` table exists (part of Supabase Auth).

---

## ✅ Final Verification

Run this query to see sample data structure:
```sql
-- Show table structures
\d music_recommendations
\d music_interactions
\d music_genre_preferences
\d music_listening_history
\d music_rl_models
```

Or in SQL Editor:
```sql
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'music_%'
ORDER BY table_name;
```

Expected output:
```
table_name                  | column_count
----------------------------+-------------
music_genre_preferences     | 12
music_interactions          | 18
music_listening_history     | 14
music_recommendations       | 21
music_rl_models            | 11
```

---

## 🎉 You're Done!

Once the schema is applied, the music recommendation system is ready to:
- ✅ Store recommendations from Spotify
- ✅ Track user feedback (like/dislike/play)
- ✅ Learn preferences via RL
- ✅ Auto-update genre preferences
- ✅ Cache listening history
- ✅ Save RL model snapshots

**No manual intervention needed** - the system handles everything automatically! 🎵
