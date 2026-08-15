-- Database Schema Export
-- Generated: 2026-08-15T07:44:31.207Z
-- DS Medical Agencies CRM Complete Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- From: 001_initial_schema.sql
-- Migration: Initial Schema Setup
-- Created: 2025-01-07
-- Description: Creates core tables for DS Medical Agencies CRM

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


-- From: 009_add_link_doctor_cash_flow.sql
-- Migration: Add Doctor/Chemist Link to Cash Flow
-- Created: 2025-01-15
-- Description: Adds optional link between cash flow transactions and doctors/chemists

-- Add doctor_id column to cash_flow table
ALTER TABLE public.cash_flow 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_doctor_id ON public.cash_flow(doctor_id);

-- Add comment for documentation
COMMENT ON COLUMN public.cash_flow.doctor_id IS 'Optional link to doctor/chemist contact for transaction tracking';

-- Update RLS policies to include doctor_id in queries
-- (Existing policies already allow all operations, so no changes needed)

-- Sample query to verify the link works:
-- SELECT cf.*, d.name as doctor_name, d.contact_type 
-- FROM cash_flow cf 
-- LEFT JOIN doctors d ON cf.doctor_id = d.id;


-- From: 010_ledger_support.sql
-- Migration: Ledger support (entries + helper indexes)
-- Created: 2025-11-29

-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Ledger entries (per contact)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_type VARCHAR NOT NULL CHECK (source_type IN ('visit', 'sale', 'cash')),
  source_id UUID, -- visit.id / sales.id / cash_flow.id (optional)
  description TEXT,
  debit NUMERIC NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC NOT NULL DEFAULT 0 CHECK (credit >= 0),
  balance NUMERIC, -- optional snapshot after this entry
  invoice_number UUID, -- optional external reference
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure single-sided entries (either debit>0 or credit>0, not both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ledger_entries_one_sided'
  ) THEN
    ALTER TABLE public.ledger_entries
      ADD CONSTRAINT chk_ledger_entries_one_sided
      CHECK (
        (debit = 0 AND credit > 0) OR
        (credit = 0 AND debit > 0)
      );
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_doctor_id ON public.ledger_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_date ON public.ledger_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_source ON public.ledger_entries(source_type, source_id);

-- Avoid duplicate entries for the same source
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_source_unique
  ON public.ledger_entries(source_type, source_id)
  WHERE source_id IS NOT NULL;

-- 2) RLS (match your existing pattern)
ALTER TABLE IF EXISTS public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for ledger_entries" ON public.ledger_entries;
CREATE POLICY "Allow all operations for ledger_entries"
  ON public.ledger_entries
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access to ledger_entries" ON public.ledger_entries;
CREATE POLICY "Allow service role full access to ledger_entries"
  ON public.ledger_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- From: 011_fix_invoice_number_type.sql
-- Migration: Fix invoice_number type to VARCHAR
-- Created: 2025-01-24

-- Change invoice_number from UUID to VARCHAR to support custom format
ALTER TABLE public.ledger_entries 
ALTER COLUMN invoice_number TYPE VARCHAR(50);

-- Update the unique index constraint
DROP INDEX IF EXISTS uq_ledger_source_unique;
CREATE UNIQUE INDEX uq_ledger_source_unique
  ON public.ledger_entries(source_type, source_id)
  WHERE source_id IS NOT NULL;

-- Add index on invoice_number for better performance
CREATE INDEX IF NOT EXISTS idx_ledger_invoice_number 
  ON public.ledger_entries(invoice_number) 
  WHERE invoice_number IS NOT NULL;



-- From: 012_add_doctor_important_dates.sql
-- Migration: Add Doctor Important Dates
-- Created: 2026-03-10
-- Description: Creates table for storing important dates (birthdays, anniversaries, etc.) for doctors/chemists

-- Create the doctor_important_dates table
CREATE TABLE IF NOT EXISTS public.doctor_important_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.doctor_important_dates ENABLE ROW LEVEL SECURITY;

-- RLS policy (matches existing pattern)
CREATE POLICY "Enable all access for authenticated users" ON public.doctor_important_dates
  FOR ALL USING (true);

