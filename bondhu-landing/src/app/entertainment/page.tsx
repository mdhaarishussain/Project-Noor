"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Play, Pause, Volume2, ChevronRight, Gamepad2, Camera, Headphones, TrendingUp, Clock, Star, Users } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import AnimatedLoader from "@/components/ui/animated-loader"
import type { Profile } from "@/types/auth"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import VideoRecommendations from "@/components/video-recommendations"
import MusicRecommendations from "@/components/music-recommendations"
import Link from "next/link"

// Import the components that were in the dashboard
// These would need to be moved to separate files in a real app
const PuzzleMaster = ({ onGameComplete }: { onGameComplete: (data: any) => void }) => (
  <div className="p-8 text-center">
    <h3 className="text-xl font-bold mb-4">Puzzle Master Game</h3>
    <p className="text-muted-foreground mb-4">Game interface would be implemented here</p>
    <Button onClick={() => onGameComplete({
      gameId: 'puzzle_master',
      completionRate: 85,
      performance: { creativity: 75, speed: 80, accuracy: 90 },
      emotionalState: 'focused'
    })}>
      Complete Demo
    </Button>
  </div>
)

const MemoryPalace = ({ onGameComplete }: { onGameComplete: (data: any) => void }) => (
  <div className="p-8 text-center">
    <h3 className="text-xl font-bold mb-4">Memory Palace Game</h3>
    <p className="text-muted-foreground mb-4">Memory game interface would be implemented here</p>
    <Button onClick={() => onGameComplete({
      gameId: 'memory_palace',
      completionRate: 92,
      performance: { creativity: 60, speed: 85, accuracy: 95 },
      emotionalState: 'determined'
    })}>
      Complete Demo
    </Button>
  </div>
)

const ColorSymphony = ({ onGameComplete }: { onGameComplete: (data: any) => void }) => (
  <div className="p-8 text-center">
    <h3 className="text-xl font-bold mb-4">Color Symphony Game</h3>
    <p className="text-muted-foreground mb-4">Creative color game interface would be implemented here</p>
    <Button onClick={() => onGameComplete({
      gameId: 'color_symphony',
      completionRate: 78,
      performance: { creativity: 95, speed: 70, accuracy: 80 },
      emotionalState: 'creative'
    })}>
      Complete Demo
    </Button>
  </div>
)

const VideoPlayer = ({ video, onWatchComplete, onClose }: { video: any, onWatchComplete: (data: any) => void, onClose: () => void }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold">{video.title}</h3>
      <Button variant="outline" onClick={onClose}>Close Player</Button>
    </div>
    <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
      <div className="text-center">
        <div className="text-6xl mb-4">{video.thumbnail}</div>
        <p className="text-lg">{video.title}</p>
        <p className="text-sm opacity-75">Video player would be implemented here</p>
        <Button
          className="mt-4"
          onClick={() => onWatchComplete({
            contentId: video.id,
            watchTime: video.duration * 0.8,
            completionRate: 80,
            interactions: ['pause', 'rewind'],
            skipPatterns: []
          })}
        >
          Mark as Watched
        </Button>
      </div>
    </div>
  </div>
)

// Enhanced AI Learning Engine with dynamic analysis
class EnhancedAILearningEngine {
  private supabase = createClient()
  private profileId: string | null = null

  constructor(profileId: string) {
    this.profileId = profileId
  }

  async addGameplayData(data: any) {
    try {
      // Store gameplay data with real-time analysis
      const analysisData = {
        profile_id: this.profileId,
        content_type: 'game',
        content_id: data.gameId,
        interaction_data: data,
        insights: this.analyzeGameplayPatterns(data),
        timestamp: new Date().toISOString(),
        emotional_state: data.emotionalState,
        performance_metrics: data.performance
      }

      // Store in Supabase (would need to create this table)
      console.log('Enhanced game analysis:', analysisData)

      // Return personalized recommendations
      return this.getPersonalizedGameRecommendations(data)
    } catch (error) {
      console.error('Error storing gameplay data:', error)
    }
  }

