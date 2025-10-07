-- Migration: Row Level Security Policies
-- Created: 2025-01-07
-- Description: Enables RLS and creates security policies

-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON doctors;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON visits;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON stock_transactions;

-- Create policies for public access (modify based on your auth requirements)
-- Note: Change these policies when you implement authentication

-- Doctors policies
CREATE POLICY "Enable all access for authenticated users" ON doctors 
  FOR ALL USING (true);

-- Visits policies
CREATE POLICY "Enable all access for authenticated users" ON visits 
  FOR ALL USING (true);

-- Products policies
CREATE POLICY "Enable all access for authenticated users" ON products 
  FOR ALL USING (true);

-- Sales policies
CREATE POLICY "Enable all access for authenticated users" ON sales 
  FOR ALL USING (true);

-- Stock transactions policies
CREATE POLICY "Enable all access for authenticated users" ON stock_transactions 
  FOR ALL USING (true);

COMMENT ON POLICY "Enable all access for authenticated users" ON doctors IS 'Temporary policy - implement proper auth';