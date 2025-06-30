'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name?: string
  image?: string
}

interface Post {
  id: string
  roleTitle: string
  company: string
  roleType: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'
  roleDesc: string
  contactDetails: string
  createdAt: string
  profiles: {
    name: string | null
    email: string
  }[]
}

const roleTypeLabels = {
  'INTERNSHIP': 'Internship',
  'FULL_TIME': 'Full-time',
  'PART_TIME': 'Part-time',
  'COLLABORATIVE_PROJECT': 'Collaborative Project',
  'VOLUNTEER': 'Volunteer',
  'RESEARCH': 'Research'
}

const roleTypeColors = {
  'INTERNSHIP': 'bg-blue-100 text-blue-800',
  'FULL_TIME': 'bg-green-100 text-green-800',
  'PART_TIME': 'bg-yellow-100 text-yellow-800',
  'COLLABORATIVE_PROJECT': 'bg-purple-100 text-purple-800',
  'VOLUNTEER': 'bg-pink-100 text-pink-800',
  'RESEARCH': 'bg-indigo-100 text-indigo-800'
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const supabaseUser = await getCurrentUser()
        
        if (!supabaseUser) {
          window.location.href = '/auth/signin'
          return
        }

        const supabase = createSupabaseClient()
        
        // Get user data from our database
        const { data: dbUser, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('googleId', supabaseUser.id)
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          setError('Failed to load user data')
          return
        }

        if (dbUser) {
          setUser({
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || undefined,
            image: dbUser.image || undefined
          })

          // Fetch all posts for the main feed
          const { data: allPostsData, error: allPostsError } = await supabase
            .from('posts')
            .select(`
              id,
              roleTitle,
              company,
              roleType,
              roleDesc,
              contactDetails,
              createdAt,
              profiles!inner (
                name,
                email
              )
            `)
            .eq('isDeleted', false)
            .order('createdAt', { ascending: false })

          if (allPostsError) {
            console.error('Error fetching all posts:', allPostsError)
          } else {
            setAllPosts(allPostsData || [])
          }

          // Fetch user's own posts for the sidebar
          const { data: userPostsData, error: userPostsError } = await supabase
            .from('posts')
            .select(`
              id,
              roleTitle,
              company,
              roleType,
              roleDesc,
              contactDetails,
              createdAt,
              profiles!inner (
                name,
                email
              )
            `)
            .eq('userId', dbUser.id)
            .eq('isDeleted', false)
            .order('createdAt', { ascending: false })

          if (userPostsError) {
            console.error('Error fetching user posts:', userPostsError)
          } else {
            setUserPosts(userPostsData || [])
          }
        }
      } catch (error: any) {
        console.error('Dashboard load error:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error: any) {
      console.error('Sign out error:', error)
      setError('Failed to sign out')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <p className="text-red-800"><strong>Error:</strong> {error}</p>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {user?.image && (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-primary">
                  Welcome, {user?.name || 'Fellow Wesleyan'}!
                </h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Personal Management */}
        <div className="lg:col-span-1 space-y-6">
          {/* My Posts */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">My Posts</h2>
            {userPosts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No posts yet</p>
                <Link
                  href="/create-post"
                  className="inline-block px-3 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90"
                >
                  Create First Post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {userPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="border rounded p-3">
                    <h4 className="font-medium text-sm line-clamp-1">{post.roleTitle}</h4>
                    <p className="text-xs text-muted-foreground">{post.company}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(post.createdAt)}</p>
                  </div>
                ))}
                {userPosts.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{userPosts.length - 3} more posts
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/create-post"
                className="block w-full px-3 py-2 bg-primary text-white text-sm text-center rounded hover:bg-primary/90"
              >
                Create New Post
              </Link>
              <Link
                href="/profile"
                className="block w-full px-3 py-2 border border-gray-300 text-sm text-center rounded hover:bg-gray-50"
              >
                Edit Profile
              </Link>
              <Link
                href="/opportunities"
                className="block w-full px-3 py-2 border border-gray-300 text-sm text-center rounded hover:bg-gray-50"
              >
                View All Opportunities
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Community Stats</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Opportunities:</span>
                <span className="font-medium">{allPosts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Posts:</span>
                <span className="font-medium">{userPosts.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Opportunities Feed */}
        <div className="lg:col-span-3">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Latest Opportunities</h2>
            <p className="text-muted-foreground">
              Discover venture opportunities shared by the Wesleyan community
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {allPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">No opportunities yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share an opportunity with the Wesleyan community!
                </p>
                <Link
                  href="/create-post"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Create First Post
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {allPosts.map((post) => (
                <div key={post.id} className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                        {post.roleTitle}
                      </h3>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${roleTypeColors[post.roleType]}`}>
                        {roleTypeLabels[post.roleType]}
                      </span>
                    </div>
                    <p className="text-primary font-medium">{post.company}</p>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {post.roleDesc}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Posted by {post.profiles?.[0]?.name || 'Wesleyan Community'}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Contact:</p>
                      <p className="text-sm text-foreground font-medium break-all">
                        {post.contactDetails}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 