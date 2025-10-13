# Integrated Personality System - Quick Start

## 🚀 Quick Deploy (3 Steps)

### 1. Deploy Database Schema (2 minutes)

```bash
# Connect to Supabase SQL Editor
# Copy/paste: bondhu-ai/database/personality_adjustment_system.sql
# Run the script
```

Creates:
- `personality_surveys` table (permanent baseline)
- `personality_adjustments` table (dynamic learning)
- `get_weighted_personality()` function
- Helper functions and views

### 2. Migrate Existing Data (5 minutes)

```bash
cd bondhu-ai

# Preview what will happen (safe)
python database/migrate_personality_system.py --dry-run

# Execute migration
python database/migrate_personality_system.py --execute
```

Migrates existing personality data to new system.

### 3. Deploy Code (1 minute)

```bash
# Code is already updated, just restart
docker-compose restart bondhu-ai

# Or rebuild if needed
docker-compose up -d --build
```

**Done!** ✅ System is now live.

## 🎯 What Changed?

### Database
- **NEW**: `personality_surveys` - Permanent survey storage
- **NEW**: `personality_adjustments` - Dynamic learning adjustments
- **PRESERVED**: `profiles.personality_llm_context` - Still used for LLM prompts

### Code Updates
- ✅ `music_agent.py` - Stores adjustments instead of modifying profiles
- ✅ `personality.py` - Chat sentiment creates adjustments
- ✅ `supabase_client.py` - New methods + weighted scoring
- ✅ API Routes - Transparent (no changes needed!)

### Data Flow
```
Original Survey (70%) + Behavioral Adjustments (30%) = Final Personality Score
```

## 📊 How It Works

### Survey Baseline (Permanent)
```python
# User completes personality survey
scores = {
    'openness': 75,
    'conscientiousness': 60,
    'extraversion': 80,
    'agreeableness': 70,
    'neuroticism': 40
}
# Stored in personality_surveys (never modified)
```

### Music Adjustments (Dynamic)
```python
# User listens to 50+ high-energy, positive music tracks
# System creates adjustment:
{
    'source': 'music_analysis',
    'trait': 'extraversion',
    'adjustment_value': +8.5,  # Boost extraversion
    'confidence_score': 0.92   # High confidence (50+ tracks)
}
```

### Chat Adjustments (Dynamic)
```python
# User sends 40+ positive, emotionally stable messages
# System creates adjustment:
{
    'source': 'chat_sentiment',
    'trait': 'neuroticism',
    'adjustment_value': -6.2,  # Lower neuroticism
    'confidence_score': 0.85   # Good confidence (40+ messages)
}
```

### Final Weighted Score
```python
# Extraversion example:
survey_score = 80
music_adjustment = +8.5
chat_adjustment = 0

total_adjustment = (8.5 × 0.92) = 7.82

weighted_score = (80 × 0.7) + (7.82 × 0.3)
                = 56 + 2.35
                = 58.35
                
# Rounded to 58 for API
```

## 🔍 Verification Commands

### Check Survey Migration
```sql
SELECT 
    user_id,
    openness_score,
    conscientiousness_score,
    extraversion_score,
    agreeableness_score,
    neuroticism_score,
    completed_at
FROM personality_surveys
LIMIT 10;
```

### Check Adjustments Being Created
```sql
SELECT 
    user_id,
    source,
    trait,
    adjustment_value,
    confidence_score,
    created_at
FROM personality_adjustments
ORDER BY created_at DESC
LIMIT 20;
```

### Get Weighted Personality
```sql
-- For specific user
SELECT * FROM get_weighted_personality('[user-uuid-here]');

-- Summary view
SELECT * FROM user_personality_overview WHERE user_id = '[user-uuid-here]';
```

### Python API Test
```python
from core.database.supabase_client import get_supabase_client

supabase = get_supabase_client()

# Get weighted personality
personality = await supabase.get_user_personality('user-id-here')

print(personality['scores'])  # Weighted Big Five scores
print(personality['weighted_personality'])  # Full breakdown
```

