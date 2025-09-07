-- Add current_stock column to products table
ALTER TABLE public.products ADD COLUMN current_stock integer DEFAULT 0;

-- Create stock_transactions table
CREATE TABLE public.stock_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  transaction_type character varying NOT NULL CHECK (transaction_type::text = ANY (ARRAY['opening'::character varying, 'purchase'::character varying, 'sale'::character varying, 'adjustment'::character varying]::text[])),
  quantity integer NOT NULL,
  transaction_date date NOT NULL,
  reference_type character varying,
  reference_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT stock_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX idx_stock_transactions_product_date ON public.stock_transactions(product_id, transaction_date);
CREATE INDEX idx_stock_transactions_reference ON public.stock_transactions(reference_type, reference_id);

-- Insert initial stock transactions for existing products (set opening stock to 0)
INSERT INTO public.stock_transactions (product_id, transaction_type, quantity, transaction_date, notes)
SELECT id, 'opening', 0, CURRENT_DATE, 'Initial opening stock'
FROM public.products;
