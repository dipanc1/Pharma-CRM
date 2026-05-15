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
