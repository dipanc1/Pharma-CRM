-- LIVE DATABASE SCHEMA
-- Read directly from Postgres: 2026-08-15T09:31:13.950Z
--
-- A report of what the database actually contains, not a migration.
-- Use migrations_combined_*.sql to rebuild from scratch.

----------------------------------------------------------------------
TABLE cash_flow
----------------------------------------------------------------------
  id                uuid                      NOT NULL  default gen_random_uuid()
  transaction_date  date                      NOT NULL  default CURRENT_DATE
  cash_type         character varying         NOT NULL
  name              character varying         NOT NULL
  type              character varying         NOT NULL
  amount            numeric                   NOT NULL
  purpose           character varying         NULL    
  notes             text                      NULL    
  reference_type    character varying         NULL    
  reference_id      uuid                      NULL    
  created_at        timestamp with time zone  NULL      default now()
  updated_at        timestamp with time zone  NULL      default now()
  doctor_id         uuid                      NULL    

  CHECK  cash_flow_amount_check
    CHECK ((amount > (0)::numeric))
  CHECK  chk_reference_consistency
    CHECK ((((reference_type IS NULL) AND (reference_id IS NULL)) OR ((reference_type IS NOT NULL) AND (reference_id IS NOT NULL))))
  FOREIGN KEY  cash_flow_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
  PRIMARY KEY  cash_flow_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Owners can manage cash flow  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  TRIGGER update_cash_flow_updated_at_trigger
    CREATE TRIGGER update_cash_flow_updated_at_trigger BEFORE UPDATE ON public.cash_flow FOR EACH ROW EXECUTE FUNCTION update_cash_flow_updated_at()

  INDEX CREATE UNIQUE INDEX cash_flow_pkey ON public.cash_flow USING btree (id)
  INDEX CREATE INDEX idx_cash_flow_cash_type ON public.cash_flow USING btree (cash_type)
  INDEX CREATE INDEX idx_cash_flow_doctor_id ON public.cash_flow USING btree (doctor_id)
  INDEX CREATE INDEX idx_cash_flow_purpose ON public.cash_flow USING btree (purpose)
  INDEX CREATE INDEX idx_cash_flow_reference ON public.cash_flow USING btree (reference_type, reference_id)
  INDEX CREATE INDEX idx_cash_flow_transaction_date ON public.cash_flow USING btree (transaction_date)
  INDEX CREATE INDEX idx_cash_flow_type ON public.cash_flow USING btree (type)

----------------------------------------------------------------------
TABLE companies
----------------------------------------------------------------------
  id           uuid                      NOT NULL  default gen_random_uuid()
  name         character varying         NOT NULL
  description  text                      NULL    
  created_at   timestamp with time zone  NULL      default now()
  updated_at   timestamp with time zone  NULL      default now()

  PRIMARY KEY  companies_pkey
    PRIMARY KEY (id)
  UNIQUE  companies_name_key
    UNIQUE (name)

  RLS: ENABLED
  POLICY Owners can manage companies  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  INDEX CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (name)
  INDEX CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id)
  INDEX CREATE INDEX idx_companies_name ON public.companies USING btree (name)

----------------------------------------------------------------------
TABLE cycle_plans
----------------------------------------------------------------------
  id                uuid                      NOT NULL  default gen_random_uuid()
  cycle_start_date  date                      NOT NULL
  product_id        uuid                      NOT NULL
  doctor_id         uuid                      NOT NULL
  created_at        timestamp with time zone  NULL      default now()
  updated_at        timestamp with time zone  NULL      default now()

  FOREIGN KEY  cycle_plans_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  FOREIGN KEY  cycle_plans_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  PRIMARY KEY  cycle_plans_pkey
    PRIMARY KEY (id)
  UNIQUE  uq_cycle_product_doctor
    UNIQUE (cycle_start_date, product_id, doctor_id)

  RLS: ENABLED
  !! RLS is enabled but this table has NO POLICIES.
  !! Every query against it is denied except via service_role.

  TRIGGER update_cycle_plans_updated_at
    CREATE TRIGGER update_cycle_plans_updated_at BEFORE UPDATE ON public.cycle_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

  INDEX CREATE UNIQUE INDEX cycle_plans_pkey ON public.cycle_plans USING btree (id)
  INDEX CREATE INDEX idx_cycle_plans_cycle_start ON public.cycle_plans USING btree (cycle_start_date)
  INDEX CREATE INDEX idx_cycle_plans_doctor_id ON public.cycle_plans USING btree (doctor_id)
  INDEX CREATE INDEX idx_cycle_plans_product_id ON public.cycle_plans USING btree (product_id)
  INDEX CREATE UNIQUE INDEX uq_cycle_product_doctor ON public.cycle_plans USING btree (cycle_start_date, product_id, doctor_id)

