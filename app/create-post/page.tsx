'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

import { CreatePostForm, RoleType } from '@/types/post'

export default function CreatePostPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState<CreatePostForm>({
    roleTitle: '',
    company: '',
    companyUrl: '',
    roleType: 'INTERNSHIP',
    roleDesc: '',
    contactEmail: '',
    contactPhone: '',
    preferredContactMethod: 'email',
    contactDetails: ''
  })

  const roleTypeOptions = [
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'COLLABORATIVE_PROJECT', label: 'Collaborative Project' },
    { value: 'VOLUNTEER', label: 'Volunteer' },
    { value: 'RESEARCH', label: 'Research' }
  ]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/signin')
          return
        }
        setUser(currentUser)
        
        // Pre-fill contact email with user's email
        setForm(prev => ({
          ...prev,
          contactEmail: currentUser.email || ''
        }))
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const validateForm = (): string | null => {
    if (!form.roleTitle.trim()) return 'Role title is required'
    if (form.roleTitle.length > 200) return 'Role title must be 200 characters or less'
    
    if (!form.company.trim()) return 'Company name is required'
    
    if (form.companyUrl && !/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/.test(form.companyUrl)) {
      return 'Please enter a valid company URL (e.g., https://company.com)'
    }
    
    if (!form.roleDesc.trim()) return 'Role description is required'
    if (form.roleDesc.length > 2000) return 'Role description must be 2000 characters or less'
    
    if (!form.contactEmail.trim()) return 'Contact email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) return 'Please enter a valid email address'
    
    if (form.contactPhone && !/^[\+]?[\d\s\-\(\)\.]{7,}$/.test(form.contactPhone)) {
      return 'Please enter a valid phone number (e.g., +1 (555) 123-4567)'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createSupabaseClient()
      
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({
          userId: user.id,
          roleTitle: form.roleTitle.trim(),
          company: form.company.trim(),
          companyUrl: form.companyUrl.trim() || null,
          roleType: form.roleType,
          roleDesc: form.roleDesc.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim() || null,
          preferredContactMethod: form.preferredContactMethod,
          contactDetails: form.contactDetails.trim()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating post:', insertError)
        setError('Failed to create post. Please try again.')
        return
      }

      // Success! Redirect to dashboard
      router.push('/dashboard?success=post-created')
      
    } catch (error: any) {
      console.error('Create post error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto pt-8 pb-16 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="text-primary hover:text-primary/80 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create New Post</h1>
          <p className="text-muted-foreground mt-2">
            Share a venture opportunity with the Wesleyan community
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Title */}
            <div>
              <label htmlFor="roleTitle" className="block text-sm font-medium text-foreground mb-2">
                Role Title *
              </label>
              <input
                type="text"
                id="roleTitle"
                name="roleTitle"
                value={form.roleTitle}
                onChange={handleChange}
                placeholder="e.g., Product Intern, Software Developer"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.roleTitle.length}/200 characters
              </p>
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                Company/Organization *
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g., TechCorp, Wesleyan University"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Company URL */}
            <div>
              <label htmlFor="companyUrl" className="block text-sm font-medium text-foreground mb-2">
                Company Website
              </label>
              <input
                type="url"
                id="companyUrl"
                name="companyUrl"
                value={form.companyUrl}
                onChange={handleChange}
                placeholder="https://company.com"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Add your company's website for more visibility
              </p>
            </div>

            {/* Role Type */}
            <div>
              <label htmlFor="roleType" className="block text-sm font-medium text-foreground mb-2">
                Role Type *
              </label>
              <select
                id="roleType"
                name="roleType"
                value={form.roleType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                {roleTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Description */}
            <div>
              <label htmlFor="roleDesc" className="block text-sm font-medium text-foreground mb-2">
                Role Description *
              </label>
              <textarea
                id="roleDesc"
                name="roleDesc"
                value={form.roleDesc}
                onChange={handleChange}
                placeholder="Describe the role, responsibilities, requirements, and any other relevant details..."
                rows={6}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.roleDesc.length}/2000 characters
              </p>
            </div>

            {/* Contact Information Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Contact Information</h3>
              
              {/* Contact Email */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-foreground mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Add a phone number for direct contact
                  </p>
                </div>

                {/* Preferred Contact Method */}
                <div>
                  <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-foreground mb-2">
                    Preferred Contact Method *
                  </label>
                  <select
                    id="preferredContactMethod"
                    name="preferredContactMethod"
                    value={form.preferredContactMethod}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="email">Email Only</option>
                    <option value="phone">Phone Only</option>
                    <option value="both">Both Email and Phone</option>
                  </select>
                </div>

                {/* Additional Contact Details */}
                <div>
                  <label htmlFor="contactDetails" className="block text-sm font-medium text-foreground mb-2">
                    Additional Contact Instructions
                  </label>
                  <textarea
                    id="contactDetails"
                    name="contactDetails"
                    value={form.contactDetails}
                    onChange={handleChange}
                    placeholder="Add any specific instructions for contacting you (e.g., preferred contact hours, application process)..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Post...' : 'Create Post'}
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 