-- Indexes
CREATE INDEX idx_doctor_important_dates_doctor_id
  ON public.doctor_important_dates(doctor_id);

CREATE INDEX idx_doctor_important_dates_date_month_day
  ON public.doctor_important_dates(EXTRACT(MONTH FROM date), EXTRACT(DAY FROM date));

-- Updated_at trigger (reuse existing function if available)
CREATE OR REPLACE FUNCTION update_doctor_important_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_doctor_important_dates_updated_at
  BEFORE UPDATE ON public.doctor_important_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_important_dates_updated_at();



-- From: 013_migrate_visits_to_ledger.sql
-- Migration: Migrate existing visits to ledger entries
-- Created: 2026-03-15
-- Description: Syncs all existing visits to the ledger_entries table as DEBIT entries

INSERT INTO public.ledger_entries (doctor_id, entry_date, source_type, source_id, debit, credit)
SELECT 
  v.doctor_id,
  v.visit_date::DATE,
  'visit',
  v.id,
  COALESCE(SUM(s.total_amount), 0),
  0
FROM public.visits v
LEFT JOIN public.sales s ON v.id = s.visit_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.ledger_entries le 
  WHERE le.source_type = 'visit' AND le.source_id = v.id
)
AND v.doctor_id NOT IN (
  'fdac5867-c9c8-4ff7-9cb2-be4e391b1563',
  '82de3076-078f-4ab6-bc4c-820c2a557424',
  '6ffbd9ac-768f-4b1b-9e3c-592f14961799',
  'd41cecd0-ab55-446a-8bfa-1c1bd0ec8806'
)
GROUP BY v.id, v.doctor_id, v.visit_date
HAVING COALESCE(SUM(s.total_amount), 0) > 0;



-- From: 014_add_cycle_plans_and_kol.sql
-- Migration: Add Cycle Plans, KOL support, and KOL Notes
-- Created: 2026-03-22
-- Description: Creates cycle_plans table for quarterly product-doctor assignments,
--              adds is_kol flag to doctors, creates kol_notes table for KOL output tracking

-- ============================================
-- 1. cycle_plans table
-- ============================================
CREATE TABLE IF NOT EXISTS public.cycle_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_start_date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_cycle_product_doctor UNIQUE (cycle_start_date, product_id, doctor_id)
);

ALTER TABLE public.cycle_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.cycle_plans
    FOR ALL USING (true);

CREATE INDEX idx_cycle_plans_cycle_start ON public.cycle_plans(cycle_start_date);
CREATE INDEX idx_cycle_plans_product_id ON public.cycle_plans(product_id);
CREATE INDEX idx_cycle_plans_doctor_id ON public.cycle_plans(doctor_id);

CREATE TRIGGER update_cycle_plans_updated_at
    BEFORE UPDATE ON public.cycle_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.cycle_plans IS 'Stores product-doctor assignments per quarterly cycle';
COMMENT ON COLUMN public.cycle_plans.cycle_start_date IS 'First day of the quarter (e.g., 2026-04-01 for Apr-Jun)';

-- ============================================
-- 2. Add is_kol column to doctors
-- ============================================
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS is_kol BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_doctors_is_kol ON public.doctors(is_kol) WHERE is_kol = true;

COMMENT ON COLUMN public.doctors.is_kol IS 'Whether this doctor is flagged as a Key Opinion Leader';

-- ============================================
-- 3. kol_notes table
-- ============================================
CREATE TABLE IF NOT EXISTS public.kol_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    cycle_start_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_kol_notes_doctor_cycle UNIQUE (doctor_id, cycle_start_date)
);

ALTER TABLE public.kol_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.kol_notes
    FOR ALL USING (true);

CREATE INDEX idx_kol_notes_doctor_id ON public.kol_notes(doctor_id);
CREATE INDEX idx_kol_notes_cycle ON public.kol_notes(cycle_start_date);

CREATE TRIGGER update_kol_notes_updated_at
    BEFORE UPDATE ON public.kol_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.kol_notes IS 'Free-text output notes per KOL doctor per quarterly cycle';