  async addVideoData(data: any) {
    try {
      const analysisData = {
        profile_id: this.profileId,
        content_type: 'video',
        content_id: data.contentId,
        watch_time: data.watchTime,
        completion_rate: data.completionRate,
        interaction_patterns: data.interactions,
        skip_patterns: data.skipPatterns || [], // Default to empty array
        timestamp: new Date().toISOString()
      }

      console.log('Enhanced video analysis:', analysisData)
      return this.getPersonalizedVideoRecommendations(data)
    } catch (error) {
      console.error('Error storing video data:', error)
    }
  }

  async addMusicData(data: any) {
    try {
      const analysisData = {
        profile_id: this.profileId,
        content_type: 'music',
        mood: data.mood,
        listening_duration: data.duration,
        track_preferences: data.trackPreferences,
        skip_rate: data.skipRate,
        timestamp: new Date().toISOString()
      }

      console.log('Enhanced music analysis:', analysisData)
      return this.getPersonalizedMusicRecommendations(data)
    } catch (error) {
      console.error('Error storing music data:', error)
    }
  }

  private analyzeGameplayPatterns(data: any) {
    const insights = {
      problemSolvingStyle: this.determineProblemSolvingStyle(data.performance),
      stressResponse: this.analyzeStressResponse(data.performance, data.emotionalState),
      learningPreference: this.identifyLearningPreference(data),
      personalityTraits: this.extractPersonalityTraits(data)
    }
    return insights
  }

  private determineProblemSolvingStyle(performance: any) {
    if (performance.speed > 80 && performance.accuracy > 85) return 'analytical_fast'
    if (performance.creativity > 80) return 'creative_explorer'
    if (performance.accuracy > 90) return 'methodical_precise'
    return 'balanced_approach'
  }

  private analyzeStressResponse(performance: any, emotionalState: string) {
    const stressIndicators = {
      performance_drop: performance.accuracy < 70,
      time_pressure_effect: performance.speed < 50,
      emotional_response: emotionalState
    }
    return stressIndicators
  }

  private identifyLearningPreference(data: any) {
    // Analyze learning patterns from gameplay
    return {
      visual: data.gameId.includes('color') || data.gameId.includes('puzzle'),
      kinesthetic: data.performance.speed > 75,
      analytical: data.performance.accuracy > 85
    }
  }

  private extractPersonalityTraits(data: any) {
    return {
      openness: data.performance.creativity,
      conscientiousness: data.performance.accuracy,
      extraversion: data.completionRate > 90 ? 75 : 45,
      agreeableness: 65, // Would be determined by multiplayer interactions
      neuroticism: this.calculateNeuroticism(data.emotionalState, data.performance)
    }
  }

  private calculateNeuroticism(emotionalState: string, performance: any) {
    const stressKeywords = ['anxious', 'frustrated', 'overwhelmed']
    const isStressed = stressKeywords.some(keyword => emotionalState.includes(keyword))
    return isStressed ? Math.max(70, 100 - performance.accuracy) : Math.min(40, 60 - performance.accuracy / 2)
  }

  private getPersonalizedGameRecommendations(data: any) {
    // Dynamic game recommendations based on performance and preferences
    const recommendations = []

    if (data.performance.creativity > 80) {
      recommendations.push({
        type: 'creative_games',
        reason: 'High creativity score detected',
        games: ['color_symphony', 'artistic_expression', 'story_builder']
      })
    }

    if (data.performance.accuracy > 85) {
      recommendations.push({
        type: 'strategy_games',
        reason: 'Excellent precision and attention to detail',
        games: ['chess_master', 'logic_puzzles', 'pattern_recognition']
      })
    }

    return recommendations
  }

  private getPersonalizedVideoRecommendations(data: any) {
    const recommendations = []

    if (data.completionRate > 80) {
      recommendations.push({
        type: 'deep_content',
        reason: 'High engagement with educational content',
        categories: ['advanced_psychology', 'neuroscience', 'philosophy']
      })
    }

    if (data.skipPatterns && data.skipPatterns.length > 3) {
      recommendations.push({
        type: 'bite_sized_content',
        reason: 'Preference for shorter, focused content',
        categories: ['quick_tips', 'micro_learning', 'summary_videos']
      })
    }

    return recommendations
  }

  private getPersonalizedMusicRecommendations(data: any) {
    const recommendations = []

    // Analyze listening patterns for mood correlation
    const moodPreferences = this.analyzeMoodPatterns(data)

    recommendations.push({
      type: 'mood_based',
      currentMood: data.mood,
      suggestedMoods: this.getComplementaryMoods(data.mood),
      playlists: this.generateDynamicPlaylists(moodPreferences)
    })

    return recommendations
  }

