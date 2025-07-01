'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { EnhancedPostCard } from '@/app/_components/posts/enhanced-post-card'
import { Post } from '@/types/post'
import { useRouter, useSearchParams } from 'next/navigation'
import debounce from 'lodash/debounce'

const roleTypeLabels = {
  'INTERNSHIP': 'Internship',
  'FULL_TIME': 'Full-time',
  'PART_TIME': 'Part-time',
  'COLLABORATIVE_PROJECT': 'Collaborative Project',
  'VOLUNTEER': 'Volunteer',
  'RESEARCH': 'Research'
}

export default function OpportunitiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [roleTypeFilter, setRoleTypeFilter] = useState(searchParams.get('roleType') || 'all')
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false
  })

  // Create a debounced version of the fetch function
  const debouncedFetch = useCallback(
    debounce(async (searchTerm: string, roleType: string) => {
      try {
        setLoading(true)
        
        // Update URL without page reload
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (roleType !== 'all') params.set('roleType', roleType)
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
        window.history.pushState({}, '', newUrl)
        
        // Use our enhanced API endpoint with search and filtering
        const apiParams = new URLSearchParams({
          page: '1',
          limit: '20'
        })
        
        if (searchTerm.trim()) {
          apiParams.set('search', searchTerm.trim())
        }
        
        if (roleType !== 'all') {
          apiParams.set('roleType', roleType)
        }

        const response = await fetch(`/api/posts?${apiParams}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }
        
        const data = await response.json()
        
        setPosts(data.posts || [])
        setPagination({
          page: data.pagination?.page || 1,
          total: data.pagination?.total || 0,
          hasMore: data.pagination?.hasMore || false
        })
        
      } catch (error) {
        console.error('Fetch posts error:', error)
        setError('Failed to load opportunities')
      } finally {
        setLoading(false)
      }
    }, 300), // 300ms delay
    [] // Empty dependency array since we don't want to recreate the debounced function
  )

  // Effect to handle search and filter changes
  useEffect(() => {
    debouncedFetch(search, roleTypeFilter)
    
    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedFetch.cancel()
    }
  }, [search, roleTypeFilter, debouncedFetch])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  // Handle role type filter change
  const handleRoleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleTypeFilter(e.target.value)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setRoleTypeFilter('all')
    // Update URL without page reload
    window.history.pushState({}, '', window.location.pathname)
  }

  if (loading && posts.length === 0) {
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
          
          {/* Search and Filters */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              {/* Role Type Filter */}
              <div>
                <select
                  value={roleTypeFilter}
                  onChange={handleRoleTypeChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="INTERNSHIP">Internships</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="COLLABORATIVE_PROJECT">Projects</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="RESEARCH">Research</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6 p-4 bg-card border rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{pagination.total}</span> opportunities available
                {search && <span> (filtered by "{search}")</span>}
                {roleTypeFilter !== 'all' && <span> • {roleTypeLabels[roleTypeFilter as keyof typeof roleTypeLabels]} only</span>}
              </p>
              {(search || roleTypeFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
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
                className="
                  inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg 
                  hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl
                "
              >
                <span aria-hidden="true">✨</span>
                Sign In to Post
              </Link>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 && (
          <div className="space-y-6">
            {/* Posts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <div key={post.id} className="h-full">
                  <EnhancedPostCard 
                    post={post} 
                    className="h-full hover:shadow-md transition-shadow duration-200"
                  />
                </div>
              ))}
            </div>

            {/* Have an opportunity? */}
            <div className="mt-12 text-center py-8 border-t">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Have an opportunity to share?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join the community and help fellow Wesleyan students discover amazing opportunities.
                </p>
                <Link
                  href="/auth/signin"
                  className="
                    inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg 
                    hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl
                  "
                >
                  <span aria-hidden="true">✨</span>
                  Sign In to Post
                </Link>
              </div>
            </div>
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