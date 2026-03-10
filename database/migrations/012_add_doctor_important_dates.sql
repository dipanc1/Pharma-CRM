-- Migration: Add Doctor Important Dates
-- Created: 2026-03-10
-- Description: Creates table for storing important dates (birthdays, anniversaries, etc.) for doctors/chemists

-- Create the doctor_important_dates table
CREATE TABLE IF NOT EXISTS public.doctor_important_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
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
