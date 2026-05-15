-- Migration: Transactional visit-save RPC + unique invoice numbers
-- Created: 2026-05-15
--
-- Purpose:
--   1. Add a UNIQUE constraint on ledger_entries.invoice_number so the
--      app-level generateInvoiceNumber() race cannot silently produce
--      duplicates — concurrent inserts will fail cleanly instead.
--   2. Provide save_visit_with_sales(): a single Postgres function that
--      atomically inserts the visit row, its sales rows, the stock
--      transactions, and the ledger entry. Because the function runs in one
--      implicit transaction, a failure on any step rolls back the entire
--      visit — eliminating the partial-failure inconsistency that the
--      app-side multi-step write currently risks.
--
-- Notes / prerequisites:
--   - If existing rows have duplicate non-null invoice_numbers from prior
--     races, the unique index creation will fail. Deduplicate first by
--     either nulling out duplicates or renaming them, e.g.:
--       UPDATE ledger_entries SET invoice_number = invoice_number || '-DUP-' || id
--       WHERE id IN (
--         SELECT id FROM (
--           SELECT id, row_number() OVER (PARTITION BY invoice_number ORDER BY created_at) rn
--           FROM ledger_entries WHERE invoice_number IS NOT NULL
--         ) t WHERE rn > 1
--       );
--   - The existing trigger update_product_stock() on stock_transactions
--     already syncs products.current_stock automatically. The RPC therefore
--     does NOT call it explicitly. (Side note: that trigger's
--     calculate_current_stock function only knows the 'purchase' / 'sale' /
--     'adjustment' / 'return' transaction types — it ignores 'opening' and
--     'sale_reversal' that the app uses. Worth fixing in a follow-up.)

-- ---------------------------------------------------------------------------
-- 1) Unique index on invoice_number (non-null only)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_invoice_number
  ON public.ledger_entries(invoice_number)
  WHERE invoice_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) save_visit_with_sales(): atomic visit + sales + stock + ledger insert
-- ---------------------------------------------------------------------------
-- p_sales is a JSONB array of objects with shape:
--   { "product_id": uuid, "quantity": number, "unit_price": number,
--     "total_amount": number, "product_name": text (optional) }
--
-- Returns:
--   { "visit_id": uuid, "invoice_number": text|null, "total_amount": numeric }
--
-- Raises:
--   - 'Insufficient stock for product X. Available: A, Required: R'
--     when any product's aggregate requested quantity exceeds available
--     stock as of p_visit_date.
--   - unique_violation on invoice_number collision (extremely unlikely with
--     the advisory lock, but the unique index is the final guarantee).

