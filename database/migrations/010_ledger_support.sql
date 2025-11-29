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