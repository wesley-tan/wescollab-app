# 🚀 Enhanced Contact & Company Features Implementation Plan

## 📋 **Overview**

This plan implements three key enhancements to job/role cards to reduce friction and improve user engagement:

1. **Company Links** - Allow job posters to add clickable company/venture website links
2. **Multiple Contact Methods** - Separate email and phone number fields instead of generic contact details
3. **One-Click Contact Templates** - Pre-filled email drafts and SMS/iMessage links for instant outreach

## 🎯 **Expected Outcomes**

- **📈 Contact Rate**: +75% increase in successful user connections
- **⚡ Reduced Friction**: 3-click process → 1-click contact initiation  
- **🔗 Professional Presence**: Direct company website access
- **📱 Mobile Optimization**: Native SMS/email app integration

---

## 🗄️ **Phase 1: Database Schema Enhancement**

### **1.1 Database Migration**

**File**: `scripts/enhance-contact-schema.sql`

```sql
-- Add new contact and company fields to posts table
ALTER TABLE "posts" 
ADD COLUMN "companyUrl" TEXT,
ADD COLUMN "contactEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "preferredContactMethod" TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both'));

-- Update existing posts to migrate contactDetails to contactEmail
UPDATE "posts" 
SET "contactEmail" = "contactDetails" 
WHERE "contactDetails" IS NOT NULL;

-- Create validation constraints
ALTER TABLE "posts" 
ADD CONSTRAINT "valid_email" CHECK (
  "contactEmail" = '' OR "contactEmail" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

ALTER TABLE "posts" 
ADD CONSTRAINT "valid_phone" CHECK (
  "contactPhone" IS NULL OR "contactPhone" ~* '^[\+]?[\d\s\-\(\)]{7,}$'
);

ALTER TABLE "posts" 
ADD CONSTRAINT "valid_url" CHECK (
  "companyUrl" IS NULL OR "companyUrl" ~* '^https?://.*'
);

-- Create indexes for performance
CREATE INDEX "posts_contact_email_idx" ON "posts"("contactEmail");
CREATE INDEX "posts_company_url_idx" ON "posts"("companyUrl") WHERE "companyUrl" IS NOT NULL;

-- Update existing contactDetails to be not null but allow empty string
ALTER TABLE "posts" ALTER COLUMN "contactDetails" SET DEFAULT '';
```

### **1.2 Prisma Schema Update**

**File**: `prisma/schema.prisma`

```prisma
model Post {
  id                    String    @id @default(cuid())
  userId                String
  roleTitle             String    @db.VarChar(200)
  company               String
  companyUrl            String?   // New: Company website link
  roleType              RoleType
  roleDesc              String    @db.VarChar(2000)
  
  // Enhanced contact fields
  contactEmail          String    @default("") // Primary contact email
  contactPhone          String?   // Optional phone number
  preferredContactMethod String   @default("email") // 'email', 'phone', 'both'
  contactDetails        String    @default("") // Legacy field, kept for additional notes
  
  isDeleted             Boolean   @default(false)
  deletedAt             DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relationships
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([userId])
  @@index([roleType])
  @@index([isDeleted, createdAt])
  @@index([contactEmail])
  @@map("posts")
}
```

### **1.3 TypeScript Interface Updates**

**File**: `types/post.ts`

```typescript
export interface Post {
  id: string
  userId: string
  roleTitle: string
  company: string
  companyUrl?: string
  roleType: RoleType
  roleDesc: string
  contactEmail: string
  contactPhone?: string
  preferredContactMethod: 'email' | 'phone' | 'both'
  contactDetails: string // Additional contact notes
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  profiles: {
    name: string | null
    email: string
  }[]
}

export interface CreatePostForm {
  roleTitle: string
  company: string
  companyUrl: string
  roleType: RoleType
  roleDesc: string
  contactEmail: string
  contactPhone: string
  preferredContactMethod: 'email' | 'phone' | 'both'
  contactDetails: string
}
```

---

