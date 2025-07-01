import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase'
import { 
  editPostSchema, 
  legacyCreatePostSchema, 
  formatValidationErrors,
  transformLegacyToNew,
  EditPostRequest,
  LegacyCreatePostRequest 
} from '@/lib/validation'

interface RouteParams {
  params: { id: string }
}

// GET /api/posts/[id] - Get individual post
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createSupabaseAdminClient()
    
    const { data: post, error } = await supabase
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
      `)
      .eq('id', params.id)
      .eq('isDeleted', false)
      .single()

    if (error || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Update post (owner only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
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
    
    // Add the ID to the body for validation
    const bodyWithId = { ...body, id: params.id }
    
    // Determine if this is legacy format or new format
    const hasNewFields = 'contactEmail' in body || 'companyUrl' in body
    
    let validatedData: EditPostRequest | (LegacyCreatePostRequest & { id: string })
    
    if (hasNewFields) {
      // Use new validation schema
      const validation = editPostSchema.safeParse(bodyWithId)
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: formatValidationErrors(validation.error)
          },
          { status: 400 }
        )
      }
      
      validatedData = validation.data
    } else {
      // Use legacy validation schema with ID added
      const legacySchemaWithId = legacyCreatePostSchema.extend({
        id: editPostSchema.shape.id
      })
      
      const validation = legacySchemaWithId.safeParse(bodyWithId)
      
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
      validatedData = {
        ...transformLegacyToNew(validation.data),
        id: validation.data.id
      } as EditPostRequest
    }

    const supabase = createSupabaseAdminClient()

    // Check if post exists and user owns it
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('userId, isDeleted')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.isDeleted) {
      return NextResponse.json(
        { error: 'Cannot edit deleted post' },
        { status: 400 }
      )
    }

    if (existingPost.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      )
    }

    // Update the post
    const updateData = {
      roleTitle: validatedData.roleTitle,
      company: validatedData.company,
      companyUrl: (validatedData as EditPostRequest).companyUrl || null,
      roleType: validatedData.roleType,
      roleDesc: validatedData.roleDesc,
      contactEmail: (validatedData as EditPostRequest).contactEmail || '',
      contactPhone: (validatedData as EditPostRequest).contactPhone || null,
      preferredContactMethod: (validatedData as EditPostRequest).preferredContactMethod || 'email',
      contactDetails: (validatedData as EditPostRequest).contactDetails || '',
      updatedAt: new Date().toISOString()
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', params.id)
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

    if (updateError) {
      console.error('Error updating post:', updateError)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Soft delete post (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabaseServer = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseAdminClient()

    // Check if post exists and user owns it
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('userId, isDeleted')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.isDeleted) {
      return NextResponse.json(
        { error: 'Post already deleted' },
        { status: 400 }
      )
    }

    if (existingPost.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      )
    }

    // Soft delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .update({
        isDeleted: true,
        deletedAt: new Date().toISOString()
      })
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Post deleted successfully',
      postId: params.id 
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
} 