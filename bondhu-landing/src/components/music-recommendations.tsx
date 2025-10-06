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

    // Fetch available genres on mount
    useEffect(() => {
        fetchAvailableGenres()
    }, [])

    // Auto-select all 6 genres initially
    useEffect(() => {
        if (availableGenres.length > 0 && selectedGenres.length === 0) {
            setSelectedGenres(availableGenres)
        }
    }, [availableGenres])

    // Fetch recommendations when genres selected
    useEffect(() => {
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

            // Reset manual refresh count daily
            const lastManualReset = localStorage.getItem(`music_manual_reset_${userId}`)
            if (lastManualReset !== today) {
                setManualRefreshCount(0)
                localStorage.setItem(`music_manual_reset_${userId}`, today)
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
            const response = await apiClient.get('/agents/music/genres') as { genres: string[] }
            setAvailableGenres(response.genres)
        } catch (error) {
            console.error('Error fetching genres:', error)
            toast.error('Failed to load music genres')
        }
    }

    const fetchRecommendations = async (type: 'manual' | 'auto' | 'initial' = 'initial') => {

        // Check manual refresh limit
        if (type === 'manual' && manualRefreshCount >= 3) {
            toast.error('Daily manual refresh limit reached (3/3). Try again tomorrow!')
            return
        }

        setLoading(true)
        try {
            const response = await apiClient.post(`/agents/music/recommendations/${userId}`, {
                spotify_token: spotifyToken || undefined,
                personality_profile: personalityProfile,
                genres: selectedGenres,
                songs_per_genre: 3,
                use_history: Boolean(spotifyToken),
                refresh_salt: Date.now()
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
                toast.success(`Loaded ${Object.keys(response.recommendations).length} genres!`)
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
                feedback_type: feedbackType,
                personality_profile: personalityProfile,
                ...(spotifyToken ? { spotify_token: spotifyToken } : {})
            })

            setFeedbackState(prev => ({ ...prev, [song.id]: feedbackType as 'liked' | 'disliked' }))
            toast.success(`${feedbackType === 'like' ? '👍' : '👎'} Feedback recorded!`)

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

    const connectSpotify = async () => {
        try {
            const response = await apiClient.get(`/agents/music/connect?user_id=${userId}`) as { auth_url: string }
            window.location.href = response.auth_url
        } catch (error: any) {
            toast.error(error.message || 'Failed to connect Spotify')
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
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recommendations">
                        <Music2 className="h-4 w-4 mr-2" />
                        Recommendations
                    </TabsTrigger>
                    <TabsTrigger value="genres">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Genres ({selectedGenres.length})
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
                            <h2 className="text-xl font-semibold">Your Music</h2>
                            {!spotifyToken && (
                                <p className="text-sm text-muted-foreground">
                                    Personality-based recommendations •
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
                                                        {/* Song Info */}
                                                        <div>
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
                                                                disabled={!!feedbackState[song.id]}
                                                                className="flex-1"
                                                            >
                                                                <ThumbsUp className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={feedbackState[song.id] === 'disliked' ? 'destructive' : 'outline'}
                                                                onClick={() => handleFeedback(song, 'dislike')}
                                                                disabled={!!feedbackState[song.id]}
                                                                className="flex-1"
                                                            >
                                                                <ThumbsDown className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => handlePlay(song)}
                                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                            >
                                                                <Play className="h-3 w-3" />
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

                {/* Genres Tab */}
                <TabsContent value="genres" className="space-y-4 mt-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Select 3-6 genres to get personalized recommendations.
                            More selections = more variety!
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableGenres.map(genre => (
                            <Button
                                key={genre}
                                variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                                onClick={() => toggleGenre(genre)}
                                className="h-auto py-3 text-left justify-start"
                            >
                                <div className="flex items-center space-x-2">
                                    {selectedGenres.includes(genre) && (
                                        <Heart className="h-4 w-4" />
                                    )}
                                    <span className="text-sm">{genre}</span>
                                </div>
                            </Button>
                        ))}
                    </div>

                    <Button onClick={() => fetchRecommendations('manual')} className="w-full" disabled={selectedGenres.length === 0}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get Recommendations for {selectedGenres.length} Genres
                    </Button>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-6 mt-6">
                    {rlInsights ? (
                        <>
                            {/* Learning Progress */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Learning Progress</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Training Episodes</div>
                                            <div className="text-2xl font-bold">{rlInsights.training_episodes}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Average Reward</div>
                                            <div className="text-2xl font-bold">
                                                {rlInsights.average_reward.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Exploration Rate</div>
                                            <div className="text-2xl font-bold">
                                                {(rlInsights.epsilon * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

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
