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
