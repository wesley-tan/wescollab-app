-- WesCollab Database - Clean Start
-- This script drops everything and recreates with proper Supabase patterns

-- 1. Drop everything to start fresh
DROP TABLE IF EXISTS "posts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "ventures" CASCADE;
DROP TYPE IF EXISTS "RoleType" CASCADE;

-- Clear any existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON "profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "profiles";
DROP POLICY IF EXISTS "Service role can manage users" ON "profiles";

-- 2. Add our custom columns to Supabase's existing profiles table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER';
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Add unique constraint on googleId
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_googleId_unique";
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_googleId_unique" UNIQUE ("googleId");

-- 3. Create RoleType enum
CREATE TYPE "RoleType" AS ENUM (
    'INTERNSHIP',
    'FULL_TIME', 
    'PART_TIME',
    'COLLABORATIVE_PROJECT',
    'VOLUNTEER',
    'RESEARCH'
);

-- 4. Create posts table with proper UUID types from the start
CREATE TABLE "posts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "roleTitle" VARCHAR(200) NOT NULL,
    "company" TEXT NOT NULL,
    "roleType" "RoleType" NOT NULL,
    "roleDesc" VARCHAR(2000) NOT NULL,
    "contactDetails" TEXT NOT NULL,
    "isDeleted" BOOLEAN DEFAULT false NOT NULL,
    "deletedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Create indexes for performance
CREATE INDEX "profiles_email_idx" ON "profiles"("email");
CREATE INDEX "profiles_googleId_idx" ON "profiles"("googleId");
CREATE INDEX "posts_userId_idx" ON "posts"("userId");
CREATE INDEX "posts_roleType_idx" ON "posts"("roleType");
CREATE INDEX "posts_active_idx" ON "posts"("isDeleted", "createdAt") WHERE "isDeleted" = false;
CREATE INDEX "posts_company_search_idx" ON "posts" USING gin(to_tsvector('english', "company"));
CREATE INDEX "posts_role_search_idx" ON "posts" USING gin(to_tsvector('english', "roleTitle" || ' ' || "roleDesc"));

-- 6. Create trigger function for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON "posts" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable Row Level Security
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON "profiles"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "profiles"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON "profiles"
    FOR ALL USING (true);

-- 10. Create RLS policies for posts
CREATE POLICY "Posts are publicly readable" ON "posts"
    FOR SELECT USING (NOT "isDeleted");

CREATE POLICY "Users can create posts" ON "posts"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own posts" ON "posts"
    FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own posts" ON "posts"
    FOR DELETE USING (auth.uid() = "userId");

CREATE POLICY "Service role can manage posts" ON "posts"
    FOR ALL USING (true);

-- 11. Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON "posts" TO anon;
GRANT ALL ON "profiles", "posts" TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON "profiles", "posts" TO service_role;

-- 12. Verify everything is working
SELECT 'DATABASE SETUP COMPLETE!' as status;

SELECT 'TABLES:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'posts')
ORDER BY table_name;

SELECT 'PROFILES COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'POSTS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'posts'
ORDER BY ordinal_position;

SELECT 'FOREIGN KEYS:' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'posts';

SELECT 'Ready for authentication!' as final_status; 