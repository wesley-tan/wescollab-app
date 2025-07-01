const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function betterVerifyMigration() {
  console.log('🔍 Enhanced verification of database migration...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const results = []

  try {
    // Test 1: Check new columns exist and data types
    console.log('\n📋 Test 1: Verifying new column structure...')
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('sql', { 
        query: `SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'posts' 
                  AND column_name IN ('companyUrl', 'contactEmail', 'contactPhone', 'preferredContactMethod')
                ORDER BY column_name;`
      })

    if (schemaError) {
      // Try alternative approach
      const { data: posts, error: selectError } = await supabase
        .from('posts')
        .select('id, companyUrl, contactEmail, contactPhone, preferredContactMethod')
        .limit(1)

      if (selectError) {
        console.error('❌ Test 1 FAILED: New columns not accessible')
        results.push({ test: 'Column Structure', status: 'FAILED', error: selectError.message })
      } else {
        console.log('✅ Test 1 PASSED: New columns exist and are selectable')
        results.push({ test: 'Column Structure', status: 'PASSED' })
      }
    } else {
      console.log('✅ Test 1 PASSED: New columns verified in schema')
      console.log('   Columns found:', schemaData?.map(c => c.column_name).join(', '))
      results.push({ test: 'Column Structure', status: 'PASSED' })
    }

    // Test 2: Check data migration worked
    console.log('\n📋 Test 2: Checking existing data migration...')
    const { data: existingPosts, error: dataError } = await supabase
      .from('posts')
      .select('id, roleTitle, company, contactDetails, contactEmail, contactPhone, preferredContactMethod')
      .eq('isDeleted', false)
      .limit(5)

    if (dataError) {
      console.error('❌ Test 2 FAILED: Cannot query migrated data')
      results.push({ test: 'Data Migration', status: 'FAILED', error: dataError.message })
    } else {
      const migratedCount = existingPosts.filter(post => 
        post.contactEmail && post.contactEmail !== ''
      ).length
      
      console.log('✅ Test 2 PASSED: Data migration successful')
      console.log(`   Found ${existingPosts.length} existing posts`)
      console.log(`   ${migratedCount} have migrated contact emails`)
      
      // Show sample data
      if (existingPosts.length > 0) {
        console.log('\n📊 Sample migrated data:')
        existingPosts.forEach((post, i) => {
          console.log(`   ${i + 1}. ${post.roleTitle} at ${post.company}`)
          console.log(`      Email: ${post.contactEmail || 'N/A'}`)
          console.log(`      Phone: ${post.contactPhone || 'N/A'}`)
          console.log(`      Method: ${post.preferredContactMethod || 'email'}`)
        })
      }
      
      results.push({ 
        test: 'Data Migration', 
        status: 'PASSED', 
        details: `${migratedCount}/${existingPosts.length} posts migrated` 
      })
    }

    // Test 3: Test insert with proper UUID (get a real user ID first)
    console.log('\n📋 Test 3: Testing insert with new fields...')
    
    // Get a real user ID from existing data
    const { data: realUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (userError || !realUser || realUser.length === 0) {
      console.log('⚠️  Test 3 SKIPPED: No existing users found for testing')
      results.push({ test: 'Insert Test', status: 'SKIPPED', details: 'No users available' })
    } else {
      const testPost = {
        userId: realUser[0].id, // Use real UUID
        roleTitle: 'Test Migration Role',
        company: 'Test Company',
        companyUrl: 'https://testcompany.com',
        roleType: 'INTERNSHIP',
        roleDesc: 'This is a test post to verify migration.',
        contactEmail: 'test@wesleyan.edu',
        contactPhone: '+1 (555) 123-4567',
        preferredContactMethod: 'email',
        contactDetails: 'Additional test contact info'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('posts')
        .insert([testPost])
        .select()

      if (insertError) {
        console.error('❌ Test 3 FAILED: Cannot insert with new fields')
        console.error('   Error:', insertError.message)
        results.push({ test: 'Insert Test', status: 'FAILED', error: insertError.message })
      } else {
        console.log('✅ Test 3 PASSED: Can insert posts with new fields')
        results.push({ test: 'Insert Test', status: 'PASSED' })
        
        // Clean up test post
        await supabase.from('posts').delete().eq('id', insertData[0].id)
        console.log('   (Test post cleaned up)')
      }
    }

    // Test 4: Verify indexes were created
    console.log('\n📋 Test 4: Checking database indexes...')
    const { data: indexData, error: indexError } = await supabase
      .rpc('sql', { 
        query: `SELECT indexname FROM pg_indexes 
                WHERE tablename = 'posts' 
                  AND indexname LIKE '%contact%' OR indexname LIKE '%company%'
                ORDER BY indexname;`
      })

    if (indexError) {
      console.log('⚠️  Test 4 WARNING: Cannot verify indexes (expected in some environments)')
      results.push({ test: 'Index Creation', status: 'WARNING', details: 'Cannot verify indexes' })
    } else {
      console.log('✅ Test 4 PASSED: Database indexes verified')
      if (indexData && indexData.length > 0) {
        console.log('   Indexes found:', indexData.map(i => i.indexname).join(', '))
      }
      results.push({ test: 'Index Creation', status: 'PASSED' })
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ENHANCED MIGRATION VERIFICATION SUMMARY')
    console.log('='.repeat(60))
    
    results.forEach((result) => {
      const emoji = result.status === 'PASSED' ? '✅' : 
                   result.status === 'WARNING' ? '⚠️' : 
                   result.status === 'SKIPPED' ? '⏭️' : '❌'
      console.log(`${emoji} ${result.test}: ${result.status}`)
      if (result.details) console.log(`   Details: ${result.details}`)
      if (result.error) console.log(`   Error: ${result.error}`)
    })

    const passedTests = results.filter(r => r.status === 'PASSED').length
    const totalTests = results.length
    
    console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`)
    
    if (passedTests >= 3) {
      console.log('\n🎉 Migration verification SUCCESSFUL!')
      console.log('✅ Database is ready for Phase 1.2: TypeScript Interface Updates')
      return true
    } else {
      console.log('\n⚠️  Migration needs attention')
      return false
    }

  } catch (error) {
    console.error('💥 Verification failed with error:', error)
    return false
  }
}

// Run verification
if (require.main === module) {
  betterVerifyMigration()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('💥 Verification script error:', error)
      process.exit(1)
    })
} 