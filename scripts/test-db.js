/**
 * Database Connection Test Script for Supabase + Prisma
 * Run this after setting up your Supabase database
 */

const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing Prisma database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma database connection successful!');
    
    // Test if tables exist (after migration)
    try {
      const userCount = await prisma.user.count();
      const postCount = await prisma.post.count();
      console.log(`✅ Prisma tables accessible - Users: ${userCount}, Posts: ${postCount}`);
    } catch (error) {
      console.log('⚠️  Prisma tables not yet created - run `npx prisma db push` first');
      console.log('   Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function testSupabaseConnection() {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase credentials not found in environment variables');
    return;
  }
  
  try {
    console.log('🔄 Testing Supabase connection...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection with a simple query
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Supabase tables not accessible:', error.message);
      console.log('   You may need to run `npx prisma db push` to create tables');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log(`✅ Profiles table accessible (${count || 0} records)`);
    }
    
    // Test posts table
    const { error: postsError, count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    if (!postsError) {
      console.log(`✅ Posts table accessible (${postsCount || 0} records)`);
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
}

async function testAuthentication() {
  try {
    console.log('🔄 Testing Supabase Auth configuration...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Cannot test auth - Supabase credentials missing');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to get current session (should be null in test environment)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️  Auth configuration issue:', error.message);
    } else {
      console.log('✅ Supabase Auth configuration working');
      console.log(`   Current session: ${session ? 'Active' : 'None (expected in test)'}`);
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
}

async function main() {
  console.log('🎯 WesCollab Database & Auth Test\n');
  
  try {
    // Test Prisma connection
    await testPrismaConnection();
    console.log();
    
    // Test Supabase connection  
    await testSupabaseConnection();
    console.log();
    
    // Test Authentication
    await testAuthentication();
    console.log();
    
    console.log('🎉 Database test completed successfully!');
    console.log();
    console.log('📋 Next steps:');
    console.log('   1. Make sure your Supabase project is set up');
    console.log('   2. Configure Google OAuth in Supabase dashboard');
    console.log('   3. Run `npx prisma db push` to sync schema');
    console.log('   4. Test the authentication flow');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your .env file has correct Supabase credentials');
    console.log('   2. Verify your Supabase project is active');
    console.log('   3. Ensure DATABASE_URL is correct for Prisma');
    console.log('   4. Run `npx prisma db push` to create tables');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main(); 