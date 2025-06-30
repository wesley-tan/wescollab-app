'use client'

import { createSupabaseClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function AuthDebugPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseClient()

    // Get current session
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError(sessionError.message)
        } else {
          setSession(session)
          setUser(session?.user || null)
        }
      } catch (err: any) {
        console.error('Error getting session:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session)
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const clearAuth = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setError(null)
  }

  if (loading) {
    return <div className="p-8">Loading auth state...</div>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Current Session</h2>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
              {session ? JSON.stringify(session, null, 2) : 'No session'}
            </pre>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Current User</h2>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
              {user ? JSON.stringify(user, null, 2) : 'No user'}
            </pre>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Environment</h2>
            <div className="text-sm space-y-1">
              <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              <p><strong>NEXT_PUBLIC_APP_URL:</strong> {process.env.NEXT_PUBLIC_APP_URL}</p>
              <p><strong>Window Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <a
              href="/auth/signin"
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Try Sign In
            </a>
            <button
              onClick={clearAuth}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear Auth State
            </button>
            <a
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 