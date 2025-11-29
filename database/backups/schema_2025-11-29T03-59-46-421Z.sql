-- Database Schema Export
-- Generated: 2025-11-29T03:59:46.423Z
-- Pharma CRM Complete Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- From: 001_initial_schema.sql
-- Migration: Initial Schema Setup
-- Created: 2025-01-07
-- Description: Creates core tables for Pharma CRM

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  specialization VARCHAR,
  hospital VARCHAR,
  contact_number VARCHAR,
  email VARCHAR,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  notes TEXT,
  status VARCHAR DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  company_name VARCHAR,
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  reference_number VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- From: 002_add_doctor_fields.sql
-- Migration: Add Doctor Classification Fields
-- Created: 2025-01-07
-- Description: Adds doctor_type and doctor_class fields for better categorization

-- Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='doctors' AND column_name='doctor_type') THEN
        ALTER TABLE doctors ADD COLUMN doctor_type VARCHAR DEFAULT 'prescriber' 
          CHECK (doctor_type IN ('prescriber', 'stockist'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='doctors' AND column_name='doctor_class') THEN
        ALTER TABLE doctors ADD COLUMN doctor_class VARCHAR DEFAULT 'C' 
          CHECK (doctor_class IN ('A', 'B', 'C'));
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN doctors.doctor_type IS 'Type of doctor: prescriber or stockist';
COMMENT ON COLUMN doctors.doctor_class IS 'Classification: A (high value), B (medium), C (standard)';


-- From: 003_add_stock_tracking.sql
-- Migration: Stock Tracking System
-- Created: 2025-01-07
-- Description: Adds automated stock calculation functions and triggers

-- Function to calculate current stock
CREATE OR REPLACE FUNCTION calculate_current_stock(product_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(
      CASE 
        WHEN transaction_type IN ('purchase', 'return') THEN quantity
        WHEN transaction_type IN ('sale', 'adjustment') THEN -quantity
        ELSE 0
      END
    )
    FROM stock_transactions 
    WHERE product_id = product_uuid
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock automatically
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET current_stock = calculate_current_stock(NEW.product_id),
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_stock ON stock_transactions;

-- Create trigger to auto-update stock on transactions
CREATE TRIGGER trigger_update_stock
  AFTER INSERT OR UPDATE OR DELETE ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION update_product_stock();

COMMENT ON FUNCTION calculate_current_stock IS 'Calculates total current stock for a product';
COMMENT ON FUNCTION update_product_stock IS 'Automatically updates product stock after transactions';


-- From: 004_add_rls_policies.sql
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


-- From: 005_add_indexes.sql
-- Migration: Performance Indexes
-- Created: 2025-01-07
-- Description: Adds indexes for improved query performance

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_visits_doctor_id;
DROP INDEX IF EXISTS idx_visits_date;
DROP INDEX IF EXISTS idx_sales_visit_id;
DROP INDEX IF EXISTS idx_sales_product_id;
DROP INDEX IF EXISTS idx_stock_transactions_product_id;
DROP INDEX IF EXISTS idx_stock_transactions_date;
DROP INDEX IF EXISTS idx_doctors_name;
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_products_company;

-- Create indexes for better performance
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_date ON visits(visit_date DESC);
CREATE INDEX idx_sales_visit_id ON sales(visit_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(transaction_date DESC);
CREATE INDEX idx_doctors_name ON doctors(name);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_company ON products(company_name);

-- Additional composite indexes for common queries
CREATE INDEX idx_visits_doctor_date ON visits(doctor_id, visit_date DESC);
CREATE INDEX idx_sales_product_visit ON sales(product_id, visit_id);

COMMENT ON INDEX idx_visits_doctor_id IS 'Speed up doctor visit lookups';
COMMENT ON INDEX idx_visits_date IS 'Speed up date-based visit queries';


-- From: 006_add_chemist_support.sql
-- Migration: Add Chemist Support
-- Created: 2025-01-08
-- Description: Adds contact_type field and allows null for doctor-specific fields

-- Add contact_type column
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS contact_type VARCHAR DEFAULT 'doctor' 
  CHECK (contact_type IN ('doctor', 'chemist'));

-- Make doctor-specific fields nullable
ALTER TABLE doctors ALTER COLUMN specialization DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN doctor_type DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN doctor_class DROP NOT NULL;

-- Add index for contact_type
CREATE INDEX IF NOT EXISTS idx_doctors_contact_type ON doctors(contact_type);

-- Update existing records to be 'doctor' type
UPDATE doctors SET contact_type = 'doctor' WHERE contact_type IS NULL;

-- Add comments
COMMENT ON COLUMN doctors.contact_type IS 'Type of contact: doctor or chemist';
COMMENT ON COLUMN doctors.specialization IS 'Doctor specialization (null for chemists)';
COMMENT ON COLUMN doctors.doctor_type IS 'Doctor type: prescriber/dispenser (null for chemists)';
COMMENT ON COLUMN doctors.doctor_class IS 'Doctor class: A/B/C (null for chemists)';


-- From: 007_add_cash_flow_table.sql
-- Migration: Add cash_flow table for tracking cash transactions
-- Created: 2025-11-01

-- Create cash_flow table
CREATE TABLE IF NOT EXISTS public.cash_flow (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    cash_type character varying NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    purpose character varying,
    notes text,
    reference_type character varying,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cash_flow_pkey PRIMARY KEY (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_transaction_date ON public.cash_flow(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_cash_type ON public.cash_flow(cash_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON public.cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_purpose ON public.cash_flow(purpose);
CREATE INDEX IF NOT EXISTS idx_cash_flow_reference ON public.cash_flow(reference_type, reference_id);

-- Add RLS policies
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all cash flow records
CREATE POLICY "Allow authenticated users to view cash flow"
    ON public.cash_flow
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert cash flow records
CREATE POLICY "Allow authenticated users to insert cash flow"
    ON public.cash_flow
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update cash flow records
CREATE POLICY "Allow authenticated users to update cash flow"
    ON public.cash_flow
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to delete cash flow records
CREATE POLICY "Allow authenticated users to delete cash flow"
    ON public.cash_flow
    FOR DELETE
    TO authenticated
    USING (true);


CREATE POLICY "Allow all operations for cash_flow"
    ON public.cash_flow
    TO public
    USING (true);

-- Add foreign key constraints based on reference_type
-- Note: These assume the existence of related tables (doctors, visits, sales, etc.)
-- Uncomment and modify based on your actual table structure

-- Foreign key for doctor references
-- ALTER TABLE public.cash_flow 
-- ADD CONSTRAINT fk_cash_flow_doctor 
-- FOREIGN KEY (reference_id) 
-- REFERENCES public.doctors(id) 
-- WHERE reference_type = 'doctor';

-- Foreign key for visit references  
-- ALTER TABLE public.cash_flow 
-- ADD CONSTRAINT fk_cash_flow_visit 
-- FOREIGN KEY (reference_id) 
-- REFERENCES public.visits(id) 
-- WHERE reference_type = 'visit';

-- Foreign key for sale references
-- ALTER TABLE public.cash_flow 
-- ADD CONSTRAINT fk_cash_flow_sale 
-- FOREIGN KEY (reference_id) 
-- REFERENCES public.sales(id) 
-- WHERE reference_type = 'sale';

-- Alternative approach: Add a check constraint to ensure reference consistency
-- This ensures reference_id is only set when reference_type is specified
ALTER TABLE public.cash_flow 
ADD CONSTRAINT chk_reference_consistency 
CHECK (
    (reference_type IS NULL AND reference_id IS NULL) OR 
    (reference_type IS NOT NULL AND reference_id IS NOT NULL)
);

-- Add comments for documentation
COMMENT ON TABLE public.cash_flow IS 'Tracks all cash inflows and outflows including sundry expenses and person-related transactions';
COMMENT ON COLUMN public.cash_flow.cash_type IS 'Type of cash flow (e.g., in_flow, out_flow) - user defined';
COMMENT ON COLUMN public.cash_flow.name IS 'Name of the person or description of the sundry item';
COMMENT ON COLUMN public.cash_flow.type IS 'Type of transaction (e.g., sundry, person) - user defined';
COMMENT ON COLUMN public.cash_flow.amount IS 'Transaction amount (always positive)';
COMMENT ON COLUMN public.cash_flow.purpose IS 'Purpose of transaction - user defined (e.g., expense, gift, payment, etc.)';
COMMENT ON COLUMN public.cash_flow.reference_type IS 'Optional reference to related entity (e.g., doctor, visit, sale)';
COMMENT ON COLUMN public.cash_flow.reference_id IS 'Optional ID of the referenced entity';

-- Insert sample data (optional, comment out if not needed)
INSERT INTO public.cash_flow (transaction_date, cash_type, name, type, amount, purpose, notes) VALUES
    (CURRENT_DATE, 'out_flow', 'Office Rent', 'sundry', 15000.00, 'expense', 'Monthly office rent payment'),
    (CURRENT_DATE, 'out_flow', 'Fuel', 'sundry', 2500.00, 'expense', 'Vehicle fuel for field visits'),
    (CURRENT_DATE, 'in_flow', 'Dr. Rajesh Kumar', 'person', 50000.00, 'debt_recovery', 'Outstanding payment received'),
    (CURRENT_DATE, 'out_flow', 'Medical Rep Salary', 'sundry', 25000.00, 'expense', 'Monthly salary payment'),
    (CURRENT_DATE, 'out_flow', 'John Doe', 'person', 10000.00, 'advance', 'Advance given for emergency');



-- From: 008_fix_rls_policies.sql
-- Migration: Fix RLS policies for all tables to match doctors table pattern
-- Created: 2025-11-02

-- Fix stock_transactions table policies
DROP POLICY IF EXISTS "Allow all operations for stock_transactions" ON public.stock_transactions;
CREATE POLICY "Allow all operations for stock_transactions"
    ON public.stock_transactions
    TO public
    USING (true);

-- Add service role policy for stock_transactions
DROP POLICY IF EXISTS "Allow service role full access to stock_transactions" ON public.stock_transactions;
CREATE POLICY "Allow service role full access to stock_transactions"
    ON public.stock_transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Fix visits table policies (ensure consistency)
DROP POLICY IF EXISTS "Allow all operations for visits" ON public.visits;
CREATE POLICY "Allow all operations for visits"
    ON public.visits
    TO public
    USING (true);

-- Add service role policy for visits
DROP POLICY IF EXISTS "Allow service role full access to visits" ON public.visits;
CREATE POLICY "Allow service role full access to visits"
    ON public.visits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Fix products table policies
DROP POLICY IF EXISTS "Allow all operations for products" ON public.products;
CREATE POLICY "Allow all operations for products"
    ON public.products
    TO public
    USING (true);

-- Add service role policy for products
DROP POLICY IF EXISTS "Allow service role full access to products" ON public.products;
CREATE POLICY "Allow service role full access to products"
    ON public.products
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Fix sales table policies
DROP POLICY IF EXISTS "Allow all operations for sales" ON public.sales;
CREATE POLICY "Allow all operations for sales"
    ON public.sales
    TO public
    USING (true);

-- Add service role policy for sales
DROP POLICY IF EXISTS "Allow service role full access to sales" ON public.sales;
CREATE POLICY "Allow service role full access to sales"
    ON public.sales
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure doctors table has service role policy too
DROP POLICY IF EXISTS "Allow service role full access to doctors" ON public.doctors;
CREATE POLICY "Allow service role full access to doctors"
    ON public.doctors
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Fix any trigger functions with search_path issues
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

