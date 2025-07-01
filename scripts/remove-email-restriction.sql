-- Remove email domain restriction from profiles table
DROP TRIGGER IF EXISTS check_email_domain ON "profiles";
DROP FUNCTION IF EXISTS check_email_domain();

-- Remove any existing check constraints
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS check_email_domain;

-- Verify changes
SELECT 'Email domain restriction removed!' as status; 