  private analyzeMoodPatterns(data: any) {
    // This would analyze historical mood data
    return {
      mostFrequent: data.mood,
      timeOfDay: new Date().getHours() > 18 ? 'evening' : 'day',
      weekday: new Date().getDay() < 6
    }
  }

  private getComplementaryMoods(currentMood: string) {
    const moodMap: { [key: string]: string[] } = {
      'Focus': ['Relax', 'Creative'],
      'Relax': ['Energy', 'Creative'],
      'Energy': ['Focus', 'Relax'],
      'Creative': ['Focus', 'Energy']
    }
    return moodMap[currentMood] || []
  }

  private generateDynamicPlaylists(moodPreferences: any) {
    // Generate playlists based on user preferences and time context
    const timeOfDay = new Date().getHours()
    const isWeekend = [0, 6].includes(new Date().getDay())

    return {
      contextual: `${isWeekend ? 'Weekend' : 'Weekday'} ${timeOfDay > 18 ? 'Evening' : 'Morning'} Vibes`,
      personal: `Your ${moodPreferences.mostFrequent} Mix`,
      discovery: 'New Sounds for You'
    }
  }
}

export default function EntertainmentHubPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [activityHistory, setActivityHistory] = useState<any[]>([])
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const aiEngine = useRef<EnhancedAILearningEngine | null>(null)

  // Function to add activity to main history - this will update the stats
  const addActivityToHistory = useCallback((activity: any) => {
    setActivityHistory(prev => [...prev, activity])
  }, [])

  // Memoized user stats calculation
  const userStats = useMemo(() => {
    if (!activityHistory.length) return null

    const gamesPlayed = activityHistory.filter(a => a.type === 'game').length
    const videosWatched = activityHistory.filter(a => a.type === 'video').length
    const musicListened = activityHistory.filter(a => a.type === 'music').length
    const totalTime = activityHistory.reduce((acc, a) => acc + (a.duration || 0), 0)

    return {
      gamesPlayed,
      videosWatched,
      musicListened,
      totalTime: Math.round(totalTime / 60), // Convert to minutes
      streak: calculateStreak(activityHistory),
      favoriteCategory: getFavoriteCategory(activityHistory)
    }
  }, [activityHistory])

  // Dynamic content loading based on user behavior
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Initialize AI engine
      aiEngine.current = new EnhancedAILearningEngine(userId)

      // Load user preferences (would come from database)
      const preferences = await loadUserPreferences(userId)
      setUserPreferences(preferences)

      // Load activity history
      const history = await loadActivityHistory(userId)
      setActivityHistory(history)

      // Generate personalized recommendations
      const recommendations = await generatePersonalizedContent(userId, preferences, history)
      setPersonalizedRecommendations(recommendations)

    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/sign-in')
          return
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return
        }

        setProfile(profileData)

        // Load additional user data for personalization
        await loadUserData(user.id)

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [supabase, router, loadUserData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <AnimatedLoader size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <Button onClick={() => router.push('/sign-in')}>
            Return to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
              <Link href="/" className="flex items-center">
                <Logo width={140} height={50} />
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-muted-foreground">Entertainment Hub</h1>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Entertainment Hub</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      Entertainment Hub
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Explore games, videos, and music while Bondhu learns about your personality
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    🎮
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Interactive Content
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Stats Dashboard */}
        {userStats && (
          <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {userStats.gamesPlayed}
                  </div>
                  <div className="text-sm text-muted-foreground">Games Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {userStats.videosWatched}
                  </div>
                  <div className="text-sm text-muted-foreground">Videos Watched</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {userStats.musicListened}
                  </div>
                  <div className="text-sm text-muted-foreground">Music Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userStats.totalTime}m
                  </div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {userStats.streak}
                  </div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personalized Recommendations */}
        {personalizedRecommendations && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Recommended for You</span>
              </CardTitle>
              <p className="text-muted-foreground">
                Based on your personality insights and activity patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {personalizedRecommendations.games?.slice(0, 1).map((game: any, index: number) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gamepad2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Game</span>
                    </div>
                    <h4 className="font-semibold mb-1">{game.name}</h4>
                    <p className="text-xs text-muted-foreground">{game.reason}</p>
                  </div>
                ))}
                {personalizedRecommendations.videos?.slice(0, 1).map((video: any, index: number) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Camera className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">Video</span>
                    </div>
                    <h4 className="font-semibold mb-1">{video.title}</h4>
                    <p className="text-xs text-muted-foreground">{video.reason}</p>
                  </div>
                ))}
                {personalizedRecommendations.music?.slice(0, 1).map((music: any, index: number) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Headphones className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Music</span>
                    </div>
                    <h4 className="font-semibold mb-1">{music.playlist}</h4>
                    <p className="text-xs text-muted-foreground">{music.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entertainment Content */}
        <EntertainmentHub
          profile={profile}
          userPreferences={userPreferences}
          aiEngine={aiEngine.current}
          personalizedRecommendations={personalizedRecommendations}
          addActivityToHistory={addActivityToHistory}
        />
      </main>
    </div>
  )
}

