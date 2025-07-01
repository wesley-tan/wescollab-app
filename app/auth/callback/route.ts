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

  if (code) {
    const cookieStore = cookies()
    
    // Create Supabase client with access to request cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
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
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )

    try {
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

  // Return the user to the homepage if something goes wrong
  return NextResponse.redirect(requestUrl.origin)
} 