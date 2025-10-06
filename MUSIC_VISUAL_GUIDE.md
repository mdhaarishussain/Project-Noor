# Music Recommendation System - Visual Guide

## 🎵 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                 │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Lo-fi Chill │  │ Indie Vibes  │  │ Pop Anthems  │  │  Hype Beats  │  │
│  │              │  │              │  │              │  │              │  │
│  │ 🎵 Song 1    │  │ 🎵 Song 1    │  │ 🎵 Song 1    │  │ 🎵 Song 1    │  │
│  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │
│  │              │  │              │  │              │  │              │  │
│  │ 🎵 Song 2    │  │ 🎵 Song 2    │  │ 🎵 Song 2    │  │ 🎵 Song 2    │  │
│  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │
│  │              │  │              │  │              │  │              │  │
│  │ 🎵 Song 3    │  │ 🎵 Song 3    │  │ 🎵 Song 3    │  │ 🎵 Song 3    │  │
│  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │ 👍 👎 ▶️     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                             │
│  20 GenZ Genres • 2-3 Songs Each • Like/Dislike/Play Actions              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                      │
│                                                                             │
│  GET  /music/genres                      → List 20 genre names            │
│  GET  /music/history/{user_id}           → Spotify history by genre       │
│  POST /music/recommendations/{user_id}   → Get 2-3 songs per genre        │
│  POST /music/feedback/{user_id}          → Record like/dislike/play       │
│  GET  /music/insights/{user_id}          → View RL learning stats         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MUSIC INTELLIGENCE AGENT                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  GenZ Genre Mapper                                                  │  │
│  │  • Maps Spotify genres → GenZ names                                │  │
│  │  • "lo-fi" → "Lo-fi Chill"                                         │  │
│  │  • "indie pop" → "Indie Vibes"                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  History Fetcher                                                    │  │
│  │  • Fetches Spotify listening history                               │  │
│  │  • Organizes by GenZ genres                                        │  │
│  │  • Caches audio features                                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Recommendation Generator                                           │  │
│  │  • Uses history as seeds                                           │  │
│  │  • Gets Spotify recommendations                                    │  │
│  │  • Enriches with audio features                                    │  │
│  │  • Calculates personality match                                    │  │
│  │  • Applies RL scoring                                              │  │
│  │  • Returns top 3 per genre                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Feedback Processor                                                 │  │
│  │  • Handles like/dislike/play                                       │  │
│  │  • Feeds to RL system                                              │  │
│  │  • Updates preferences                                             │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                    ↓                               ↓
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │    SPOTIFY API            │   │    RL SYSTEM              │
    │                           │   │                           │
    │  • Get listening history  │   │  • Q-learning algorithm   │
    │  • Get recommendations    │   │  • State: personality +   │
    │  • Get audio features     │   │    audio + genre          │
    │  • Get artist genres      │   │  • Actions: recommend/not │
    │  • Playback URLs          │   │  • Rewards: like/dislike  │
    │                           │   │  • Experience replay      │
    │                           │   │  • Genre performance      │
    │                           │   │                           │
    └───────────────────────────┘   └───────────────────────────┘
                                                ↓
                            ┌───────────────────────────┐
                            │   SUPABASE DATABASE       │
                            │                           │
                            │  music_recommendations    │
                            │  music_interactions       │
                            │  music_genre_preferences  │
                            │  music_listening_history  │
                            │  music_rl_models          │
                            │                           │
                            │  Auto-updating functions  │
                            │  Row Level Security       │
                            │                           │
                            └───────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### 1. Getting Recommendations

```
User opens app
      ↓
Frontend requests recommendations
      ↓
POST /music/recommendations/{user_id}
      ↓
Music Agent receives request
      ↓
[1] Fetch Spotify history by genre
      ↓
[2] Use top 2 tracks per genre as seeds
      ↓
[3] Query Spotify recommendations API
      ↓
[4] Enrich with audio features (energy, valence, etc.)
      ↓
[5] Calculate personality match scores
      ↓
[6] Apply RL scoring (Q-values from past feedback)
      ↓
[7] Rank and select top 3 songs per genre
      ↓
[8] Format with action buttons (like/dislike/play)
      ↓
Return to frontend
      ↓
User sees 20 genres × 3 songs = 60 recommendations
```

### 2. User Feedback Loop

