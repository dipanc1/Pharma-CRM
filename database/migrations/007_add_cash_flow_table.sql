-- Migration: Add cash_flow table for tracking cash transactions
-- Created: 2025-11-01

-- Create cash_flow table
CREATE TABLE IF NOT EXISTS public.cash_flow (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    cash_type character varying NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    purpose character varying,
    notes text,
    reference_type character varying,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cash_flow_pkey PRIMARY KEY (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_transaction_date ON public.cash_flow(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_cash_type ON public.cash_flow(cash_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON public.cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_purpose ON public.cash_flow(purpose);
CREATE INDEX IF NOT EXISTS idx_cash_flow_reference ON public.cash_flow(reference_type, reference_id);

-- Add RLS policies
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all cash flow records
CREATE POLICY "Allow authenticated users to view cash flow"
    ON public.cash_flow
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert cash flow records
CREATE POLICY "Allow authenticated users to insert cash flow"
    ON public.cash_flow
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update cash flow records
CREATE POLICY "Allow authenticated users to update cash flow"
    ON public.cash_flow
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to delete cash flow records
CREATE POLICY "Allow authenticated users to delete cash flow"
    ON public.cash_flow
    FOR DELETE
    TO authenticated
    USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cash_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cash_flow_updated_at_trigger
    BEFORE UPDATE ON public.cash_flow
    FOR EACH ROW
    EXECUTE FUNCTION update_cash_flow_updated_at();

-- Add foreign key constraints based on reference_type
-- Note: These assume the existence of related tables (doctors, visits, sales, etc.)
-- Uncomment and modify based on your actual table structure

-- Foreign key for doctor references
-- ALTER TABLE public.cash_flow 
-- ADD CONSTRAINT fk_cash_flow_doctor 
-- FOREIGN KEY (reference_id) 
-- REFERENCES public.doctors(id) 
-- WHERE reference_type = 'doctor';

-- Foreign key for visit references  
-- ALTER TABLE public.cash_flow 
-- ADD CONSTRAINT fk_cash_flow_visit 
-- FOREIGN KEY (reference_id) 
-- REFERENCES public.visits(id) 
-- WHERE reference_type = 'visit';

-- Foreign key for sale references
-- ALTER TABLE public.cash_flow 
-- ADD CONSTRAINT fk_cash_flow_sale 
-- FOREIGN KEY (reference_id) 
-- REFERENCES public.sales(id) 
-- WHERE reference_type = 'sale';

-- Alternative approach: Add a check constraint to ensure reference consistency
-- This ensures reference_id is only set when reference_type is specified
ALTER TABLE public.cash_flow 
ADD CONSTRAINT chk_reference_consistency 
CHECK (
    (reference_type IS NULL AND reference_id IS NULL) OR 
    (reference_type IS NOT NULL AND reference_id IS NOT NULL)
);

-- Add comments for documentation
COMMENT ON TABLE public.cash_flow IS 'Tracks all cash inflows and outflows including sundry expenses and person-related transactions';
COMMENT ON COLUMN public.cash_flow.cash_type IS 'Type of cash flow (e.g., in_flow, out_flow) - user defined';
COMMENT ON COLUMN public.cash_flow.name IS 'Name of the person or description of the sundry item';
COMMENT ON COLUMN public.cash_flow.type IS 'Type of transaction (e.g., sundry, person) - user defined';
COMMENT ON COLUMN public.cash_flow.amount IS 'Transaction amount (always positive)';
COMMENT ON COLUMN public.cash_flow.purpose IS 'Purpose of transaction - user defined (e.g., expense, gift, payment, etc.)';
COMMENT ON COLUMN public.cash_flow.reference_type IS 'Optional reference to related entity (e.g., doctor, visit, sale)';
COMMENT ON COLUMN public.cash_flow.reference_id IS 'Optional ID of the referenced entity';

-- Insert sample data (optional, comment out if not needed)
INSERT INTO public.cash_flow (transaction_date, cash_type, name, type, amount, purpose, notes) VALUES
    (CURRENT_DATE, 'out_flow', 'Office Rent', 'sundry', 15000.00, 'expense', 'Monthly office rent payment'),
    (CURRENT_DATE, 'out_flow', 'Fuel', 'sundry', 2500.00, 'expense', 'Vehicle fuel for field visits'),
    (CURRENT_DATE, 'in_flow', 'Dr. Rajesh Kumar', 'person', 50000.00, 'debt_recovery', 'Outstanding payment received'),
    (CURRENT_DATE, 'out_flow', 'Medical Rep Salary', 'sundry', 25000.00, 'expense', 'Monthly salary payment'),
    (CURRENT_DATE, 'out_flow', 'John Doe', 'person', 10000.00, 'advance', 'Advance given for emergency');
