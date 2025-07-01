import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    // Remove min-h-screen from main and handle height differently
    <main className="relative bg-background w-full">
      {/* Wrapper div with proper scroll handling */}
      <div className="w-full min-h-[100dvh] overflow-y-auto">
        {/* Content container with proper spacing */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-primary">
              WesCollab
            </h1>
            
            {/* Description */}
            <div className="space-y-6">
              <p className="text-xl md:text-2xl text-muted-foreground">
                Wesleyan University's Community-Driven Venture Board
              </p>

              <p className="text-lg text-foreground leading-relaxed">
                A community-driven platform where Wesleyan students, alumni, and partners can discover and share venture opportunities including internships, full-time roles, and collaborative projects.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/opportunities"
                className="flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all"
              >
                Browse Opportunities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/auth/signin"
                className="flex items-center justify-center px-6 py-3 bg-white border-2 border-primary/10 rounded-lg font-medium hover:bg-primary/5 transition-all"
              >
                Sign In with Google
              </Link>
            </div>

            {/* Get Started Card */}
            <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 mt-12">
              <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
              <p className="text-muted-foreground mb-6">
                Browse opportunities from the Wesleyan community or sign in to create your own posts.
              </p>
              
              {/* Status indicator */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center text-green-800 gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium">
                    WesCollab is live! Sign in to start sharing opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}