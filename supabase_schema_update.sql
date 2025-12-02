-- Add missing columns to store_profile table
ALTER TABLE store_profile 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP',
ADD COLUMN IF NOT EXISTS default_markdown_percent INTEGER DEFAULT 50;

-- Ensure id has a default value
ALTER TABLE store_profile ALTER COLUMN id SET DEFAULT 'default';

-- Update batches table if needed (ensure columns match)
-- Note: Make sure your batches table has these columns:
-- id (TEXT), barcode (TEXT), expiry_date (DATE), quantity (INTEGER), 
-- status (TEXT), added_date (DATE)

-- Update products table if needed (should be fine as is)
-- Note: Make sure your products table has:
-- barcode (TEXT PRIMARY KEY), name (TEXT), category (TEXT), price (DECIMAL)

