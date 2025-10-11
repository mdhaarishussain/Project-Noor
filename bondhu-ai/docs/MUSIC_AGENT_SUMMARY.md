# Music Agent Configuration - Quick Summary

## ✅ What Was Done

### 1. **Created Music RL System** (`core/rl/music_recommendation_rl.py`)
- Q-learning implementation for music recommendations
- State features: personality + audio features + genre
- Reward mapping: like (+1.0), dislike (-1.0), play (+0.8), save (+1.5), etc.
- Genre-specific performance tracking
- Experience replay buffer for batch learning

### 2. **Enhanced Music Agent** (`agents/music/music_agent.py`)
Added 20 GenZ-friendly genre categories:
- **Chill**: Lo-fi Chill, Serene Acoustics, Dreamy Vibes
- **Energetic**: Pop Anthems, Hype Beats, EDM Bangers, Rock Energy
- **Mood**: Sad Boy Hours, R&B Feels, Soulful Grooves
- **Party**: Party Starters, Throwback Jams
- **Focus**: Focus Flow, Study Beats
- **Indie**: Indie Vibes, Alt Scene
- **Global**: Global Rhythms, K-Wave
- **Niche**: Underground Hits, Metal Mayhem

New methods:
- `fetch_genre_based_history()` - Get Spotify history by genre
- `get_recommendations_by_genre()` - Get 2-3 songs per genre
- `process_user_feedback()` - Handle like/dislike/play feedback
- `get_available_genres()` - List all genres
- `get_rl_statistics()` - Get learning stats
- `get_genre_insights()` - Get genre performance data

### 3. **Added API Routes** (`api/routes/agents.py`)
New endpoints:
- `GET /music/genres` - Get available genres
- `GET /music/history/{user_id}` - Get genre-organized listening history
- `POST /music/recommendations/{user_id}` - Get personalized recommendations
- `POST /music/feedback/{user_id}` - Record like/dislike/play feedback
- `GET /music/insights/{user_id}` - Get RL statistics and insights

### 4. **Created Database Schema** (`database/music_recommendation_schema.sql`)
Tables:
- `music_recommendations` - Recommended tracks with RL scores
- `music_interactions` - User feedback for RL learning
- `music_genre_preferences` - Learned genre preferences
- `music_listening_history` - Cached Spotify history
- `music_rl_models` - RL model snapshots

Functions:
- `record_music_interaction()` - Record feedback + update preferences
- `get_top_music_genres()` - Get user's top genres

---

## 🎯 How It Works

### Flow Diagram:
```
User → Spotify OAuth → Music Agent
                           ↓
                  Fetch History by Genre
                           ↓
              Get Recommendations (2-3 per genre)
                     ↓          ↓
              Personality  +  RL Scoring
                           ↓
              Present with Like/Dislike/Play buttons
                           ↓
              User Feedback (like/dislike/play)
                           ↓
              RL System Updates Q-values
                           ↓
              Genre Preferences Updated
                           ↓
              Future Recommendations Improved
```

### Recommendation Process:
1. **Fetch History**: Get user's Spotify history, organize by GenZ genre
2. **Get Seeds**: Use top 2 tracks from each genre as seeds
3. **Query Spotify**: Get recommendations from Spotify API
4. **Enrich Data**: Add audio features (energy, valence, tempo, etc.)
5. **Calculate Match**: Score personality alignment
6. **RL Scoring**: Apply learned Q-values from past feedback
7. **Rank & Select**: Choose top 3 songs per genre
8. **Return with Actions**: Include like/dislike/play buttons

### Feedback Learning:
1. **User Action**: Clicks like/dislike/play
2. **Extract State**: Personality + audio features + genre
3. **Calculate Reward**: Base reward + modifiers (completion %, time, etc.)
4. **Update Q-value**: Q-learning formula
5. **Update Genre Performance**: Track avg reward per genre
6. **Store Experience**: Add to replay buffer
7. **Batch Learning**: Every 10 interactions, learn from buffer
8. **Update Database**: Auto-update `music_genre_preferences`

---

## 📦 Required Supabase Setup

Run this SQL file in your Supabase SQL Editor:
```
bondhu-ai/database/music_recommendation_schema.sql
```

This creates:
- ✅ 5 music-specific tables
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Helper functions
- ✅ Auto-updating preferences

---

## 🚀 Frontend Integration

### Step 1: Connect Spotify
```typescript
const connectSpotify = async () => {
  const response = await fetch(`/api/v1/agents/music/connect?user_id=${userId}`);
  const { auth_url } = await response.json();
  window.location.href = auth_url;
};
```

