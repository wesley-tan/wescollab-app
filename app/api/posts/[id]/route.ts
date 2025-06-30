import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase'

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
        roleType,
        roleDesc,
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
    const { roleTitle, company, roleType, roleDesc, contactDetails } = body

    // Validate required fields
    if (!roleTitle?.trim() || !company?.trim() || !roleType || !roleDesc?.trim() || !contactDetails?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate length limits
    if (roleTitle.length > 200) {
      return NextResponse.json(
        { error: 'Role title must be 200 characters or less' },
        { status: 400 }
      )
    }

    if (roleDesc.length > 2000) {
      return NextResponse.json(
        { error: 'Role description must be 2000 characters or less' },
        { status: 400 }
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
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        roleTitle: roleTitle.trim(),
        company: company.trim(),
        roleType,
        roleDesc: roleDesc.trim(),
        contactDetails: contactDetails.trim(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        id,
        userId,
        roleTitle,
        company,
        roleType,
        roleDesc,
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