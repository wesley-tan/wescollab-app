const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function verifyMigration() {
  console.log('🔍 Verifying database migration...')
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let allTestsPassed = true
  const results = []

  try {
    // Test 1: Check if new columns exist by trying to select them
    console.log('\n📋 Test 1: Checking new columns exist...')
    const { data: posts, error: selectError } = await supabase
      .from('posts')
      .select('id, companyUrl, contactEmail, contactPhone, preferredContactMethod')
      .limit(1)

    if (selectError) {
      console.error('❌ Test 1 FAILED: New columns not found')
      console.error('   Error:', selectError.message)
      allTestsPassed = false
      results.push({ test: 'New Columns', status: 'FAILED', error: selectError.message })
    } else {
      console.log('✅ Test 1 PASSED: New columns exist and are selectable')
      results.push({ test: 'New Columns', status: 'PASSED' })
    }

    // Test 2: Check if we can insert data with new fields
    console.log('\n📋 Test 2: Testing insert with new fields...')
    const testPost = {
      userId: 'test-user-id-' + Date.now(),
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
      console.error('❌ Test 2 FAILED: Cannot insert with new fields')
      console.error('   Error:', insertError.message)
      allTestsPassed = false
      results.push({ test: 'Insert New Fields', status: 'FAILED', error: insertError.message })
    } else {
      console.log('✅ Test 2 PASSED: Can insert posts with new fields')
      results.push({ test: 'Insert New Fields', status: 'PASSED' })
      
      // Clean up test post
      await supabase.from('posts').delete().eq('id', insertData[0].id)
      console.log('   (Test post cleaned up)')
    }

    // Test 3: Check existing posts were migrated properly
    console.log('\n📋 Test 3: Checking data migration...')
    const { data: existingPosts, error: migrationError } = await supabase
      .from('posts')
      .select('id, contactDetails, contactEmail, preferredContactMethod')
      .eq('isDeleted', false)
      .limit(5)

    if (migrationError) {
      console.error('❌ Test 3 FAILED: Cannot query migrated data')
      console.error('   Error:', migrationError.message)
      allTestsPassed = false
      results.push({ test: 'Data Migration', status: 'FAILED', error: migrationError.message })
    } else {
      console.log('✅ Test 3 PASSED: Can query existing posts with new structure')
      
      // Check if data was migrated
      const migratedCount = existingPosts.filter(post => 
        post.contactEmail && post.contactEmail !== ''
      ).length
      
      console.log(`   Found ${existingPosts.length} existing posts`)
      console.log(`   ${migratedCount} have migrated contact emails`)
      
      results.push({ 
        test: 'Data Migration', 
        status: 'PASSED', 
        details: `${migratedCount}/${existingPosts.length} posts migrated` 
      })
    }

    // Test 4: Check validation constraints (try invalid data)
    console.log('\n📋 Test 4: Testing validation constraints...')
    const invalidPost = {
      userId: 'test-user-id-' + Date.now(),
      roleTitle: 'Invalid Test',
      company: 'Test Company',
      companyUrl: 'invalid-url', // Should fail URL validation
      roleType: 'INTERNSHIP',
      roleDesc: 'Testing validation.',
      contactEmail: 'invalid-email', // Should fail email validation
      contactPhone: 'abc123', // Should fail phone validation
      preferredContactMethod: 'invalid', // Should fail enum validation
    }

    const { error: validationError } = await supabase
      .from('posts')
      .insert([invalidPost])

    if (validationError) {
      console.log('✅ Test 4 PASSED: Validation constraints are working')
      console.log('   Expected validation error:', validationError.message)
      results.push({ test: 'Validation Constraints', status: 'PASSED' })
    } else {
      console.log('⚠️  Test 4 WARNING: Validation constraints may not be enforced')
      results.push({ test: 'Validation Constraints', status: 'WARNING', details: 'Constraints may not be active' })
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 MIGRATION VERIFICATION SUMMARY')
    console.log('='.repeat(50))
    
    results.forEach((result, i) => {
      const emoji = result.status === 'PASSED' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'
      console.log(`${emoji} ${result.test}: ${result.status}`)
      if (result.details) console.log(`   Details: ${result.details}`)
      if (result.error) console.log(`   Error: ${result.error}`)
    })

    const passedTests = results.filter(r => r.status === 'PASSED').length
    const totalTests = results.length
    
    console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`)
    
    if (allTestsPassed) {
      console.log('\n🎉 Migration verification SUCCESSFUL!')
      console.log('✅ Database is ready for Phase 1.2: TypeScript Interface Updates')
      return true
    } else {
      console.log('\n⚠️  Migration verification had issues')
      console.log('❗ Please check the failed tests and run the migration again')
      return false
    }

  } catch (error) {
    console.error('💥 Verification failed with error:', error)
    return false
  }
}

// Run verification
if (require.main === module) {
  verifyMigration()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('💥 Verification script error:', error)
      process.exit(1)
    })
}

module.exports = { verifyMigration } 