----------------------------------------------------------------------
TABLE doctor_important_dates
----------------------------------------------------------------------
  id            uuid                      NOT NULL  default uuid_generate_v4()
  doctor_id     uuid                      NOT NULL
  label         character varying(100)    NOT NULL
  date          date                      NOT NULL
  notes         text                      NULL    
  created_at    timestamp with time zone  NULL      default now()
  updated_at    timestamp with time zone  NULL      default now()
  is_recurring  boolean                   NOT NULL  default false

  FOREIGN KEY  doctor_important_dates_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  PRIMARY KEY  doctor_important_dates_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Allow service role full access to doctor important dates  [ALL]  roles={service_role}  
    USING true
    WITH CHECK true
  POLICY Owners can manage doctor important dates  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  TRIGGER set_doctor_important_dates_updated_at
    CREATE TRIGGER set_doctor_important_dates_updated_at BEFORE UPDATE ON public.doctor_important_dates FOR EACH ROW EXECUTE FUNCTION update_doctor_important_dates_updated_at()

  INDEX CREATE UNIQUE INDEX doctor_important_dates_pkey ON public.doctor_important_dates USING btree (id)
  INDEX CREATE INDEX idx_doctor_important_dates_date_month_day ON public.doctor_important_dates USING btree (EXTRACT(month FROM date), EXTRACT(day FROM date))
  INDEX CREATE INDEX idx_doctor_important_dates_doctor_id ON public.doctor_important_dates USING btree (doctor_id)

----------------------------------------------------------------------
TABLE doctors
----------------------------------------------------------------------
  id                   uuid                      NOT NULL  default gen_random_uuid()
  name                 character varying         NOT NULL
  specialization       character varying         NULL    
  hospital             character varying         NULL    
  contact_number       character varying         NULL    
  email                character varying         NULL    
  address              character varying         NULL    
  created_at           timestamp with time zone  NULL      default now()
  updated_at           timestamp with time zone  NULL      default now()
  doctor_class         character varying         NULL    
  doctor_type          character varying         NULL    
  contact_type         character varying         NULL      default 'doctor'::character varying
  is_kol               boolean                   NOT NULL  default false
  discount_percentage  numeric(5,2)              NULL      default 0

  CHECK  doctors_contact_type_check
    CHECK (((contact_type)::text = ANY ((ARRAY['doctor'::character varying, 'chemist'::character varying])::text[])))
  CHECK  doctors_discount_percentage_check
    CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric)))
  CHECK  doctors_doctor_class_check
    CHECK (((doctor_class)::text = ANY ((ARRAY['A'::character varying, 'B'::character varying, 'C'::character varying])::text[])))
  CHECK  doctors_doctor_type_check
    CHECK (((doctor_type)::text = ANY ((ARRAY['dispenser'::character varying, 'prescriber'::character varying])::text[])))
  PRIMARY KEY  doctors_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Authenticated can read doctors  [SELECT]  roles={authenticated}  
    USING true
  POLICY Owners can manage doctors  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  INDEX CREATE UNIQUE INDEX doctors_pkey ON public.doctors USING btree (id)
  INDEX CREATE INDEX idx_doctors_contact_type ON public.doctors USING btree (contact_type)
  INDEX CREATE INDEX idx_doctors_is_kol ON public.doctors USING btree (is_kol) WHERE (is_kol = true)

