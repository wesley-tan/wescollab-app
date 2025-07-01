import { createSupabaseClient, createSupabaseAdminClient } from './supabase'

// Domain restriction configuration - temporarily disabled for testing
const ALLOWED_DOMAINS: string[] = [] // Empty array means no domain restriction

/**
 * Check if email belongs to allowed domain
 */
export function isAllowedEmail(email: string): boolean {
  if (!email) return false
  // Temporarily allow all email domains for testing
  return true
}

/**
 * Sign in with Google OAuth with domain restriction
 */
export async function signInWithGoogle() {
  const supabase = createSupabaseClient()
  
  // Get the correct base URL for redirects
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    // Clear any existing auth state to ensure a fresh login
    await supabase.auth.signOut()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',
        },
        skipBrowserRedirect: false,
      },
    })

    if (error) {
      console.error('OAuth initiation error:', error)
      throw new Error(`Authentication failed: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error('Sign in error:', error)
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`)
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const supabase = createSupabaseClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

/**
 * Check if user has valid email and sync with database
 */
export async function validateAndSyncUser(user: any) {
  if (!user?.email) {
    // Sign out user if they don't have an email
    await signOut()
    throw new Error('Access denied. Email address is required.')
  }

  // Sync user data with our database using admin client
  const adminSupabase = createSupabaseAdminClient()
  
  // Check if user exists in our profiles table
  const { data: existingUser, error: fetchError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('googleId', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user:', fetchError)
    throw new Error('Database error during user validation')
  }

  if (!existingUser) {
    // Create new user in our database
    const { data: newUser, error: createError } = await adminSupabase
      .from('profiles')
      .insert({
        id: user.id, // Use Supabase auth user ID
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        googleId: user.id,
        role: 'USER',
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      throw new Error('Failed to create user account')
    }

    return newUser
  } else {
    // Update existing user data
    const { data: updatedUser, error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        name: user.user_metadata?.full_name || user.user_metadata?.name || existingUser.name,
        image: user.user_metadata?.avatar_url || user.user_metadata?.picture || existingUser.image,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      // Don't throw error for update failures, just continue
    }

    return updatedUser || existingUser
  }
}

/**
 * Rate limiting: Check if user can create more posts today
 */
export async function checkPostRateLimit(userId: string): Promise<boolean> {
  const adminSupabase = createSupabaseAdminClient()
  
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  const { count, error } = await adminSupabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)
    .gte('createdAt', `${today}T00:00:00.000Z`)
    .lt('createdAt', `${today}T23:59:59.999Z`)

  if (error) {
    console.error('Error checking rate limit:', error)
    return false // Deny on error to be safe
  }

  const POST_LIMIT_PER_DAY = 10
  return (count || 0) < POST_LIMIT_PER_DAY
} 