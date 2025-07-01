export type RoleType = 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'

export interface Post {
  id: string
  userId?: string
  roleTitle: string
  company: string
  companyUrl?: string | null
  roleType: RoleType
  roleDesc: string
  contactEmail?: string
  contactPhone?: string | null
  preferredContactMethod?: 'email' | 'phone' | 'both'
  contactDetails: string
  isDeleted?: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt?: string
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

export interface EditPostForm {
  id?: string
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

export interface ContactTemplateData {
  posterName: string
  roleTitle: string
  company: string
  applicantName?: string
}

export interface ContactActionProps {
  post: {
    id: string
    contactEmail: string
    contactPhone?: string | null
    preferredContactMethod: 'email' | 'phone' | 'both'
    profiles: { name: string | null }[]
    roleTitle: string
    company: string
  }
  currentUserName?: string
} 