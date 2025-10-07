-- Migration: Add Doctor Classification Fields
-- Created: 2025-01-07
-- Description: Adds doctor_type and doctor_class fields for better categorization

-- Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='doctors' AND column_name='doctor_type') THEN
        ALTER TABLE doctors ADD COLUMN doctor_type VARCHAR DEFAULT 'prescriber' 
          CHECK (doctor_type IN ('prescriber', 'stockist'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='doctors' AND column_name='doctor_class') THEN
        ALTER TABLE doctors ADD COLUMN doctor_class VARCHAR DEFAULT 'C' 
          CHECK (doctor_class IN ('A', 'B', 'C'));
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN doctors.doctor_type IS 'Type of doctor: prescriber or stockist';
COMMENT ON COLUMN doctors.doctor_class IS 'Classification: A (high value), B (medium), C (standard)';