```
User clicks "Like" on a song
      ↓
POST /music/feedback/{user_id}
      ↓
Music Agent receives feedback
      ↓
[1] Extract state features
    • Personality: [openness: high, extraversion: med, ...]
    • Audio: [energy: 0.7, valence: 0.8, tempo: 120, ...]
    • Genre: "Lo-fi Chill"
      ↓
[2] Calculate reward
    • Base: +1.0 (like)
    • Completion bonus: +0.4 (listened 90%)
    • Quick action bonus: +0.15 (clicked within 3s)
    • Total: +1.55
      ↓
[3] Update Q-value
    • Current Q(state, action) = 0.3
    • New Q = 0.3 + 0.1 * (1.55 - 0.3) = 0.425
      ↓
[4] Update genre performance
    • "Lo-fi Chill" avg_reward: 0.45 → 0.52
    • interaction_count: 8 → 9
      ↓
[5] Store in experience buffer
      ↓
[6] Trigger batch learning (every 10 interactions)
      ↓
[7] Database auto-updates
    • INSERT into music_interactions
    • UPDATE music_genre_preferences
      ↓
[8] Return success to frontend
      ↓
User sees confirmation
      ↓
Next recommendations will be better!
```

---

## 🎯 GenZ Genre Mapping

```
SPOTIFY GENRES                  →    GENZ FRIENDLY NAME
─────────────────────────────────────────────────────────
lo-fi, chillhop, study beats    →    Lo-fi Chill
indie, indie pop, bedroom pop   →    Indie Vibes
pop, dance pop, synth-pop       →    Pop Anthems
hip hop, trap, rap              →    Hype Beats
emo, sad, melancholic           →    Sad Boy Hours
r&b, neo-soul                   →    R&B Feels
edm, house, techno              →    EDM Bangers
acoustic, folk                  →    Serene Acoustics
dream pop, shoegaze             →    Dreamy Vibes
rock, alternative rock          →    Rock Energy
soul, funk, motown              →    Soulful Grooves
dance, party, club              →    Party Starters
80s, 90s, throwback             →    Throwback Jams
classical, piano                →    Focus Flow
lo-fi hip hop, jazz             →    Study Beats
alternative, post-punk          →    Alt Scene
world, afrobeat, k-pop          →    Global Rhythms
k-pop, k-indie                  →    K-Wave
underground hip hop             →    Underground Hits
metal, heavy metal              →    Metal Mayhem
```

---

## 🧠 RL Learning Process

### State Representation
```
STATE = {
  Personality Features (discretized):
    • openness: low/med/high
    • extraversion: low/med/high
    • conscientiousness: low/med/high
    • agreeableness: low/med/high
    • neuroticism: low/med/high
  
  Audio Features (discretized):
    • energy: low/med/high
    • valence: low/med/high
    • danceability: low/med/high
    • tempo: slow/medium/fast
  
  Genre:
    • "Lo-fi Chill"
}

Example State String:
"openness_high|extraversion_med|energy_low|valence_high|tempo_slow|genre_lo-fi_chill"
```

### Q-Table Structure
```
Q-Table = {
  "openness_high|extraversion_med|...|genre_lo-fi_chill_recommend": 0.85,
  "openness_low|extraversion_high|...|genre_hype_beats_recommend": 0.72,
  "openness_high|neuroticism_low|...|genre_indie_vibes_recommend": 0.68,
  ...
  (Grows with each unique state-action pair)
}
```

### Learning Update
```python
# Q-learning formula
Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]

# Simplified (no next state yet)
Q(s,a) = Q(s,a) + α[r - Q(s,a)]

# Example:
current_q = 0.3
reward = 1.55
learning_rate = 0.1

new_q = 0.3 + 0.1 * (1.55 - 0.3)
new_q = 0.3 + 0.125
new_q = 0.425  ✓
```

### Genre Performance Tracking
```
genre_performance = {
  "Lo-fi Chill": {
    total_reward: 4.2,
    count: 8,
    avg_reward: 0.525
  },
  "Indie Vibes": {
    total_reward: 3.6,
    count: 6,
    avg_reward: 0.60
  },
  "Metal Mayhem": {
    total_reward: -0.6,
    count: 2,
    avg_reward: -0.30
  }
}
```

---

## 📊 Database Schema Visual

