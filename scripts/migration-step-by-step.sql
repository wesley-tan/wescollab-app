-- Step 1: Add new columns to posts table
ALTER TABLE "posts" 
ADD COLUMN IF NOT EXISTS "companyUrl" TEXT,
ADD COLUMN IF NOT EXISTS "contactEmail" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
ADD COLUMN IF NOT EXISTS "preferredContactMethod" TEXT DEFAULT 'email';

-- Step 2: Migrate existing contactDetails data to contactEmail
UPDATE "posts" 
SET "contactEmail" = "contactDetails" 
WHERE "contactDetails" IS NOT NULL 
  AND "contactDetails" != '' 
  AND ("contactEmail" IS NULL OR "contactEmail" = '');

-- Step 3: Make contactEmail NOT NULL
ALTER TABLE "posts" ALTER COLUMN "contactEmail" SET NOT NULL;

-- Step 4: Create indexes (run these one by one)
CREATE INDEX IF NOT EXISTS "posts_contact_email_idx" ON "posts"("contactEmail");
CREATE INDEX IF NOT EXISTS "posts_company_url_idx" ON "posts"("companyUrl") WHERE "companyUrl" IS NOT NULL;

-- Step 5: Verify migration worked
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name IN ('companyUrl', 'contactEmail', 'contactPhone', 'preferredContactMethod', 'contactDetails')
ORDER BY column_name; 