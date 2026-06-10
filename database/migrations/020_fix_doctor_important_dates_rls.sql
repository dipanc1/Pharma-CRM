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