## 🎛️ Configuration Options

### Change Weight Distribution
Edit `supabase_client.py`:
```python
weighted_personality = await self.get_weighted_personality(
    user_id=user_id,
    survey_weight=0.8,  # 80% survey (default: 0.7)
    adjustment_weight=0.2  # 20% adjustments (default: 0.3)
)
```

### Adjust Confidence Thresholds

**Music** (`music_agent.py`):
```python
confidence_score = min(1.0, total_tracks / 50.0)
# Change 50.0 to require more/fewer tracks
```

**Chat** (`personality.py`):
```python
confidence_score = min(1.0, message_count / 30.0)
# Change 30.0 to require more/fewer messages
```

## 🛠️ Troubleshooting

### Issue: No adjustments being created

**Check**:
1. Are users actually listening to music? Check `music_listening_history`
2. Are users chatting? Check `chat_messages`
3. Are Celery tasks running? Check `celery -A core.celery_app worker`

**Solution**:
```bash
# Manually trigger music analysis
python -c "from agents.music.music_agent import MusicAgent; agent = MusicAgent('user-id'); await agent._analyze_music_personality()"

# Manually trigger chat analysis
python -c "from core.tasks.personality import analyze_chat_sentiment_batch; analyze_chat_sentiment_batch.delay('user-id')"
```

### Issue: Weighted scores same as survey scores

**This is normal if**:
- User has no adjustments yet (new system)
- User has minimal data (low confidence adjustments)

**Check**:
```sql
SELECT * FROM personality_adjustments WHERE user_id = '[user-id]';
-- If empty, no adjustments created yet
```

### Issue: Migration failed

**Check migration errors**:
```bash
python database/migrate_personality_system.py --dry-run
# Look for error messages
```

**Common issues**:
- Missing personality scores (incomplete assessments) - Will be skipped
- Duplicate migrations - Use `ON CONFLICT` in schema
- Database permissions - Use service role key

## 📈 Monitoring

### Daily Checks
```sql
-- New surveys today
SELECT COUNT(*) FROM personality_surveys 
WHERE completed_at > NOW() - INTERVAL '1 day';

-- New adjustments today
SELECT source, COUNT(*) 
FROM personality_adjustments 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY source;

-- Users with weighted personalities
SELECT COUNT(DISTINCT user_id) FROM personality_surveys;
```

### Health Metrics
```sql
-- Average confidence scores by source
SELECT 
    source,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) as adjustment_count
FROM personality_adjustments
GROUP BY source;

-- Most active adjustment sources
SELECT 
    source,
    COUNT(*) as total_adjustments,
    COUNT(DISTINCT user_id) as unique_users
FROM personality_adjustments
GROUP BY source
ORDER BY total_adjustments DESC;
```

## 🎉 Success Indicators

✅ **System Working Properly When**:

1. `personality_surveys` has records for onboarded users
2. `personality_adjustments` growing daily (music/chat)
3. Weighted scores differ from survey baseline (learning happening)
4. API responses include `weighted_personality` field
5. Confidence scores increase over time
6. No errors in application logs

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `database/personality_adjustment_system.sql` | Database schema |
| `database/migrate_personality_system.py` | Migration script |
| `core/database/supabase_client.py` | Database methods |
| `agents/music/music_agent.py` | Music analysis |
| `core/tasks/personality.py` | Chat sentiment |
| `INTEGRATED_PERSONALITY_SYSTEM.md` | Full documentation |

## 💡 Tips

1. **Run migration on staging first** - Test with real data
2. **Monitor logs after deploy** - Watch for adjustment creation
3. **Validate weighted scores** - Compare to survey baseline
4. **User transparency** - Show users how behavior influences personality
5. **Backup before migration** - Safety first!

---

**Status**: ✅ Ready to deploy

**Support**: Check full documentation in `INTEGRATED_PERSONALITY_SYSTEM.md`
