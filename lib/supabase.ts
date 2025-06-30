import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

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
    // Server-side: always create a new client
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // Browser-side: use singleton
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  
  return browserClient
}

// Create client for server-side usage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Create client for server-side usage with cookies (for API routes)
export const createSupabaseServerClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Create admin client with service role (for server-side admin operations)
export const createSupabaseAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, serviceRoleKey)
} 