## 🛠️ **Phase 2: Backend API Enhancement**

### **2.1 Enhanced Validation Schema**

**File**: `lib/validation.ts`

```typescript
import { z } from 'zod'

// URL validation regex
const urlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/

// Phone validation (international format)
const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/

export const createPostSchema = z.object({
  roleTitle: z.string()
    .min(1, "Role title is required")
    .max(200, "Role title must be 200 characters or less"),
  
  company: z.string()
    .min(1, "Company name is required")
    .max(100, "Company name must be 100 characters or less"),
  
  companyUrl: z.string()
    .optional()
    .refine((url) => !url || urlRegex.test(url), {
      message: "Please enter a valid URL (e.g., https://company.com)"
    }),
  
  roleType: z.enum(['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'COLLABORATIVE_PROJECT', 'VOLUNTEER', 'RESEARCH']),
  
  roleDesc: z.string()
    .min(1, "Role description is required")
    .max(2000, "Role description must be 2000 characters or less"),
  
  contactEmail: z.string()
    .email("Please enter a valid email address")
    .min(1, "Contact email is required"),
  
  contactPhone: z.string()
    .optional()
    .refine((phone) => !phone || phoneRegex.test(phone), {
      message: "Please enter a valid phone number"
    }),
  
  preferredContactMethod: z.enum(['email', 'phone', 'both']).default('email'),
  
  contactDetails: z.string()
    .max(500, "Additional contact details must be 500 characters or less")
    .optional()
    .default("")
})

export type CreatePostRequest = z.infer<typeof createPostSchema>
```

---

## 🔗 **Phase 3: One-Click Contact System**

### **3.1 Contact Utilities**

**File**: `lib/contact-utils.ts`

```typescript
export interface ContactTemplateData {
  posterName: string
  roleTitle: string
  company: string
  applicantName?: string
}

/**
 * Generate pre-filled email template URL for Gmail/default email client
 */
export const generateEmailTemplate = (
  contactEmail: string, 
  templateData: ContactTemplateData
): string => {
  const subject = `Interest in ${templateData.roleTitle} at ${templateData.company}`
  
  const body = `Hi ${templateData.posterName || 'there'},

I hope this email finds you well. I'm writing to express my interest in the ${templateData.roleTitle} position at ${templateData.company} that you posted on WesCollab.

I'm a member of the Wesleyan community and would love to learn more about this opportunity. Could we schedule a brief conversation to discuss the role and how my background might be a good fit?

Thank you for your time, and I look forward to hearing from you.

Best regards,
${templateData.applicantName || '[Your Name]'}

---
Found on WesCollab - Wesleyan University Venture Board
`

  // Create mailto link with pre-filled content
  const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  
  return mailtoUrl
}

/**
 * Generate SMS/iMessage template URL
 */
export const generateSMSTemplate = (
  phoneNumber: string,
  templateData: ContactTemplateData
): string => {
  const message = `Hi ${templateData.posterName || 'there'}! I'm interested in the ${templateData.roleTitle} position at ${templateData.company} from WesCollab. Could we chat about this opportunity? Thanks!`
  
  // Remove all non-digit characters from phone number for SMS
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  
  // iOS and Android support sms: protocol
  const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`
  
  return smsUrl
}

/**
 * Detect user's operating system for appropriate contact method
 */
export const getContactMethod = () => {
  if (typeof window === 'undefined') return 'web'
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios'
  if (/android/.test(userAgent)) return 'android'
  
  return 'web'
}

/**
 * Track contact interactions for analytics
 */
export const trackContactInteraction = async (
  postId: string,
  contactMethod: 'email' | 'phone',
  contactType: 'template' | 'copy'
) => {
  try {
    await fetch('/api/analytics/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        contactMethod,
        contactType,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Failed to track contact interaction:', error)
  }
}
```

### **3.2 Enhanced Contact Component**

**File**: `components/ContactActions.tsx`

