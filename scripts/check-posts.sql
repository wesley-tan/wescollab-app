-- Check all posts and their status
SELECT 
  p.id,
  p.role_title,
  p.company,
  p.is_deleted,
  p.created_at,
  pr.name as author_name,
  pr.email as author_email
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC;

-- Count posts by status
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_posts,
  COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_posts,
  COUNT(CASE WHEN pr.id IS NULL THEN 1 END) as posts_without_profile
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id;

-- Check for any posts with invalid user_ids
SELECT p.id, p.role_title, p.user_id
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id IS NULL; 