-- From: 015_add_companies_table.sql
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



-- From: 016_add_user_profiles_and_roles.sql
-- Migration: Add user profiles and role-based access
-- Created: 2026-05-11
-- Description: Adds profiles, roles, and RLS for owner/rep access

-- 0) Clean up legacy policies (from previous incomplete migrations)
-- Drop all old "Enable all operations" and "Allow all" policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.visits;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow all operations for visits" ON public.visits;
DROP POLICY IF EXISTS "Allow all operations for products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations for sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations for stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow all operations for ledger_entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cycle_plans;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.doctor_important_dates;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.kol_notes;

-- Drop broken companies policies
DROP POLICY IF EXISTS "Anyone can read companies" ON public.companies;
DROP POLICY IF EXISTS "Only authorized users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Only authorized users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Only authorized users can delete companies" ON public.companies;

-- 1) Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'rep')),
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, 'rep', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users (assume owner for current business)
INSERT INTO public.profiles (id, role, display_name)
SELECT id, 'owner', COALESCE(raw_user_meta_data->>'display_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2) Helper function for role checks
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- 3) Visits ownership
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_visits_user_id ON public.visits(user_id);

-- Assign existing visits to the first owner profile (single business setup)
UPDATE public.visits
SET user_id = (
  SELECT id FROM public.profiles
  WHERE role = 'owner'
  ORDER BY created_at
  LIMIT 1
)
WHERE user_id IS NULL;

-- 4) RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_owner());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Doctors: readable by all authenticated, owner can manage
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Allow all operations for doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated can read doctors" ON public.doctors;
DROP POLICY IF EXISTS "Owners can manage doctors" ON public.doctors;

CREATE POLICY "Authenticated can read doctors" ON public.doctors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owners can manage doctors" ON public.doctors
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Visits: owner can manage all, reps only their own
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.visits;
DROP POLICY IF EXISTS "Allow all operations for visits" ON public.visits;
DROP POLICY IF EXISTS "Users can view their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can insert their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can update their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can delete their own visits" ON public.visits;
DROP POLICY IF EXISTS "Owners can manage visits" ON public.visits;
DROP POLICY IF EXISTS "Reps can manage own visits" ON public.visits;

CREATE POLICY "Owners can manage visits" ON public.visits
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "Reps can manage own visits" ON public.visits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Products: owner only
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow all operations for products" ON public.products;
DROP POLICY IF EXISTS "Owners can manage products" ON public.products;

CREATE POLICY "Owners can manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Sales: owner only
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations for sales" ON public.sales;
DROP POLICY IF EXISTS "Owners can manage sales" ON public.sales;

CREATE POLICY "Owners can manage sales" ON public.sales
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Stock transactions: owner only
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow all operations for stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Owners can manage stock transactions" ON public.stock_transactions;

CREATE POLICY "Owners can manage stock transactions" ON public.stock_transactions
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Ledger entries: owner only
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for ledger_entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Owners can manage ledger entries" ON public.ledger_entries;

CREATE POLICY "Owners can manage ledger entries" ON public.ledger_entries
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Allow service role full access to ledger_entries" ON public.ledger_entries;
CREATE POLICY "Allow service role full access to ledger_entries" ON public.ledger_entries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Cash flow: owner only
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to view cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow authenticated users to insert cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow authenticated users to update cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow authenticated users to delete cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow all operations for cash_flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Owners can manage cash flow" ON public.cash_flow;

CREATE POLICY "Owners can manage cash flow" ON public.cash_flow
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Companies: owner only
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage companies" ON public.companies;

CREATE POLICY "Owners can manage companies" ON public.companies
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());



