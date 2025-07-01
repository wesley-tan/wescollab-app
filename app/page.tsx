import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center">
      <div className="text-center max-w-3xl w-full -mt-24">
        <h1 className="text-4xl font-bold text-primary mb-2">WesCollab</h1>
        <p className="text-xl text-muted-foreground mb-8">Wesleyan University Venture Board</p>
        
        <div className="mb-8">
          <p className="text-lg mb-6">
            A community-driven platform where Wesleyan students, alumni, and partners can discover and share venture opportunities including internships, full-time roles, and collaborative projects.
          </p>
          
          <div className="bg-card border rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-muted-foreground mb-6">
              Browse opportunities from the Wesleyan community or sign in to create your own posts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/opportunities"
                className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Opportunities
              </Link>
              <Link
                href="/auth/signin"
                className="px-6 py-3 border border-border rounded-md font-medium hover:bg-muted transition-colors"
              >
                Sign In with Google
              </Link>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Ready to Use</h3>
            <p className="text-sm text-green-800">
              WesCollab is now live! Sign in with your Google account to share opportunities with the community.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 