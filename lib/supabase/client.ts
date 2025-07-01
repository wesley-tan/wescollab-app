'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { Database } from '../supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton browser client to avoid multiple instances
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Create client for client-side usage (browser)
export const createSupabaseClient = () => {
  // Browser-side: use singleton with proper initialization
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          storageKey: 'wescollab-supabase-auth',
          flowType: 'pkce',
          detectSessionInUrl: true,
          autoRefreshToken: true,
          storage: {
            getItem: (key) => {
              try {
                const item = localStorage.getItem(key)
                return item
              } catch (error) {
                console.error('Error reading from localStorage:', error)
                return null
              }
            },
            setItem: (key, value) => {
              try {
                localStorage.setItem(key, value)
              } catch (error) {
                console.error('Error writing to localStorage:', error)
              }
            },
            removeItem: (key) => {
              try {
                localStorage.removeItem(key)
              } catch (error) {
                console.error('Error removing from localStorage:', error)
              }
            },
          },
        },
        global: {
          headers: {
            'x-client-info': 'wescollab-app',
          },
        },
      }
    )

    // Add auth state change listener after client creation
    browserClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const maxAge = 100 * 365 * 24 * 60 * 60 // 100 years
        document.cookie = `wescollab-auth-token=${session?.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`
      }
      if (event === 'SIGNED_OUT') {
        document.cookie = 'wescollab-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      }
    })
  }
  
  return browserClient
} 