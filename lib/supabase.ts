import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Types for our database (from Prisma schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string // UUID from Supabase auth
          email: string
          name: string | null
          image: string | null
          googleId: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string // Required - uses Supabase auth user ID (UUID)
          email: string
          name?: string | null
          image?: string | null
          googleId?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          googleId?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string // UUID
          userId: string // UUID - references profiles.id
          roleTitle: string
          company: string
          roleType: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'
          roleDesc: string
          contactDetails: string
          isDeleted: boolean
          deletedAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string // UUID
          userId: string // UUID - references profiles.id
          roleTitle: string
          company: string
          roleType: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'
          roleDesc: string
          contactDetails: string
          isDeleted?: boolean
          deletedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string // UUID
          userId?: string // UUID - references profiles.id
          roleTitle?: string
          company?: string
          roleType?: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'
          roleDesc?: string
          contactDetails?: string
          isDeleted?: boolean
          deletedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton browser client to avoid multiple instances
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Create client for client-side usage (browser)
export const createSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: use the server client
    return createSupabaseServerClient()
  }

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

// Create client for server-side usage with cookies (for API routes)
export const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
      global: { fetch },
      auth: { 
        persistSession: true, 
        storageKey: 'wescollab-supabase-auth'
      },
    }
  )
}

// Create admin client with service role (for server-side admin operations)
export const createSupabaseAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, serviceRoleKey)
} 