----------------------------------------------------------------------
TABLE kol_notes
----------------------------------------------------------------------
  id                uuid                      NOT NULL  default gen_random_uuid()
  doctor_id         uuid                      NOT NULL
  cycle_start_date  date                      NOT NULL
  notes             text                      NULL    
  created_at        timestamp with time zone  NULL      default now()
  updated_at        timestamp with time zone  NULL      default now()

  FOREIGN KEY  kol_notes_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  PRIMARY KEY  kol_notes_pkey
    PRIMARY KEY (id)
  UNIQUE  uq_kol_notes_doctor_cycle
    UNIQUE (doctor_id, cycle_start_date)

  RLS: ENABLED
  !! RLS is enabled but this table has NO POLICIES.
  !! Every query against it is denied except via service_role.

  TRIGGER update_kol_notes_updated_at
    CREATE TRIGGER update_kol_notes_updated_at BEFORE UPDATE ON public.kol_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

  INDEX CREATE INDEX idx_kol_notes_cycle ON public.kol_notes USING btree (cycle_start_date)
  INDEX CREATE INDEX idx_kol_notes_doctor_id ON public.kol_notes USING btree (doctor_id)
  INDEX CREATE UNIQUE INDEX kol_notes_pkey ON public.kol_notes USING btree (id)
  INDEX CREATE UNIQUE INDEX uq_kol_notes_doctor_cycle ON public.kol_notes USING btree (doctor_id, cycle_start_date)

----------------------------------------------------------------------
TABLE ledger_entries
----------------------------------------------------------------------
  id              uuid                      NOT NULL  default gen_random_uuid()
  doctor_id       uuid                      NOT NULL
  entry_date      date                      NOT NULL  default CURRENT_DATE
  source_type     character varying         NOT NULL
  source_id       uuid                      NULL    
  description     text                      NULL    
  debit           numeric                   NOT NULL  default 0
  credit          numeric                   NOT NULL  default 0
  balance         numeric                   NULL    
  invoice_number  character varying(50)     NULL    
  created_at      timestamp with time zone  NULL      default now()

  CHECK  chk_ledger_entries_one_sided
    CHECK ((((debit = (0)::numeric) AND (credit > (0)::numeric)) OR ((credit = (0)::numeric) AND (debit > (0)::numeric))))
  CHECK  ledger_entries_credit_check
    CHECK ((credit >= (0)::numeric))
  CHECK  ledger_entries_debit_check
    CHECK ((debit >= (0)::numeric))
  CHECK  ledger_entries_source_type_check
    CHECK (((source_type)::text = ANY ((ARRAY['visit'::character varying, 'sale'::character varying, 'cash'::character varying])::text[])))
  FOREIGN KEY  ledger_entries_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  PRIMARY KEY  ledger_entries_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Allow service role full access to ledger_entries  [ALL]  roles={service_role}  
    USING true
    WITH CHECK true
  POLICY Owners can manage ledger entries  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  INDEX CREATE INDEX idx_ledger_doctor_id ON public.ledger_entries USING btree (doctor_id)
  INDEX CREATE INDEX idx_ledger_entry_date ON public.ledger_entries USING btree (entry_date DESC)
  INDEX CREATE INDEX idx_ledger_invoice_number ON public.ledger_entries USING btree (invoice_number) WHERE (invoice_number IS NOT NULL)
  INDEX CREATE INDEX idx_ledger_source ON public.ledger_entries USING btree (source_type, source_id)
  INDEX CREATE UNIQUE INDEX ledger_entries_pkey ON public.ledger_entries USING btree (id)
  INDEX CREATE UNIQUE INDEX uq_ledger_invoice_number ON public.ledger_entries USING btree (invoice_number) WHERE (invoice_number IS NOT NULL)
  INDEX CREATE UNIQUE INDEX uq_ledger_source_unique ON public.ledger_entries USING btree (source_type, source_id) WHERE (source_id IS NOT NULL)

----------------------------------------------------------------------
TABLE products
----------------------------------------------------------------------
  id             uuid                      NOT NULL  default gen_random_uuid()
  name           character varying         NOT NULL
  description    text                      NULL    
  price          numeric(10,2)             NULL    
  created_at     timestamp with time zone  NULL      default now()
  updated_at     timestamp with time zone  NULL      default now()
  current_stock  integer                   NULL      default 0
  company_name   text                      NULL    
  mrp            numeric(10,2)             NULL    

  PRIMARY KEY  products_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Owners can manage products  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  INDEX CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id)

