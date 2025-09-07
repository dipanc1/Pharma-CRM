-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Add user_id column to all tables (if not exists)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to have user_id (run this once)
-- You'll need to replace 'your-user-id' with the actual user ID from auth.users table
-- UPDATE doctors SET user_id = 'your-user-id' WHERE user_id IS NULL;
-- UPDATE visits SET user_id = 'your-user-id' WHERE user_id IS NULL;
-- UPDATE products SET user_id = 'your-user-id' WHERE user_id IS NULL;
-- UPDATE sales SET user_id = 'your-user-id' WHERE user_id IS NULL;

-- Create policies for doctors table
CREATE POLICY "Users can view their own doctors" ON doctors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doctors" ON doctors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doctors" ON doctors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own doctors" ON doctors
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for visits table
CREATE POLICY "Users can view their own visits" ON visits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits" ON visits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits" ON visits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visits" ON visits
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for products table
CREATE POLICY "Users can view their own products" ON products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for sales table
CREATE POLICY "Users can view their own sales" ON sales
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales" ON sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" ON sales
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" ON sales
    FOR DELETE USING (auth.uid() = user_id);