CREATE OR REPLACE FUNCTION public.save_visit_with_sales(
  p_doctor_id  UUID,
  p_visit_date DATE,
  p_notes      TEXT,
  p_status     TEXT,
  p_user_id    UUID,
  p_sales      JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_visit_id   UUID;
  v_sale       JSONB;
  v_total      NUMERIC := 0;
  v_invoice    TEXT;
  v_prefix     TEXT;
  v_next_num   INT;
  v_product_id UUID;
  v_req_qty    NUMERIC;
  v_avail      NUMERIC;
  v_lock_key   BIGINT;
  v_count      INT;
BEGIN
  v_count := COALESCE(jsonb_array_length(p_sales), 0);

  -- Aggregate stock validation per product, as of p_visit_date.
  IF v_count > 0 THEN
    FOR v_product_id, v_req_qty IN
      SELECT (s->>'product_id')::uuid, SUM((s->>'quantity')::numeric)
      FROM jsonb_array_elements(p_sales) s
      GROUP BY (s->>'product_id')::uuid
    LOOP
      SELECT COALESCE(SUM(
        CASE
          WHEN transaction_type = 'purchase'        THEN  quantity
          WHEN transaction_type = 'opening'         THEN  quantity
          WHEN transaction_type = 'adjustment'      THEN  quantity
          WHEN transaction_type = 'sale'            THEN -ABS(quantity)
          WHEN transaction_type = 'sale_reversal'   THEN  ABS(quantity)
          ELSE 0
        END
      ), 0)
      INTO v_avail
      FROM public.stock_transactions
      WHERE product_id = v_product_id
        AND transaction_date <= p_visit_date;

      IF v_avail < v_req_qty THEN
        RAISE EXCEPTION
          'Insufficient stock for product %. Available: %, Required: %',
          v_product_id, v_avail, v_req_qty
          USING ERRCODE = 'P0001';
      END IF;
    END LOOP;
  END IF;

  -- Insert the visit row.
  INSERT INTO public.visits (doctor_id, visit_date, notes, status, user_id)
  VALUES (p_doctor_id, p_visit_date, p_notes, COALESCE(p_status, 'completed'), p_user_id)
  RETURNING id INTO v_visit_id;

  IF v_count > 0 THEN
    -- Generate invoice number under an advisory lock so concurrent calls
    -- serialize on the same month-prefix. The unique index is the final
    -- safety net.
    v_prefix   := 'INV-' || to_char(now(), 'YYYY-MM');
    v_lock_key := hashtextextended(v_prefix, 0);
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT COALESCE(MAX(
      NULLIF(regexp_replace(invoice_number, '^.*-(\d+)$', '\1'), '')::int
    ), 0) + 1
    INTO v_next_num
    FROM public.ledger_entries
    WHERE invoice_number LIKE v_prefix || '%';

    v_invoice := v_prefix || '-' || lpad(v_next_num::text, 4, '0');

    -- Insert each sale + corresponding stock transaction. Total accumulated
    -- here so we don't have to re-aggregate from p_sales.
    FOR v_sale IN SELECT * FROM jsonb_array_elements(p_sales)
    LOOP
      INSERT INTO public.sales (visit_id, product_id, quantity, unit_price, total_amount)
      VALUES (
        v_visit_id,
        (v_sale->>'product_id')::uuid,
        (v_sale->>'quantity')::numeric,
        (v_sale->>'unit_price')::numeric,
        (v_sale->>'total_amount')::numeric
      );

      INSERT INTO public.stock_transactions (
        product_id, transaction_type, quantity, transaction_date,
        reference_type, reference_id, notes
      )
      VALUES (
        (v_sale->>'product_id')::uuid,
        'sale',
        -(v_sale->>'quantity')::numeric,
        p_visit_date,
        'visit',
        v_visit_id,
        'Sale via visit - Invoice: ' || v_invoice
      );

      v_total := v_total + (v_sale->>'total_amount')::numeric;
    END LOOP;

    -- Single ledger entry for the visit's total.
    INSERT INTO public.ledger_entries (
      doctor_id, entry_date, source_type, source_id,
      description, debit, credit, invoice_number
    )
    VALUES (
      p_doctor_id,
      p_visit_date,
      'visit',
      v_visit_id,
      'Sales from visit - ' || v_count || ' items (Invoice: ' || v_invoice || ')',
      v_total,
      0,
      v_invoice
    );
  END IF;

  RETURN jsonb_build_object(
    'visit_id',       v_visit_id,
    'invoice_number', v_invoice,
    'total_amount',   v_total
  );
END;
$$;

COMMENT ON FUNCTION public.save_visit_with_sales IS
  'Atomically inserts a visit, its sales rows, stock_transactions, and the ledger_entries row. Validates aggregate stock per product as of visit_date. Returns visit_id, invoice_number, total_amount.';

-- Allow the app role(s) to call it. Adjust to your project's role setup.
GRANT EXECUTE ON FUNCTION public.save_visit_with_sales(UUID, DATE, TEXT, TEXT, UUID, JSONB)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_visit_with_sales(UUID, DATE, TEXT, TEXT, UUID, JSONB)
  TO service_role;
