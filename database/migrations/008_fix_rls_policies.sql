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