```typescript
import { useState } from 'react'
import { Copy, Mail, Phone, ExternalLink } from 'lucide-react'
import { 
  generateEmailTemplate, 
  generateSMSTemplate, 
  trackContactInteraction,
  getContactMethod 
} from '@/lib/contact-utils'

interface ContactActionsProps {
  post: {
    id: string
    contactEmail: string
    contactPhone?: string
    preferredContactMethod: 'email' | 'phone' | 'both'
    profiles: { name: string | null }[]
    roleTitle: string
    company: string
  }
  currentUserName?: string
}

export const ContactActions = ({ post, currentUserName }: ContactActionsProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const posterName = post.profiles?.[0]?.name || 'the poster'
  const contactMethod = getContactMethod()

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      
      await trackContactInteraction(post.id, field as 'email' | 'phone', 'copy')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleEmailTemplate = async () => {
    const emailUrl = generateEmailTemplate(post.contactEmail, {
      posterName,
      roleTitle: post.roleTitle,
      company: post.company,
      applicantName: currentUserName
    })
    
    window.open(emailUrl, '_blank')
    await trackContactInteraction(post.id, 'email', 'template')
  }

  const handleSMSTemplate = async () => {
    if (!post.contactPhone) return
    
    const smsUrl = generateSMSTemplate(post.contactPhone, {
      posterName,
      roleTitle: post.roleTitle,
      company: post.company,
      applicantName: currentUserName
    })
    
    window.open(smsUrl, '_blank')
    await trackContactInteraction(post.id, 'phone', 'template')
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="space-y-3">
        {/* Contact Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Contact Information</h4>
          {post.preferredContactMethod !== 'email' && (
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
              {post.preferredContactMethod === 'phone' ? 'Phone Preferred' : 'Email or Phone'}
            </span>
          )}
        </div>

        {/* Email Contact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-mono">
                {post.contactEmail}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(post.contactEmail, 'email')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy email"
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          
          <button
            onClick={handleEmailTemplate}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>Send Email Template</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        {/* Phone Contact (if available) */}
        {post.contactPhone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-mono">
                  {post.contactPhone}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(post.contactPhone!, 'phone')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy phone number"
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            
            {contactMethod !== 'web' && (
              <button
                onClick={handleSMSTemplate}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Send Message Template</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Copy Success Indicator */}
        {copiedField && (
          <div className="text-xs text-green-600 text-center">
            ✓ {copiedField === 'email' ? 'Email' : 'Phone number'} copied to clipboard
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 🎨 **Phase 4: Enhanced Form Implementation**

### **4.1 Enhanced Create Post Form**

**File**: `app/create-post/page.tsx` (Key additions)

```typescript
// Add to existing form state
const [form, setForm] = useState<CreatePostForm>({
  roleTitle: '',
  company: '',
  companyUrl: '',
  roleType: 'INTERNSHIP',
  roleDesc: '',
  contactEmail: '',
  contactPhone: '',
  preferredContactMethod: 'email',
  contactDetails: ''
})

// Auto-fill contact email with user's email
useEffect(() => {
  if (user?.email) {
    setForm(prev => ({
      ...prev,
      contactEmail: user.email
    }))
  }
}, [user])

// Add these form fields to existing form JSX:
{/* NEW: Company Website Field */}
<div>
  <label htmlFor="companyUrl" className="block text-sm font-medium text-foreground mb-2">
    Company Website <span className="text-muted-foreground">(Optional)</span>
  </label>
  <input
    type="url"
    id="companyUrl"
    name="companyUrl"
    value={form.companyUrl}
    onChange={handleChange}
    placeholder="https://company.com"
    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
  />
  <p className="text-xs text-muted-foreground mt-1">
    Add your company or project website for more information
  </p>
</div>

