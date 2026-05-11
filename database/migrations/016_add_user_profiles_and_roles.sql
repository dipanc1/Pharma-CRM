-- Migration: Add user profiles and role-based access
-- Created: 2026-05-11
-- Description: Adds profiles, roles, and RLS for owner/rep access

-- 0) Clean up legacy policies (from previous incomplete migrations)
-- Drop all old "Enable all operations" and "Allow all" policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.visits;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow all operations for visits" ON public.visits;
DROP POLICY IF EXISTS "Allow all operations for products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations for sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations for stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow all operations for ledger_entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.cycle_plans;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.doctor_important_dates;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.kol_notes;

-- Drop broken companies policies
DROP POLICY IF EXISTS "Anyone can read companies" ON public.companies;
DROP POLICY IF EXISTS "Only authorized users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Only authorized users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Only authorized users can delete companies" ON public.companies;

-- 1) Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'rep')),
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, 'rep', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users (assume owner for current business)
INSERT INTO public.profiles (id, role, display_name)
SELECT id, 'owner', COALESCE(raw_user_meta_data->>'display_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2) Helper function for role checks
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- 3) Visits ownership
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_visits_user_id ON public.visits(user_id);

-- Assign existing visits to the first owner profile (single business setup)
UPDATE public.visits
SET user_id = (
  SELECT id FROM public.profiles
  WHERE role = 'owner'
  ORDER BY created_at
  LIMIT 1
)
WHERE user_id IS NULL;

-- 4) RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_owner());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Doctors: readable by all authenticated, owner can manage
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Allow all operations for doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated can read doctors" ON public.doctors;
DROP POLICY IF EXISTS "Owners can manage doctors" ON public.doctors;

CREATE POLICY "Authenticated can read doctors" ON public.doctors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owners can manage doctors" ON public.doctors
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Visits: owner can manage all, reps only their own
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.visits;
DROP POLICY IF EXISTS "Allow all operations for visits" ON public.visits;
DROP POLICY IF EXISTS "Users can view their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can insert their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can update their own visits" ON public.visits;
DROP POLICY IF EXISTS "Users can delete their own visits" ON public.visits;
DROP POLICY IF EXISTS "Owners can manage visits" ON public.visits;
DROP POLICY IF EXISTS "Reps can manage own visits" ON public.visits;

CREATE POLICY "Owners can manage visits" ON public.visits
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "Reps can manage own visits" ON public.visits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Products: owner only
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow all operations for products" ON public.products;
DROP POLICY IF EXISTS "Owners can manage products" ON public.products;

CREATE POLICY "Owners can manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Sales: owner only
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.sales;
DROP POLICY IF EXISTS "Allow all operations for sales" ON public.sales;
DROP POLICY IF EXISTS "Owners can manage sales" ON public.sales;

CREATE POLICY "Owners can manage sales" ON public.sales
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Stock transactions: owner only
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow all operations for stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Owners can manage stock transactions" ON public.stock_transactions;

CREATE POLICY "Owners can manage stock transactions" ON public.stock_transactions
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Ledger entries: owner only
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for ledger_entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Owners can manage ledger entries" ON public.ledger_entries;

CREATE POLICY "Owners can manage ledger entries" ON public.ledger_entries
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Allow service role full access to ledger_entries" ON public.ledger_entries;
CREATE POLICY "Allow service role full access to ledger_entries" ON public.ledger_entries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Cash flow: owner only
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to view cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow authenticated users to insert cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow authenticated users to update cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow authenticated users to delete cash flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Allow all operations for cash_flow" ON public.cash_flow;
DROP POLICY IF EXISTS "Owners can manage cash flow" ON public.cash_flow;

CREATE POLICY "Owners can manage cash flow" ON public.cash_flow
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Companies: owner only
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage companies" ON public.companies;

CREATE POLICY "Owners can manage companies" ON public.companies
  FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());
