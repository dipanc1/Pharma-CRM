-- Migration: Add Chemist Support
-- Created: 2025-01-08
-- Description: Adds contact_type field and allows null for doctor-specific fields

-- Add contact_type column
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS contact_type VARCHAR DEFAULT 'doctor' 
  CHECK (contact_type IN ('doctor', 'chemist'));

-- Make doctor-specific fields nullable
ALTER TABLE doctors ALTER COLUMN specialization DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN doctor_type DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN doctor_class DROP NOT NULL;

-- Add index for contact_type
CREATE INDEX IF NOT EXISTS idx_doctors_contact_type ON doctors(contact_type);

-- Update existing records to be 'doctor' type
UPDATE doctors SET contact_type = 'doctor' WHERE contact_type IS NULL;

-- Add comments
COMMENT ON COLUMN doctors.contact_type IS 'Type of contact: doctor or chemist';
COMMENT ON COLUMN doctors.specialization IS 'Doctor specialization (null for chemists)';
COMMENT ON COLUMN doctors.doctor_type IS 'Doctor type: prescriber/dispenser (null for chemists)';
COMMENT ON COLUMN doctors.doctor_class IS 'Doctor class: A/B/C (null for chemists)';