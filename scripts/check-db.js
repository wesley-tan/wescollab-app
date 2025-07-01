require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabase() {
  try {
    console.log('🔍 Checking Database State\n')

    // Get all posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
    
    if (postsError) throw postsError
    
    console.log('Posts found:', posts.length)
    console.log('\nPost Details:')
    posts.forEach(post => {
      console.log('-------------------')
      console.log('ID:', post.id)
      console.log('Title:', post.roleTitle)
      console.log('Company:', post.company)
      console.log('Is Deleted:', post.isDeleted)
      console.log('User ID:', post.userId)
      console.log('Created:', new Date(post.createdAt).toLocaleString())
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

checkDatabase() 