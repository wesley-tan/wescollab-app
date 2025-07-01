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

export function DashboardContent() {
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

          // Fetch user's own posts for the sidebar
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center justify-between">
            <p>{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center justify-between">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/create-post"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Create Post
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 border border-input rounded-md hover:bg-muted"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Opportunities</h2>
              {allPosts.length === 0 ? (
                <p className="text-muted-foreground">No opportunities posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {allPosts.map(post => (
                    <EnhancedPostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Posts</h2>
              {userPosts.length === 0 ? (
                <p className="text-muted-foreground">You haven't created any posts yet.</p>
              ) : (
                <div className="space-y-4">
                  {userPosts.map(post => (
                    <div key={post.id} className="relative">
                      <EnhancedPostCard post={post} />
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          href={`/edit-post/${post.id}`}
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deleting === post.id}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deleting === post.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 