export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          WesCollab
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Wesleyan University Venture Board
        </p>
        <div className="max-w-2xl mx-auto">
          <p className="text-lg mb-6">
            A community-driven platform where Wesleyan students, alumni, and partners 
            can discover and share venture opportunities including internships, 
            full-time roles, and collaborative projects.
          </p>
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-muted-foreground">
              We're building something amazing for the Wesleyan community. 
              Stay tuned for the launch!
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 