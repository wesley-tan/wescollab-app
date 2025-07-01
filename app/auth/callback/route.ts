import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateAndSyncUser } from '@/lib/auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

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
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    try {
      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (authError) throw authError
      
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
      
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=auth_error&message=${encodeURIComponent('Authentication failed. Please try again.')}`
      )
    }
  }

  // Return the user to the homepage if something goes wrong
  return NextResponse.redirect(requestUrl.origin)
} 