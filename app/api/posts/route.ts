import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase'
import { 
  createPostSchema, 
  legacyCreatePostSchema, 
  formatValidationErrors,
  transformLegacyToNew,
  CreatePostRequest,
  LegacyCreatePostRequest 
} from '@/lib/validation'
import { z } from 'zod'

// Rate limiting configuration (10 posts per day per user)
const RATE_LIMIT_POSTS_PER_DAY = 10

// GET /api/posts - Get all posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const offset = (page - 1) * limit
    
    // Filtering parameters
    const search = searchParams.get('search')
    const roleType = searchParams.get('roleType')
    
    // Build query
    let query = supabase
      .from('posts')
      .select(`
        id,
        userId,
        roleTitle,
        company,
        companyUrl,
        roleType,
        roleDesc,
        contactEmail,
        contactPhone,
        preferredContactMethod,
        contactDetails,
        createdAt,
        updatedAt,
        profiles!inner (
          name,
          email
        )
      `, { count: 'exact' })
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false })

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.trim()
      query = query.or(`roleTitle.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,roleDesc.ilike.%${searchTerm}%`)
    }

    // Apply role type filter
    if (roleType && roleType !== 'all') {
      query = query.eq('roleType', roleType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore,
        hasSearch: !!search,
        hasFilter: !!roleType && roleType !== 'all'
      }
    })
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Check rate limiting
    const supabase = createSupabaseAdminClient()
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { count: recentPostCount, error: countError } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('userId', user.id)
      .gte('createdAt', twentyFourHoursAgo.toISOString())

    if (countError) {
      console.error('Error checking rate limit:', countError)
      return NextResponse.json(
        { error: 'Failed to check rate limit' },
        { status: 500 }
      )
    }

    if ((recentPostCount || 0) >= RATE_LIMIT_POSTS_PER_DAY) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `You can only create ${RATE_LIMIT_POSTS_PER_DAY} posts per day. Please try again tomorrow.`,
          resetTime: new Date(twentyFourHoursAgo.getTime() + (24 * 60 * 60 * 1000)).toISOString()
        },
        { status: 429 }
      )
    }

    // Determine if this is legacy format or new format
    const hasNewFields = 'contactEmail' in body || 'companyUrl' in body
    
    let validatedData: CreatePostRequest | LegacyCreatePostRequest
    
    if (hasNewFields) {
      // Use new validation schema
      const validation = createPostSchema.safeParse(body)
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: formatValidationErrors(validation.error)
          },
          { status: 400 }
        )
      }
      
      validatedData = validation.data as CreatePostRequest
    } else {
      // Use legacy validation schema
      const validation = legacyCreatePostSchema.safeParse(body)
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: formatValidationErrors(validation.error)
          },
          { status: 400 }
        )
      }
      
      // Transform legacy data to new format
      validatedData = transformLegacyToNew(validation.data) as CreatePostRequest
    }

    // Create the post
    const postData = {
      userId: user.id,
      roleTitle: validatedData.roleTitle,
      company: validatedData.company,
      companyUrl: (validatedData as CreatePostRequest).companyUrl || null,
      roleType: validatedData.roleType,
      roleDesc: validatedData.roleDesc,
      contactEmail: (validatedData as CreatePostRequest).contactEmail || '',
      contactPhone: (validatedData as CreatePostRequest).contactPhone || null,
      preferredContactMethod: (validatedData as CreatePostRequest).preferredContactMethod || 'email',
      contactDetails: (validatedData as CreatePostRequest).contactDetails || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    }

    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert(postData)
      .select(`
        id,
        userId,
        roleTitle,
        company,
        companyUrl,
        roleType,
        roleDesc,
        contactEmail,
        contactPhone,
        preferredContactMethod,
        contactDetails,
        createdAt,
        updatedAt,
        profiles!inner (
          name,
          email
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating post:', insertError)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 