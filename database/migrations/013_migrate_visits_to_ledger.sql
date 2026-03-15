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
