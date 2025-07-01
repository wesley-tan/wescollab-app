import { z } from 'zod'

// URL validation regex - accepts http/https with or without www
const urlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/

// Phone validation regex - supports international formats
const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,}$/

// Role type enum for validation
const roleTypeEnum = z.enum(['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'COLLABORATIVE_PROJECT', 'VOLUNTEER', 'RESEARCH'])

export const createPostSchema = z.object({
  roleTitle: z.string()
    .min(1, "Role title is required")
    .max(200, "Role title must be 200 characters or less")
    .trim(),
  
  company: z.string()
    .min(1, "Company name is required")
    .max(100, "Company name must be 100 characters or less")
    .trim(),
  
  companyUrl: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val)
    .refine((url) => !url || urlRegex.test(url), {
      message: "Please enter a valid URL (e.g., https://company.com)"
    }),
  
  roleType: roleTypeEnum,
  
  roleDesc: z.string()
    .min(1, "Role description is required")
    .max(2000, "Role description must be 2000 characters or less")
    .trim(),
  
  contactEmail: z.string()
    .min(1, "Contact email is required")
    .email("Please enter a valid email address")
    .trim(),
  
  contactPhone: z.string()
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val)
    .refine((phone) => !phone || phoneRegex.test(phone), {
      message: "Please enter a valid phone number (e.g., +1 (555) 123-4567)"
    }),
  
  preferredContactMethod: z.enum(['email', 'phone', 'both'])
    .default('email'),
  
  contactDetails: z.string()
    .max(500, "Additional contact details must be 500 characters or less")
    .optional()
    .default("")
    .transform(val => val || "")
})

export const editPostSchema = createPostSchema.extend({
  id: z.string().uuid("Invalid post ID")
})

// Legacy schema for backward compatibility during migration
export const legacyCreatePostSchema = z.object({
  roleTitle: z.string()
    .min(1, "Role title is required")
    .max(200, "Role title must be 200 characters or less")
    .trim(),
  
  company: z.string()
    .min(1, "Company name is required")
    .max(100, "Company name must be 100 characters or less")
    .trim(),
  
  roleType: roleTypeEnum,
  
  roleDesc: z.string()
    .min(1, "Role description is required")
    .max(2000, "Role description must be 2000 characters or less")
    .trim(),
  
  contactDetails: z.string()
    .min(1, "Contact details are required")
    .max(500, "Contact details must be 500 characters or less")
    .trim()
})

// Helper function to determine which schema to use
export const getValidationSchema = (hasNewFields: boolean) => {
  return hasNewFields ? createPostSchema : legacyCreatePostSchema
}

// Transform legacy data to new format
export const transformLegacyToNew = (legacyData: any) => {
  return {
    ...legacyData,
    contactEmail: legacyData.contactDetails || '',
    contactPhone: undefined,
    preferredContactMethod: 'email' as const,
    companyUrl: undefined,
    contactDetails: '' // Clear since we moved it to contactEmail
  }
}

// Transform new data to legacy format (for backward compatibility)
export const transformNewToLegacy = (newData: any) => {
  return {
    roleTitle: newData.roleTitle,
    company: newData.company,
    roleType: newData.roleType,
    roleDesc: newData.roleDesc,
    contactDetails: newData.contactEmail || newData.contactDetails || ''
  }
}

// Validation error formatter
export const formatValidationErrors = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }))
}

// Type exports
export type CreatePostRequest = z.infer<typeof createPostSchema>
export type EditPostRequest = z.infer<typeof editPostSchema>
export type LegacyCreatePostRequest = z.infer<typeof legacyCreatePostSchema>

// Validation utility functions
export const validateUrl = (url: string): boolean => {
  return urlRegex.test(url)
}

export const validatePhone = (phone: string): boolean => {
  return phoneRegex.test(phone)
}

export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success
}

// Contact method validation
export const isValidContactMethod = (method: string): method is 'email' | 'phone' | 'both' => {
  return ['email', 'phone', 'both'].includes(method)
} 