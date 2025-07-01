-- First, let's check for any existing auth triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
   OR event_object_schema = 'public';

-- Drop any existing auth hooks
SELECT auth.disable_user_management();

-- Remove any custom email validation
CREATE OR REPLACE FUNCTION auth.email_check()
RETURNS trigger AS $$
BEGIN
  -- Only check that email is not null
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable basic user management without domain restrictions
SELECT auth.enable_user_management();

-- Update any existing auth settings
UPDATE auth.config 
SET email_confirm_required = false,
    double_confirm_changes = false;

-- Make sure service_role has proper permissions
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO service_role;

-- Make sure authenticated users can access necessary tables
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify changes
SELECT 'Auth restrictions removed!' as status; 