-- From: 017_visit_save_rpc_and_invoice_unique.sql
-- Migration: Transactional visit-save RPC + unique invoice numbers
-- Created: 2026-05-15
--
-- Purpose:
--   1. Add a UNIQUE constraint on ledger_entries.invoice_number so the
--      app-level generateInvoiceNumber() race cannot silently produce
--      duplicates — concurrent inserts will fail cleanly instead.
--   2. Provide save_visit_with_sales(): a single Postgres function that
--      atomically inserts the visit row, its sales rows, the stock
--      transactions, and the ledger entry. Because the function runs in one
--      implicit transaction, a failure on any step rolls back the entire
--      visit — eliminating the partial-failure inconsistency that the
--      app-side multi-step write currently risks.
--
-- Notes / prerequisites:
--   - If existing rows have duplicate non-null invoice_numbers from prior
--     races, the unique index creation will fail. Deduplicate first by
--     either nulling out duplicates or renaming them, e.g.:
--       UPDATE ledger_entries SET invoice_number = invoice_number || '-DUP-' || id
--       WHERE id IN (
--         SELECT id FROM (
--           SELECT id, row_number() OVER (PARTITION BY invoice_number ORDER BY created_at) rn
--           FROM ledger_entries WHERE invoice_number IS NOT NULL
--         ) t WHERE rn > 1
--       );
--   - The existing trigger update_product_stock() on stock_transactions
--     already syncs products.current_stock automatically. The RPC therefore
--     does NOT call it explicitly. (Side note: that trigger's
--     calculate_current_stock function only knows the 'purchase' / 'sale' /
--     'adjustment' / 'return' transaction types — it ignores 'opening' and
--     'sale_reversal' that the app uses. Worth fixing in a follow-up.)

-- ---------------------------------------------------------------------------
-- 1) Unique index on invoice_number (non-null only)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_invoice_number
  ON public.ledger_entries(invoice_number)
  WHERE invoice_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) save_visit_with_sales(): atomic visit + sales + stock + ledger insert
-- ---------------------------------------------------------------------------
-- p_sales is a JSONB array of objects with shape:
--   { "product_id": uuid, "quantity": number, "unit_price": number,
--     "total_amount": number, "product_name": text (optional) }
--
-- Returns:
--   { "visit_id": uuid, "invoice_number": text|null, "total_amount": numeric }
--
-- Raises:
--   - 'Insufficient stock for product X. Available: A, Required: R'
--     when any product's aggregate requested quantity exceeds available
--     stock as of p_visit_date.
--   - unique_violation on invoice_number collision (extremely unlikely with
--     the advisory lock, but the unique index is the final guarantee).