// Helper functions for dynamic data loading
async function loadUserPreferences(userId: string) {
  // Mock implementation - would load from Supabase
  return {
    favoriteGameTypes: ['puzzle', 'strategy'],
    preferredVideoLength: 'medium', // short, medium, long
    musicMoods: ['Focus', 'Relax'],
    playingTime: 'evening',
    difficulty: 'medium'
  }
}

async function loadActivityHistory(userId: string) {
  // Mock implementation - would load recent activity from Supabase
  const mockHistory = [
    { type: 'game', name: 'Puzzle Master', duration: 900, timestamp: new Date().toISOString(), performance: { accuracy: 85 } },
    { type: 'video', name: 'Breathing Exercise', duration: 300, timestamp: new Date().toISOString() },
    { type: 'music', mood: 'Focus', duration: 1800, timestamp: new Date().toISOString() }
  ]
  return mockHistory
}

// This is a mock implementation. In a real app, this would call the backend API.
const generatePersonalizedContent = async (userId: string, preferences: any, history: any) => {
  console.log("Generating personalized content for user:", userId);

  // Return mock data for now - the VideoRecommendations component handles real API calls
  try {
    return {
      videos: [],
      games: [],
      music: [],
    };
  } catch (error) {
    console.error("Error fetching video recommendations:", error);
    // Fallback to mock data if API fails
    return {
      videos: [], // Return empty array on error
      games: [],
      music: [],
    };
  }
}

// Helper function to calculate user streak
function calculateStreak(history: any[]) {
  // Calculate consecutive days of engagement
  const today = new Date()
  let streak = 0

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)

    const hasActivity = history.some(activity => {
      const activityDate = new Date(activity.timestamp)
      return activityDate.toDateString() === checkDate.toDateString()
    })

    if (hasActivity) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

function getFavoriteCategory(history: any[]) {
  const categories = history.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1
    return acc
  }, {})

  return Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b)
}

