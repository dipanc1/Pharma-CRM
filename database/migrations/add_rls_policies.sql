-- Enable RLS on stock_transactions table if not already enabled
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- You can modify this based on your specific requirements
CREATE POLICY "Allow all operations for authenticated users" ON public.stock_transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: More granular policies
-- Uncomment and use these if you want more specific control

-- CREATE POLICY "Allow select for authenticated users" ON public.stock_transactions
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow insert for authenticated users" ON public.stock_transactions
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Allow update for authenticated users" ON public.stock_transactions
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow delete for authenticated users" ON public.stock_transactions
--     FOR DELETE USING (auth.role() = 'authenticated');