----------------------------------------------------------------------
TABLE profiles
----------------------------------------------------------------------
  id            uuid                      NOT NULL
  role          text                      NOT NULL  default 'owner'::text
  display_name  text                      NULL    
  created_at    timestamp with time zone  NULL      default now()
  updated_at    timestamp with time zone  NULL      default now()

  CHECK  profiles_role_check
    CHECK ((role = ANY (ARRAY['owner'::text, 'rep'::text])))
  FOREIGN KEY  profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
  PRIMARY KEY  profiles_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Owners can view all profiles  [SELECT]  roles={authenticated}  
    USING is_owner()
  POLICY Users can update own profile  [UPDATE]  roles={authenticated}  
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id)
  POLICY Users can view own profile  [SELECT]  roles={authenticated}  
    USING (auth.uid() = id)

  TRIGGER update_profiles_updated_at
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

  INDEX CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)

----------------------------------------------------------------------
TABLE sales
----------------------------------------------------------------------
  id            uuid                      NOT NULL  default gen_random_uuid()
  visit_id      uuid                      NULL    
  product_id    uuid                      NULL    
  quantity      integer                   NOT NULL
  unit_price    numeric(10,2)             NOT NULL
  total_amount  numeric(10,2)             NOT NULL
  created_at    timestamp with time zone  NULL      default now()

  FOREIGN KEY  sales_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  FOREIGN KEY  sales_visit_id_fkey
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
  PRIMARY KEY  sales_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Owners can manage sales  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  INDEX CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id)

----------------------------------------------------------------------
TABLE stock_transactions
----------------------------------------------------------------------
  id                uuid                      NOT NULL  default gen_random_uuid()
  product_id        uuid                      NOT NULL
  transaction_type  character varying         NOT NULL
  quantity          integer                   NOT NULL
  transaction_date  date                      NOT NULL
  reference_type    character varying         NULL    
  reference_id      uuid                      NULL    
  notes             text                      NULL    
  created_at        timestamp with time zone  NULL      default now()

  CHECK  stock_transactions_transaction_type_check
    CHECK (((transaction_type)::text = ANY (ARRAY[('opening'::character varying)::text, ('purchase'::character varying)::text, ('sale'::character varying)::text, ('adjustment'::character varying)::text])))
  FOREIGN KEY  stock_transactions_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  PRIMARY KEY  stock_transactions_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Owners can manage stock transactions  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()

  INDEX CREATE INDEX idx_stock_transactions_product_date ON public.stock_transactions USING btree (product_id, transaction_date)
  INDEX CREATE INDEX idx_stock_transactions_reference ON public.stock_transactions USING btree (reference_type, reference_id)
  INDEX CREATE UNIQUE INDEX stock_transactions_pkey ON public.stock_transactions USING btree (id)

----------------------------------------------------------------------
TABLE visits
----------------------------------------------------------------------
  id          uuid                      NOT NULL  default gen_random_uuid()
  doctor_id   uuid                      NULL    
  visit_date  date                      NOT NULL
  notes       text                      NULL    
  status      character varying         NULL      default 'completed'::character varying
  created_at  timestamp with time zone  NULL      default now()
  updated_at  timestamp with time zone  NULL      default now()
  user_id     uuid                      NULL    

  FOREIGN KEY  visits_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  FOREIGN KEY  visits_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
  PRIMARY KEY  visits_pkey
    PRIMARY KEY (id)

  RLS: ENABLED
  POLICY Owners can manage visits  [ALL]  roles={authenticated}  
    USING is_owner()
    WITH CHECK is_owner()
  POLICY Reps can manage own visits  [ALL]  roles={authenticated}  
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id)

  INDEX CREATE INDEX idx_visits_user_id ON public.visits USING btree (user_id)
  INDEX CREATE UNIQUE INDEX visits_pkey ON public.visits USING btree (id)

======================================================================
FUNCTIONS
======================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, 'rep', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.is_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
$function$

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_cash_flow_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_doctor_important_dates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
