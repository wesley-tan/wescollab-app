const { createSupabaseAdminClient } = require('../lib/supabase')

async function debugPosts() {
  try {
    console.log('🔍 Debugging Posts\n')
    
    const supabase = createSupabaseAdminClient()
    
    // Get all posts with profile info
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        roleTitle,
        company,
        isDeleted,
        createdAt,
        userId,
        profiles (
          id,
          name,
          email
        )
      `)
      .order('createdAt', { ascending: false })
    
    if (postsError) {
      throw postsError
    }

    console.log('📊 Posts Overview:')
    console.log('------------------')
    console.log(`Total Posts: ${posts.length}`)
    console.log(`Active Posts: ${posts.filter(p => !p.isDeleted).length}`)
    console.log(`Deleted Posts: ${posts.filter(p => p.isDeleted).length}`)
    console.log(`Posts without Profiles: ${posts.filter(p => !p.profiles).length}`)
    console.log('\n')

    console.log('📝 Post Details:')
    console.log('--------------')
    posts.forEach(post => {
      console.log(`ID: ${post.id}`)
      console.log(`Title: ${post.roleTitle}`)
      console.log(`Company: ${post.company}`)
      console.log(`Status: ${post.isDeleted ? 'Deleted' : 'Active'}`)
      console.log(`Created: ${new Date(post.createdAt).toLocaleString()}`)
      console.log(`Author: ${post.profiles?.name || 'Unknown'} (${post.profiles?.email || 'No email'})`)
      console.log('---')
    })

    // Check for orphaned posts (no profile)
    const orphanedPosts = posts.filter(p => !p.profiles)
    if (orphanedPosts.length > 0) {
      console.log('\n⚠️ Found Orphaned Posts:')
      console.log('----------------------')
      orphanedPosts.forEach(post => {
        console.log(`ID: ${post.id}`)
        console.log(`Title: ${post.roleTitle}`)
        console.log(`UserId: ${post.userId}`)
        console.log('---')
      })
    }

  } catch (error) {
    console.error('Error debugging posts:', error)
  }
}

debugPosts() 