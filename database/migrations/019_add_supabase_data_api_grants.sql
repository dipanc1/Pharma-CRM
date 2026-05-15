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
