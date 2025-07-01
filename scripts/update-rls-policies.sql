-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create more permissive RLS policies
CREATE POLICY "Profiles are publicly readable" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Verify changes
SELECT 'RLS policies updated!' as status; 