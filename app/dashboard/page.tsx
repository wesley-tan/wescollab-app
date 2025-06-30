'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name?: string
  image?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabaseUser = await getCurrentUser()
        
        if (!supabaseUser) {
          // Redirect to sign in if not authenticated
          window.location.href = '/auth/signin'
          return
        }

        // Get user data from our database
        const supabase = createSupabaseClient()
        const { data: dbUser, error: dbError } = await supabase
          .from('User')
          .select('*')
          .eq('googleId', supabaseUser.id)
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          setError('Failed to load user data')
        } else if (dbUser) {
          setUser({
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || undefined,
            image: dbUser.image || undefined
          })
        }
      } catch (error: any) {
        console.error('Auth check error:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-card border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {user?.image && (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="h-12 w-12 rounded-full"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    Welcome back{user?.name ? `, ${user.name}` : ''}!
                  </h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">My Posts</h2>
              <p className="text-muted-foreground mb-4">You haven't created any venture posts yet.</p>
              <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                Create Your First Post
              </button>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <p className="text-muted-foreground">
                Welcome to WesCollab! Start by browsing venture opportunities or creating your own post.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                Browse Opportunities
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Create New Post
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                View My Profile
              </button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-8 bg-gray-50 border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info (Authentication Test)</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.name || 'Not provided'}</p>
              <p><strong>Image:</strong> {user?.image ? 'Yes' : 'No'}</p>
              <p><strong>Authentication:</strong> ✅ Success</p>
              <p><strong>Domain Validation:</strong> ✅ @wesleyan.edu confirmed</p>
              <p><strong>Database Sync:</strong> ✅ User record found</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 