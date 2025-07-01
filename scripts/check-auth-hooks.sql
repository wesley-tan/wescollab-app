-- Check for any auth hooks
SELECT *
FROM supabase_functions.hooks
WHERE hook_table_id = 'auth.users'
   OR function_name LIKE '%email%'
   OR function_name LIKE '%domain%';

-- Remove any existing hooks
DELETE FROM supabase_functions.hooks
WHERE hook_table_id = 'auth.users'
   OR function_name LIKE '%email%'
   OR function_name LIKE '%domain%';

-- Verify changes
SELECT 'Auth hooks checked and removed!' as status; 