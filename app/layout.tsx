import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WesCollab - Wesleyan University Venture Board',
  description: 'A community-driven venture board for Wesleyan University students, alumni, and partners.',
  keywords: ['wesleyan', 'university', 'venture', 'board', 'opportunities', 'internships'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
} 