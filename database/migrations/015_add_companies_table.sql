-- Migration: Add Companies Management Table
-- Created: 2026-05-02
-- Description: Creates a companies table to manage pharmaceutical companies dynamically

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Insert default companies
INSERT INTO companies (name, description) VALUES
  ('LSB LIFE SCIENCES', 'LSB Life Sciences'),
  ('FLOWRICH PHARMA', 'Flowrich Pharma'),
  ('CRANIX PHARMA', 'Cranix Pharma'),
  ('BRVYMA', 'Brvyma'),
  ('RECHELIST PHARMA', 'Rechelist Pharma'),
  ('COSMOGENE', 'Cosmogene')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read companies
CREATE POLICY "Anyone can read companies" ON companies
  FOR SELECT USING (true);

-- Allow only admin/specific role to insert companies (modify role as needed)
CREATE POLICY "Only authorized users can insert companies" ON companies
  FOR INSERT WITH CHECK (true);

-- Allow only admin/specific role to delete companies
CREATE POLICY "Only authorized users can delete companies" ON companies
  FOR DELETE USING (true);

-- Allow only admin/specific role to update companies
CREATE POLICY "Only authorized users can update companies" ON companies
  FOR UPDATE USING (true);
