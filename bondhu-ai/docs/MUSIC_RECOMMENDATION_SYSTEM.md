# Music Recommendation System - Complete Guide

## Overview

The Music Intelligence Agent has been enhanced with an advanced RL-based recommendation system featuring:
- **20 GenZ-friendly genre categories** (e.g., "Lo-fi Chill", "Hype Beats", "Sad Boy Hours")
- **Spotify integration** for fetching listening history by genre
- **Personalized recommendations** (2-3 songs per genre) based on personality and listening patterns
- **RL-based learning** from user feedback (like/dislike/play buttons)
- **Spotify redirect** for seamless music playback

---

## 🎵 GenZ Genre Categories

The system organizes music into 20 cool GenZ-friendly genres:

### Chill & Relaxing
- **Lo-fi Chill** - lo-fi, chillhop, study beats, ambient
- **Serene Acoustics** - acoustic, folk, singer-songwriter, indie folk
- **Dreamy Vibes** - dream pop, shoegaze, ethereal, ambient pop

### Energetic & Upbeat
- **Pop Anthems** - pop, dance pop, electropop, synth-pop
- **Hype Beats** - hip hop, trap, rap, drill
- **EDM Bangers** - edm, house, techno, dubstep, electronic
- **Rock Energy** - rock, alternative rock, indie rock, garage rock

### Mood & Emotional
- **Sad Boy Hours** - emo, sad, melancholic, alternative
- **R&B Feels** - r&b, rnb, neo-soul, contemporary r&b
- **Soulful Grooves** - soul, funk, motown, classic soul

### Party & Social
- **Party Starters** - dance, party, club, latin, reggaeton
- **Throwback Jams** - 80s, 90s, 2000s, throwback, retro

### Focus & Study
- **Focus Flow** - classical, instrumental, piano, orchestral
- **Study Beats** - lo-fi hip hop, jazz, classical crossover

### Alternative & Indie
- **Indie Vibes** - indie, indie pop, bedroom pop, indie rock
- **Alt Scene** - alternative, post-punk, new wave, art pop

### International
- **Global Rhythms** - world, afrobeat, k-pop, j-pop, latin
- **K-Wave** - k-pop, k-indie, k-r&b

### Niche & Underground
- **Underground Hits** - underground hip hop, indie electronic, experimental
- **Metal Mayhem** - metal, heavy metal, metalcore, death metal

---

## 🔧 Architecture

### 1. **Music Agent (`music_agent.py`)**
Enhanced features:
- GenZ genre mapping system
- Spotify history fetching organized by genre
- Recommendation generation (2-3 songs per genre)
- Personality-based music matching
- RL integration for feedback processing

### 2. **RL System (`music_recommendation_rl.py`)**
Implements Q-learning for music recommendations:
- State features: personality traits + audio features + genre
- Actions: recommend/not recommend
- Rewards: like (+1.0), dislike (-1.0), play (+0.8), skip (-0.4), save (+1.5)
- Genre-specific performance tracking
- Experience replay buffer for batch learning

### 3. **API Routes (`api/routes/agents.py`)**
New endpoints:
- `GET /music/genres` - Get available genres
- `GET /music/history/{user_id}` - Get genre-organized listening history
- `POST /music/recommendations/{user_id}` - Get personalized recommendations
- `POST /music/feedback/{user_id}` - Record like/dislike/play feedback
- `GET /music/insights/{user_id}` - Get RL statistics and genre insights

---

## 📊 Database Schema

### Tables Created (see `music_recommendation_schema.sql`)

1. **`music_recommendations`**
   - Stores recommended tracks with audio features
   - Includes RL scores and personality match scores
   - Links to Spotify tracks with URLs

2. **`music_interactions`**
   - Tracks all user feedback (like, dislike, play, etc.)
   - Stores RL rewards and Q-values
   - Includes listening context and completion data

3. **`music_genre_preferences`**
   - Learned genre preferences per user
   - Tracks interaction counts and average rewards
   - Updates automatically based on feedback

4. **`music_listening_history`**
   - Cached Spotify listening history
   - Organized by GenZ genres
   - Audio features cached for efficiency

5. **`music_rl_models`**
   - Snapshots of RL models for versioning
   - Q-table and genre performance data
   - Training statistics

### Key Functions

- `record_music_interaction()` - Records feedback and updates preferences
- `get_top_music_genres()` - Gets user's preferred genres

---

## 🚀 API Usage Examples

### 1. Get Available Genres

```bash
GET /api/v1/agents/music/genres

Response:
{
  "genres": ["Lo-fi Chill", "Pop Anthems", "Hype Beats", ...],
  "total_count": 20
}
```

### 2. Get Listening History by Genre

