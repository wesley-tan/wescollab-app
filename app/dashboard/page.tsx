'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { EnhancedPostCard } from '@/app/_components/posts/enhanced-post-card'
import { Post } from '@/types/post'

interface User {
  id: string
  email: string
  name?: string
  image?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Check for success messages from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    
    if (success === 'post-created') {
      setSuccessMessage('Post created successfully!')
    } else if (success === 'post-updated') {
      setSuccessMessage('Post updated successfully!')
    } else if (success === 'post-deleted') {
      setSuccessMessage('Post deleted successfully!')
    }

    // Clear the URL parameter
    if (success) {
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [])

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

          // Fetch all posts for the main feed using our enhanced API
          try {
            const response = await fetch('/api/posts?limit=10')
            if (response.ok) {
              const data = await response.json()
              setAllPosts(data.posts || [])
            } else {
              console.error('Error fetching all posts via API')
              setAllPosts([])
            }
          } catch (apiError) {
            console.error('API fetch error:', apiError)
            setAllPosts([])
          }

          // Fetch user's own posts for the sidebar (enhanced query)
          const { data: userPostsData, error: userPostsError } = await supabase
            .from('posts')
            .select(`
              id,
              roleTitle,
              company,
              companyUrl,
              roleType,
              roleDesc,
              contactEmail,
              contactPhone,
              preferredContactMethod,
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setDeleting(postId)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete post')
        return
      }

      // Remove the post from local state
      setUserPosts(prev => prev.filter(post => post.id !== postId))
      setAllPosts(prev => prev.filter(post => post.id !== postId))
      
      setSuccessMessage('Post deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 5000)
      
    } catch (error: any) {
      console.error('Delete post error:', error)
      setError('An unexpected error occurred while deleting the post')
    } finally {
      setDeleting(null)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {user?.image && (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-12 w-12 rounded-full ring-2 ring-primary/10"
                />
              )}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Welcome, {user?.name || 'Fellow Wesleyan'}!
                </h1>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/create-post"
                    className="flex items-center justify-center px-4 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create New Post
                  </Link>
                  <Link
                    href="/my-posts"
                    className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Manage My Posts
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* My Posts Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">My Posts</h2>
                  <Link href="/my-posts" className="text-sm text-primary hover:text-primary/80 font-medium">
                    View All →
                  </Link>
                </div>
                {userPosts.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-4">No posts yet</p>
                    <Link
                      href="/create-post"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Create First Post
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{post.roleTitle}</h4>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-1">{post.company}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{formatDate(post.createdAt)}</span>
                          <div className="flex gap-3">
                            <Link
                              href={`/edit-post/${post.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={deleting === post.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
                            >
                              {deleting === post.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Opportunities</span>
                    <span className="font-semibold text-gray-900">{allPosts.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Your Posts</span>
                    <span className="font-semibold text-gray-900">{userPosts.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Latest Opportunities</h2>
                <p className="text-gray-600">
                  Discover venture opportunities with enhanced one-click contact features
                </p>
              </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Posts Grid */}
            {allPosts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="text-center py-16">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Be the first to share an opportunity with the Wesleyan community!
                  </p>
                  <Link
                    href="/create-post"
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create First Post
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6">
                  {allPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                      <div className="p-6">
                        <EnhancedPostCard 
                          post={post} 
                          showActions={true}
                          compact={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* View More Link */}
                <div className="text-center py-8">
                  <Link
                    href="/opportunities"
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors gap-2 font-medium"
                  >
                    <span>View All Opportunities</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 