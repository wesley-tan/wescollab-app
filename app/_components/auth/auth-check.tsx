import { headers, cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

async function getSession() {
  const supabase = createSupabaseServerClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return session
  } catch (error) {
    return null
  }
}

export async function AuthCheck({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return <>{children}</>
} 