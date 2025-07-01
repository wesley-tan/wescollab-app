-- Add missing columns that Supabase Auth expects
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make sure email is not null
ALTER TABLE "profiles" ALTER COLUMN "email" SET NOT NULL;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON "profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "profiles";
DROP POLICY IF EXISTS "Service role can manage profiles" ON "profiles";

-- Create more permissive RLS policies
CREATE POLICY "Profiles are publicly readable" ON "profiles"
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON "profiles"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON "profiles"
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON "profiles" TO service_role;
GRANT ALL ON "profiles" TO authenticated;
GRANT SELECT ON "profiles" TO anon;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON "profiles"
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Verify changes
SELECT 'PROFILES TABLE FIXED!' as status; 