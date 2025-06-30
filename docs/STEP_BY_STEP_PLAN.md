# WesCollab Step-by-Step Implementation Plan

## Overview
This plan breaks down the WesCollab venture board implementation into verifiable steps, each with clear success criteria and testing instructions.

## Week 1: Foundation & Authentication (Days 1-7)

### Step 1: Project Setup & Environment
**Goal**: Initialize Next.js project with required dependencies

**Tasks**:
```bash
npm install @prisma/client prisma next-auth @next-auth/prisma-adapter
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react @radix-ui/react-slot class-variance-authority
npm install clsx tailwind-merge
```

**Verification Criteria**:
- [ ] Project builds successfully: `npm run build`
- [ ] Development server starts: `npm run dev`
- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] All dependencies installed without errors
- [ ] `.env.local` file created with required variables

**Testing**:
```bash
# Should return 200 status
curl http://localhost:3000

# Should show no TypeScript errors
npx tsc --noEmit
```

---

### Step 2: Database Schema Setup
**Goal**: Create PostgreSQL database with Prisma schema

**Tasks**:
1. Create `prisma/schema.prisma` with User and Post models
2. Set up database connection
3. Run initial migration

**Verification Criteria**:
- [ ] Database connects successfully
- [ ] Prisma schema generates without errors
- [ ] Migration creates all required tables
- [ ] Indexes are properly created
- [ ] Enum types work correctly

**Testing**:
```bash
# Should connect and show tables
npx prisma db push
npx prisma studio # Should open without errors

# Verify schema in database
npx prisma db pull # Should match existing schema
```

**SQL Verification**:
```sql
-- These queries should return expected results
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Post';
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'RoleType'::regtype;
```

---

### Step 3: Google OAuth Setup  
**Goal**: Implement Google OAuth with @wesleyan.edu restriction

**Tasks**:
1. Set up Google Cloud Console project
2. Configure OAuth credentials
3. Implement NextAuth.js configuration
4. Add domain restriction logic

**Verification Criteria**:
- [ ] Google OAuth redirects work locally
- [ ] @wesleyan.edu emails can sign in
- [ ] Non-@wesleyan.edu emails are rejected
- [ ] User data is saved to database
- [ ] Session management works

**Testing**:
```bash
# Test with valid Wesleyan email
# 1. Navigate to http://localhost:3000/auth/signin
# 2. Click "Sign in with Google"
# 3. Use test@wesleyan.edu account
# Expected: Successful login

# Test with invalid email  
# 1. Try signing in with test@gmail.com
# Expected: Access denied error
```

**Database Verification**:
```sql
-- Should show user record after successful login
SELECT id, email, name, created_at FROM "User" WHERE email LIKE '%@wesleyan.edu';
```

---

### Step 4: Basic API Endpoints
**Goal**: Create REST API for venture CRUD operations

**Tasks**:
1. Implement `/api/posts` (GET, POST)
2. Implement `/api/posts/[id]` (DELETE)
3. Implement `/api/session` (GET)
4. Add input validation with Zod

**Verification Criteria**:
- [ ] GET `/api/posts` returns posts array
- [ ] POST `/api/posts` creates new post (auth required)
- [ ] DELETE `/api/posts/[id]` soft-deletes post (owner only)
- [ ] GET `/api/session` returns user info
- [ ] All endpoints return proper HTTP status codes
- [ ] Validation errors return 400 with details

**Testing**:
```bash
# Test public posts endpoint
curl http://localhost:3000/api/posts
# Expected: {"posts": [], "pagination": {...}}

# Test session endpoint (no auth)
curl http://localhost:3000/api/session  
# Expected: {"user": null, "authenticated": false}

# Test creating post (requires login first)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Product Intern",
    "roleType": "INTERNSHIP", 
    "company": "Test Corp",
    "roleTitle": "Summer Intern",
    "roleDesc": "Great opportunity",
    "contactDetails": "test@wesleyan.edu"
  }'
# Expected: 401 Unauthorized (if not logged in)
```

---

### Step 5: Authentication Integration
**Goal**: Connect auth system with API endpoints

**Tasks**:
1. Create auth utility functions
2. Add middleware for protected routes
3. Implement session validation
4. Add user ownership checks

**Verification Criteria**:
- [ ] Protected endpoints require authentication
- [ ] Users can only delete their own posts
- [ ] Middleware blocks unauthorized access
- [ ] Session validation works correctly
- [ ] Rate limiting prevents spam (10 posts/day)

