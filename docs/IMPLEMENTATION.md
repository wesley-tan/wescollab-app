# WesCollab Implementation Guide

## Overview
This document provides detailed implementation instructions for the Wesleyan-only job board MVP. Follow these steps to build a production-ready application in 3 weeks.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js 4.x
- **Database**: PostgreSQL with Prisma ORM 5.x
- **Authentication**: Google OAuth 2.0 (wesleyan.edu restricted)
- **Hosting**: Vercel (frontend) + Neon/Supabase (database)

## Project Setup

### 1. Initialize Next.js Project
```bash
npx create-next-app@latest wescollab-app --typescript --tailwind --eslint --app
cd wescollab-app
```

### 2. Install Core Dependencies
```bash
# Authentication & Database
npm install @prisma/client prisma next-auth @next-auth/prisma-adapter

# Form handling & validation
npm install zod react-hook-form @hookform/resolvers

# UI Components
npm install lucide-react @radix-ui/react-slot class-variance-authority
npm install clsx tailwind-merge

# Development tools
npm install --save-dev @types/node @types/react @types/react-dom
```

### 3. Environment Configuration
Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wescollab"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Database Schema & Setup

### 1. Prisma Schema
Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// NextAuth required tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  lastLoginAt   DateTime?

  accounts Account[]
  sessions Session[]
  posts    Post[]

  @@index([email])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// Updated Post model with role_type
enum RoleType {
  FULL_TIME
  PART_TIME
  INTERNSHIP
  CONTRACT
  PROJECT
}

model Post {
  id             String    @id @default(cuid())
  userId         String
  role           String    @db.VarChar(120)    // e.g. "Product Intern"
  roleType       RoleType                      // e.g. INTERNSHIP
  company        String    @db.VarChar(120)
  companyDesc    String?   @db.Text
  roleTitle      String    @db.VarChar(120)
  roleDesc       String    @db.Text
  contactDetails String    @db.VarChar(120)
  isDeleted      Boolean   @default(false)
  createdAt      DateTime  @default(now())
  deletedAt      DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([roleType])
  @@index([isDeleted, createdAt])
  @@index([createdAt])
}
```

### 2. Database Migration Commands
```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# View database in browser (optional)
npx prisma studio
```

### 3. Prisma Client Setup
Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Authentication Implementation

### 1. NextAuth Configuration
Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: "wesleyan.edu", // Domain hint for Google
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Strict domain enforcement
      if (!user.email?.endsWith("@wesleyan.edu")) {
        console.log(`Rejected login attempt from: ${user.email}`)
        return false
      }
      
      // Update last login timestamp
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        }).catch(console.error)
      }
      
      return true
    },
    async session({ session, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect after login
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  session: {
    strategy: "database"
  },
  debug: process.env.NODE_ENV === "development"
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 2. Auth Utilities
Create `lib/auth.ts`:
```typescript
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }
  return user
}

export function isWesleyanEmail(email: string): boolean {
  return email.endsWith("@wesleyan.edu")
}

export async function requirePostOwnership(postId: string, userId: string) {
  const { prisma } = await import("@/lib/prisma")
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true }
  })
  
  if (!post || post.userId !== userId) {
    throw new Error("Unauthorized: You can only manage your own posts")
  }
}
```

### 3. Middleware for Route Protection
Create `middleware.ts`:
```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
    console.log(`Protected route accessed: ${req.nextUrl.pathname}`)
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Ensure user has valid wesleyan.edu email
        return token?.email?.endsWith("@wesleyan.edu") ?? false
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/posts/create",
    "/api/posts/delete/:path*"
  ]
}
```

## API Endpoints Implementation

### 1. API Structure
```
app/api/
├── auth/[...nextauth]/
│   └── route.ts
├── posts/
│   ├── route.ts              # GET (list), POST (create)
│   ├── [id]/
│   │   └── route.ts          # DELETE (soft delete)
│   └── types.ts              # Type definitions
└── session/
    └── route.ts              # GET current user
```

### 2. Post Types & Validation
Create `app/api/posts/types.ts`:
```typescript
import { z } from "zod"
import { RoleType } from "@prisma/client"

export const createPostSchema = z.object({
  role: z.string().min(1, "Role is required").max(120),
  roleType: z.nativeEnum(RoleType),
  company: z.string().min(1, "Company is required").max(120),
  companyDesc: z.string().optional(),
  roleTitle: z.string().min(1, "Role title is required").max(120),
  roleDesc: z.string().min(1, "Role description is required").max(2000),
  contactDetails: z.string().min(1, "Contact details are required").max(120)
})

export type CreatePostRequest = z.infer<typeof createPostSchema>

export interface PostWithUser {
  id: string
  role: string
  roleType: RoleType
  company: string
  companyDesc: string | null
  roleTitle: string
  roleDesc: string
  contactDetails: string
  createdAt: Date
  user: {
    name: string | null
    email: string
  }
}