// Enhanced Entertainment Hub Component with dynamic features
function EntertainmentHub({
  profile,
  userPreferences,
  aiEngine,
  personalizedRecommendations,
  addActivityToHistory
}: {
  profile: Profile
  userPreferences: any
  aiEngine: EnhancedAILearningEngine | null
  personalizedRecommendations: any
  addActivityToHistory: (activity: any) => void
}) {
  const [activeSection, setActiveSection] = useState(() => {
    // Dynamic default section based on user preferences or time of day
    const hour = new Date().getHours()
    if (hour < 12) return userPreferences?.morningPreference || 'games'
    if (hour < 18) return userPreferences?.afternoonPreference || 'videos'
    return userPreferences?.eveningPreference || 'music'
  })
  // Real-time mood inference function
  const inferCurrentMood = useCallback(() => {
    const hour = new Date().getHours()
    const day = new Date().getDay()

    // Time-based mood inference
    if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) return 'Focus'
    if (hour >= 18 || day === 0 || day === 6) return 'Relax'
    if (hour >= 6 && hour <= 9) return 'Energy'
    return 'Creative'
  }, [])

  const [currentMood, setCurrentMood] = useState(() => {
    // Infer current mood from time and recent activity inline
    const hour = new Date().getHours()
    const day = new Date().getDay()

    // Time-based mood inference
    if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) return 'Focus'
    if (hour >= 18 || day === 0 || day === 6) return 'Relax'
    if (hour >= 6 && hour <= 9) return 'Energy'
    return 'Creative'
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Update mood dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      const newMood = inferCurrentMood()
      if (newMood !== currentMood) {
        setCurrentMood(newMood)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [currentMood, inferCurrentMood])

  return (
    <div className="space-y-6">
      {/* Entertainment Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>Choose Your Experience</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Select what type of content you'd like to explore today
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => setActiveSection('games')}
              className={`h-16 flex flex-col justify-center items-center space-y-1.5 relative overflow-hidden transition-all duration-500 group border-0 ${activeSection === 'games'
                ? 'bg-green-500/20 backdrop-blur-xl border border-green-400/30 shadow-lg shadow-green-500/20 dark:shadow-green-400/15'
                : 'bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 hover:bg-green-500/10 hover:border-green-400/20 hover:shadow-md hover:shadow-green-500/10'
                }`}
            >
              <GlowingEffect disabled={false} proximity={120} spread={35} blur={1.5} />

              {/* Liquid glass morphing background */}
              <div className={`absolute inset-0 transition-all duration-700 ease-out ${activeSection === 'games'
                ? 'bg-gradient-to-br from-green-400/30 via-emerald-500/20 to-green-600/30'
                : 'bg-gradient-to-br from-white/5 via-green-500/5 to-white/10 group-hover:from-green-400/10 group-hover:via-emerald-500/10 group-hover:to-green-600/15'
                }`} />

              {/* Animated liquid blob */}
              <div className={`absolute w-32 h-32 -top-8 -left-8 rounded-full transition-all duration-1000 ease-in-out ${activeSection === 'games'
                ? 'bg-green-400/30 blur-xl animate-pulse'
                : 'bg-green-500/10 blur-2xl group-hover:bg-green-400/20 group-hover:scale-110'
                }`} />

              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />

              <Gamepad2 className={`h-5 w-5 transition-all duration-300 group-hover:scale-110 relative z-10 ${activeSection === 'games'
                ? 'text-green-100 drop-shadow-sm filter brightness-110'
                : 'text-green-600 dark:text-green-400 group-hover:text-green-500 dark:group-hover:text-green-300'
                }`} />
              <span className={`text-xs font-semibold transition-all duration-300 relative z-10 ${activeSection === 'games'
                ? 'text-green-50 drop-shadow-sm filter brightness-110'
                : 'text-green-700 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-200'
                }`}>Games</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveSection('videos')}
              className={`h-16 flex flex-col justify-center items-center space-y-1.5 relative overflow-hidden transition-all duration-500 group border-0 ${activeSection === 'videos'
                ? 'bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 shadow-lg shadow-blue-500/20 dark:shadow-blue-400/15'
                : 'bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 hover:bg-blue-500/10 hover:border-blue-400/20 hover:shadow-md hover:shadow-blue-500/10'
                }`}
            >
              <GlowingEffect disabled={false} proximity={120} spread={35} blur={1.5} />

              {/* Liquid glass morphing background */}
              <div className={`absolute inset-0 transition-all duration-700 ease-out ${activeSection === 'videos'
                ? 'bg-gradient-to-br from-blue-400/30 via-cyan-500/20 to-blue-600/30'
                : 'bg-gradient-to-br from-white/5 via-blue-500/5 to-white/10 group-hover:from-blue-400/10 group-hover:via-cyan-500/10 group-hover:to-blue-600/15'
                }`} />

              {/* Animated liquid blob */}
              <div className={`absolute w-32 h-32 -top-8 -right-8 rounded-full transition-all duration-1000 ease-in-out ${activeSection === 'videos'
                ? 'bg-blue-400/30 blur-xl animate-pulse'
                : 'bg-blue-500/10 blur-2xl group-hover:bg-blue-400/20 group-hover:scale-110'
                }`} />

              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />

              <Camera className={`h-5 w-5 transition-all duration-300 group-hover:scale-110 relative z-10 ${activeSection === 'videos'
                ? 'text-blue-100 drop-shadow-sm filter brightness-110'
                : 'text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300'
                }`} />
              <span className={`text-xs font-semibold transition-all duration-300 relative z-10 ${activeSection === 'videos'
                ? 'text-blue-50 drop-shadow-sm filter brightness-110'
                : 'text-blue-700 dark:text-blue-300 group-hover:text-blue-600 dark:group-hover:text-blue-200'
                }`}>Videos</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveSection('music')}
              className={`h-16 flex flex-col justify-center items-center space-y-1.5 relative overflow-hidden transition-all duration-500 group border-0 ${activeSection === 'music'
                ? 'bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 shadow-lg shadow-purple-500/20 dark:shadow-purple-400/15'
                : 'bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 hover:bg-purple-500/10 hover:border-purple-400/20 hover:shadow-md hover:shadow-purple-500/10'
                }`}
            >
              <GlowingEffect disabled={false} proximity={120} spread={35} blur={1.5} />

              {/* Liquid glass morphing background */}
              <div className={`absolute inset-0 transition-all duration-700 ease-out ${activeSection === 'music'
                ? 'bg-gradient-to-br from-purple-400/30 via-pink-500/20 to-purple-600/30'
                : 'bg-gradient-to-br from-white/5 via-purple-500/5 to-white/10 group-hover:from-purple-400/10 group-hover:via-pink-500/10 group-hover:to-purple-600/15'
                }`} />

              {/* Animated liquid blob */}
              <div className={`absolute w-32 h-32 -bottom-8 -left-8 rounded-full transition-all duration-1000 ease-in-out ${activeSection === 'music'
                ? 'bg-purple-400/30 blur-xl animate-pulse'
                : 'bg-purple-500/10 blur-2xl group-hover:bg-purple-400/20 group-hover:scale-110'
                }`} />

              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />

              <Headphones className={`h-5 w-5 transition-all duration-300 group-hover:scale-110 relative z-10 ${activeSection === 'music'
                ? 'text-purple-100 drop-shadow-sm filter brightness-110'
                : 'text-purple-600 dark:text-purple-400 group-hover:text-purple-500 dark:group-hover:text-purple-300'
                }`} />
              <span className={`text-xs font-semibold transition-all duration-300 relative z-10 ${activeSection === 'music'
                ? 'text-purple-50 drop-shadow-sm filter brightness-110'
                : 'text-purple-700 dark:text-purple-300 group-hover:text-purple-600 dark:group-hover:text-purple-200'
                }`}>Music</span>
            </Button>
          </div>

          {/* Dynamic Content Area */}
          {activeSection === 'games' && (
            <GamingSection
              profile={profile}
              userPreferences={userPreferences}
              aiEngine={aiEngine}
              recommendations={personalizedRecommendations?.games}
              addActivityToHistory={addActivityToHistory}
            />
          )}
          {activeSection === 'videos' && (
            <VideoSection
              profile={profile}
              userPreferences={userPreferences}
              aiEngine={aiEngine}
              recommendations={personalizedRecommendations?.videos}
              addActivityToHistory={addActivityToHistory}
            />
          )}
          {activeSection === 'music' && (
            <MusicRecommendations
              userId={profile.id}
              personalityProfile={{
                openness: typeof profile.personality_data?.openness === 'number' ? profile.personality_data.openness : 0.5,
                extraversion: typeof profile.personality_data?.extraversion === 'number' ? profile.personality_data.extraversion : 0.5,
                conscientiousness: typeof profile.personality_data?.conscientiousness === 'number' ? profile.personality_data.conscientiousness : 0.5,
                agreeableness: typeof profile.personality_data?.agreeableness === 'number' ? profile.personality_data.agreeableness : 0.5,
                neuroticism: typeof profile.personality_data?.neuroticism === 'number' ? profile.personality_data.neuroticism : 0.5
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Copy the rest of the components from dashboard (GamingSection, VideoSection, MusicSection)
// I'll include simplified versions here due to space constraints

function GamingSection({
  profile,
  userPreferences,
  aiEngine,
  recommendations,
  addActivityToHistory
}: {
  profile: Profile
  userPreferences: any
  aiEngine: EnhancedAILearningEngine | null
  recommendations?: any[]
  addActivityToHistory: (activity: any) => void
}) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameResults, setGameResults] = useState<any[]>([])
  const [gameStats, setGameStats] = useState<{
    [key: string]: {
      completions?: number
      averageScore?: number
      bestScore?: number
      startTime?: number
      endTime?: number
      attempts?: number
    }
  }>({})

  // Dynamic game library based on user preferences and skill level
  const availableGames = useMemo(() => {
    const baseGames = recommendations || []

    // Filter and sort based on user preferences
    return baseGames
      .filter(game => {
        if (!userPreferences?.favoriteGameTypes) return true
        return userPreferences.favoriteGameTypes.includes(game.category.toLowerCase())
      })
      .sort((a, b) => {
        // Prioritize based on recommendations and popularity
        if (recommendations?.some(r => r.type === a.category.toLowerCase())) return -1
        if (recommendations?.some(r => r.type === b.category.toLowerCase())) return 1
        return b.popularity - a.popularity
      })
  }, [userPreferences, recommendations])

  const handleGameComplete = useCallback(async (gameData: any) => {
    // Enhanced game completion handling
    const enhancedData = {
      ...gameData,
      userId: profile.id,
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - (gameStats[gameData.gameId]?.startTime || Date.now())
    }

    setGameResults(prev => [...prev, enhancedData])
    setSelectedGame(null)

    // Update activity stats - track game completion
    try {
      const gameNames: Record<string, string> = {
        'puzzle_master': 'Puzzle Master',
        'memory_palace': 'Memory Palace',
        'color_symphony': 'Color Symphony'
      };

      await fetch('/api/activity-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'increment_game',
          data: { gameName: gameNames[gameData.gameId] || gameData.gameId }
        })
      });
    } catch (statsError) {
      console.error('Failed to update game stats:', statsError);
    }

    // Add to main activity history for stats dashboard
    const activityData = {
      type: 'game',
      name: gameData.gameId,
      duration: enhancedData.sessionDuration / 1000, // Convert to seconds
      timestamp: enhancedData.timestamp,
      performance: gameData.performance,
      completionRate: gameData.completionRate
    }
    addActivityToHistory(activityData)

    // Update game stats
    setGameStats(prev => ({
      ...prev,
      [gameData.gameId]: {
        ...prev[gameData.gameId],
        completions: (prev[gameData.gameId]?.completions || 0) + 1,
        averageScore: calculateAverageScore(prev[gameData.gameId], gameData),
        bestScore: Math.max(prev[gameData.gameId]?.bestScore || 0, gameData.completionRate),
        endTime: Date.now()
      }
    }))

    // Send to AI engine for analysis
    if (aiEngine) {
      await aiEngine.addGameplayData(enhancedData)
    }
  }, [profile.id, gameStats, aiEngine, addActivityToHistory])

  const startGame = useCallback((gameId: string) => {
    setSelectedGame(gameId)
    setGameStats(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        startTime: Date.now(),
        attempts: (prev[gameId]?.attempts || 0) + 1
      }
    }))
  }, [])

  const calculateAverageScore = (existingStats: any, newData: any) => {
    if (!existingStats?.averageScore) return newData.completionRate
    const totalGames = existingStats.completions || 0
    return ((existingStats.averageScore * totalGames) + newData.completionRate) / (totalGames + 1)
  }

  const selectedGameData = availableGames.find(game => game.id === selectedGame)

  if (selectedGame && selectedGameData) {
    const GameComponent = selectedGameData.component
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Playing: {selectedGameData.name}</h3>
          <Button variant="outline" onClick={() => setSelectedGame(null)}>
            Back to Games
          </Button>
        </div>
        <GameComponent onGameComplete={handleGameComplete} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Game Performance Summary */}
      {Object.keys(gameStats).length > 0 && (
        <Card className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Your Gaming Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(gameStats).map(([gameId, stats]: [string, any]) => {
                const game = availableGames.find(g => g.id === gameId)
                return (
                  <div key={gameId} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{game?.icon}</span>
                      <span className="font-medium text-sm">{game?.name}</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Games: {stats.completions || 0}</div>
                      <div>Best: {stats.bestScore || 0}%</div>
                      <div>Avg: {Math.round(stats.averageScore || 0)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {availableGames.map((game) => {
          const stats = gameStats[game.id]
          const isRecommended = recommendations?.some(r => r.games?.includes(game.id))

          return (
            <Card key={game.id} className={`p-4 hover:shadow-md transition-shadow cursor-pointer relative ${isRecommended ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/10' : ''
              }`}>
              <GlowingEffect disabled={false} proximity={150} spread={40} blur={2} />

              {/* Recommendation Badge */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2 z-20">
                  <Badge className="bg-green-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl">
                    {game.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{game.name}</h4>
                      {game.recentPlays && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {game.recentPlays}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {game.insights.map((insight: any, index: any) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {insight}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {game.duration}
                      </span>
                      <span>Difficulty: {game.difficulty}</span>
                      <span>❤️ {game.popularity}%</span>
                      {stats && (
                        <span className="text-green-600 dark:text-green-400">
                          Best: {stats.bestScore}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={() => startGame(game.id)} className="flex-shrink-0">
                  <Play className="h-4 w-4 mr-2" />
                  {stats?.completions ? 'Play Again' : 'Play'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function VideoSection({
  profile,
  userPreferences,
  aiEngine,
  recommendations,
  addActivityToHistory
}: {
  profile: Profile
  userPreferences: any
  aiEngine: EnhancedAILearningEngine | null
  recommendations?: any[]
  addActivityToHistory: (activity: any) => void
}) {
  const [personalityProfile, setPersonalityProfile] = useState<any>(null)
  const [videoInteractions, setVideoInteractions] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('educational')
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({})
  const [watchHistory, setWatchHistory] = useState<any[]>([])

  const availableVideos = recommendations || [];

  // Video categories
  const categories = useMemo(() => {
    if (!availableVideos) return [];
    const allCategories = availableVideos.map(v => v.category_name);
    const uniqueCategories = [...new Set(allCategories)];
    return uniqueCategories.map(c => ({ id: c, name: c, icon: '🎬' }));
  }, [availableVideos]);

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  // Get personality profile on component mount
  useEffect(() => {
    const fetchPersonalityProfile = async () => {
      try {
        // This would typically come from your personality assessment
        // For now, using default values
        const defaultProfile = {
          openness: 0.7,
          conscientiousness: 0.6,
          extraversion: 0.5,
          agreeableness: 0.8,
          neuroticism: 0.3
        }
        setPersonalityProfile(defaultProfile)
      } catch (error) {
        console.error('Error fetching personality profile:', error)
      }
    }

    fetchPersonalityProfile()
  }, [profile.id])

  const handleVideoInteraction = useCallback(async (video: any, interaction: string) => {
    const interactionData = {
      video_id: video.id,
      interaction_type: interaction,
      video_title: video.title,
      category: video.category_name,
      timestamp: new Date().toISOString(),
      personality_score: video.personality_score,
      rl_score: video.rl_score
    }

    setVideoInteractions(prev => [...prev, interactionData])

    // Add to main activity history for stats dashboard
    const activityData = {
      type: 'video',
      name: video.title,
      duration: interaction === 'watch' ? video.duration_seconds : 0,
      timestamp: interactionData.timestamp,
      category: video.category_name,
      interaction: interaction
    }
    addActivityToHistory(activityData)

    // Send to AI engine for learning
    if (aiEngine) {
      await aiEngine.addVideoData({
        contentId: video.id,
        watchTime: interaction === 'watch' ? video.duration_seconds * 0.8 : 0,
        completionRate: interaction === 'watch' ? 80 : interaction === 'like' ? 100 : 0,
        interactions: [interaction],
        category: video.category_name
      })
    }
  }, [aiEngine, addActivityToHistory])

  return (
    <div className="space-y-4">
      {/* Video Interaction Summary */}
      {videoInteractions.length > 0 && (
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Your Video Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {videoInteractions.filter(i => i.interaction_type === 'watch').length}
                </div>
                <div className="text-sm text-muted-foreground">Videos Watched</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {videoInteractions.filter(i => i.interaction_type === 'like').length}
                </div>
                <div className="text-sm text-muted-foreground">Videos Liked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(videoInteractions.reduce((acc, i) => acc + (i.personality_score || 0), 0) / Math.max(videoInteractions.length, 1) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Match Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {new Set(videoInteractions.map(i => i.category)).size}
                </div>
                <div className="text-sm text-muted-foreground">Categories Explored</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render VideoRecommendations component here */}
      <VideoRecommendations
        userId={profile.id}
        personalityProfile={personalityProfile}
        onVideoInteraction={handleVideoInteraction}
      />
    </div>
  )
}
