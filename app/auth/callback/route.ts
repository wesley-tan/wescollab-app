import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateAndSyncUser } from '@/lib/auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${error}&message=${encodeURIComponent(error_description || 'Authentication failed')}`
    )
  }

  if (!code) {
    console.error('No code provided in callback')
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=no_code&message=${encodeURIComponent('No authentication code provided')}`
    )
  }

  const cookieStore = cookies()

  // Get the code verifier cookie
  const pkceVerifier = cookieStore.get('supabase-auth-code-verifier')?.value
  
  if (!pkceVerifier) {
    console.error('No PKCE verifier found in cookies')
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=no_verifier&message=${encodeURIComponent('Authentication state lost. Please try again.')}`
    )
  }
  
  // Create Supabase client with access to request cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value
          } catch (error) {
            console.error('Error getting cookie:', error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )

  try {
    // Log available cookies for debugging
    console.log('Available cookies:', cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })))
    
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (authError) {
      console.error('Auth exchange error:', authError)
      throw authError
    }
    
    if (!user?.email) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=no_email&message=${encodeURIComponent('Email is required for authentication.')}`
      )
    }

    // Validate and sync user data
    await validateAndSyncUser(user)
    
    // Clean up PKCE verifier cookie
    cookieStore.delete('supabase-auth-code-verifier')
    
    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  } catch (error: any) {
    console.error('Auth callback error:', error)
    
    const errorMessage = error.message || 'Authentication failed. Please try again.'
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=auth_error&message=${encodeURIComponent(errorMessage)}`
    )
  }
} 