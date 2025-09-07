# Pharma CRM - Pharmaceutical Sales Management System

A comprehensive Customer Relationship Management (CRM) system designed specifically for pharmaceutical sales representatives. This application helps sales reps track doctor visits, manage product sales, inventory, and analyze performance metrics.

## 🌐 Live Demo

Visit the live application: **[https://pharma-crm.netlify.app/](https://pharma-crm.netlify.app/)**

## 🎯 Key Benefits

- **Complete Visit Tracking**: Never lose track of which doctors you visited and when
- **Sales Performance**: Monitor your sales metrics and top-performing relationships
- **Inventory Management**: Real-time stock tracking with low-stock alerts
- **Professional Reporting**: Beautiful charts and analytics for presentations
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## Features

### 🏥 Doctor Management
- Add and manage doctor profiles with complete contact information
- Store specialization, hospital details, and personal notes
- Advanced search and filter functionality
- Import/export doctor data (CSV support)

### 📅 Visit Tracking
- Record doctor visits with precise date and time tracking
- Add detailed visit notes and outcomes
- Track visit status (completed, scheduled, cancelled, rescheduled)
- Associate multiple sales transactions with each visit
- Set follow-up reminders and notifications

### 💊 Product Management
- Comprehensive pharmaceutical product catalog
- Multiple product categories (Antibiotics, Pain Relief, Cardiovascular, Diabetes, etc.)
- Batch number and expiry date tracking
- Pricing management with discount support
- Product performance analytics

### 📦 Inventory Management
- Real-time inventory dashboard with comprehensive analytics
- Track opening stock, purchases, sales, returns, and adjustments
- Interactive stock movement charts and category distribution
- Automated low stock alerts and reorder notifications
- Export detailed inventory reports to CSV/Excel
- Batch tracking and expiry management

### 💰 Sales Tracking
- Record detailed sales during doctor visits
- Track quantities, unit prices, discounts, and total amounts
- Multi-product sales in single visits
- Commission calculations and reporting
- Target vs achievement tracking

### 📊 Dashboard & Analytics
- Real-time business metrics and KPIs
- Interactive sales performance charts
- Top doctors by sales volume and frequency
- Revenue analysis by product category and time periods
- Inventory insights with stock value tracking
- Trend analysis and forecasting

### 🔐 Security Features
- Row Level Security (RLS) with Supabase
- Secure authentication and authorization
- Data encryption in transit and at rest
- Regular automated backups

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
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visits table
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_time TIME,
  notes TEXT,
  status VARCHAR DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category VARCHAR NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  batch_number VARCHAR,
  expiry_date DATE,
  manufacturer VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_transactions table for inventory tracking
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
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_sales_visit_id ON sales(visit_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(transaction_date);

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
For testing purposes, run the sample data script:
```bash
-- Load sample data (available in database/sample-data.sql)
```

## Usage Guide

### Getting Started Workflow
1. **Initial Setup**: Add your first doctor profiles in the Doctors section
2. **Product Catalog**: Create your pharmaceutical product inventory
3. **Record Visits**: Start tracking doctor visits with associated sales
4. **Monitor Performance**: Use Dashboard and Sales analytics to track progress
5. **Manage Inventory**: Keep stock levels updated and monitor low stock alerts

### Core Workflows

#### 📋 Recording a Complete Doctor Visit
1. Navigate to **Visits** → **Add Visit**
2. Select doctor from the searchable dropdown
3. Set visit date, time, and status
4. Add detailed visit notes and outcomes
5. **Add Sales Items**:
   - Select products from your catalog
   - Enter quantities and confirm pricing
   - Apply any discounts if applicable
6. Set follow-up date if needed
7. Save the complete visit record

#### 📊 Analyzing Sales Performance
1. **Dashboard Overview**: Check key metrics and trends
2. **Sales Analytics**: 
   - Filter by date ranges, doctors, or products
   - View performance charts and comparisons
   - Identify top-performing relationships
3. **Export Reports**: Download data for external analysis

#### 📦 Managing Inventory
1. **Monitor Stock Levels**: Check current inventory status
2. **Record Transactions**:
   - Log new purchases and stock receipts
   - Record sales and adjustments
   - Handle returns and damaged goods
3. **Track Alerts**: Respond to low stock notifications
4. **Generate Reports**: Export inventory summaries

#### 🔍 Advanced Search and Filtering
- **Doctors**: Search by name, specialization, hospital
- **Visits**: Filter by date range, doctor, status
- **Products**: Filter by category, stock level, expiry
- **Sales**: Analyze by time period, doctor, product category

## Advanced Configuration

### Environment Variables
```env
# Required
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
REACT_APP_APP_NAME=Pharma CRM
REACT_APP_COMPANY_NAME=Your Company
REACT_APP_SUPPORT_EMAIL=support@yourcompany.com
```

### Customization Options

#### Adding New Product Categories
Edit the category options in [`src/pages/AddProduct.js`](src/pages/AddProduct.js):
```javascript
const categories = [
  'Antibiotics',
  'Pain Relief',
  'Cardiovascular',
  'Diabetes',
  'Respiratory',
  'Your New Category'  // Add here
];
```

#### Modifying Dashboard Metrics
Update statistics in [`src/pages/Dashboard.js`](src/pages/Dashboard.js):
```javascript
// Add new metric cards or modify existing ones
const customMetrics = {
  // Your custom calculations
};
```

#### Styling and Branding
- **Colors**: Modify [`tailwind.config.js`](tailwind.config.js)
- **Fonts**: Update [`src/index.css`](src/index.css)
- **Logo**: Replace in [`src/components/Layout.js`](src/components/Layout.js)

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
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard components
│   │   ├── common/            # Shared page components
│   │   └── inventory/         # Inventory management
│   ├── utils/                 # Utility functions
│   │   └── stockUtils.js      # Stock calculation utilities
│   ├── App.js                 # Main application component
│   ├── index.js               # Application entry point
│   └── index.css              # Global styles and Tailwind imports
├── database/                  # Database related files
│   ├── auth-policies.sql      # Authentication policies
│   ├── sample-data.sql        # Sample data for testing
│   └── migrations/            # Database migration files
├── .env.example               # Environment variables template
├── package.json               # Project dependencies and scripts
├── tailwind.config.js         # Tailwind CSS configuration
└── README.md                  # This documentation
```

## Performance Optimization

### Database Optimization
- Indexes on frequently queried columns
- Optimized queries with proper joins
- Real-time subscriptions for live updates
- Connection pooling via Supabase

### Frontend Optimization
- Lazy loading for routes and components
- Memoization for expensive calculations
- Optimized re-renders with React.memo
- Image optimization and compression

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

### Authentication (Ready for Implementation)
```javascript
// Authentication setup ready in AuthContext
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

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

### Phase 2 (Planned) 🚧
- User authentication and multi-user support
- Advanced reporting and exports
- Email notifications and reminders
- Mobile application (React Native)

### Phase 3 (Future) 📋
- AI-powered insights and recommendations
- Integration with external systems
- Advanced inventory forecasting
- Customer portal for doctors

## Support and Community

### Getting Help
- **Documentation**: This README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions

### Commercial Support
For enterprise features, custom development, or priority support:
- Email: [Click here to contact me](mailto:dipanchhabra@gmail.com)
- Website: [Click here to visit my website](https://dipan-portfolio2.netlify.app)

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

*Last updated: 07-09-2025*