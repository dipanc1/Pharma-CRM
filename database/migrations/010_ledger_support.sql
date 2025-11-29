-- Migration: Ledger support (entries + helper indexes)
-- Created: 2025-11-29

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_doctor_id ON public.ledger_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_date ON public.ledger_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_source ON public.ledger_entries(source_type, source_id);

-- 2) Helper view: trial balance per contact
CREATE OR REPLACE VIEW public.ledger_trial_balance AS
SELECT
  d.id AS doctor_id,
  d.name,
  d.contact_type,
  COALESCE(SUM(le.debit), 0) AS total_debit,
  COALESCE(SUM(le.credit), 0) AS total_credit,
  COALESCE(SUM(le.debit) - SUM(le.credit), 0) AS current_balance
FROM public.doctors d
LEFT JOIN public.ledger_entries le ON le.doctor_id = d.id
GROUP BY d.id, d.name, d.contact_type;

COMMENT ON VIEW public.ledger_trial_balance IS 'Aggregated debit/credit and current balance per contact';

-- 3) Notes:
-- - Sales via visits should add ledger entries with debit = total_amount (doctor owes).
-- - Cash flow linked to doctor_id should add ledger entries:
--     in_flow  -> credit (payment received, reduces balance)
--     out_flow -> debit (advance/expense paid to contact, increases balance)