'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  
  const [editForm, setEditForm] = useState({
    name: '',
    image: ''
  })

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/signin')
          return
        }

        // Load profile from database
        const supabase = createSupabaseClient()
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (profileError) {
          console.error('Error loading profile:', profileError)
          setError('Failed to load profile')
          return
        }

        setProfile(profileData)
        setEditForm({
          name: profileData.name || '',
          image: profileData.image || ''
        })
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadProfile()
  }, [router])

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createSupabaseClient()
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: editForm.name.trim() || null,
          image: editForm.image.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        setError('Failed to update profile. Please try again.')
        return
      }

      setProfile(data)
      setEditing(false)
      setSuccess('Profile updated successfully!')
    } catch (error: any) {
      console.error('Update profile error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        image: profile.image || ''
      })
    }
    setEditing(false)
    setError(null)
    setSuccess(null)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error: any) {
      console.error('Sign out error:', error)
      setError('Failed to sign out')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
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
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Profile not found</h2>
          <p className="text-muted-foreground mb-4">Unable to load your profile information.</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Back to Dashboard
          </Link>
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
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          {/* Profile Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                {profile.image ? (
                  <img 
                    src={profile.image} 
                    alt={profile.name || 'Profile'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show fallback
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <span className="text-2xl font-semibold text-primary fallback">
                    {(profile.name || profile.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Basic Info */}
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {profile.name || 'Wesleyan Student'}
                </h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mt-1">
                  {profile.role}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            {editing ? (
              /* Edit Form */
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    placeholder="Enter your preferred name"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This name will be displayed on your posts
                  </p>
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-foreground mb-2">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={editForm.image}
                    onChange={handleEditChange}
                    placeholder="https://example.com/your-image.jpg"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Add a link to your profile picture
                  </p>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Email</h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your account email (cannot be changed)
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Display Name</h3>
                  <p className="text-muted-foreground">
                    {profile.name || 'Not set'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Member Since</h3>
                  <p className="text-muted-foreground">{formatDate(profile.created_at)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Last Updated</h3>
                  <p className="text-muted-foreground">{formatDate(profile.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="mt-8 bg-card border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">Account Actions</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full px-4 py-2 text-left border border-border rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              View Dashboard
            </Link>
            <Link
              href="/create-post"
              className="block w-full px-4 py-2 text-left border border-border rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Create New Post
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left border border-red-200 rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 