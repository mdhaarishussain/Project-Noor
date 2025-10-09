/**
 * Music Recommendation Component with GenZ Genres & RL Learning
 * Connects to the new music backend API with Spotify integration
 */

"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
    ThumbsUp, ThumbsDown, Play, ExternalLink, RefreshCw,
    Sparkles, Music2, TrendingUp, Heart, BarChart3, Info
} from 'lucide-react'
import { toast } from 'sonner'
import { GlowingEffect } from "@/components/ui/glowing-effect"

interface Song {
    id: string
    name: string
    artists: string[]
    album: string
    album_image?: string
    preview_url?: string
    external_url: string
    duration_ms: number
    popularity: number
    energy?: number
    valence?: number
    danceability?: number
    tempo: number
    genz_genre: string
    personality_match: number
    rl_score?: number
    actions: {
        like: string
        dislike: string
        play: string
    }
}

interface GenreRecommendations {
    [genre: string]: Song[]
}

interface RLInsights {
    training_episodes: number
    average_reward: number
    epsilon: number
    genre_performance: {
        best_genres: Array<{ genre: string; avg_reward: number; count: number }>
        worst_genres: Array<{ genre: string; avg_reward: number; count: number }>
    }
}

interface MusicRecommendationsProps {
    userId: string
    spotifyToken?: string
    personalityProfile: {
        openness: number
        extraversion: number
        conscientiousness: number
        agreeableness: number
        neuroticism: number
    }
}