### Step 2: Get Recommendations
```typescript
const getRecommendations = async () => {
  const response = await fetch(`/api/v1/agents/music/recommendations/${userId}`, {
    method: 'POST',
    body: JSON.stringify({
      spotify_token: spotifyToken,
      personality_profile: {
        openness: 0.75,
        extraversion: 0.60,
        conscientiousness: 0.55,
        agreeableness: 0.70,
        neuroticism: 0.40
      },
      genres: ["Lo-fi Chill", "Indie Vibes", "Pop Anthems"],
      songs_per_genre: 3,
      use_history: true
    })
  });
  
  const { recommendations } = await response.json();
  // recommendations = { "Lo-fi Chill": [song1, song2, song3], ... }
};
```

### Step 3: Handle Feedback
```typescript
const handleFeedback = async (song: Song, feedbackType: 'like' | 'dislike') => {
  await fetch(`/api/v1/agents/music/feedback/${userId}`, {
    method: 'POST',
    body: JSON.stringify({
      song_data: {
        id: song.id,
        name: song.name,
        genre: song.genz_genre,
        energy: song.energy,
        valence: song.valence,
        tempo: song.tempo
      },
      feedback_type: feedbackType,
      personality_profile: userProfile,
      additional_data: {
        listen_duration: listenDuration,
        track_duration: song.duration_ms,
        time_to_action: timeToAction
      }
    })
  });
};
```

### Step 4: Play Button
```typescript
<button onClick={() => window.open(song.external_url, '_blank')}>
  ▶️ Play on Spotify
</button>
```

---

## 🎵 Example UI Component

```typescript
interface Song {
  id: string;
  name: string;
  artists: string[];
  album: string;
  external_url: string;
  energy: number;
  valence: number;
  personality_match: number;
  genz_genre: string;
}

const MusicRecommendationCard = ({ genre, songs }: { genre: string; songs: Song[] }) => {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  
  const handleLike = async (song: Song) => {
    await sendFeedback(song, 'like');
    setFeedback({ ...feedback, [song.id]: 'liked' });
  };
  
  const handleDislike = async (song: Song) => {
    await sendFeedback(song, 'dislike');
    setFeedback({ ...feedback, [song.id]: 'disliked' });
  };
  
  return (
    <div className="genre-card">
      <h2>{genre}</h2>
      <div className="songs-grid">
        {songs.map(song => (
          <div key={song.id} className={`song-card ${feedback[song.id] || ''}`}>
            <div className="song-info">
              <h3>{song.name}</h3>
              <p>{song.artists.join(', ')}</p>
              <p className="album">{song.album}</p>
              <div className="match-score">
                Match: {(song.personality_match * 100).toFixed(0)}%
              </div>
            </div>
            <div className="song-actions">
              <button 
                onClick={() => handleLike(song)}
                disabled={feedback[song.id] === 'liked'}
                className="like-btn"
              >
                👍 Like
              </button>
              <button 
                onClick={() => handleDislike(song)}
                disabled={feedback[song.id] === 'disliked'}
                className="dislike-btn"
              >
                👎 Dislike
              </button>
              <button 
                onClick={() => window.open(song.external_url, '_blank')}
                className="play-btn"
              >
                ▶️ Play
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🧪 Testing Checklist

- [ ] Run SQL schema in Supabase
- [ ] Test Spotify OAuth flow
- [ ] Fetch genre-organized history
- [ ] Get recommendations (verify 2-3 per genre)
- [ ] Test like button (check RL stats update)
- [ ] Test dislike button (check genre preferences update)
- [ ] Test play button (redirects to Spotify)
- [ ] Check RL insights endpoint (verify learning progress)
- [ ] Test with different personality profiles
- [ ] Verify database tables populated correctly

---

## 📊 Monitoring RL Performance

Check system learning via:
```typescript
const insights = await fetch(`/api/v1/agents/music/insights/${userId}?spotify_token=${token}`);
const data = await insights.json();

console.log('Training episodes:', data.rl_statistics.training_episodes);
console.log('Average reward:', data.rl_statistics.average_reward);
console.log('Best genres:', data.genre_insights.best_genres);
console.log('Worst genres:', data.genre_insights.worst_genres);
```

**Expected Progress**:
- Initial: avg_reward ~0.0, epsilon 0.1
- After 10 interactions: avg_reward ~0.2-0.4, epsilon 0.09
- After 50 interactions: avg_reward ~0.5-0.7, epsilon 0.06
- After 100+ interactions: avg_reward ~0.7-0.9, epsilon 0.01

---

## 🎉 You're All Set!

The music agent is now fully configured with:
✅ 20 GenZ-friendly genres
✅ Spotify integration for history & playback
✅ Personality-based recommendations (2-3 per genre)
✅ RL system learning from feedback
✅ Like/Dislike/Play buttons
✅ Complete API endpoints
✅ Database schema ready

**Next Steps**:
1. Run the SQL schema in Supabase
2. Test the API endpoints
3. Build the frontend UI
4. Monitor RL learning progress

For detailed documentation, see: `MUSIC_RECOMMENDATION_SYSTEM.md`