{/* NEW: Contact Information Section */}
<div className="border rounded-lg p-4 space-y-4">
  <h3 className="text-lg font-medium text-foreground">Contact Information</h3>
  
  {/* Contact Email */}
  <div>
    <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-2">
      Contact Email *
    </label>
    <input
      type="email"
      id="contactEmail"
      name="contactEmail"
      value={form.contactEmail}
      onChange={handleChange}
      placeholder="your.email@wesleyan.edu"
      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      required
    />
  </div>

  {/* Contact Phone */}
  <div>
    <label htmlFor="contactPhone" className="block text-sm font-medium text-foreground mb-2">
      Phone Number <span className="text-muted-foreground">(Optional)</span>
    </label>
    <input
      type="tel"
      id="contactPhone"
      name="contactPhone"
      value={form.contactPhone}
      onChange={handleChange}
      placeholder="+1 (555) 123-4567"
      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    />
  </div>

  {/* Preferred Contact Method */}
  <div>
    <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-foreground mb-2">
      Preferred Contact Method
    </label>
    <select
      id="preferredContactMethod"
      name="preferredContactMethod"
      value={form.preferredContactMethod}
      onChange={handleChange}
      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    >
      <option value="email">Email preferred</option>
      <option value="phone">Phone preferred</option>
      <option value="both">Either email or phone</option>
    </select>
  </div>

  {/* Additional Contact Details */}
  <div>
    <label htmlFor="contactDetails" className="block text-sm font-medium text-foreground mb-2">
      Additional Contact Notes <span className="text-muted-foreground">(Optional)</span>
    </label>
    <textarea
      id="contactDetails"
      name="contactDetails"
      value={form.contactDetails}
      onChange={handleChange}
      placeholder="Best times to contact, LinkedIn profile, etc."
      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      rows={2}
      maxLength={500}
    />
    <p className="text-xs text-muted-foreground mt-1">
      {form.contactDetails.length}/500 characters
    </p>
  </div>
</div>
```

---

## 📱 **Phase 5: Enhanced Job Card Display**

### **5.1 Updated PostCard Component**

**File**: Update existing PostCard components to include:

```typescript
// Add to existing PostCard component
import { ExternalLink, Building, Calendar } from 'lucide-react'
import { ContactActions } from './ContactActions'

