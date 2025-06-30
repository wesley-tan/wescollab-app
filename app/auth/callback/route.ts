import { createSupabaseClient } from '@/lib/supabase'
import { validateAndSyncUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=oauth_error&message=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const supabase = createSupabaseClient()
    
    try {
      // Exchange code for session
      const { data: { user }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/signin?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
        )
      }

      if (user) {
        try {
          // Validate domain and sync user with our database
          await validateAndSyncUser(user)
          
          // Successful authentication - redirect to dashboard
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        } catch (validationError: any) {
          console.error('User validation error:', validationError)
          
          // Domain restriction failed - redirect with error
          return NextResponse.redirect(
            `${requestUrl.origin}/auth/signin?error=domain_restricted&message=${encodeURIComponent(validationError.message)}`
          )
        }
      }
    } catch (error: any) {
      console.error('Authentication callback error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=auth_failed&message=${encodeURIComponent(error.message || 'Authentication failed')}`
      )
    }
  }

  // No code parameter - redirect to sign in
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`)
} 