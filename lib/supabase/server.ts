import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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