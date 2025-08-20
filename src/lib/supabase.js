import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema for the CRM app
export const DB_SCHEMA = {
  doctors: `
    CREATE TABLE doctors (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR NOT NULL,
      specialization VARCHAR,
      hospital VARCHAR,
      contact_number VARCHAR,
      email VARCHAR,
      address VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  visits: `
    CREATE TABLE visits (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
      visit_date DATE NOT NULL,
      notes TEXT,
      status VARCHAR DEFAULT 'completed',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  products: `
    CREATE TABLE products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      price DECIMAL(10,2),
      category VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  sales: `
    CREATE TABLE sales (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
}
