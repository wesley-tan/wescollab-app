'use client'

import { Post } from '@/types/post'

interface ContactActionsProps {
  post: Post
}

export function ContactActions({ post }: ContactActionsProps) {
  return (
    <div className="space-y-3">
      {/* Email (Required) */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 min-w-[4.5rem]">Email:</span>
        <a 
          href={`mailto:${post.contactEmail}`}
          className="text-primary hover:text-primary/80 font-medium"
        >
          {post.contactEmail}
        </a>
      </div>

      {/* Website Link */}
      {post.companyUrl && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500 min-w-[4.5rem]">Website:</span>
          <a
            href={post.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Visit Organization
          </a>
        </div>
      )}

      {/* Phone Number (Optional) */}
      {post.contactPhone && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500 min-w-[4.5rem]">Number:</span>
          <span className="font-medium text-gray-700">{post.contactPhone}</span>
        </div>
      )}
    </div>
  )
} 