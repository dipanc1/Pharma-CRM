-- Sample data for Pharma CRM
-- Run these commands in your Supabase SQL editor after creating the tables

-- Sample Doctors
INSERT INTO doctors (name, specialization, hospital, contact_number, email, address) VALUES
('Dr. Sarah Johnson', 'Cardiology', 'City General Hospital', '+1-555-0101', 'sarah.johnson@citygen.com', '123 Medical Center Dr, City, State 12345'),
('Dr. Michael Chen', 'Neurology', 'Regional Medical Center', '+1-555-0102', 'michael.chen@regional.com', '456 Health Ave, City, State 12345'),
('Dr. Emily Rodriguez', 'Pediatrics', 'Children''s Hospital', '+1-555-0103', 'emily.rodriguez@childrens.com', '789 Care St, City, State 12345'),
('Dr. David Thompson', 'Oncology', 'Cancer Treatment Center', '+1-555-0104', 'david.thompson@cancer.com', '321 Hope Blvd, City, State 12345'),
('Dr. Lisa Wang', 'Dermatology', 'Skin Care Clinic', '+1-555-0105', 'lisa.wang@skincare.com', '654 Beauty Lane, City, State 12345');

-- Sample Products
INSERT INTO products (name, description, price, category) VALUES
('Amoxicillin 500mg', 'Broad-spectrum antibiotic for bacterial infections', 15.99, 'Antibiotics'),
('Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 8.50, 'Pain Relief'),
('Lisinopril 10mg', 'ACE inhibitor for hypertension', 12.75, 'Cardiovascular'),
('Metformin 500mg', 'Oral diabetes medication', 9.25, 'Diabetes'),
('Albuterol Inhaler', 'Bronchodilator for asthma', 22.00, 'Respiratory'),
('Vitamin D3 1000IU', 'Supports bone health and immune function', 14.99, 'Vitamins'),
('Omega-3 Fish Oil', 'Heart health supplement', 18.50, 'Supplements'),
('Omeprazole 20mg', 'Proton pump inhibitor for acid reflux', 11.25, 'Other');

-- Sample Visits (you'll need to replace doctor_id with actual UUIDs from your doctors table)
-- Note: These will need to be updated with actual doctor IDs after running the doctor inserts

-- Sample Sales (you'll need to replace visit_id and product_id with actual UUIDs)
-- Note: These will need to be updated with actual IDs after running the visit and product inserts

-- To get the actual UUIDs, run these queries after inserting the sample data:
-- SELECT id, name FROM doctors;
-- SELECT id, name FROM products;
-- SELECT id, visit_date FROM visits;

-- Then update the visit and sales inserts with the actual UUIDs