```
┌────────────────────────────────────────────────────────────┐
│                 music_recommendations                      │
├────────────────────────────────────────────────────────────┤
│ id (PK)                                                    │
│ user_id (FK → auth.users)                                 │
│ spotify_track_id                                           │
│ track_name                                                 │
│ artists[]                                                  │
│ genz_genre                                                 │
│ spotify_genres[]                                           │
│ energy, valence, danceability, tempo                      │
│ rl_score                                                   │
│ personality_match_score                                    │
│ spotify_url ← (Used for Play button)                      │
│ recommended_at                                             │
└────────────────────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────────────┐
│                 music_interactions                         │
├────────────────────────────────────────────────────────────┤
│ id (PK)                                                    │
│ user_id (FK → auth.users)                                 │
│ recommendation_id (FK → music_recommendations)             │
│ spotify_track_id                                           │
│ genz_genre                                                 │
│ interaction_type (like/dislike/play/skip/save)           │
│ rl_reward                                                  │
│ q_value                                                    │
│ state_features                                             │
│ listen_duration_ms, completion_percentage                  │
│ personality_snapshot (JSONB)                               │
│ interacted_at                                              │
└────────────────────────────────────────────────────────────┘
                     ↓ (Triggers function)
┌────────────────────────────────────────────────────────────┐
│              music_genre_preferences                       │
├────────────────────────────────────────────────────────────┤
│ id (PK)                                                    │
│ user_id (FK → auth.users)                                 │
│ genz_genre (UNIQUE per user)                              │
│ preference_score (0-1) ← Auto-calculated                  │
│ avg_rl_reward ← Auto-calculated                           │
│ interaction_count ← Auto-incremented                      │
│ positive_interactions ← Auto-incremented                  │
│ negative_interactions ← Auto-incremented                  │
│ learned_from                                               │
│ last_updated_at ← Auto-updated                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              music_listening_history                       │
├────────────────────────────────────────────────────────────┤
│ id (PK)                                                    │
│ user_id (FK → auth.users)                                 │
│ spotify_track_id                                           │
│ genz_genre                                                 │
│ played_at                                                  │
│ time_range (short/medium/long_term)                       │
│ energy, valence, danceability, tempo                      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                 music_rl_models                            │
├────────────────────────────────────────────────────────────┤
│ id (PK)                                                    │
│ user_id (FK → auth.users)                                 │
│ q_table (JSONB) ← Entire Q-table snapshot                 │
│ genre_performance (JSONB)                                  │
│ training_episodes, total_reward, avg_reward               │
│ is_active                                                  │
└────────────────────────────────────────────────────────────┘
```

---

## 🎮 User Journey Example

### Day 1: First Use
```
1. User connects Spotify
2. System fetches history (50 tracks)
3. Organizes into 8 genres
4. Generates recommendations (8 genres × 3 songs = 24 total)
5. User sees recommendations
6. User likes 5 songs, dislikes 2
7. RL system: avg_reward = 0.43, epsilon = 0.09
8. Database: 7 interactions recorded, genre preferences updating
```

### Day 3: System Learning
```
1. User returns
2. System generates new recommendations
3. Now uses learned Q-values + genre performance
4. Better songs suggested in preferred genres
5. User likes 8 songs, dislikes 1
6. RL system: avg_reward = 0.67, epsilon = 0.07
7. "Lo-fi Chill" and "Indie Vibes" marked as top genres
```

### Week 1: Personalized Experience
```
1. System knows user loves "Lo-fi Chill" and "Indie Vibes"
2. Knows user dislikes "Metal Mayhem"
3. Recommendations heavily favor high-performing genres
4. RL system: avg_reward = 0.82, epsilon = 0.02
5. User satisfaction: 90%+ like rate
6. Q-table: 150+ state-action pairs learned
```

---

## 🎯 Action Button Behavior

### Like Button (👍)
```
Click → POST /feedback → reward: +1.0
         ↓
    RL system learns
         ↓
    Genre preference ↑
         ↓
    More similar songs next time
```

### Dislike Button (👎)
```
Click → POST /feedback → reward: -1.0
         ↓
    RL system learns
         ↓
    Genre preference ↓
         ↓
    Fewer similar songs next time
```

### Play Button (▶️)
```
Click → Opens Spotify URL
    (web or app)
         ↓
    Backend records "play" event
         ↓
    reward: +0.8
         ↓
    RL system learns
         ↓
    Similar songs boosted
```

---

This visual guide shows exactly how all the pieces work together! 🎵
