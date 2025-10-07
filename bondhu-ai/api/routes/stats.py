"""
User Activity Stats API Endpoints

Provides comprehensive dashboard statistics including:
- Wellness Score (0-100 based on activity, consistency, engagement, growth)
- Chat Sessions count
- Games Played count
- Growth Streak (consecutive days)
- Achievements (based on streaks)
- Active Sessions
"""

import logging
from typing import Optional
from datetime import datetime, date

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from core.database.supabase_client import get_supabase_client

logger = logging.getLogger("bondhu.api.stats")

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


# Response Models
class WellnessScoreDetail(BaseModel):
    """Wellness score with breakdown."""
    score: int = Field(..., ge=0, le=100, description="Overall wellness score (0-100)")
    change: int = Field(..., description="Change from previous period")
    change_text: str = Field(..., description="Human-readable change text")


class DashboardStats(BaseModel):
    """Complete dashboard statistics."""
    wellness_score: int = 0
    wellness_change: int = 0
    wellness_change_text: str = "No change"
    chat_sessions: int = 0
    chat_sessions_change: str = "+0 today"
    games_played: int = 0
    games_change: str = "+0 this week"
    growth_streak_days: int = 0
    growth_streak_status: str = "Start your journey!"
    achievements: int = 0
    achievements_change: str = "+0 this month"
    active_sessions: int = 0
    active_sessions_text: str = "0 active now"
    longest_streak: int = 0
    last_activity: Optional[str] = None


class Achievement(BaseModel):
    """Achievement definition."""
    id: str
    achievement_name: str
    description: str
    requirement_value: int
    icon_name: str
    unlocked: bool
    unlocked_at: Optional[str] = None


class AchievementList(BaseModel):
    """List of achievements."""
    achievements: list[Achievement]
    total_unlocked: int
    total_available: int


# Endpoints
@router.get("/dashboard/{user_id}", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str):
    """
    Get complete dashboard statistics for a user.
    
    Returns:
    - Wellness Score (0-100)
    - Chat Sessions count
    - Games Played
    - Growth Streak
    - Achievements
    - Active Sessions
    
    Args:
        user_id: User's unique ID
        
    Returns:
        Complete dashboard statistics
    """
    try:
        supabase = get_supabase_client()
        
        # Call database function to get all stats
        response = supabase.supabase.rpc(
            'get_user_dashboard_stats',
            {'p_user_id': user_id}
        ).execute()
        
        if not response.data:
            # Return default stats for new users
            return DashboardStats(
                wellness_score=0,
                wellness_change=0,
                wellness_change_text="No change",
                chat_sessions=0,
                chat_sessions_change="+0 today",
                games_played=0,
                games_change="+0 this week",
                growth_streak_days=0,
                growth_streak_status="Start your journey!",
                achievements=0,
                achievements_change="+0 this month",
                active_sessions=0,
                active_sessions_text="0 active now",
                longest_streak=0,
                last_activity=None
            )
        
        stats = response.data
        logger.info(f"Retrieved dashboard stats for user {user_id}")
        
        return DashboardStats(**stats)
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard stats: {str(e)}"
        )


@router.get("/wellness/{user_id}", response_model=WellnessScoreDetail)
async def get_wellness_score(user_id: str, recalculate: bool = False):
    """
    Get wellness score for a user.
    
    Wellness score (0-100) is calculated from:
    - Activity Score (25 points): Recent activity in last 7 days
    - Consistency Score (25 points): Current streak
    - Engagement Score (25 points): Chat sessions and messages
    - Growth Score (25 points): Games played and achievements
    
    Args:
        user_id: User's unique ID
        recalculate: Force recalculation of score
        
    Returns:
        Wellness score with change indicator
    """
    try:
        supabase = get_supabase_client()
        
        if recalculate:
            # Force recalculation
            supabase.supabase.rpc(
                'calculate_wellness_score',
                {'p_user_id': user_id}
            ).execute()
        
        # Get current stats
        response = supabase.supabase.table('user_activity_stats') \
            .select('wellness_score, wellness_score_history') \
            .eq('user_id', user_id) \
            .execute()
        
        if not response.data or len(response.data) == 0:
            return WellnessScoreDetail(
                score=0,
                change=0,
                change_text="No data yet"
            )
        
        response.data = response.data[0]
        
        current_score = response.data.get('wellness_score', 0)
        history = response.data.get('wellness_score_history', [])
        
        # Calculate change from yesterday
        change = 0
        if len(history) >= 2:
            yesterday_score = history[-2].get('score', 0)
            change = current_score - yesterday_score
        
        change_text = "No change"
        if change > 0:
            change_text = f"+{change} this week"
        elif change < 0:
            change_text = f"{change} this week"
        
        return WellnessScoreDetail(
            score=current_score,
            change=change,
            change_text=change_text
        )
        
    except Exception as e:
        logger.error(f"Error getting wellness score: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get wellness score: {str(e)}"
        )


