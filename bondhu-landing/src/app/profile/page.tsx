"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ArrowLeft, User, Mail, Edit3, Save, X } from "lucide-react"
import type { Profile } from "@/types/auth"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()
    const supabase = createClient()

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
                setEditName(profileData.full_name || "")
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        getProfile()
    }, [supabase, router])

    const handleSaveName = async () => {
        if (!profile || !editName.trim()) return

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: editName.trim() })
                .eq('id', profile.id)

            if (error) {
                console.error('Error updating profile:', error)
                return
            }

            setProfile({ ...profile, full_name: editName.trim() })
            setIsEditing(false)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setEditName(profile?.full_name || "")
        setIsEditing(false)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
                                Back
                            </Button>
                            <Link href="/" className="flex items-center">
                                <Logo width={140} height={50} />
                            </Link>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold text-muted-foreground">Profile</h1>
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
            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
                        <p className="text-muted-foreground">Manage your account information and preferences</p>
                    </div>

                    {/* Profile Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-2xl">
                                        {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                                    <p className="text-muted-foreground">Level 1 Explorer</p>
                                </div>
                            </div>

                            {/* Name Field */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                                {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="name"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="flex-1"
                                        />
                                        <Button onClick={handleSaveName} size="sm" disabled={isSaving}>
                                            {isSaving ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button onClick={handleCancelEdit} size="sm" variant="outline">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                        <span>{profile.full_name || "No name set"}</span>
                                        <Button onClick={() => setIsEditing(true)} size="sm" variant="ghost">
                                            <Edit3 className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                                <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1">{profile.id}</span>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Read only</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Your email address cannot be changed. Contact support if you need assistance.
                                </p>
                            </div>

                            {/* Account Statistics */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">1</p>
                                    <p className="text-sm text-muted-foreground">Current Level</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Member Since</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={() => router.push('/dashboard')}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
