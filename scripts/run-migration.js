const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function runMigration() {
  console.log('🚀 Starting database migration for enhanced contact features...')
  
  // Create Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Read the migration SQL file
    const sqlFile = path.join(__dirname, 'enhance-contact-schema.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // Split SQL commands (simple split by semicolon for this migration)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'))
    
    console.log(`📝 Found ${commands.length} SQL commands to execute`)
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      console.log(`⚡ Executing command ${i + 1}/${commands.length}`)
      
      if (command.includes('ALTER TABLE') || command.includes('CREATE INDEX') || command.includes('UPDATE')) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: command })
        
        if (error) {
          console.error(`❌ Error executing command ${i + 1}:`, error)
          // Don't fail on constraint errors (they might already exist)
          if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            throw error
          } else {
            console.log(`⚠️  Command ${i + 1} skipped (already exists)`)
          }
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`)
        }
      }
    }

    // Verify the migration by checking the new columns
    console.log('\n🔍 Verifying migration...')
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'posts')
      .in('column_name', ['companyUrl', 'contactEmail', 'contactPhone', 'preferredContactMethod'])
    
    if (schemaError) {
      console.error('❌ Error verifying schema:', schemaError)
    } else {
      console.log('📊 New columns added:')
      schemaData.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // Test by fetching a few posts to see the new structure
    const { data: testPosts, error: testError } = await supabase
      .from('posts')
      .select('id, roleTitle, company, companyUrl, contactEmail, contactPhone, preferredContactMethod')
      .eq('isDeleted', false)
      .limit(3)

    if (testError) {
      console.error('❌ Error testing new structure:', testError)
    } else {
      console.log('\n📋 Sample posts with new fields:')
      testPosts.forEach((post, i) => {
        console.log(`   ${i + 1}. ${post.roleTitle} at ${post.company}`)
        console.log(`      Email: ${post.contactEmail || 'N/A'}`)
        console.log(`      Phone: ${post.contactPhone || 'N/A'}`)
        console.log(`      Method: ${post.preferredContactMethod || 'email'}`)
        console.log(`      URL: ${post.companyUrl || 'N/A'}`)
      })
    }

    console.log('\n🎉 Migration completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect() {
  console.log('🚀 Running migration with direct SQL execution...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const migrations = [
    `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "companyUrl" TEXT`,
    `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT`,
    `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "preferredContactMethod" TEXT DEFAULT 'email'`,
    `UPDATE "posts" SET "contactEmail" = "contactDetails" WHERE "contactDetails" IS NOT NULL AND "contactDetails" != '' AND ("contactEmail" IS NULL OR "contactEmail" = '')`,
    `CREATE INDEX IF NOT EXISTS "posts_contact_email_idx" ON "posts"("contactEmail")`,
    `CREATE INDEX IF NOT EXISTS "posts_company_url_idx" ON "posts"("companyUrl") WHERE "companyUrl" IS NOT NULL`
  ]

  for (let i = 0; i < migrations.length; i++) {
    const sql = migrations[i]
    console.log(`⚡ Executing migration ${i + 1}/${migrations.length}`)
    
    try {
      // Using raw SQL through Supabase
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.log(`⚠️  Migration ${i + 1} info:`, error.message)
        // Continue if it's just a "column already exists" error
        if (!error.message.includes('already exists')) {
          throw error
        }
      } else {
        console.log(`✅ Migration ${i + 1} completed`)
      }
    } catch (err) {
      console.error(`❌ Migration ${i + 1} failed:`, err.message)
      // Don't stop on expected errors
      if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
        throw err
      }
    }
  }

  console.log('🎉 Direct migration completed!')
}

// Run the migration
if (require.main === module) {
  runMigrationDirect()
    .then(() => {
      console.log('✅ All done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { runMigration, runMigrationDirect } 