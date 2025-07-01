# WesCollab Codebase Cleanup Implementation Guide

## Overview
This document outlines the step-by-step implementation plan for cleaning up and modernizing the WesCollab codebase. The goal is to consolidate components, remove legacy code, and improve overall code quality.

## Prerequisites
- Ensure you have the latest Next.js 14 installed
- Back up your current codebase
- Create a new feature branch: `feature/codebase-cleanup`

## Phase 1: Component Organization (Days 1-2)

### Step 1: Create New Directory Structure
```bash
mkdir -p app/_components/{posts,ui,auth,layout}
```

### Step 2: Component Migration Checklist

#### 2.1 Move Post Components
- [ ] Move and rename contact actions:
  ```bash
  mv components/posts/ContactActions.tsx app/_components/posts/contact-actions.tsx
  ```
  - Update imports in all files using ContactActions
  - Update component name to follow kebab-case
  - Remove LegacyContactDisplay export

- [ ] Move and rename post card:
  ```bash
  mv components/posts/EnhancedPostCard.tsx app/_components/posts/enhanced-post-card.tsx
  ```
  - Update imports in all files using EnhancedPostCard
  - Remove legacy contact handling
  - Update to use new contact system exclusively

#### 2.2 Update Import Statements
Example of updated imports:
```typescript
// Old
import ContactActions from '@/components/posts/ContactActions'
import EnhancedPostCard from '@/components/posts/EnhancedPostCard'

// New
import ContactActions from '@/app/_components/posts/contact-actions'
import EnhancedPostCard from '@/app/_components/posts/enhanced-post-card'
```

## Phase 2: Legacy Code Cleanup (Days 3-4)

### Step 1: Remove Legacy Contact System

#### 1.1 Update contact-actions.tsx
```typescript
// Remove these exports/components
- LegacyContactDisplay
- ContactActionsBrief (if not using)

// Keep only
- ContactActions (main component)
- generateContactActions (utility)
```

#### 1.2 Clean Up Validation (lib/validation.ts)
Remove:
```typescript
- legacyCreatePostSchema
- transformLegacyToNew
- transformNewToLegacy
- getValidationSchema
```

Keep only the new schema:
```typescript
export const createPostSchema = z.object({
  roleTitle: z.string().min(1).max(200),
  company: z.string().min(1).max(100),
  companyUrl: z.string().url().optional(),
  roleType: roleTypeEnum,
  roleDesc: z.string().min(1).max(2000),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'both'])
})
```

### Step 2: Update API Routes
Files to update:
- [ ] app/api/posts/route.ts
- [ ] app/api/posts/[id]/route.ts

Remove legacy support:
```typescript
// Remove
if (isLegacyFormat) {
  // legacy handling
}

// Keep only new format handling
const post = await createPostSchema.parse(data)
```

## Phase 3: Page Updates (Days 5-6)

### Step 1: Update My Posts Page
File: app/my-posts/page.tsx
```typescript
// Remove
import { LegacyContactDisplay } from '@/components/posts/ContactActions'

// Add
import { EnhancedPostCard } from '@/app/_components/posts/enhanced-post-card'
```

### Step 2: Update Opportunities Page
File: app/opportunities/page.tsx
- Add enhanced filtering
- Implement new contact features
- Update to new component imports

### Step 3: Update Create Post Page
File: app/create-post/page.tsx
- Add new form fields
- Use new validation schema
- Add contact preference selection

## Phase 4: UI Standardization (Days 7-8)

### Step 1: Create UI Components
Create base components in app/_components/ui:

```typescript
// button.tsx
export const Button = ({
  variant = 'default',
  size = 'default',
  children,
  ...props
}: ButtonProps) => {
  // Implementation
}

// Similar for other components
```

### Step 2: Update Styling
Update globals.css:
```css
@layer base {
  :root {
    --primary: 348 100% 40%; /* Wesleyan red */
    --primary-foreground: 210 40% 98%;
    /* Add other variables */
  }
}
```

## Phase 5: Type Safety (Day 9)

### Step 1: Update Post Types
File: types/post.ts
```typescript
export interface Post {
  id: string
  roleTitle: string
  company: string
  companyUrl?: string
  roleType: RoleType
  roleDesc: string
  contactEmail: string
  contactPhone?: string
  preferredContactMethod: 'email' | 'phone' | 'both'
  createdAt: string
  updatedAt: string
  profiles: Profile[]
}

// Remove legacy interfaces
```

### Step 2: Add Error Boundaries
Create app/_components/error-boundary.tsx:
```typescript
'use client'

export function ErrorBoundary({
  children,
  fallback
}: {
  children: React.ReactNode
  fallback: React.ReactNode
}) {
  // Implementation
}
```

## Phase 6: Documentation (Day 10)

### Step 1: Update Component Documentation
Add JSDoc comments to all components:
```typescript
/**
 * ContactActions component for handling user interactions with posts
 * @param {Post} post - The post to display contact actions for
 * @param {string} [applicantName] - Optional name of the applicant
 * @param {string} [className] - Optional CSS class name
 * @param {boolean} [compact=false] - Whether to show compact version
 */
```

### Step 2: Create Usage Examples
Add example usage in README.md:
```markdown
## Contact Features
The new contact system provides one-click actions:
- Email templates
- Phone calls
- SMS messaging
- WhatsApp integration
```

## Testing Checklist

### Component Tests
- [ ] ContactActions renders correctly
- [ ] EnhancedPostCard displays all fields
- [ ] Form validation works
- [ ] Error boundaries catch issues

### Integration Tests
- [ ] Create post flow works
- [ ] Contact actions trigger correctly
- [ ] Filtering and search work
- [ ] Dark mode functions properly

### Performance Tests
- [ ] Page load time < 1s
- [ ] No console errors
- [ ] Memory usage stable

## Deployment Steps

1. Create deployment branch:
```bash
git checkout -b deploy/codebase-cleanup
```

2. Run final checks:
```bash
npm run lint
npm run test
npm run build
```

3. Deploy to staging
4. Test all features
5. Deploy to production

## Rollback Plan

If issues occur:
1. Revert to previous stable version
2. Restore legacy components temporarily
3. Fix issues in separate branch
4. Re-deploy when stable

## Success Metrics

Track these metrics before and after cleanup:
- Bundle size
- Page load time
- Lighthouse scores
- Error rates
- User engagement

## Support

For questions or issues:
- Check the inline documentation
- Refer to component examples
- Contact the development team

Remember to:
- Commit frequently
- Test after each phase
- Document all changes
- Monitor error rates
- Back up data before migrations 