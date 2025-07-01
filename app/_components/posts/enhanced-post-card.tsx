'use client'

import { useState } from 'react'
import { Post } from '@/types/post'
import { ContactActions } from '@/app/_components/posts/contact-actions'

interface EnhancedPostCardProps {
  post: Post
  showActions?: boolean
  compact?: boolean
  className?: string
}

export { EnhancedPostCard, CompactEnhancedPostCard, DetailedPostCard }

const EnhancedPostCard = ({ 
  post, 
  showActions = true, 
  compact = false, 
  className = "" 
}: EnhancedPostCardProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false)
  
  const maxDescLength = compact ? 150 : 300
  const shouldTruncateDesc = post.roleDesc.length > maxDescLength
  const displayDesc = shouldTruncateDesc && !showFullDescription 
    ? post.roleDesc.substring(0, maxDescLength) + '...' 
    : post.roleDesc

  const roleTypeColors = {
    INTERNSHIP: 'bg-blue-100 text-blue-800',
    FULL_TIME: 'bg-green-100 text-green-800', 
    PART_TIME: 'bg-yellow-100 text-yellow-800',
    COLLABORATIVE_PROJECT: 'bg-purple-100 text-purple-800',
    VOLUNTEER: 'bg-pink-100 text-pink-800',
    RESEARCH: 'bg-indigo-100 text-indigo-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                {post.roleTitle}
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{post.company}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleTypeColors[post.roleType] || 'bg-gray-100 text-gray-800'}`}>
                {post.roleType.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(post.createdAt)}
              </span>
            </div>
          </div>

          {/* Description */}
          {post.roleDesc && (
            <div className="mt-4">
              <p className="text-gray-600 leading-relaxed">
                {displayDesc}
              </p>
              {shouldTruncateDesc && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary hover:text-primary/80 text-sm mt-2 font-medium"
                  type="button"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact Section */}
        {showActions && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
            <ContactActions post={post} />
          </div>
        )}
      </div>
    </div>
  )
}

const CompactEnhancedPostCard = ({ post, className = "" }: { post: Post, className?: string }) => {
  return (
    <EnhancedPostCard 
      post={post} 
      compact={true} 
      className={className}
    />
  )
}

const DetailedPostCard = ({ post, className = "" }: { post: Post, className?: string }) => {
  return (
    <EnhancedPostCard 
      post={post} 
      showActions={true}
      compact={false}
      className={className}
    />
  )
} 