# DS Medical Agencies CRM - Pharmaceutical Sales Management System

A comprehensive Customer Relationship Management (CRM) system designed specifically for pharmaceutical sales representatives. This application helps sales reps track doctor visits, manage product sales, inventory, and analyze performance metrics.

## 🌐 Live Demo

Visit the live application: **[https://pharma-crm.netlify.app/](https://pharma-crm.netlify.app/)**

## 🎯 Key Benefits

- **Complete Visit Tracking**: Never lose track of which doctors you visited and when
- **Sales Performance**: Monitor your sales metrics and top-performing relationships
- **Inventory Management**: Real-time stock tracking with low-stock alerts
- **Professional Reporting**: Beautiful charts and analytics for presentations
- **Financial Management**: Track cash flow, maintain accounting ledger, and monitor doctor credit
- **Important Dates**: Never miss important client occasions with automatic calendar tracking
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Data Protection**: Automated backup system with schema versioning
- **Voice-Enabled**: Quick data entry using draggable voice command button

## Features

### 🏥 Doctor Management
- Add and manage doctor profiles with complete contact information
- Store specialization, hospital details, and personal notes
- Advanced search and filter functionality
- Import/export doctor data (CSV support)
- Doctor classification (Type: Prescriber/Dispenser, Class: A/B/C)

### 📅 Visit Tracking
- Record doctor visits with precise date and time tracking
- Add detailed visit notes and outcomes
- Track visit status (completed, scheduled, cancelled, rescheduled)
- Associate multiple sales transactions with each visit
- Set follow-up reminders and notifications
- Filter by date range, city, and status

### 💊 Product Management
- Comprehensive pharmaceutical product catalog
- Organized by company/manufacturer (e.g., LSB LIFE SCIENCES, FLOWRICH PHARMA, CRANIX PHARMA, BRVYMA, RECHELIST PHARMA)
- **Note**: Products are organized by pharmaceutical company rather than generic categories for better tracking
- Batch number and expiry date tracking
- Pricing management with discount support
- Product performance analytics

### 📦 Inventory Management
- Real-time inventory dashboard with comprehensive analytics
- Track opening stock, purchases, sales, returns, and adjustments
- Interactive stock movement charts and company distribution
- **Filter by product, company, and date range**
- Automated low stock alerts and reorder notifications
- Export detailed inventory reports to CSV/Excel
- Batch tracking and expiry management
- Visual company-wise stock distribution

### 💰 Sales Tracking
- Record detailed sales during doctor visits
- Track quantities, unit prices, discounts, and total amounts
- Multi-product sales in single visits
- Commission calculations and reporting
- Target vs achievement tracking
- **Filter by doctor, product, and company**

### 📊 Dashboard & Analytics
- Real-time business metrics and KPIs
- Interactive sales performance charts
- Top doctors by sales volume and frequency
- Revenue analysis by product company and time periods
- Inventory insights with stock value tracking
- Trend analysis and forecasting
- **Monthly and all-time performance views**
- **Important dates calendar** for upcoming doctor events

### 💳 Cash Flow Management
- **Complete Cash Tracking**: Record inflows and outflows with specific categories
- **Contact Linking**: Associate cash flow entries with doctors and chemists
- **Advanced Analytics**: Visual representation of cash flow trends and patterns
- **Voice Command Support**: Record cash transactions using voice commands
- **Categorized Transactions**: Organize by cash type, transaction type, and purpose
- **Multi-Period Reporting**: View cash flow across any date range
- **Dashboard Integration**: Daily cash flow insights and analytics

### 📋 Ledger & Accounting
- **Double-Entry Accounting**: Complete accounting ledger for all transactions
- **Running Balance**: Automatic balance calculations per doctor/contact
- **Trial Balance**: Summary view of all contacts with debit/credit positions
- **Invoice Tracking**: Link ledger entries to specific invoices
- **Source Categorization**: Track transaction sources (sales, cash flow, adjustments)
- **CSV Export**: Export ledger entries and trial balance reports
- **Advanced Filtering**: Filter by contact, date range, and transaction source

### 🎂 Important Dates Management
- **Recurring Dates**: Track important dates for each doctor (birthdays, anniversaries, etc.)
- **Annual Reminders**: Automatic recognition of recurring important dates each year
- **Calendar View**: Integrated calendar display in doctor profiles
- **Full CRUD Operations**: Add, edit, view, and delete important dates
- **Dashboard Visibility**: Upcoming important dates displayed on main dashboard

### 🔄 Backup & Restore System
- **Automated Database Backups**: Complete data and schema backup
- **Schema Export**: Export complete database schema as SQL
- **Version Control**: Track schema changes over time
- **Easy Restoration**: Simple backup restoration process
- **Backup Comparison**: Compare backups to see data changes
- **Automatic Cleanup**: Keep last 10 backups automatically
- **Migration History**: All migration files included in backups

### 🔐 Security Features
- Row Level Security (RLS) with Supabase
- Secure authentication and authorization
- Data encryption in transit and at rest
- Regular automated backups with versioning

## Tech Stack

- **Frontend**: React 18 with modern hooks and functional components
- **Routing**: React Router v6 for seamless navigation
- **Styling**: Tailwind CSS with custom component library
- **Backend**: Supabase (PostgreSQL + Real-time API + Authentication)
- **Charts**: Recharts for interactive data visualization
- **Icons**: Heroicons for consistent iconography
- **Date Handling**: date-fns for robust date manipulation
- **State Management**: React Context API and custom hooks
- **Deployment**: Netlify with automatic deployments

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager
- **Supabase account** (free tier available)
- **Git** for version control

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd pharma-crm
npm install
npm run setup  # Creates .env file automatically
```

### 2. Supabase Configuration
1. Visit [supabase.com](https://supabase.com) and create a new project
2. Navigate to Settings > API in your Supabase dashboard
3. Copy your Project URL and anon/public key
4. Update the generated `.env` file with your credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

#### Option A: Using Migration Files (Recommended)
Run each migration file in order in your Supabase SQL editor:

1. **Initial Schema** ([`database/migrations/001_initial_schema.sql`](database/migrations/001_initial_schema.sql))
2. **Doctor Fields** ([`database/migrations/002_add_doctor_fields.sql`](database/migrations/002_add_doctor_fields.sql))
3. **Stock Tracking** ([`database/migrations/003_add_stock_tracking.sql`](database/migrations/003_add_stock_tracking.sql))
4. **Security Policies** ([`database/migrations/004_add_rls_policies.sql`](database/migrations/004_add_rls_policies.sql))
5. **Performance Indexes** ([`database/migrations/005_add_indexes.sql`](database/migrations/005_add_indexes.sql))
6. **Chemist Support** ([`database/migrations/006_add_chemist_support.sql`](database/migrations/006_add_chemist_support.sql))
7. **Cash Flow Table** ([`database/migrations/007_add_cash_flow_table.sql`](database/migrations/007_add_cash_flow_table.sql))
8. **RLS Policies Fix** ([`database/migrations/008_fix_rls_policies.sql`](database/migrations/008_fix_rls_policies.sql))
9. **Link Doctor to Cash Flow** ([`database/migrations/009_add_link_doctor_cash_flow.sql`](database/migrations/009_add_link_doctor_cash_flow.sql))
10. **Ledger Support** ([`database/migrations/010_ledger_support.sql`](database/migrations/010_ledger_support.sql))
11. **Fix Invoice Number Type** ([`database/migrations/011_fix_invoice_number_type.sql`](database/migrations/011_fix_invoice_number_type.sql))
12. **Doctor Important Dates** ([`database/migrations/012_add_doctor_important_dates.sql`](database/migrations/012_add_doctor_important_dates.sql))

#### Option B: Complete Schema (All-in-One)
Run the complete database schema in your Supabase SQL editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create doctors table
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  specialization VARCHAR,
  hospital VARCHAR,
  contact_number VARCHAR,
  email VARCHAR,
  address TEXT,
  doctor_type VARCHAR DEFAULT 'prescriber' CHECK (doctor_type IN ('prescriber', 'stockist')),
  doctor_class VARCHAR DEFAULT 'C' CHECK (doctor_class IN ('A', 'B', 'C')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visits table
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  notes TEXT,
  status VARCHAR DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  company_name VARCHAR,
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_transactions table
CREATE TABLE stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  reference_number VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create function to calculate current stock
CREATE OR REPLACE FUNCTION calculate_current_stock(product_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(
      CASE 
        WHEN transaction_type IN ('purchase', 'return') THEN quantity
        WHEN transaction_type IN ('sale', 'adjustment') THEN -quantity
        ELSE 0
      END
    )
    FROM stock_transactions 
    WHERE product_id = product_uuid
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to update product stock automatically
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET current_stock = calculate_current_stock(NEW.product_id),
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update stock on transactions
DROP TRIGGER IF EXISTS trigger_update_stock ON stock_transactions;
CREATE TRIGGER trigger_update_stock
  AFTER INSERT OR UPDATE OR DELETE ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (modify based on your auth requirements)
CREATE POLICY "Enable all access for authenticated users" ON doctors FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON visits FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON sales FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON stock_transactions FOR ALL USING (true);
```

### 4. Start Development
```bash
npm start
```

The application will be available at `http://localhost:3000`

### 5. Load Sample Data (Optional)
For testing purposes, load sample data from [`database/sample-data.sql`](database/sample-data.sql)

## 🔄 Database Backup & Restore

### Manual Backup (Complete - Data + Schema + Migrations)
```bash
# Create a full backup with schema and migration files
npm run backup

# Backups are saved to database/backups/ directory
# Format: backup_YYYY-MM-DDTHH-MM-SS.json
```

### Schema-Only Export
```bash
# Export complete schema as executable SQL
npm run backup:schema

# Creates: database/backups/schema_YYYY-MM-DDTHH-MM-SS.sql
```

### Data-Only Backup
```bash
# Backup data without schema information
npm run backup:no-schema
```

### Restore from Backup
```bash
# Interactive restore - choose from available backups
npm run restore

# Follow the prompts to select and restore a backup
```

### View Schema from Backup
```bash
# Interactive schema viewer
npm run restore:schema

# Select a backup to view its schema
# Option to save schema to a file
```

### Compare Backups
```bash
# See what changed between two backups
node database/compare-schema.js backup_2025-01-07.json backup_2025-01-08.json
```

### Backup File Structure
Each backup includes:
```json
{
  "timestamp": "2025-01-07T10:30:00.000Z",
  "version": "2.0",
  "type": "full",
  "tables": {
    "doctors": { "count": 50, "data": [...] },
    "products": { "count": 120, "data": [...] },
    "visits": { "count": 300, "data": [...] },
    "sales": { "count": 450, "data": [...] },
    "stock_transactions": { "count": 600, "data": [...] }
  },
  "schema": {
    "schema": {...},
    "type": "fallback"
  },
  "migrations": {
    "001_initial_schema.sql": "CREATE TABLE...",
    "002_add_doctor_fields.sql": "ALTER TABLE...",
    ...
  }
}
```

### Automated Backups (Production)
```bash
# Install cron dependency
npm install node-cron

# Run automated backup scheduler
node database/schedule-backup.js

# Backups run automatically:
# - Daily at 2:00 AM (full backup with schema)
# - Every 6 hours (data only)
```

### Backup Management Features
- ✅ **Last 10 backups** kept automatically (older ones deleted)
- ✅ **Schema exports** (last 5 kept)
- ✅ **Migration history** included in each backup
- ✅ **Data integrity** with record counts
- ✅ **Easy comparison** between backups
- ✅ **JSON format** for easy inspection

### Backup Best Practices
1. **Regular Backups**: Run daily backups in production (`npm run backup`)
2. **Schema Versioning**: Export schema after major database changes
3. **Off-site Storage**: Copy backups to cloud storage (Google Drive, Dropbox, etc.)
4. **Test Restores**: Regularly test backup restoration process
5. **Before Migrations**: Always backup before running new migrations
6. **Document Changes**: Keep notes about significant schema changes

## Usage Guide

### Getting Started Workflow
1. **Initial Setup**: Add your first doctor profiles in the Doctors section
2. **Product Catalog**: Create your pharmaceutical product inventory
3. **Record Visits**: Start tracking doctor visits with associated sales
4. **Monitor Performance**: Use Dashboard and Sales analytics to track progress
5. **Manage Inventory**: Keep stock levels updated and monitor low stock alerts
6. **Regular Backups**: Set up automated backups for data protection

### Core Workflows

#### 📋 Recording a Complete Doctor Visit
1. Navigate to **Visits** → **Add Visit**
2. Select doctor from the searchable dropdown
3. Set visit date and status
4. Add detailed visit notes and outcomes
5. **Add Sales Items**:
   - Select products from your catalog
   - Enter quantities and confirm pricing
   - System automatically tracks stock levels
6. Save the complete visit record

#### 📊 Analyzing Sales Performance
1. **Dashboard Overview**: Check key metrics and trends
2. **Sales Analytics**: 
   - Filter by date ranges, doctors, products, or companies
   - View performance charts and comparisons
   - Identify top-performing relationships
3. **Export Reports**: Download data for external analysis

#### 📦 Managing Inventory
1. **Monitor Stock Levels**: Check current inventory status on dashboard
2. **Record Transactions**:
   - Log new purchases and stock receipts
   - Record sales (automatic via visits)
   - Handle adjustments and returns
3. **Filter Analysis**: View inventory by product, company, or date range
4. **Track Alerts**: Respond to low stock notifications
5. **Generate Reports**: Export inventory summaries to CSV

#### 🔍 Advanced Search and Filtering
- **Doctors**: Search by name, specialization, hospital; Filter by class (A/B/C) and type (Prescriber/Dispenser)
- **Visits**: Filter by date range, doctor city, and status
- **Products**: Filter by company name, stock level
- **Sales**: Analyze by time period, specific doctor, or product company
- **Inventory**: Multi-filter by product, company, and date range

#### 💾 Data Backup Workflow
1. **Daily Routine**: Run `npm run backup` at end of day
2. **Before Changes**: Backup before major operations or migrations
3. **Monthly Review**: Compare backups to track growth
4. **Schema Updates**: Export schema after database changes
5. **Disaster Recovery**: Keep off-site backup copies

## Advanced Configuration

### Environment Variables
```env
# Required
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
REACT_APP_APP_NAME=DS Medical Agencies
REACT_APP_COMPANY_NAME=Your Company
REACT_APP_SUPPORT_EMAIL=support@yourcompany.com
```

### Customization Options

#### Adding New Product Companies
Edit the company options in [`src/pages/products/AddProduct/AddProduct.container.js`](src/pages/products/AddProduct/AddProduct.container.js):
```javascript
const COMPANIES = [
  { value: 'LSB LIFE SCIENCES', label: 'LSB LIFE SCIENCES' },
  { value: 'FLOWRICH PHARMA', label: 'FLOWRICH PHARMA' },
  { value: 'CRANIX PHARMA', label: 'CRANIX PHARMA' },
  { value: 'BRVYMA', label: 'BRVYMA' },
  { value: 'YOUR NEW COMPANY', label: 'YOUR NEW COMPANY' }  // Add here
];
```

Also update in [`src/pages/products/EditProduct/EditProduct.container.js`](src/pages/products/EditProduct/EditProduct.container.js)

#### Modifying Dashboard Metrics
Update statistics in [`src/pages/dashboard/Dashboard.container.js`](src/pages/dashboard/Dashboard.container.js):
```javascript
// Add new metric cards or modify existing ones
const customMetrics = {
  // Your custom calculations
};
```

#### Customizing Backup Schedule
Edit [`database/schedule-backup.js`](database/schedule-backup.js):
```javascript
// Change backup frequency
cron.schedule('0 2 * * *', () => {  // Daily at 2 AM
  performBackup();
});

cron.schedule('0 */6 * * *', () => { // Every 6 hours
  performBackup({ includeSchema: false });
});
```

#### Styling and Branding
- **Colors**: Modify [`tailwind.config.js`](tailwind.config.js)
- **Fonts**: Update [`src/index.css`](src/index.css)
- **Logo**: Replace in [`src/components/layout/Header.js`](src/components/layout/Header.js)

## Project Structure

```
pharma-crm/
├── public/
│   ├── index.html              # Main HTML template
│   └── favicon.ico             # App favicon
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Common components
│   │   └── layout/            # Layout components
│   ├── contexts/              # React Context providers
│   │   └── AuthContext.js     # Authentication context
│   ├── hooks/                 # Custom React hooks
│   │   └── useToast.js        # Toast notification hook
│   ├── lib/                   # External service configurations
│   │   └── supabase.js        # Supabase client setup
│   ├── pages/                 # Application pages/routes
│   │   ├── dashboard/         # Dashboard components
│   │   ├── doctors/           # Doctor management
│   │   ├── visits/            # Visit tracking
│   │   ├── products/          # Product catalog
│   │   ├── sales/             # Sales analytics
│   │   ├── inventory/         # Inventory management
│   │   └── common/            # Shared page components
│   ├── utils/                 # Utility functions
│   │   └── stockUtils.js      # Stock calculation utilities
│   ├── App.js                 # Main application component
│   ├── index.js               # Application entry point
│   └── index.css              # Global styles and Tailwind imports
├── database/                  # Database related files
│   ├── migrations/            # Database migration files
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_doctor_fields.sql
│   │   ├── 003_add_stock_tracking.sql
│   │   ├── 004_add_rls_policies.sql
│   │   └── 005_add_indexes.sql
│   ├── backups/               # Backup storage directory
│   │   └── .gitkeep          # Keeps directory in git
│   ├── backup.js              # Backup utility script
│   ├── restore.js             # Restore utility script
│   ├── restore-schema.js      # Schema viewer utility
│   ├── compare-schema.js      # Backup comparison utility
│   ├── schedule-backup.js     # Automated backup scheduler
│   ├── sample-data.sql        # Sample data for testing
│   └── auth-policies.sql      # Authentication policies
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies and scripts
├── tailwind.config.js         # Tailwind CSS configuration
├── setup.js                   # Initial setup script
└── README.md                  # This documentation
```

## Performance Optimization

### Database Optimization
- Indexes on frequently queried columns (doctor_id, dates, product_id)
- Optimized queries with proper joins
- Real-time subscriptions for live updates
- Connection pooling via Supabase
- Automatic stock calculation triggers

### Frontend Optimization
- Lazy loading for routes and components
- Memoization for expensive calculations
- Optimized re-renders with React.memo
- Image optimization and compression
- Efficient state management with Context API

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check environment variables
cat .env

# Verify Supabase credentials in dashboard
# Ensure RLS policies are correctly configured
```

#### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### Backup/Restore Issues
```bash
# Ensure database directory exists
mkdir -p database/backups

# Check Node.js version (should be v18+)
node --version

# Verify Supabase connection
node -e "require('dotenv').config(); console.log(process.env.REACT_APP_SUPABASE_URL)"
```

#### Deployment Issues
```bash
# Verify build process
npm run build

# Check environment variables in Netlify dashboard
# Ensure all required variables are set
```

## Deployment Options

### Netlify (Recommended)
1. **Automatic Setup**: Connect GitHub repository
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Environment Variables**: Add in Netlify dashboard
4. **Custom Domain**: Configure in Netlify DNS settings

### Alternative Platforms

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### AWS Amplify
- Connect repository in AWS Console
- Configure build settings and environment variables

#### Traditional Hosting
```bash
npm run build
# Upload build/ folder to your hosting provider
```

### Production Backup Strategy
```bash
# Set up automated backups with cron
npm install node-cron
node database/schedule-backup.js

# Or use cloud backup services
# Store backups in S3, Google Cloud Storage, etc.
```

## API Integration

### Supabase Features Used
- **Database**: PostgreSQL with real-time subscriptions
- **Authentication**: Built-in auth system (ready for implementation)
- **Storage**: File upload capabilities (for future features)
- **Edge Functions**: Serverless functions (for advanced features)

### Custom API Endpoints
The application uses Supabase's auto-generated REST API. For custom functionality, you can add Edge Functions:

```javascript
// Example: Custom sales report function
export default async function handler(req, res) {
  // Custom logic for complex reports
}
```

## Security Best Practices

### Data Protection
- Row Level Security (RLS) enabled on all tables
- Input validation and sanitization
- HTTPS enforced in production
- Regular security updates
- **Automated backups with version control**

### Authentication (Ready for Implementation)
```javascript
// Authentication setup ready in AuthContext
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Backup Security
- Backup files stored locally (can be moved to secure cloud storage)
- Sensitive data encrypted in transit
- Access control via file system permissions
- Automatic cleanup of old backups

## Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/new-feature`
3. **Commit** changes: `git commit -m 'Add new feature'`
4. **Push** to branch: `git push origin feature/new-feature`
5. **Submit** a Pull Request

### Code Standards
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message standards
- **Component Documentation**: JSDoc comments for components

### Testing (Ready for Implementation)
```bash
# Unit tests with Jest and React Testing Library
npm test

# E2E tests with Cypress
npm run cypress:open
```

## Roadmap

### Phase 1 (Current) ✅
- Core CRM functionality
- Visit and sales tracking
- Basic analytics and reporting
- Inventory management
- **Complete backup and restore system**
- **Schema versioning and migration management**

### Phase 2 (Planned) 🚧
- User authentication and multi-user support
- Advanced reporting and exports
- Email notifications and reminders
- Mobile application (React Native)
- **Cloud backup integration (S3, Google Cloud)**

### Phase 3 (Future) 📋
- AI-powered insights and recommendations
- Integration with external systems
- Advanced inventory forecasting
- Customer portal for doctors
- **Real-time collaboration features**

## Support and Community

### Getting Help
- **Documentation**: This README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions

### Commercial Support
For enterprise features, custom development, or priority support:
- Email: [dipanchhabra@gmail.com](mailto:dipanchhabra@gmail.com)
- Website: [dipan-portfolio2.netlify.app](https://dipan-portfolio2.netlify.app)

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Commercial Use
Feel free to use this project for commercial purposes. Attribution is appreciated but not required.

## Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **React Team** for the amazing frontend library
- **Recharts** for beautiful chart components
- **Heroicons** for the comprehensive icon set

---

**Made with ❤️ for pharmaceutical sales professionals**

*Last updated: 2025-10-08*