'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { EnhancedPostCard } from '@/app/_components/posts/enhanced-post-card'
import { Post } from '@/types/post'

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

export default function MyPostsPage() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const loadUserPosts = async () => {
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

          // Fetch user's posts
          const { data: postsData, error: postsError } = await supabase
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

          if (postsError) {
            console.error('Error fetching posts:', postsError)
            setError('Failed to load posts')
          } else {
            setPosts(postsData || [])
          }
        }
      } catch (error: any) {
        console.error('Load error:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadUserPosts()
  }, [])

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
      setPosts(prev => prev.filter(post => post.id !== postId))
      
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto pt-8 pb-16 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="text-primary hover:text-primary/80 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Posts</h1>
              <p className="text-muted-foreground mt-2">
                Manage all your venture opportunity posts
              </p>
            </div>
            <Link
              href="/create-post"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Create New Post
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Share your first venture opportunity with the Wesleyan community!
              </p>
              <Link
                href="/create-post"
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Create Your First Post
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map(post => (
              <div key={post.id} className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <EnhancedPostCard 
                    post={post} 
                    className="mb-4"
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 justify-end border-t pt-4">
                    <Link
                      href={`/edit-post/${post.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleting === post.id}
                      className={`
                        px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md
                        hover:bg-red-700 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
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
  )
} 