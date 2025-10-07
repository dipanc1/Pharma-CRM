-- Migration: Performance Indexes
-- Created: 2025-01-07
-- Description: Adds indexes for improved query performance

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_visits_doctor_id;
DROP INDEX IF EXISTS idx_visits_date;
DROP INDEX IF EXISTS idx_sales_visit_id;
DROP INDEX IF EXISTS idx_sales_product_id;
DROP INDEX IF EXISTS idx_stock_transactions_product_id;
DROP INDEX IF EXISTS idx_stock_transactions_date;
DROP INDEX IF EXISTS idx_doctors_name;
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_products_company;

-- Create indexes for better performance
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_date ON visits(visit_date DESC);
CREATE INDEX idx_sales_visit_id ON sales(visit_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(transaction_date DESC);
CREATE INDEX idx_doctors_name ON doctors(name);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_company ON products(company_name);

-- Additional composite indexes for common queries
CREATE INDEX idx_visits_doctor_date ON visits(doctor_id, visit_date DESC);
CREATE INDEX idx_sales_product_visit ON sales(product_id, visit_id);

COMMENT ON INDEX idx_visits_doctor_id IS 'Speed up doctor visit lookups';
COMMENT ON INDEX idx_visits_date IS 'Speed up date-based visit queries';