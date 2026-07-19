-- Migration: Add product MRP and per-contact discount
-- Created: 2026-07-19
-- Description:
--   * Adds products.mrp (Maximum Retail Price) alongside the existing
--     products.price (the price we bought it for / cost price).
--   * Adds doctors.discount_percentage — a single discount % saved per
--     doctor/chemist, applied to a product's MRP to compute the unit price
--     during a visit (unit_price = mrp * (1 - discount_percentage / 100)).

-- ============================================
-- PRODUCTS: add MRP
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2);

COMMENT ON COLUMN products.mrp IS 'Maximum Retail Price shown to customers (distinct from price, which is our purchase/cost price)';

-- ============================================
-- DOCTORS: add per-contact discount percentage
-- ============================================
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

COMMENT ON COLUMN doctors.discount_percentage IS 'Discount % applied to product MRP for this doctor/chemist to derive the unit price';

-- Backfill existing rows so the column is never null
UPDATE doctors SET discount_percentage = 0 WHERE discount_percentage IS NULL;
