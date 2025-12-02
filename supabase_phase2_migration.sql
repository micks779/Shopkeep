-- Phase 2: Add user_id columns for data isolation
-- Run this in Supabase SQL Editor

-- 1. Add user_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add user_id to batches table
ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Add user_id to store_profile table
ALTER TABLE store_profile 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Make user_id NOT NULL (after adding, we'll update existing rows)
-- First, let's see if there's any existing data to migrate
-- (If you have existing data, you'll need to assign it to a user)

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_user_id ON batches(user_id);
CREATE INDEX IF NOT EXISTS idx_store_profile_user_id ON store_profile(user_id);

-- 6. Update RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on products" ON products;
DROP POLICY IF EXISTS "Allow all operations on batches" ON batches;
DROP POLICY IF EXISTS "Allow all operations on store_profile" ON store_profile;

-- Create new policies that filter by user_id
CREATE POLICY "Users can only see their own products" 
ON products FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own products" 
ON products FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own products" 
ON products FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own products" 
ON products FOR DELETE 
USING (auth.uid() = user_id);

-- Batches policies
CREATE POLICY "Users can only see their own batches" 
ON batches FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own batches" 
ON batches FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own batches" 
ON batches FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own batches" 
ON batches FOR DELETE 
USING (auth.uid() = user_id);

-- Store profile policies
CREATE POLICY "Users can only see their own profile" 
ON store_profile FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own profile" 
ON store_profile FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own profile" 
ON store_profile FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own profile" 
ON store_profile FOR DELETE 
USING (auth.uid() = user_id);