export interface PostListResponse {
  posts: PostWithUser[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

### 3. Posts API Implementation
Create `app/api/posts/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { createPostSchema } from "./types"
import { RoleType } from "@prisma/client"

// GET /api/posts - List all posts (public endpoint)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const roleType = searchParams.get("roleType") as RoleType | null
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  
  try {
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { roleTitle: { contains: search, mode: "insensitive" as const } },
          { company: { contains: search, mode: "insensitive" as const } },
          { roleDesc: { contains: search, mode: "insensitive" as const } },
          { role: { contains: search, mode: "insensitive" as const } }
        ]
      }),
      ...(roleType && { roleType })
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.post.count({ where })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post (authenticated)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    // Rate limiting: max 10 posts per day
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const postsToday = await prisma.post.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        isDeleted: false
      }
    })

    if (postsToday >= 10) {
      return NextResponse.json(
        { error: "Daily post limit exceeded (10 posts per day)" },
        { status: 429 }
      )
    }

    const post = await prisma.post.create({
      data: {
        ...validatedData,
        userId: user.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}
```

### 4. Individual Post Management
Create `app/api/posts/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, requirePostOwnership } from "@/lib/auth"

interface RouteParams {
  params: { id: string }
}

// DELETE /api/posts/[id] - Soft delete post (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify ownership
    await requirePostOwnership(params.id, user.id)

    // Soft delete
    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: "Post deleted successfully",
      postId: post.id 
    })
  } catch (error) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}
```

### 5. Session Endpoint
Create `app/api/session/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      },
      authenticated: true
    })
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    )
  }
}
```

## Frontend Implementation

### 1. Component Architecture
```
app/
├── (auth)/
│   ├── signin/page.tsx
│   └── error/page.tsx
├── dashboard/
│   └── page.tsx
├── components/
│   ├── ui/              # Shadcn-style components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── auth/
│   │   ├── SignInButton.tsx
│   │   └── SignOutButton.tsx
│   ├── posts/
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   ├── CreatePostForm.tsx
│   │   └── PostFilters.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── lib/
│   ├── utils.ts
│   └── hooks/
│       ├── usePosts.ts
│       └── useAuth.ts
└── page.tsx
```

### 2. Key UI Components
Create `components/ui/button.tsx`:
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 3. Custom Hooks
Create `lib/hooks/usePosts.ts`:
```typescript
import { useState, useEffect } from 'react'
import { PostWithUser, PostListResponse } from '@/app/api/posts/types'
import { RoleType } from '@prisma/client'

interface UsePostsOptions {
  search?: string
  roleType?: RoleType | null
  page?: number
  limit?: number
}

export function usePosts(options: UsePostsOptions = {}) {
  const [data, setData] = useState<PostListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { search = '', roleType = null, page = 1, limit = 20 } = options

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(roleType && { roleType })
        })

        const response = await fetch(`/api/posts?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const result: PostListResponse = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [search, roleType, page, limit])

  const refreshPosts = () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(roleType && { roleType })
    })
    
    fetch(`/api/posts?${params}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
  }

  return {
    posts: data?.posts || [],
    pagination: data?.pagination,
    loading,
    error,
    refreshPosts
  }
}
```

## Security & Performance

### 1. Input Sanitization
- All user inputs validated with Zod schemas
- HTML content sanitization for descriptions
- SQL injection protection via Prisma ORM

### 2. Rate Limiting Implementation
Create `lib/rate-limit.ts`:
```typescript
import { LRUCache } from "lru-cache"

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit

        return isRateLimited ? reject() : resolve()
      }),
  }
}
```

### 3. HTTPS & CORS
- Enforce HTTPS in production
- Configure CORS policies
- Set security headers

## Testing Strategy

### 1. Unit Tests Setup
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

### 2. Test Coverage Areas
- Authentication flows (domain validation)
- API endpoint validation
- Post creation/deletion workflows
- Rate limiting enforcement
- Form validation

### 3. Integration Tests
```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Deployment

### 1. Production Database Setup
Options for PostgreSQL hosting:
- **Neon**: Serverless PostgreSQL with generous free tier
- **Supabase**: Full-stack platform with auth + database
- **Railway**: Simple deployment with PostgreSQL
- **Vercel Postgres**: Integrated with Vercel (beta)

### 2. Environment Variables (Production)
Required environment variables for Vercel:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Deployment Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXTAUTH_SECRET production
```

### 4. Domain Configuration
- Configure custom domain (e.g., `jobs.wesleyan.edu`)
- Update Google OAuth redirect URLs
- Set up SSL certificates (automatic with Vercel)

### 5. Database Migration in Production
```bash
# Apply pending migrations
npx prisma migrate deploy

# Generate client (if needed)
npx prisma generate
```

## Monitoring & Maintenance

### 1. Analytics Integration
- Vercel Analytics for performance metrics
- Custom event tracking for user actions
- Database query performance monitoring

### 2. Error Tracking
```bash
npm install @sentry/nextjs
```

### 3. Backup Strategy
- Automated daily database backups
- Point-in-time recovery (PITR) setup
- Regular backup restoration testing

### 4. Cleanup Jobs
Implement cron job for data cleanup:
- Permanently delete soft-deleted posts after 30 days
- Clean up expired sessions
- Archive old user activity logs

## Development Timeline

### Week 1: Foundation (Days 1-7)
- [ ] Project setup and database schema
- [ ] Authentication with Google OAuth
- [ ] Basic API endpoints (CRUD operations)
- [ ] Database migrations and seeding

### Week 2: Core Features (Days 8-14)
- [ ] Frontend components and pages
- [ ] Post creation and management UI
- [ ] Public job board with filtering
- [ ] User dashboard and authentication flows

### Week 3: Polish & Deploy (Days 15-21)
- [ ] Rate limiting and security hardening
- [ ] Mobile responsiveness and accessibility
- [ ] Testing and bug fixes
- [ ] Production deployment and monitoring

## Success Metrics

### Technical KPIs
- Page load time < 1 second
- API response time < 300ms
- 99.5% uptime
- Zero security vulnerabilities

### User Experience KPIs
- < 90 seconds to create a post
- < 1% authentication failures
- Mobile usability score > 90
- WCAG 2.1 AA compliance

This implementation guide provides a complete roadmap for building the WesCollab MVP. Each section includes specific technical details, code examples, and best practices to ensure a successful launch within the 3-week timeline. 