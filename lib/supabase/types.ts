export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string // UUID from Supabase auth
          email: string
          name: string | null
          image: string | null
          googleId: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string // Required - uses Supabase auth user ID (UUID)
          email: string
          name?: string | null
          image?: string | null
          googleId?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          googleId?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string // UUID
          userId: string // UUID - references profiles.id
          roleTitle: string
          company: string
          roleType: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'
          roleDesc: string
          contactDetails: string
          isDeleted: boolean
          deletedAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string // UUID
          userId: string // UUID - references profiles.id
          roleTitle: string
          company: string
          roleType: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'
          roleDesc: string
          contactDetails: string
          isDeleted?: boolean
          deletedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string // UUID
          userId?: string // UUID - references profiles.id
          roleTitle?: string
          company?: string
          roleType?: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'COLLABORATIVE_PROJECT' | 'VOLUNTEER' | 'RESEARCH'
          roleDesc?: string
          contactDetails?: string
          isDeleted?: boolean
          deletedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
} 