export default function MusicRecommendations({
    userId,
    spotifyToken,
    personalityProfile
}: MusicRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<GenreRecommendations>({})
    const [availableGenres, setAvailableGenres] = useState<string[]>([])
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [rlInsights, setRLInsights] = useState<RLInsights | null>(null)
    const [feedbackState, setFeedbackState] = useState<Record<string, 'liked' | 'disliked' | null>>({})
    const [spotifyConnected, setSpotifyConnected] = useState(!!spotifyToken)
    const [activeTab, setActiveTab] = useState<string>('recommendations')

    // Refresh tracking state
    const [manualRefreshCount, setManualRefreshCount] = useState(0)
    const [lastAutoRefresh, setLastAutoRefresh] = useState<{ morning?: string, noon?: string, afternoon?: string }>({})
    const [refreshDisabled, setRefreshDisabled] = useState(false)

    // Load feedback state from localStorage on mount
    useEffect(() => {
        const savedFeedback = localStorage.getItem(`music_feedback_${userId}`)
        if (savedFeedback) {
            try {
                setFeedbackState(JSON.parse(savedFeedback))
            } catch (error) {
                console.error('Error loading saved feedback:', error)
            }
        }
    }, [userId])

    // Save feedback state to localStorage whenever it changes
    useEffect(() => {
        if (Object.keys(feedbackState).length > 0) {
            localStorage.setItem(`music_feedback_${userId}`, JSON.stringify(feedbackState))
        }
    }, [feedbackState, userId])

    // Save selected genres to localStorage for browser refresh
    useEffect(() => {
        if (selectedGenres.length > 0) {
            localStorage.setItem(`music_genres_${userId}`, JSON.stringify(selectedGenres))
        }
    }, [selectedGenres, userId])

    // Browser refresh detection and auto-recommendations (separate from genre selection)
    useEffect(() => {
        // Flag to track if this is a browser refresh
        let isBrowserRefresh = false

        // Detect if this is a fresh page load (browser refresh)
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigationEntry && navigationEntry.type === 'reload') {
            isBrowserRefresh = true
        }

        // Only proceed if this is a browser refresh
        if (!isBrowserRefresh) {
            return
        }

        // Wait for genres and Spotify connection to be ready
        const waitForReady = setInterval(() => {
            if (selectedGenres.length > 0 && spotifyConnected !== null) {
                clearInterval(waitForReady)

                // Small delay to ensure everything is initialized
                setTimeout(() => {
                    console.log('Browser refresh detected - fetching fresh recommendations')
                    fetchRecommendations('browser_refresh')
                }, 300)
            }
        }, 100)

        // Cleanup after 5 seconds if still waiting
        const timeout = setTimeout(() => {
            clearInterval(waitForReady)
        }, 5000)

        return () => {
            clearInterval(waitForReady)
            clearTimeout(timeout)
        }
    }, [selectedGenres, spotifyConnected]) // Dependencies for readiness check

    // Fetch available genres and check Spotify connection on mount
    useEffect(() => {
        fetchAvailableGenres()
        checkSpotifyConnection()

        // Handle URL parameters after OAuth callback
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('spotify_connected') === 'true') {
            setSpotifyConnected(true)
            toast.success('🎵 Spotify connected successfully!')
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname)
        } else if (urlParams.get('spotify_error')) {
            const error = urlParams.get('spotify_error')
            toast.error(`Spotify connection failed: ${error}`)
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }, [])

    // Auto-select all 6 genres initially
    useEffect(() => {
        if (availableGenres.length > 0 && selectedGenres.length === 0) {
            setSelectedGenres(availableGenres)
        }
    }, [availableGenres])

    // Fetch recommendations when genres selected (but not on browser refresh)
    useEffect(() => {
        // Check if this is a browser refresh - if so, skip this effect
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const isBrowserRefresh = navigationEntry && navigationEntry.type === 'reload'

        if (isBrowserRefresh) {
            // Let the browser refresh handler deal with it
            return
        }

        if (selectedGenres.length > 0 && spotifyConnected) {
            fetchRecommendations()
        }
    }, [selectedGenres, spotifyConnected])

    // Auto-refresh functionality (morning, noon, afternoon)
    useEffect(() => {
        const checkAutoRefresh = () => {
            const now = new Date()
            const today = now.toDateString()
            const hour = now.getHours()

            // Reset manual refresh count daily at midnight
            const lastManualReset = localStorage.getItem(`music_manual_reset_${userId}`)
            if (lastManualReset !== today) {
                setManualRefreshCount(0)
                setRefreshDisabled(false)
                localStorage.setItem(`music_manual_reset_${userId}`, today)
                localStorage.removeItem(`music_manual_count_${userId}`)
                if (lastManualReset) { // Only show toast if not first time
                    toast.success('🌙 Daily refresh limit reset! (3 refreshes available)')
                }
            }

            // Morning refresh (8-10 AM)
            if (hour >= 8 && hour < 10 && !lastAutoRefresh.morning && selectedGenres.length > 0 && spotifyConnected) {
                const lastMorning = localStorage.getItem(`music_morning_${userId}`)
                if (lastMorning !== today) {
                    fetchRecommendations('auto')
                    setLastAutoRefresh(prev => ({ ...prev, morning: today }))
                    localStorage.setItem(`music_morning_${userId}`, today)
                    toast.success('🌅 Morning music refreshed!')
                }
            }

            // Noon refresh (12-2 PM)
            if (hour >= 12 && hour < 14 && !lastAutoRefresh.noon && selectedGenres.length > 0 && spotifyConnected) {
                const lastNoon = localStorage.getItem(`music_noon_${userId}`)
                if (lastNoon !== today) {
                    fetchRecommendations('auto')
                    setLastAutoRefresh(prev => ({ ...prev, noon: today }))
                    localStorage.setItem(`music_noon_${userId}`, today)
                    toast.success('☀️ Afternoon vibes refreshed!')
                }
            }

            // Afternoon refresh (5-7 PM)
            if (hour >= 17 && hour < 19 && !lastAutoRefresh.afternoon && selectedGenres.length > 0 && spotifyConnected) {
                const lastAfternoon = localStorage.getItem(`music_afternoon_${userId}`)
                if (lastAfternoon !== today) {
                    fetchRecommendations('auto')
                    setLastAutoRefresh(prev => ({ ...prev, afternoon: today }))
                    localStorage.setItem(`music_afternoon_${userId}`, today)
                    toast.success('🌆 Evening sounds refreshed!')
                }
            }
        }

        // Check immediately and then every 30 minutes
        checkAutoRefresh()
        const interval = setInterval(checkAutoRefresh, 30 * 60 * 1000)

        // Load stored refresh counts
        const storedManualCount = localStorage.getItem(`music_manual_count_${userId}`)
        const today = new Date().toDateString()
        const lastReset = localStorage.getItem(`music_manual_reset_${userId}`)

        if (lastReset === today && storedManualCount) {
            const count = parseInt(storedManualCount, 10)
            setManualRefreshCount(count)
            setRefreshDisabled(count >= 3)
        }

        return () => clearInterval(interval)
    }, [selectedGenres, spotifyConnected, lastAutoRefresh, userId])

    const getNextAutoRefreshTime = () => {
        const now = new Date()
        const hour = now.getHours()
        const today = now.toDateString()

        const hasHadMorning = localStorage.getItem(`music_morning_${userId}`) === today
        const hasHadNoon = localStorage.getItem(`music_noon_${userId}`) === today
        const hasHadAfternoon = localStorage.getItem(`music_afternoon_${userId}`) === today

        // Morning (8-10 AM)
        if (!hasHadMorning && hour < 10) {
            if (hour < 8) return `${8 - hour}h ${60 - now.getMinutes()}m`
            return 'Available now (Morning)'
        }

        // Noon (12-2 PM)
        if (!hasHadNoon && hour < 14) {
            if (hour < 12) return `${12 - hour}h ${60 - now.getMinutes()}m`
            return 'Available now (Noon)'
        }

        // Afternoon (5-7 PM)
        if (!hasHadAfternoon && hour < 19) {
            if (hour < 17) return `${17 - hour}h ${60 - now.getMinutes()}m`
            return 'Available now (Afternoon)'
        }

        // Next morning
        const hoursUntilMorning = hour >= 8 ? 24 - hour + 8 : 8 - hour
        return `${hoursUntilMorning}h (Next morning)`
    }

    const fetchAvailableGenres = async () => {
        try {
            // Fetch genres with personality ordering
            const response = await apiClient.post('/agents/music/genres', {
                user_id: userId,
                personality_profile: personalityProfile
            }) as { genres: string[], sorted_by_personality: boolean }

            setAvailableGenres(response.genres)

            if (response.sorted_by_personality) {
                console.log('Genres sorted by personality match')
            }
        } catch (error) {
            console.error('Error fetching genres:', error)
            toast.error('Failed to load music genres')
        }
    }

    const fetchRecommendations = async (type: 'manual' | 'auto' | 'initial' | 'browser_refresh' = 'initial') => {

        // Check manual refresh limit (but allow browser refreshes)
        if (type === 'manual' && manualRefreshCount >= 3) {
            toast.error('Daily manual refresh limit reached (3/3). Try again tomorrow!')
            return
        }

        setLoading(true)
        try {
            // Generate unique refresh salt for each call to ensure fresh recommendations
            const refreshSalt = Date.now() + Math.random() * 1000

            const response = await apiClient.post(`/agents/music/recommendations/${userId}`, {
                spotify_token: spotifyToken || undefined,
                personality_profile: personalityProfile,
                genres: selectedGenres,
                songs_per_genre: 3,
                use_history: Boolean(spotifyToken),
                refresh_salt: refreshSalt
            }) as { recommendations: GenreRecommendations }

            setRecommendations(response.recommendations)

            // Update manual refresh count and storage
            if (type === 'manual') {
                const newCount = manualRefreshCount + 1
                setManualRefreshCount(newCount)
                setRefreshDisabled(newCount >= 3)
                localStorage.setItem(`music_manual_count_${userId}`, newCount.toString())
                toast.success(`🎵 Refreshed! (${newCount}/3 daily manual refreshes used)`)
            } else if (type === 'initial') {
                const mode = spotifyConnected ? 'personalized + history-based' : 'personality-only'
                toast.success(`🎵 ${Object.keys(response.recommendations).length} genres loaded (${mode} mode)!`)
            } else if (type === 'browser_refresh') {
                const mode = spotifyConnected ? 'personalized + history' : 'personality-based'
                toast.success(`🔄 Fresh ${mode} recommendations!`)
            }
        } catch (error: any) {
            console.error('Error fetching recommendations:', error)
            toast.error(error.message || 'Failed to load recommendations')
        } finally {
            setLoading(false)
        }
    }

    const fetchRLInsights = async () => {
        if (!spotifyToken) return

        try {
            const response = await apiClient.get(
                `/agents/music/insights/${userId}?spotify_token=${spotifyToken}`
            ) as { rl_statistics: any, genre_insights: any }
            setRLInsights({
                ...response.rl_statistics,
                genre_performance: response.genre_insights
            })
        } catch (error) {
            console.error('Error fetching RL insights:', error)
        }
    }

    const handleFeedback = async (song: Song, feedbackType: 'like' | 'dislike') => {
        try {
            // Check if we're toggling off the same feedback
            const currentFeedback = feedbackState[song.id]
            const isToggleOff = currentFeedback === (feedbackType === 'like' ? 'liked' : 'disliked')

            await apiClient.post(`/agents/music/feedback/${userId}`, {
                song_data: {
                    id: song.id,
                    name: song.name,
                    genre: song.genz_genre,
                    energy: song.energy,
                    valence: song.valence,
                    tempo: song.tempo,
                    danceability: song.danceability
                },
                feedback_type: isToggleOff ? 'neutral' : feedbackType,
                personality_profile: personalityProfile,
                ...(spotifyToken ? { spotify_token: spotifyToken } : {})
            })

            // Update state - null if toggling off, otherwise set the feedback
            setFeedbackState(prev => ({
                ...prev,
                [song.id]: isToggleOff ? null : (feedbackType as 'liked' | 'disliked')
            }))

            if (isToggleOff) {
                toast.success('🔄 Feedback removed!')
            } else {
                toast.success(`${feedbackType === 'like' ? '👍' : '👎'} Feedback recorded!`)
            }

            // Refresh insights
            fetchRLInsights()
        } catch (error: any) {
            toast.error(error.message || 'Failed to record feedback')
        }
    }

    const handlePlay = (song: Song) => {
        // Record play action (send even without Spotify token for RL)
        apiClient.post(`/agents/music/feedback/${userId}`, {
            song_data: {
                id: song.id,
                name: song.name,
                genre: song.genz_genre,
                energy: song.energy,
                valence: song.valence,
                tempo: song.tempo
            },
            feedback_type: 'play',
            personality_profile: personalityProfile,
            ...(spotifyToken ? { spotify_token: spotifyToken } : {})
        }).catch(console.error)

        // Open Spotify
        window.open(song.external_url, '_blank')
    }

    const checkSpotifyConnection = async () => {
        if (spotifyToken) {
            setSpotifyConnected(true)
            return
        }

        try {
            // Check if user has stored Spotify tokens
            const response = await apiClient.get(`/agents/music/status/${userId}`) as {
                connected: boolean
                spotify_user_id?: string
                connected_at?: string
            }

            if (response.connected) {
                setSpotifyConnected(true)
                toast.success('🎵 Spotify connection restored!')
            }
        } catch (error) {
            // No stored connection found, stay disconnected
            console.log('No existing Spotify connection found')
        }
    }

    const connectSpotify = async () => {
        try {
            const response = await apiClient.get(`/agents/music/connect?user_id=${userId}`) as { auth_url: string }
            window.location.href = response.auth_url
        } catch (error: any) {
            toast.error(error.message || 'Failed to connect Spotify')
        }
    }

    const disconnectSpotify = async () => {
        try {
            await apiClient.post(`/agents/music/disconnect/${userId}`)
            setSpotifyConnected(false)
            setRecommendations({})
            setRLInsights(null)

            // Clear all local storage related to Spotify
            localStorage.removeItem(`music_feedback_${userId}`)
            localStorage.removeItem(`music_manual_count_${userId}`)
            localStorage.removeItem(`music_last_reset_${userId}`)

            // Reset feedback state
            setFeedbackState({})

            // Reset refresh counts
            setManualRefreshCount(0)
            setRefreshDisabled(false)

            toast.success('🎵 Spotify disconnected successfully. Connect again to re-authenticate.')
        } catch (error: any) {
            toast.error(error.message || 'Failed to disconnect Spotify')
        }
    }

    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        )
    }

    if (!spotifyConnected) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Music2 className="h-5 w-5" />
                        <span>Connect Spotify</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <Music2 className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">
                                Discover Music Tailored to Your Personality
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Get personalized recommendations across 6 GenZ genres based on your personality.
                                Connect Spotify for enhanced recommendations using your listening history, or continue with personality-based suggestions.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                size="lg"
                                onClick={connectSpotify}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                                <Music2 className="h-5 w-5 mr-2" />
                                Connect Spotify
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                    setSpotifyConnected(true)
                                    toast.success('🎵 Using personality-based recommendations!')
                                    // Immediately load persona-only recommendations
                                    fetchRecommendations('initial')
                                }}
                                className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                                <Sparkles className="h-5 w-5 mr-2" />
                                Continue Without Spotify
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Spotify Connection Status */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                <Music2 className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <div className="font-semibold">
                                    {spotifyToken ? 'Spotify Connected' : 'Personalized Recommendations'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {spotifyToken
                                        ? 'Using your listening history for personalized recommendations'
                                        : 'We got your taste and now we can make it better'
                                    }
                                </div>
                            </div>
                        </div>
                        {spotifyConnected && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={disconnectSpotify}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                Disconnect
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Header Stats */}
            {rlInsights && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {rlInsights.training_episodes}
                                </div>
                                <div className="text-sm text-muted-foreground">Interactions</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {(rlInsights.average_reward * 100).toFixed(0)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Match Score</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {Object.keys(recommendations).length}
                                </div>
                                <div className="text-sm text-muted-foreground">Genres</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                                    {Object.values(recommendations).flat().length}
                                </div>
                                <div className="text-sm text-muted-foreground">Songs</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="recommendations">
                        <Music2 className="h-4 w-4 mr-2" />
                        Recommendations
                    </TabsTrigger>
                    <TabsTrigger value="insights" onClick={fetchRLInsights}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Insights
                    </TabsTrigger>
                </TabsList>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6 mt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-semibold">Your Music</h2>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${spotifyConnected
                                    ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
                                    : 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200'
                                    }`}>
                                    {spotifyConnected ? '🎵 Personalized + History' : '🧠 Personality-Based'}
                                </div>
                            </div>
                            {!spotifyConnected && (
                                <p className="text-sm text-muted-foreground">
                                    AI-powered suggestions based on your personality •
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={connectSpotify}
                                        className="p-0 ml-1 h-auto text-green-600 hover:text-green-700"
                                    >
                                        Connect Spotify for enhanced suggestions
                                    </Button>
                                </p>
                            )}
                            {spotifyConnected && (
                                <p className="text-sm text-muted-foreground">
                                    Smart recommendations using your Spotify history and personality profile
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => fetchRecommendations('manual')}
                                disabled={loading || refreshDisabled}
                                variant="outline"
                                size="sm"
                                className={refreshDisabled ? 'opacity-50' : ''}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {refreshDisabled ? 'Refresh Limit Reached' : `Refresh (${3 - manualRefreshCount}/3 left)`}
                            </Button>
                            {refreshDisabled && (
                                <p className="text-xs text-muted-foreground">
                                    Next auto-refresh in {getNextAutoRefreshTime()}
                                </p>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-4 bg-muted rounded w-3/4"></div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="h-20 bg-muted rounded"></div>
                                            <div className="h-20 bg-muted rounded"></div>
                                            <div className="h-20 bg-muted rounded"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : Object.keys(recommendations).length === 0 ? (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Select genres from the Genres tab to get personalized recommendations
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(recommendations).map(([genre, songs]) => (
                                <div key={genre}>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                                        <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                                        {genre}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {songs.map(song => (
                                            <Card
                                                key={song.id}
                                                className={`relative overflow-hidden transition-all duration-300 ${feedbackState[song.id] === 'liked'
                                                    ? 'ring-2 ring-green-400'
                                                    : feedbackState[song.id] === 'disliked'
                                                        ? 'ring-2 ring-red-400'
                                                        : ''
                                                    }`}
                                            >
                                                <GlowingEffect disabled={false} proximity={150} spread={40} blur={2} />
                                                <CardContent className="p-4 relative z-10">
                                                    <div className="space-y-3">
                                                        {/* Album Artwork */}
                                                        {song.album_image && (
                                                            <div className="flex justify-center">
                                                                <img
                                                                    src={song.album_image}
                                                                    alt={`${song.album} album cover`}
                                                                    className="w-24 h-24 rounded-md object-cover shadow-lg"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Song Info */}
                                                        <div className="text-center">
                                                            <h4 className="font-semibold text-sm line-clamp-1">
                                                                {song.name}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                                {song.artists.join(', ')}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                                                {song.album}
                                                            </p>
                                                        </div>

                                                        {/* Personality Match */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-muted-foreground">Personality Match</span>
                                                                <span className="font-medium">
                                                                    {(song.personality_match * 100).toFixed(0)}%
                                                                </span>
                                                            </div>
                                                            <Progress value={song.personality_match * 100} className="h-1" />
                                                        </div>

                                                        {/* Audio Features */}
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div>
                                                                <div className="text-muted-foreground">Energy</div>
                                                                <div className="font-medium">{typeof song.energy === 'number' ? (song.energy * 100).toFixed(0) + '%' : '—'}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-muted-foreground">Mood</div>
                                                                <div className="font-medium">{typeof song.valence === 'number' ? (song.valence * 100).toFixed(0) + '%' : '—'}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-muted-foreground">Dance</div>
                                                                <div className="font-medium">{typeof song.danceability === 'number' ? (song.danceability * 100).toFixed(0) + '%' : '—'}</div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2 pt-2">
                                                            <Button
                                                                size="sm"
                                                                variant={feedbackState[song.id] === 'liked' ? 'default' : 'outline'}
                                                                onClick={() => handleFeedback(song, 'like')}
                                                                className={`flex-1 transition-all duration-300 ${feedbackState[song.id] === 'liked'
                                                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50 scale-105 border-green-600 ring-2 ring-green-400/30'
                                                                    : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300 hover:scale-105 hover:shadow-md hover:shadow-green-200/50'
                                                                    }`}
                                                            >
                                                                <ThumbsUp className={`h-3 w-3 ${feedbackState[song.id] === 'liked' ? 'fill-current' : ''}`} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={feedbackState[song.id] === 'disliked' ? 'destructive' : 'outline'}
                                                                onClick={() => handleFeedback(song, 'dislike')}
                                                                className={`flex-1 transition-all duration-300 ${feedbackState[song.id] === 'disliked'
                                                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/50 scale-105 border-red-600 ring-2 ring-red-400/30'
                                                                    : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300 hover:scale-105 hover:shadow-md hover:shadow-red-200/50'
                                                                    }`}
                                                            >
                                                                <ThumbsDown className={`h-3 w-3 ${feedbackState[song.id] === 'disliked' ? 'fill-current' : ''}`} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => handlePlay(song)}
                                                                className="flex-1 bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 active:scale-95"
                                                            >
                                                                <Play className="h-3 w-3 fill-current" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>



                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-6 mt-6">
                    {rlInsights ? (
                        <>
                            {/* Session Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>This Session</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {Object.values(feedbackState).filter(f => f === 'liked').length}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Songs Liked</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {Object.values(feedbackState).filter(f => f === 'disliked').length}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Songs Disliked</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {rlInsights.training_episodes}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Interactions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {(rlInsights.average_reward * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Match Score</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recently Liked Songs */}
                            {Object.values(feedbackState).filter(f => f === 'liked').length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recently Liked Songs</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {Object.keys(recommendations).map(genre =>
                                                recommendations[genre]
                                                    .filter(song => feedbackState[song.id] === 'liked')
                                                    .slice(0, 5) // Show max 5 recent likes
                                                    .map(song => (
                                                        <div key={song.id} className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 dark:bg-green-950">
                                                            {song.album_image && (
                                                                <img
                                                                    src={song.album_image}
                                                                    alt={song.album}
                                                                    className="w-12 h-12 rounded object-cover"
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{song.name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {song.artists.join(', ')} • {song.genz_genre}
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                                {(song.personality_match * 100).toFixed(0)}% match
                                                            </Badge>
                                                        </div>
                                                    ))
                                            ).flat()}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Best Genres */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Favorite Genres</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {rlInsights.genre_performance.best_genres.map((genre, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Badge>{idx + 1}</Badge>
                                                    <span className="font-medium">{genre.genre}</span>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <span className="text-muted-foreground">
                                                        {genre.count} interactions
                                                    </span>
                                                    <span className="font-semibold text-green-600">
                                                        {(genre.avg_reward * 100).toFixed(0)}% match
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Learning Progress */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Learning Progress</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-sm text-muted-foreground">Exploration Rate</div>
                                            <div className="text-xl font-bold">
                                                {(rlInsights.epsilon * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {rlInsights.epsilon > 0.3 ? 'Discovering new music' : 'Refining preferences'}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-muted-foreground">Learning Quality</div>
                                            <div className="text-xl font-bold">
                                                {rlInsights.average_reward > 0.5 ? 'Excellent' :
                                                    rlInsights.average_reward > 0.2 ? 'Good' : 'Learning'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Based on your feedback patterns
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-muted-foreground">Recommendation Accuracy</div>
                                            <div className="text-xl font-bold">
                                                {(rlInsights.average_reward * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Improving with each interaction
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Interact with recommendations (like/dislike/play) to see learning insights
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