@router.post("/activity/{user_id}")
async def track_activity(user_id: str, activity_type: str = "chat"):
    """
    Track user activity and update stats.
    
    This is called whenever user performs an action:
    - 'chat': Sends a message
    - 'game': Plays a game
    - 'login': Opens the dashboard
    
    Automatically:
    - Updates streak (increments if consecutive day, resets if broken)
    - Checks for new achievements
    - Recalculates wellness score
    
    Args:
        user_id: User's unique ID
        activity_type: Type of activity ('chat', 'game', 'login')
        
    Returns:
        Success message with updated stats
    """
    try:
        supabase = get_supabase_client()
        
        # Call increment function
        supabase.supabase.rpc(
            'increment_activity_stats',
            {
                'p_user_id': user_id,
                'p_activity_type': activity_type
            }
        ).execute()
        
        # Get updated stats
        response = supabase.supabase.table('user_activity_stats') \
            .select('current_streak_days, total_achievements, wellness_score') \
            .eq('user_id', user_id) \
            .single() \
            .execute()
        
        stats = response.data if response.data else {}
        
        logger.info(f"Tracked {activity_type} activity for user {user_id}")
        
        return {
            "success": True,
            "message": f"Activity tracked: {activity_type}",
            "current_streak": stats.get('current_streak_days', 0),
            "total_achievements": stats.get('total_achievements', 0),
            "wellness_score": stats.get('wellness_score', 0)
        }
        
    except Exception as e:
        logger.error(f"Error tracking activity: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track activity: {str(e)}"
        )


@router.get("/achievements/{user_id}", response_model=AchievementList)
async def get_achievements(user_id: str):
    """
    Get all achievements for a user (unlocked and locked).
    
    Args:
        user_id: User's unique ID
        
    Returns:
        List of all achievements with unlock status
    """
    try:
        supabase = get_supabase_client()
        
        # Get all achievements
        achievements_response = supabase.supabase.table('achievements') \
            .select('*') \
            .order('requirement_value', desc=False) \
            .execute()
        
        # Get user's unlocked achievements
        user_stats = supabase.supabase.table('user_activity_stats') \
            .select('achievement_unlocks, current_streak_days') \
            .eq('user_id', user_id) \
            .execute()
        
        unlocked_achievements = {}
        current_streak = 0
        
        if user_stats.data and len(user_stats.data) > 0:
            unlocked_achievements = user_stats.data[0].get('achievement_unlocks', {})
            current_streak = user_stats.data[0].get('current_streak_days', 0)
        
        # Build achievement list
        achievements = []
        total_unlocked = 0
        
        for ach in achievements_response.data:
            ach_id = str(ach['id'])
            is_unlocked = ach_id in unlocked_achievements
            
            if is_unlocked:
                total_unlocked += 1
                unlock_data = unlocked_achievements[ach_id]
                unlocked_at = unlock_data.get('unlocked_at')
            else:
                unlocked_at = None
            
            achievements.append(Achievement(
                id=ach_id,
                achievement_name=ach['achievement_name'],
                description=ach['description'],
                requirement_value=ach['requirement_value'],
                icon_name=ach['icon_name'],
                unlocked=is_unlocked,
                unlocked_at=unlocked_at
            ))
        
        return AchievementList(
            achievements=achievements,
            total_unlocked=total_unlocked,
            total_available=len(achievements)
        )
        
    except Exception as e:
        logger.error(f"Error getting achievements: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get achievements: {str(e)}"
        )


@router.get("/streak/{user_id}")
async def get_streak_info(user_id: str):
    """
    Get detailed streak information.
    
    Args:
        user_id: User's unique ID
        
    Returns:
        Current streak, longest streak, and streak status
    """
    try:
        supabase = get_supabase_client()
        
        response = supabase.supabase.table('user_activity_stats') \
            .select('current_streak_days, longest_streak_days, current_streak_start_date, last_activity_date') \
            .eq('user_id', user_id) \
            .execute()
        
        if not response.data or len(response.data) == 0:
            return {
                "current_streak_days": 0,
                "longest_streak_days": 0,
                "streak_start_date": None,
                "last_activity": None,
                "status": "Start your journey!"
            }
        
        data = response.data[0]
        current = data.get('current_streak_days', 0)
        longest = data.get('longest_streak_days', 0)
        
        # Determine streak status
        streak_status = "Keep going!"
        if current >= 100:
            streak_status = "ON FIRE! Unstoppable!"
        elif current >= 50:
            streak_status = "Incredible dedication!"
        elif current >= 25:
            streak_status = "Amazing streak!"
        elif current >= 10:
            streak_status = "Great momentum!"
        elif current >= 5:
            streak_status = "Building consistency!"
        
        return {
            "current_streak_days": current,
            "longest_streak_days": longest,
            "streak_start_date": data.get('current_streak_start_date'),
            "last_activity": data.get('last_activity_date'),
            "status": streak_status,
            "is_personal_best": current == longest and current > 0
        }
        
    except Exception as e:
        logger.error(f"Error getting streak info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get streak info: {str(e)}"
        )


@router.get("/health")
async def stats_health_check():
    """Health check endpoint for stats service."""
    return {
        "status": "healthy",
        "service": "stats",
        "timestamp": datetime.utcnow().isoformat()
    }
