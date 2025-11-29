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