// In the company display section, replace existing company display with:
{/* Enhanced Company Display with Link */}
<div className="flex items-center space-x-2">
  <Building className="h-4 w-4 text-primary" />
  {post.companyUrl ? (
    <a
      href={post.companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary font-medium hover:text-primary/80 transition-colors flex items-center space-x-1"
    >
      <span>{post.company}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  ) : (
    <span className="text-primary font-medium">{post.company}</span>
  )}
</div>

// Replace existing contact details section with:
{/* Enhanced Contact Actions */}
<ContactActions 
  post={post} 
  currentUserName={currentUserName}
/>
```

---

## 📊 **Phase 6: Analytics & Tracking**

### **6.1 Contact Analytics API**

**File**: `app/api/analytics/contact/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

// First, create the analytics table
// ALTER TABLE: CREATE TABLE contact_analytics (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   post_id uuid REFERENCES posts(id),
//   contact_method text NOT NULL,
//   contact_type text NOT NULL,
//   user_agent text,
//   created_at timestamptz DEFAULT NOW()
// );

export async function POST(request: NextRequest) {
  try {
    const { postId, contactMethod, contactType } = await request.json()
    
    const supabase = createSupabaseAdminClient()
    
    // Store contact interaction
    const { error } = await supabase
      .from('contact_analytics')
      .insert({
        post_id: postId,
        contact_method: contactMethod,
        contact_type: contactType,
        user_agent: request.headers.get('user-agent'),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Analytics error:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact analytics error:', error)
    return NextResponse.json({ error: 'Failed to track interaction' }, { status: 500 })
  }
}
```

---

## ✅ **Implementation Checklist**

### **Phase 1: Database Setup** (1-2 days)
- [ ] Create and run database migration script
- [ ] Update Prisma schema  
- [ ] Update TypeScript interfaces
- [ ] Test database constraints and validation
- [ ] Migrate existing `contactDetails` data to new `contactEmail` field

### **Phase 2: Backend Enhancement** (2-3 days)
- [ ] Create enhanced validation schema (`lib/validation.ts`)
- [ ] Update API routes to handle new fields
- [ ] Update create post API endpoint 
- [ ] Update edit post API endpoint
- [ ] Add comprehensive error handling
- [ ] Test all API endpoints with new schema

### **Phase 3: Contact System** (3-4 days)
- [ ] Create contact utilities (`lib/contact-utils.ts`)
- [ ] Build ContactActions component
- [ ] Implement email template generation
- [ ] Implement SMS template generation  
- [ ] Add cross-platform compatibility
- [ ] Test email client integration (Gmail, Outlook, Apple Mail)
- [ ] Test SMS integration (iOS Messages, Android Messages)

### **Phase 4: Form Enhancement** (2-3 days)
- [ ] Update create post form with new fields
- [ ] Update edit post form with new fields
- [ ] Add client-side validation
- [ ] Add auto-fill functionality for user email
- [ ] Test form submission with all new fields
- [ ] Add responsive design for mobile

### **Phase 5: UI Enhancement** (2-3 days)
- [ ] Update all PostCard components
- [ ] Add company link display with external link icon
- [ ] Integrate ContactActions component
- [ ] Update dashboard posts display
- [ ] Update opportunities page display
- [ ] Update my-posts page display
- [ ] Test responsive design across devices

### **Phase 6: Mobile Optimization** (1-2 days)
- [ ] Add mobile-specific contact actions
- [ ] Test on iOS Safari and Chrome
- [ ] Test on Android Chrome and Samsung Browser
- [ ] Optimize touch interactions
- [ ] Test native app integrations (Phone, Messages, Mail)

### **Phase 7: Analytics & Testing** (1-2 days)
- [ ] Create contact analytics table
- [ ] Implement analytics API endpoint
- [ ] Add contact interaction tracking
- [ ] Test analytics data collection
- [ ] Create simple analytics dashboard (optional)

### **Phase 8: Migration & Deployment** (1 day)
- [ ] Run database migration in production
- [ ] Deploy updated code to staging
- [ ] Test end-to-end functionality in staging
- [ ] Deploy to production
- [ ] Monitor for errors and user feedback

---

## 🎯 **Success Metrics**

### **Engagement Metrics**
- **Contact Interaction Rate**: Target 25%+ (from estimated 5% baseline)
- **Email Template Usage**: Target 60%+ of email contacts
- **SMS Template Usage**: Target 40%+ of phone contacts
- **Company Link Clicks**: Target 30%+ click-through rate

### **User Experience Metrics**
- **Time to Contact**: Target <10 seconds (from ~60 seconds)
- **Contact Method Completion Rate**: Target 80%+
- **Mobile Contact Usage**: Target 50%+ of mobile users
- **User Satisfaction**: Target 4.5/5 rating for contact experience

### **Business Metrics**
- **Successful Connections**: Target +75% increase
- **User Retention**: Target +20% increase
- **Platform Engagement**: Target +40% session duration increase
- **Daily Active Users**: Target +30% increase

---

## 🚀 **Future Enhancements** (Phase 9+)

### **Advanced Contact Features**
- **Calendar Integration**: Schedule meetings directly through the platform
- **LinkedIn Integration**: Auto-populate profiles and enable LinkedIn messaging
- **Video Call Scheduling**: Integrate with Zoom/Google Meet for instant meetings
- **Contact History**: Track communication history between users
- **Automated Follow-ups**: Reminder system for follow-up communications
- **CRM Integration**: For businesses to manage multiple candidate communications

### **Smart Features**
- **AI-Powered Templates**: Dynamic email/SMS templates based on role type and company
- **Contact Preferences**: User-defined preferred contact times and methods
- **Contact Success Tracking**: Analytics on which contact methods lead to successful connections
- **Smart Recommendations**: Suggest optimal contact times based on response patterns

---

This comprehensive implementation plan will transform WesCollab's contact experience from a basic text field to a sophisticated, frictionless communication system that dramatically improves user engagement and successful connections within the Wesleyan community. 