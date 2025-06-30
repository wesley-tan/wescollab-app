/**
 * Database Connection Test Script
 * Run this after setting up your PostgreSQL database
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test if tables exist (after migration)
    try {
      const userCount = await prisma.user.count();
      const postCount = await prisma.post.count();
      console.log(`✅ Tables accessible - Users: ${userCount}, Posts: ${postCount}`);
    } catch (error) {
      console.log('⚠️  Tables not yet created - run `npx prisma db push` first');
    }
    
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    console.log('\n💡 Make sure your DATABASE_URL in .env is correct');
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 