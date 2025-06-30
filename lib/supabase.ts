import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Types for our database (from Prisma schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          image: string | null
          googleId: string
          role: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          image?: string | null
          googleId: string
          role?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          googleId?: string
          role?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      posts: {
        Row: {
          id: string
          userId: string
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
          id?: string
          userId: string
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
          id?: string
          userId?: string
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

// Create client for client-side usage (browser)
export const createSupabaseClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Create client for server-side usage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Create admin client with service role (for server-side admin operations)
export const createSupabaseAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, serviceRoleKey)
} 