**Testing**:
```bash
# After logging in, test creating a post
# 1. Sign in via web interface
# 2. Check session endpoint returns user data
# 3. Create post via API
# 4. Verify post appears in GET /api/posts

# Test ownership protection
# 1. User A creates a post
# 2. User B tries to delete it
# Expected: 403 Forbidden

# Test rate limiting
# 1. Create 10 posts quickly
# 2. Try to create 11th post
# Expected: 429 Too Many Requests
```

---

## Week 2: Frontend & User Interface (Days 8-14)

### Step 6: Core UI Components
**Goal**: Build reusable UI components with Tailwind

**Tasks**:
1. Create Button, Input, Card, Badge components
2. Set up utility functions (cn, etc.)
3. Create auth components (SignIn/SignOut)
4. Implement responsive layout

**Verification Criteria**:
- [ ] All components render without errors
- [ ] Tailwind classes apply correctly
- [ ] Components are accessible (ARIA labels)
- [ ] Mobile responsive (≥375px width)
- [ ] Color contrast meets WCAG 2.1 AA

**Testing**:
```bash
# Visual testing in browser
# 1. Check components in Storybook or component playground
# 2. Test on mobile viewport (375px)
# 3. Use accessibility checker
# 4. Verify color contrast ratios

# Component testing
npm test -- --testPathPattern=components
```

---

### Step 7: Public Venture Board
**Goal**: Create public listing page (FR-3)

**Tasks**:
1. Implement PostList component with pagination
2. Add search functionality  
3. Add role type filtering
4. Create PostCard component
5. Implement responsive grid layout

**Verification Criteria**:
- [ ] All ventures display in cards
- [ ] Search works across title, company, description
- [ ] Role type filter works
- [ ] Pagination works correctly
- [ ] No authentication required to view
- [ ] Loading states display properly
- [ ] Empty states handled gracefully

**Testing**:
```bash
# Functional testing
# 1. Visit http://localhost:3000 (no login)
# 2. Should see venture listings
# 3. Test search with "intern"
# 4. Filter by "INTERNSHIP" 
# 5. Test pagination if >20 posts

# Performance testing
# - Page load should be <1 second
# - Search should respond instantly
```

**Success Metrics Validation**:
- [ ] Page loads in <1 second @ 3 Gbps ✓
- [ ] No login required for read access ✓

---

### Step 8: Authentication UI
**Goal**: Create sign-in/sign-out user interface

**Tasks**:
1. Create sign-in page with Google OAuth button
2. Add error handling for rejected domains
3. Implement sign-out functionality
4. Add user profile display
5. Create protected route redirects

**Verification Criteria**:
- [ ] Sign-in page displays Google button
- [ ] Successful auth redirects to dashboard
- [ ] Failed auth shows clear error message
- [ ] Sign-out clears session
- [ ] User info displays when logged in
- [ ] Protected pages redirect to sign-in

**Testing**:
```bash
# User flow testing
# 1. Visit /auth/signin
# 2. Click "Sign in with Google"
# 3. Use valid @wesleyan.edu email
# 4. Should redirect to dashboard
# 5. User name should appear in header
# 6. Sign out should work

# Error handling
# 1. Try signing in with @gmail.com
# 2. Should see "Only @wesleyan.edu emails allowed"
```

**User Story Validation**:
- [ ] "As a Wesleyan student, I can sign in with my Google account" ✓

---

### Step 9: Create Venture Form
**Goal**: Implement post creation UI (FR-4, FR-8, FR-9)

**Tasks**:
1. Create form with all required fields
2. Add role type dropdown
3. Implement React Hook Form + Zod validation
4. Add character limits and validation
5. Show loading/success states

**Verification Criteria**:
- [ ] Form collects all required fields
- [ ] Email is auto-filled and read-only
- [ ] Role type dropdown has all options
- [ ] Client-side validation works
- [ ] Character limits enforced (200 chars title, 2000 chars description)
- [ ] Form submission shows loading state
- [ ] Success creates post and shows feedback
- [ ] Rate limiting message displays clearly

**Testing**:
```bash
# Form validation testing
# 1. Try submitting empty form
# 2. Should show required field errors
# 3. Enter text > 200 chars in title
# 4. Should show character limit error
# 5. Fill valid form and submit
# 6. Should create post successfully

# Rate limiting test
# 1. Create 10 posts in one day
# 2. Try creating 11th post
# 3. Should show rate limit message
```

