-- Drop any existing email validation triggers
DROP TRIGGER IF EXISTS validate_email_domain ON auth.users;
DROP TRIGGER IF EXISTS validate_email_domain ON profiles;
DROP TRIGGER IF EXISTS check_email_domain ON auth.users;
DROP TRIGGER IF EXISTS check_email_domain ON profiles;

-- Drop any existing email validation functions
DROP FUNCTION IF EXISTS auth.validate_email_domain();
DROP FUNCTION IF EXISTS public.validate_email_domain();
DROP FUNCTION IF EXISTS auth.check_email_domain();
DROP FUNCTION IF EXISTS public.check_email_domain();

-- Remove any domain check constraints
ALTER TABLE auth.users DROP CONSTRAINT IF EXISTS check_email_domain;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_email_domain;
ALTER TABLE auth.users DROP CONSTRAINT IF EXISTS validate_email_domain;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS validate_email_domain;

-- Drop any existing policies that might check email domain
DROP POLICY IF EXISTS "Check email domain on insert" ON auth.users;
DROP POLICY IF EXISTS "Check email domain on update" ON auth.users;
DROP POLICY IF EXISTS "Check email domain" ON profiles;

-- Create a more permissive trigger function for email validation
CREATE OR REPLACE FUNCTION auth.validate_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a basic trigger that only checks if email is present
DROP TRIGGER IF EXISTS validate_email ON auth.users;
CREATE TRIGGER validate_email
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.validate_email();

-- Verify changes
SELECT 'Email domain restrictions removed!' as status; 