```bash
GET /api/v1/agents/music/history/{user_id}?spotify_token=xxx&time_range=medium_term

Response:
{
  "user_id": "123",
  "genre_history": {
    "Lo-fi Chill": [
      {
        "id": "spotify_track_id",
        "name": "Moonlight",
        "artists": ["Artist Name"],
        "external_url": "https://open.spotify.com/track/xxx",
        "genz_genre": "Lo-fi Chill"
      },
      ...
    ],
    "Pop Anthems": [...]
  },
  "total_tracks": 45,
  "total_genres": 8,
  "time_range": "medium_term"
}
```

### 3. Get Personalized Recommendations

```bash
POST /api/v1/agents/music/recommendations/{user_id}

Body:
{
  "spotify_token": "xxx",
  "personality_profile": {
    "openness": 0.75,
    "extraversion": 0.60,
    "conscientiousness": 0.55,
    "agreeableness": 0.70,
    "neuroticism": 0.40
  },
  "genres": ["Lo-fi Chill", "Indie Vibes", "Pop Anthems"],  // Optional
  "songs_per_genre": 3,
  "use_history": true
}

Response:
{
  "user_id": "123",
  "recommendations": {
    "Lo-fi Chill": [
      {
        "id": "track_id_1",
        "name": "Sunset Vibes",
        "artists": ["Artist"],
        "external_url": "https://open.spotify.com/track/xxx",
        "energy": 0.35,
        "valence": 0.65,
        "personality_match": 0.82,
        "actions": {
          "like": "/api/v1/agents/music/feedback/123",
          "dislike": "/api/v1/agents/music/feedback/123",
          "play": "https://open.spotify.com/track/xxx"
        }
      },
      // 2 more songs...
    ],
    "Indie Vibes": [...],
    "Pop Anthems": [...]
  },
  "total_genres": 3,
  "songs_per_genre": 3
}
```

### 4. Record User Feedback (Like/Dislike/Play)

```bash
POST /api/v1/agents/music/feedback/{user_id}

Body:
{
  "song_data": {
    "id": "spotify_track_id",
    "name": "Track Name",
    "genre": "Lo-fi Chill",
    "energy": 0.4,
    "valence": 0.7,
    "tempo": 95
  },
  "feedback_type": "like",  // Options: like, dislike, play, skip, save
  "personality_profile": {
    "openness": 0.75,
    "extraversion": 0.60,
    ...
  },
  "additional_data": {
    "listen_duration": 180000,  // ms
    "track_duration": 210000,   // ms
    "time_to_action": 2.5       // seconds
  }
}

Response:
{
  "message": "Feedback recorded successfully",
  "user_id": "123",
  "feedback_type": "like",
  "song_name": "Track Name",
  "rl_stats": {
    "training_episodes": 45,
    "average_reward": 0.67
  }
}
```

### 5. Get Music Insights & RL Statistics

```bash
GET /api/v1/agents/music/insights/{user_id}?spotify_token=xxx

Response:
{
  "user_id": "123",
  "rl_statistics": {
    "training_episodes": 45,
    "total_reward": 30.2,
    "average_reward": 0.67,
    "epsilon": 0.08,
    "q_table_size": 234,
    "experience_buffer_size": 45
  },
  "genre_insights": {
    "best_genres": [
      {"genre": "Lo-fi Chill", "avg_reward": 0.85, "count": 12},
      {"genre": "Indie Vibes", "avg_reward": 0.72, "count": 8},
      {"genre": "R&B Feels", "avg_reward": 0.68, "count": 6}
    ],
    "worst_genres": [
      {"genre": "Metal Mayhem", "avg_reward": -0.3, "count": 2}
    ],
    "total_genres_tracked": 10
  }
}
```

---

## 🧠 How It Works

### 1. **Genre-Based History Fetching**
```python
# Fetches user's Spotify history and organizes by GenZ genres
genre_history = await music_agent.fetch_genre_based_history(time_range="medium_term")

# Returns: {"Lo-fi Chill": [...tracks...], "Pop Anthems": [...tracks...], ...}
```

### 2. **Recommendation Generation**
```python
# Get 2-3 songs per genre based on personality + history
recommendations = await music_agent.get_recommendations_by_genre(
    personality_profile=profile,
    genres=["Lo-fi Chill", "Indie Vibes"],
    songs_per_genre=3,
    use_history=True
)

# Process:
# 1. Fetch user's history for each genre
# 2. Get Spotify recommendations based on history
# 3. Enrich with audio features
# 4. Score with RL system based on personality
# 5. Return top N songs per genre
```

### 3. **RL Feedback Learning**
```python
# User clicks "like" button
await music_agent.process_user_feedback(
    song_data=song,
    personality_profile=profile,
    feedback_type="like",
    additional_data={"listen_duration": 180000, "track_duration": 210000}
)

# RL System:
# 1. Extracts state features (personality + audio features + genre)
# 2. Calculates reward (like = +1.0, with modifiers for completion %)
# 3. Updates Q-value using Q-learning formula
# 4. Updates genre performance tracking
# 5. Stores experience for batch learning
```

### 4. **Action Buttons**

Each recommended song includes action URLs:

