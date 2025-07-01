-- We can only modify our own tables and functions in the public schema
-- Drop any existing email validation triggers in public schema
DROP TRIGGER IF EXISTS validate_email_domain ON public.profiles;
DROP TRIGGER IF EXISTS check_email_domain ON public.profiles;

-- Drop any existing email validation functions in public schema
DROP FUNCTION IF EXISTS public.validate_email_domain() CASCADE;
DROP FUNCTION IF EXISTS public.check_email_domain() CASCADE;

-- Remove any domain check constraints from profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_email_domain;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS validate_email_domain;

-- Drop any existing policies that might check email domain
DROP POLICY IF EXISTS "Check email domain" ON public.profiles;

-- Update RLS policies to be more permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

-- Create more permissive RLS policies
CREATE POLICY "Profiles are publicly readable" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON public.profiles
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- Verify changes
SELECT 'Email domain restrictions removed from public schema!' as status; 