CREATE OR REPLACE FUNCTION public.save_visit_with_sales(
  p_doctor_id  UUID,
  p_visit_date DATE,
  p_notes      TEXT,
  p_status     TEXT,
  p_user_id    UUID,
  p_sales      JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_visit_id   UUID;
  v_sale       JSONB;
  v_total      NUMERIC := 0;
  v_invoice    TEXT;
  v_prefix     TEXT;
  v_next_num   INT;
  v_product_id UUID;
  v_req_qty    NUMERIC;
  v_avail      NUMERIC;
  v_lock_key   BIGINT;
  v_count      INT;
BEGIN
  v_count := COALESCE(jsonb_array_length(p_sales), 0);

  -- Aggregate stock validation per product, as of p_visit_date.
  IF v_count > 0 THEN
    FOR v_product_id, v_req_qty IN
      SELECT (s->>'product_id')::uuid, SUM((s->>'quantity')::numeric)
      FROM jsonb_array_elements(p_sales) s
      GROUP BY (s->>'product_id')::uuid
    LOOP
      SELECT COALESCE(SUM(
        CASE
          WHEN transaction_type = 'purchase'        THEN  quantity
          WHEN transaction_type = 'opening'         THEN  quantity
          WHEN transaction_type = 'adjustment'      THEN  quantity
          WHEN transaction_type = 'sale'            THEN -ABS(quantity)
          WHEN transaction_type = 'sale_reversal'   THEN  ABS(quantity)
          ELSE 0
        END
      ), 0)
      INTO v_avail
      FROM public.stock_transactions
      WHERE product_id = v_product_id
        AND transaction_date <= CURRENT_DATE;

      IF v_avail < v_req_qty THEN
        RAISE EXCEPTION
          'Insufficient stock for product %. Available: %, Required: %',
          v_product_id, v_avail, v_req_qty
          USING ERRCODE = 'P0001';
      END IF;
    END LOOP;
  END IF;

  -- Insert the visit row.
  INSERT INTO public.visits (doctor_id, visit_date, notes, status, user_id)
  VALUES (p_doctor_id, p_visit_date, p_notes, COALESCE(p_status, 'completed'), p_user_id)
  RETURNING id INTO v_visit_id;

  IF v_count > 0 THEN
    -- Generate invoice number under an advisory lock so concurrent calls
    -- serialize on the same month-prefix. The unique index is the final
    -- safety net.
    v_prefix   := 'INV-' || to_char(now(), 'YYYY-MM');
    v_lock_key := hashtextextended(v_prefix, 0);
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT COALESCE(MAX(
      NULLIF(regexp_replace(invoice_number, '^.*-(\d+)$', '\1'), '')::int
    ), 0) + 1
    INTO v_next_num
    FROM public.ledger_entries
    WHERE invoice_number LIKE v_prefix || '%';

    v_invoice := v_prefix || '-' || lpad(v_next_num::text, 4, '0');

    -- Insert each sale + corresponding stock transaction. Total accumulated
    -- here so we don't have to re-aggregate from p_sales.
    FOR v_sale IN SELECT * FROM jsonb_array_elements(p_sales)
    LOOP
      INSERT INTO public.sales (visit_id, product_id, quantity, unit_price, total_amount)
      VALUES (
        v_visit_id,
        (v_sale->>'product_id')::uuid,
        (v_sale->>'quantity')::numeric,
        (v_sale->>'unit_price')::numeric,
        (v_sale->>'total_amount')::numeric
      );

      INSERT INTO public.stock_transactions (
        product_id, transaction_type, quantity, transaction_date,
        reference_type, reference_id, notes
      )
      VALUES (
        (v_sale->>'product_id')::uuid,
        'sale',
        -(v_sale->>'quantity')::numeric,
        p_visit_date,
        'visit',
        v_visit_id,
        'Sale via visit - Invoice: ' || v_invoice
      );

      v_total := v_total + (v_sale->>'total_amount')::numeric;
    END LOOP;

    -- Single ledger entry for the visit's total.
    INSERT INTO public.ledger_entries (
      doctor_id, entry_date, source_type, source_id,
      description, debit, credit, invoice_number
    )
    VALUES (
      p_doctor_id,
      p_visit_date,
      'visit',
      v_visit_id,
      'Sales from visit - ' || v_count || ' items (Invoice: ' || v_invoice || ')',
      v_total,
      0,
      v_invoice
    );
  END IF;

  RETURN jsonb_build_object(
    'visit_id',       v_visit_id,
    'invoice_number', v_invoice,
    'total_amount',   v_total
  );
END;
$$;

COMMENT ON FUNCTION public.save_visit_with_sales IS
  'Atomically inserts a visit, its sales rows, stock_transactions, and the ledger_entries row. Validates aggregate stock per product as of visit_date. Returns visit_id, invoice_number, total_amount.';

-- Allow the app role(s) to call it. Adjust to your project's role setup.
GRANT EXECUTE ON FUNCTION public.save_visit_with_sales(UUID, DATE, TEXT, TEXT, UUID, JSONB)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_visit_with_sales(UUID, DATE, TEXT, TEXT, UUID, JSONB)
  TO service_role;



-- From: 018_add_reference_to_stock_transactions.sql
-- Migration: Add reference fields to stock_transactions
-- Created: 2026-05-15
--
-- Purpose:
--   Add reference_type and reference_id columns to stock_transactions table
--   to track which visit/document caused each stock transaction. This allows
--   proper auditing and reversal of transactions when visits are edited/deleted.

-- Add reference_type and reference_id columns
ALTER TABLE public.stock_transactions
ADD COLUMN IF NOT EXISTS reference_type VARCHAR,
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Create index on reference columns for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_transactions_reference 
ON public.stock_transactions(reference_type, reference_id);

-- Add comment for documentation
COMMENT ON COLUMN public.stock_transactions.reference_type IS 
  'Type of reference: visit, adjustment, etc.';
COMMENT ON COLUMN public.stock_transactions.reference_id IS 
  'ID of the referenced entity (e.g., visit_id)';



-- From: 019_add_supabase_data_api_grants.sql
-- Migration: Add Supabase Data API GRANT statements
-- Created: 2026-05-15
-- Description: Adds explicit GRANT statements for Data API access after May 30, 2026 changes
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security

-- ============================================
-- DOCTORS table
-- ============================================
GRANT SELECT ON public.doctors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO service_role;

-- ============================================
-- VISITS table
-- ============================================
GRANT SELECT ON public.visits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO service_role;

-- ============================================
-- PRODUCTS table
-- ============================================
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO service_role;

-- ============================================
-- SALES table
-- ============================================
GRANT SELECT ON public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO service_role;

-- ============================================
-- STOCK_TRANSACTIONS table
-- ============================================
GRANT SELECT ON public.stock_transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transactions TO service_role;

-- ============================================
-- CASH_FLOW table
-- ============================================
GRANT SELECT ON public.cash_flow TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flow TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flow TO service_role;

-- ============================================
-- LEDGER_ENTRIES table
-- ============================================
GRANT SELECT ON public.ledger_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO service_role;

-- ============================================
-- CYCLE_PLANS table
-- ============================================
GRANT SELECT ON public.cycle_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_plans TO service_role;

-- ============================================
-- KOL_NOTES table
-- ============================================
GRANT SELECT ON public.kol_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kol_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kol_notes TO service_role;

-- ============================================
-- COMPANIES table
-- ============================================
GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO service_role;

-- ============================================
-- PROFILES table
-- ============================================
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- ============================================
-- DOCTOR_IMPORTANT_DATES table
-- ============================================
GRANT SELECT ON public.doctor_important_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_important_dates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_important_dates TO service_role;

-- ============================================
-- Migration notes
-- ============================================
-- These GRANTs work alongside existing RLS policies:
-- - GRANT statements control table-level access (role permissions)
-- - RLS policies control row-level access (data filtering)
--
-- Timeline:
-- - May 30, 2026: Default for all new projects
-- - October 30, 2026: Enforced on all existing projects
--
-- If you encounter error 42501, it means a GRANT is missing.
-- For future tables, ensure GRANT statements are included in the migration.



-- From: 020_fix_doctor_important_dates_rls.sql
-- Migration: Fix doctor_important_dates RLS policy
-- Created: 2026-06-10
-- Description: Adds missing RLS policy for doctor_important_dates table that was dropped in migration 016

-- Ensure RLS is enabled
ALTER TABLE public.doctor_important_dates ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Owners can manage doctor important dates" ON public.doctor_important_dates;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.doctor_important_dates;

-- Create RLS policy: owners can manage all doctor important dates
CREATE POLICY "Owners can manage doctor important dates" ON public.doctor_important_dates
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Add service_role bypass (for backend operations)
CREATE POLICY "Allow service role full access to doctor important dates" ON public.doctor_important_dates
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Owners can manage doctor important dates" ON public.doctor_important_dates 
  IS 'Owners have full access to doctor important dates management';



-- From: 021_add_mrp_and_doctor_discount.sql
-- Migration: Add product MRP and per-contact discount
-- Created: 2026-07-19
-- Description:
--   * Adds products.mrp (Maximum Retail Price) alongside the existing
--     products.price (the price we bought it for / cost price).
--   * Adds doctors.discount_percentage — a single discount % saved per
--     doctor/chemist, applied to a product's MRP to compute the unit price
--     during a visit (unit_price = mrp * (1 - discount_percentage / 100)).

-- ============================================
-- PRODUCTS: add MRP
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2);

COMMENT ON COLUMN products.mrp IS 'Maximum Retail Price shown to customers (distinct from price, which is our purchase/cost price)';

-- ============================================
-- DOCTORS: add per-contact discount percentage
-- ============================================
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

COMMENT ON COLUMN doctors.discount_percentage IS 'Discount % applied to product MRP for this doctor/chemist to derive the unit price';

-- Backfill existing rows so the column is never null
UPDATE doctors SET discount_percentage = 0 WHERE discount_percentage IS NULL;


