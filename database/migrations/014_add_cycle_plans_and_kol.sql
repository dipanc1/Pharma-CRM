-- Migration: Add Cycle Plans, KOL support, and KOL Notes
-- Created: 2026-03-22
-- Description: Creates cycle_plans table for quarterly product-doctor assignments,
--              adds is_kol flag to doctors, creates kol_notes table for KOL output tracking

-- ============================================
-- 1. cycle_plans table
-- ============================================
CREATE TABLE IF NOT EXISTS public.cycle_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_start_date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_cycle_product_doctor UNIQUE (cycle_start_date, product_id, doctor_id)
);

ALTER TABLE public.cycle_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.cycle_plans
    FOR ALL USING (true);

CREATE INDEX idx_cycle_plans_cycle_start ON public.cycle_plans(cycle_start_date);
CREATE INDEX idx_cycle_plans_product_id ON public.cycle_plans(product_id);
CREATE INDEX idx_cycle_plans_doctor_id ON public.cycle_plans(doctor_id);

CREATE TRIGGER update_cycle_plans_updated_at
    BEFORE UPDATE ON public.cycle_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.cycle_plans IS 'Stores product-doctor assignments per quarterly cycle';
COMMENT ON COLUMN public.cycle_plans.cycle_start_date IS 'First day of the quarter (e.g., 2026-04-01 for Apr-Jun)';

-- ============================================
-- 2. Add is_kol column to doctors
-- ============================================
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS is_kol BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_doctors_is_kol ON public.doctors(is_kol) WHERE is_kol = true;

COMMENT ON COLUMN public.doctors.is_kol IS 'Whether this doctor is flagged as a Key Opinion Leader';

-- ============================================
-- 3. kol_notes table
-- ============================================
CREATE TABLE IF NOT EXISTS public.kol_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    cycle_start_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_kol_notes_doctor_cycle UNIQUE (doctor_id, cycle_start_date)
);

ALTER TABLE public.kol_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON public.kol_notes
    FOR ALL USING (true);

CREATE INDEX idx_kol_notes_doctor_id ON public.kol_notes(doctor_id);
CREATE INDEX idx_kol_notes_cycle ON public.kol_notes(cycle_start_date);

CREATE TRIGGER update_kol_notes_updated_at
    BEFORE UPDATE ON public.kol_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.kol_notes IS 'Free-text output notes per KOL doctor per quarterly cycle';