- **Like Button** → POST to `/music/feedback/{user_id}` with `feedback_type: "like"`
- **Dislike Button** → POST to `/music/feedback/{user_id}` with `feedback_type: "dislike"`
- **Play Button** → Redirects to `external_url` (Spotify web player or app)

---

## 📦 Frontend Integration

### Example React Component

```typescript
interface Song {
  id: string;
  name: string;
  artists: string[];
  external_url: string;
  actions: {
    like: string;
    dislike: string;
    play: string;
  };
}

const MusicRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Record<string, Song[]>>({});
  
  const handleFeedback = async (song: Song, feedbackType: 'like' | 'dislike') => {
    await fetch(song.actions[feedbackType], {
      method: 'POST',
      body: JSON.stringify({
        song_data: song,
        feedback_type: feedbackType,
        personality_profile: userProfile,
      })
    });
    
    // Refresh recommendations
    fetchRecommendations();
  };
  
  return (
    <div>
      {Object.entries(recommendations).map(([genre, songs]) => (
        <div key={genre}>
          <h2>{genre}</h2>
          {songs.map(song => (
            <div key={song.id}>
              <span>{song.name} - {song.artists.join(', ')}</span>
              <button onClick={() => handleFeedback(song, 'like')}>👍 Like</button>
              <button onClick={() => handleFeedback(song, 'dislike')}>👎 Dislike</button>
              <button onClick={() => window.open(song.actions.play)}>▶️ Play</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

---

## 🗃️ Supabase Setup

Run the SQL schema file to create the required tables:

```bash
# In Supabase SQL Editor, run:
# 1. Base entertainment schema (if not already run)
# 2. bondhu-ai/database/music_recommendation_schema.sql
```

The schema includes:
- ✅ All required tables
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions for interactions and preferences
- ✅ Automatic preference updates on feedback

---

## 🎯 Key Features Summary

1. **20 GenZ-Friendly Genres** - Cool names like "Lo-fi Chill", "Hype Beats", "Sad Boy Hours"
2. **Spotify Integration** - Fetch listening history organized by genre
3. **Personality-Based Recommendations** - 2-3 songs per genre matched to user personality
4. **RL Learning System** - Improves recommendations based on like/dislike/play feedback
5. **Spotify Playback** - Play button redirects to Spotify web/app
6. **Genre Insights** - View which genres the user prefers based on interaction history
7. **Automatic Preference Updates** - Database functions automatically update preferences
8. **RL Model Persistence** - Save/load Q-tables for continued learning

---

## 🔍 Testing the System

### 1. Connect Spotify
```bash
GET /api/v1/agents/music/connect?user_id=test123
# Follow OAuth flow
```

### 2. Get Genre History
```bash
GET /api/v1/agents/music/history/test123?spotify_token=xxx
```

### 3. Get Recommendations
```bash
POST /api/v1/agents/music/recommendations/test123
{
  "spotify_token": "xxx",
  "personality_profile": {...},
  "songs_per_genre": 3
}
```

### 4. Simulate User Feedback
```bash
# Like a song
POST /api/v1/agents/music/feedback/test123
{
  "song_data": {...},
  "feedback_type": "like",
  "personality_profile": {...}
}

# Check if RL learned
GET /api/v1/agents/music/insights/test123?spotify_token=xxx
```

---

## 📈 RL Performance Monitoring

The system tracks:
- **Training Episodes** - Number of feedback instances processed
- **Average Reward** - Overall RL performance metric
- **Genre Performance** - Best/worst performing genres
- **Q-Table Size** - Number of learned state-action pairs
- **Exploration Rate (Epsilon)** - Decreases as system learns

Access via `/music/insights/{user_id}` endpoint.

---

## 🚨 Important Notes

1. **Spotify Token Required** - All music endpoints need a valid Spotify OAuth token
2. **Rate Limits** - Spotify API has rate limits, cache recommendations when possible
3. **Audio Features** - Spotify audio features are key to personality matching
4. **RL Convergence** - System improves with more feedback (30+ interactions recommended)
5. **Genre Mapping** - Fuzzy matching handles variations in Spotify genre names
6. **Database Setup** - Must run the SQL schema before using the system

---

## 🎉 What's Next?

Potential enhancements:
- [ ] Collaborative filtering (recommend based on similar users)
- [ ] Mood-based playlist generation
- [ ] Time-of-day aware recommendations
- [ ] Cross-genre discovery suggestions
- [ ] Integration with music_preferences in entertainment schema
- [ ] Advanced RL features (deep Q-networks, multi-armed bandits)

---

## 📝 Summary

The music recommendation system is now fully configured with:
✅ GenZ-friendly genre categorization
✅ Spotify history fetching by genre
✅ Personality-based song recommendations (2-3 per genre)
✅ RL-based learning from like/dislike/play feedback
✅ Complete API endpoints for frontend integration
✅ Database schema with automatic preference updates
✅ Play button redirects to Spotify

All code is production-ready and follows the existing video RL architecture! 🎵
