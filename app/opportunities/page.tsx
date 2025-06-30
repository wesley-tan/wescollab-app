'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

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
  }
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

export default function OpportunitiesPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const supabase = createSupabaseClient()
        
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select(`
            id,
            roleTitle,
            company,
            roleType,
            roleDesc,
            contactDetails,
            createdAt,
            profiles (
              name,
              email
            )
          `)
          .eq('isDeleted', false)
          .order('createdAt', { ascending: false })

        if (fetchError) {
          console.error('Error fetching posts:', fetchError)
          setError('Failed to load opportunities')
          return
        }

        setPosts(data || [])
      } catch (error) {
        console.error('Fetch posts error:', error)
        setError('Failed to load opportunities')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

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
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto pt-8 px-4">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading opportunities...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto pt-8 pb-16 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Browse Opportunities</h1>
              <p className="text-muted-foreground mt-2">
                Discover venture opportunities shared by the Wesleyan community
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Dashboard
            </Link>
          </div>
          
          {/* Stats */}
          <div className="mt-6 p-4 bg-card border rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{posts.length}</span> opportunities available
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-foreground mb-2">No opportunities yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share an opportunity with the Wesleyan community!
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Sign In to Post
              </Link>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
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
                    <span>Posted by {post.profiles?.name || 'Wesleyan Community'}</span>
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

        {/* Call to Action */}
        {posts.length > 0 && (
          <div className="mt-12 text-center bg-card border rounded-lg p-8">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Have an opportunity to share?
            </h3>
            <p className="text-muted-foreground mb-4">
              Join the community and help fellow Wesleyan students discover amazing opportunities.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Sign In to Post
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>WesCollab - Connecting the Wesleyan community through venture opportunities</p>
        </div>
      </div>
    </div>
  )
} 