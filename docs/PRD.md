# Product Requirements Document (PRD)
## WesCollab - Wesleyan University Venture Board
**Last updated: January 2025**  
**Status: MVP Phase 2 - Core Features Implementation**

---

## 📋 Current Implementation Status

### ✅ **COMPLETED (Phase 1 - Authentication & Foundation)**
- **Authentication System**: Google OAuth with @wesleyan.edu domain restriction
- **Database Schema**: Supabase with profiles and posts tables (UUID-based)
- **User Dashboard**: Working dashboard with user authentication
- **Infrastructure**: Next.js 14, TypeScript, Tailwind CSS, Supabase

### 🔄 **IN PROGRESS (Phase 2 - Core Features)**
- **Create Post Functionality** - Implementation starting
- **Browse Opportunities** - Public venture board
- **User Profile Management** - View/edit profile

### 📋 **PENDING (Phase 3 - Enhancement)**
- Search and filtering
- Rate limiting (10 posts/day)
- Admin features

---

## 1. Purpose & Vision
Create a lightweight web portal where anyone with a valid @wesleyan.edu email can post and browse opportunities (jobs, internships, projects) offered by students, alumni, or partners. The emphasis is simplicity: log in once, add or delete your own listings, and trust that every post comes from the Wes community.

## 2. Goals & Success Metrics
| Goal | KPI / Target | Status |
|------|--------------|--------|
| Community-only access | 100% of authenticated users have @wesleyan.edu addresses | ✅ **COMPLETE** |
| Easy posting | Median time to create a post ≤ 90s | 🔄 **IN PROGRESS** |
| Data integrity | < 1% orphaned or incorrect posts (owner mismatch) | 🔄 **IN PROGRESS** |
| Engagement | ≥ 50 unique active users in first month | ⏳ **PENDING** |
| Uptime | ≥ 99.5% over rolling 30 days | ⏳ **PENDING** |

## 3. User Stories

### ✅ **IMPLEMENTED**
- **"As a Wesleyan student, I can sign in with my Google (@wesleyan.edu) account"** → Working with domain restriction
- **"I can access my dashboard after authentication"** → Dashboard displays user info and navigation

### 🔄 **IMPLEMENTING NOW**
- **"After signing in, I can publish a role by filling a single form and see it appear instantly"**
- **"I can delete only the posts I created, protecting others' content"**
- **"Without signing in, I can read all public listings"**

### ⏳ **FUTURE**
- **"An admin can hide inappropriate posts or ban users"** (Out of scope for MVP)

## 4. Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-1 | Google OAuth restricted to @wesleyan.edu domain | ✅ **COMPLETE** |
| FR-2 | Optional campus SSO support | ⏳ **FUTURE** |
| FR-3 | Public job board (no login required for reading) | 🔄 **IMPLEMENTING** |
| FR-4 | Create Post form with all required fields | 🔄 **IMPLEMENTING** |
| FR-5 | Delete Post (owner only) | 🔄 **IMPLEMENTING** |
| FR-6 | Soft-delete with 30-day purge | 🔄 **IMPLEMENTING** |
| FR-7 | Search/filtering capabilities | ⏳ **PHASE 3** |
| FR-8 | Rate limiting (10 posts/day per user) | ⏳ **PHASE 3** |
| FR-9 | Payload validation (200/2000 char limits) | 🔄 **IMPLEMENTING** |
| FR-10 | Responsive UI (mobile ≥375px) | ✅ **COMPLETE** |

## 5. Updated Data Model (Implemented)

Our current Supabase schema uses the following structure:

```sql
-- Using Supabase's built-in profiles table (connected to auth.users)
CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY,              -- Supabase auth user ID
  "email" text UNIQUE NOT NULL,
  "name" text,
  "image" text,
  "googleId" text UNIQUE,             -- Google OAuth subject
  "role" text DEFAULT 'USER',
  "created_at" timestamptz DEFAULT NOW(),
  "updated_at" timestamptz DEFAULT NOW()
);

-- Role type enum for opportunities
CREATE TYPE "RoleType" AS ENUM (
  'INTERNSHIP',
  'FULL_TIME', 
  'PART_TIME',
  'COLLABORATIVE_PROJECT',
  'VOLUNTEER',
  'RESEARCH'
);

-- Posts table for venture opportunities
CREATE TABLE "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "roleTitle" VARCHAR(200) NOT NULL,
  "company" TEXT NOT NULL,
  "roleType" "RoleType" NOT NULL,
  "roleDesc" VARCHAR(2000) NOT NULL,
  "contactDetails" TEXT NOT NULL,
  "isDeleted" BOOLEAN DEFAULT false NOT NULL,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. Authentication Implementation (✅ Complete)

**Current Setup**: Google OAuth with Supabase Auth
- **Domain Restriction**: Only @wesleyan.edu emails accepted
- **Flow**: Google OAuth → Domain validation → User creation/sync → Dashboard access
- **Security**: HTTPS, proper session management, Row Level Security (RLS)

## 7. Next Implementation Steps

### **Phase 2 - Core Features (Current Sprint)**

1. **Create Post Functionality**
   - Form with roleTitle, company, roleType, roleDesc, contactDetails
   - Client-side validation with character limits
   - Integration with posts table

2. **Browse Opportunities (Public Board)**
   - Public page displaying all active posts
   - No authentication required for viewing
   - Card-based layout with company, role, and contact info

3. **User Profile Management**
   - View profile page with editable fields
   - Update name, image, and other profile data

### **Phase 3 - Enhancement Features**
- Search and filtering by role type, company
- Rate limiting implementation
- Admin dashboard
- Enhanced UI/UX polish

## 8. Technical Architecture (Current)

```
Browser ←→ Next.js 14 (React) ←→ Supabase
├── Authentication: Supabase Auth + Google OAuth
├── Database: PostgreSQL (Supabase managed)
├── Hosting: Local development → Production deployment
└── Styling: Tailwind CSS + Custom UI components
```

## 9. Success Criteria for Phase 2

- [ ] Users can create venture posts through dashboard
- [ ] Posts appear immediately on public board
- [ ] Users can delete only their own posts
- [ ] Profile management works correctly
- [ ] Mobile-responsive on devices ≥375px
- [ ] All database operations use proper validation

---

**Ready for Phase 2 Implementation** 🚀