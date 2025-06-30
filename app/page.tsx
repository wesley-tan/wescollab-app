export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">WesCollab</h1>
        <p className="text-xl text-muted-foreground mb-8">Wesleyan University Venture Board</p>
        
        <div className="max-w-2xl mx-auto">
          <p className="text-lg mb-6">
            A community-driven platform where Wesleyan students, alumni, and partners can discover and share venture opportunities including internships, full-time roles, and collaborative projects.
          </p>
          
          <div className="bg-card border rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-muted-foreground mb-6">
              Sign in with your @wesleyan.edu account to create posts and connect with the community.
            </p>
            
            <div className="space-y-4">
              <a
                href="/auth/signin"
                className="inline-block px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Sign In with Google
              </a>
              
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🧪 Testing Phase</h3>
            <p className="text-sm text-blue-800">
              WesCollab is currently in development. You can test the authentication system with your @wesleyan.edu account.
              <br />Features being tested: Google OAuth, domain restriction, user database sync.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 