**Functional Requirements Validation**:
- [ ] FR-4: All required fields collected ✓
- [ ] FR-8: Rate limiting (10/day) enforced ✓
- [ ] FR-9: Payload validation (200/2000 chars) ✓

**Success Metrics Validation**:
- [ ] Median time to create post ≤90 seconds ✓

---

### Step 10: Dashboard & Post Management
**Goal**: Create user dashboard with post management (FR-5)

**Tasks**:
1. Create dashboard page (auth required)
2. Show user's own posts
3. Add delete functionality
4. Implement soft delete with confirmation
5. Add post statistics

**Verification Criteria**:
- [ ] Dashboard requires authentication
- [ ] Shows only user's own posts
- [ ] Delete button only on own posts
- [ ] Confirmation dialog before delete
- [ ] Soft delete removes from public view
- [ ] Deleted posts marked in database
- [ ] Statistics show correct counts

**Testing**:
```bash
# Dashboard testing
# 1. Sign in and go to /dashboard
# 2. Should see "My Ventures" section
# 3. Create a test post
# 4. Should appear in dashboard
# 5. Click delete, confirm
# 6. Post should disappear
# 7. Check database - is_deleted=true

# Security testing
# 1. User A creates post
# 2. User B logs in
# 3. User B should not see delete button on A's post
# 4. Direct API call to delete A's post should fail
```

**User Story Validation**:
- [ ] "I can delete only the posts I created" ✓
- [ ] "After signing in, I can publish a role and see it instantly" ✓

---

## Week 3: Polish & Deployment (Days 15-21)

### Step 11: Search & Filtering (FR-7)
**Goal**: Implement advanced search and filtering

**Tasks**:
1. Add full-text search across multiple fields
2. Implement role type filtering
3. Add company name filtering
4. Create filter UI with clear/reset
5. Add search result counts

**Verification Criteria**:
- [ ] Search works across role_title, company, role_desc
- [ ] Role type filter shows correct results
- [ ] Multiple filters can be combined
- [ ] Search is case-insensitive
- [ ] Results update in real-time
- [ ] Filter state persists in URL
- [ ] Clear filters works

**Testing**:
```bash
# Search testing
# 1. Create posts with different companies/roles
# 2. Search for "intern" - should find relevant posts
# 3. Filter by "INTERNSHIP" - should show only internships
# 4. Combine search + filter
# 5. Check URL parameters persist
# 6. Test empty search results
```

**Functional Requirements Validation**:
- [ ] FR-7: Search/filtering by role_title, company, free-text ✓

---

### Step 12: Mobile Responsiveness (FR-10)
**Goal**: Ensure mobile-first responsive design

**Tasks**:
1. Test all pages at 375px width
2. Optimize form layouts for mobile
3. Ensure touch-friendly buttons (44px minimum)
4. Test horizontal scrolling issues
5. Optimize typography for mobile

**Verification Criteria**:
- [ ] All pages work at 375px width
- [ ] No horizontal scrolling
- [ ] Buttons are touch-friendly (≥44px)
- [ ] Text is readable without zooming
- [ ] Forms are usable on mobile
- [ ] Navigation works on small screens

**Testing**:
```bash
# Mobile testing
# 1. Open Chrome DevTools
# 2. Set viewport to 375px width
# 3. Test all major pages
# 4. Test form submission on mobile
# 5. Test sign-in flow on mobile
# 6. Check touch targets with accessibility inspector
```

**Functional Requirements Validation**:
- [ ] FR-10: Responsive UI (mobile ≥375px) ✓

---

### Step 13: Security & Performance Optimization
**Goal**: Implement security best practices and optimize performance

**Tasks**:
1. Add CSRF protection
2. Implement proper error handling
3. Add request/response logging
4. Optimize database queries
5. Add caching headers
6. Implement proper HTTPS redirects

**Verification Criteria**:
- [ ] CSRF tokens present on forms
- [ ] Errors don't leak sensitive information
- [ ] Database queries are optimized (use EXPLAIN)
- [ ] API responses include proper cache headers
- [ ] HTTPS enforced in production
- [ ] Rate limiting works correctly
- [ ] Input sanitization prevents XSS

**Testing**:
```bash
# Security testing
# 1. Check for CSRF tokens in form requests
# 2. Try SQL injection in search fields
# 3. Test XSS in post descriptions
# 4. Verify rate limiting with rapid requests
# 5. Check HTTPS redirect in production

# Performance testing
# 1. Run Lighthouse audit
# 2. Check API response times (<300ms)
# 3. Verify page load times (<1s)
# 4. Test with slow network conditions
```

**Non-Functional Requirements Validation**:
- [ ] Security: OAuth 2.0, HTTPS, CSRF, parameterized queries ✓
- [ ] Performance: Page load ≤1s, API ≤300ms ✓

---

### Step 14: Data Cleanup & Maintenance (FR-6)
**Goal**: Implement soft delete and cleanup processes

**Tasks**:
1. Verify soft delete functionality
2. Create cleanup script for 30-day purge
3. Add database backup procedures
4. Implement audit logging
5. Create monitoring dashboards

**Verification Criteria**:
- [ ] Deleted posts have is_deleted=true
- [ ] Deleted posts don't appear in public listings
- [ ] Cleanup script removes posts >30 days old
- [ ] Audit trail exists for all operations
- [ ] Backup procedures work correctly
- [ ] Monitoring alerts function properly

**Testing**:
```bash
# Soft delete testing
# 1. Create and delete a post
# 2. Verify is_deleted=true, deleted_at set
# 3. Confirm post doesn't appear in public API
# 4. Admin should still see in database

# Cleanup testing
# 1. Create test data with old deleted_at dates
# 2. Run cleanup script
# 3. Verify old records are purged
# 4. Verify recent records remain
```

**Functional Requirements Validation**:
- [ ] FR-6: Soft-delete with 30-day purge ✓

---

### Step 15: Production Deployment
**Goal**: Deploy to production with monitoring

**Tasks**:
1. Set up production database (Neon/Supabase)
2. Configure environment variables
3. Deploy to Vercel
4. Set up custom domain
5. Configure monitoring and alerts
6. Test production deployment

**Verification Criteria**:
- [ ] Production database is accessible
- [ ] All environment variables set correctly
- [ ] Application deploys without errors
- [ ] Custom domain resolves correctly
- [ ] SSL certificates work
- [ ] Monitoring captures metrics
- [ ] Google OAuth works in production

**Testing**:
```bash
# Production testing
# 1. Visit production URL
# 2. Test sign-in flow end-to-end
# 3. Create and delete a post
# 4. Test from mobile device
# 5. Verify analytics are tracking
# 6. Test performance with GTmetrix

# Deployment verification
vercel --prod
curl -I https://your-domain.com # Should return 200
```

**Non-Functional Requirements Validation**:
- [ ] Scalability: Design for 5,000 users, 20,000 posts ✓
- [ ] Uptime: ≥99.5% monitoring in place ✓

---

## Final Verification Checklist

### Functional Requirements Complete
- [ ] FR-1: Google OAuth restricted to @wesleyan.edu ✓
- [ ] FR-2: SSO support designed (future) ✓
- [ ] FR-3: Public board shows all active posts ✓
- [ ] FR-4: Create form collects all required fields ✓
- [ ] FR-5: Delete only own posts ✓
- [ ] FR-6: Soft delete with 30-day purge ✓
- [ ] FR-7: Search/filtering implemented ✓
- [ ] FR-8: Rate limiting (10/day) ✓
- [ ] FR-9: Payload validation ✓
- [ ] FR-10: Responsive UI ✓

### User Stories Complete
- [ ] "Sign in with Google (@wesleyan.edu)" ✓
- [ ] "Publish a role and see it instantly" ✓
- [ ] "Delete only my posts" ✓
- [ ] "Read all listings without signing in" ✓

### Success Metrics Achieved
- [ ] 100% authenticated users have @wesleyan.edu ✓
- [ ] Post creation ≤90 seconds ✓
- [ ] <1% orphaned/incorrect posts ✓
- [ ] Ready for 50+ users ✓
- [ ] 99.5% uptime capability ✓

### Performance Requirements Met
- [ ] Page load ≤1 second ✓
- [ ] API response ≤300ms ✓
- [ ] Mobile responsive ≥375px ✓
- [ ] WCAG 2.1 AA compliance ✓

### Security Requirements Complete
- [ ] OAuth 2.0 authentication ✓
- [ ] HTTPS enforcement ✓
- [ ] CSRF protection ✓
- [ ] SQL injection protection ✓
- [ ] Domain restriction ✓

## Success Criteria
The implementation is complete when:
1. All functional requirements are verified ✓
2. All user stories can be demonstrated ✓
3. All success metrics are achievable ✓
4. Production deployment is stable ✓
5. Security audit passes ✓

This step-by-step plan ensures each component is thoroughly tested before moving to the next phase, reducing integration issues and ensuring a stable, secure launch within the 3-week timeline. 