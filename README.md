# Pharma CRM - Pharmaceutical Sales Management System

A comprehensive Customer Relationship Management (CRM) system designed specifically for pharmaceutical sales representatives. This application helps sales reps track doctor visits, manage product sales, and analyze performance metrics.

## Features

### 🏥 Doctor Management
- Add and manage doctor profiles
- Store contact information, specialization, and hospital details
- Search and filter doctors by various criteria

### 📅 Visit Tracking
- Record doctor visits with dates and notes
- Track visit status (completed, scheduled, cancelled)
- Associate sales with specific visits

### 💊 Product Management
- Manage pharmaceutical product catalog
- Categorize products (Antibiotics, Pain Relief, Cardiovascular, etc.)
- Set pricing and descriptions

### 💰 Sales Tracking
- Record sales during doctor visits
- Track quantities, unit prices, and total amounts
- Comprehensive sales analytics and reporting

### 📊 Dashboard & Analytics
- Real-time statistics and metrics
- Sales performance charts
- Top doctors by sales volume
- Revenue analysis by product category

## Tech Stack

- **Frontend**: React 18 with React Router
- **Styling**: Tailwind CSS with custom components
- **Backend**: Supabase (PostgreSQL + Real-time API)
- **Charts**: Recharts for data visualization
- **Icons**: Heroicons
- **Date Handling**: date-fns

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pharma-crm
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project dashboard
3. Copy your project URL and anon key from Settings > API

### 4. Configure Environment Variables

Create a `.env` file in the root directory:
```bash
cp env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Set Up Database Schema

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Create doctors table
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  specialization VARCHAR,
  hospital VARCHAR,
  contact_number VARCHAR,
  email VARCHAR,
  address TEXT,
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
  category VARCHAR,
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
```

### 6. Start the Development Server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage Guide

### Getting Started
1. **Add Doctors**: Start by adding doctor profiles in the Doctors section
2. **Add Products**: Create your product catalog in the Products section
3. **Record Visits**: Use the Visits section to record doctor visits and sales
4. **Monitor Performance**: Check the Dashboard and Sales sections for analytics

### Key Workflows

#### Recording a Doctor Visit with Sales
1. Navigate to "Visits" → "Add Visit"
2. Select the doctor from the dropdown
3. Set the visit date and add notes
4. Add sales items by selecting products, quantities, and prices
5. Save the visit

#### Viewing Sales Analytics
1. Go to the "Sales" section
2. Use filters to analyze data by date or doctor
3. View charts showing sales by category and top-performing doctors
4. Review detailed sales records in the table

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.js       # Main layout with navigation
├── lib/                # Utility libraries
│   └── supabase.js     # Supabase client configuration
├── pages/              # Application pages
│   ├── Dashboard.js    # Main dashboard with analytics
│   ├── Doctors.js      # Doctor management
│   ├── AddDoctor.js    # Add new doctor form
│   ├── Visits.js       # Visit management
│   ├── AddVisit.js     # Add new visit form
│   ├── Products.js     # Product management
│   ├── AddProduct.js   # Add new product form
│   └── Sales.js        # Sales analytics
├── App.js              # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## Customization

### Adding New Product Categories
Edit the category options in `src/pages/AddProduct.js`:
```javascript
<option value="New Category">New Category</option>
```

### Modifying Dashboard Metrics
Update the statistics cards in `src/pages/Dashboard.js` to show different metrics.

### Styling Changes
Modify `src/index.css` and `tailwind.config.js` to customize the appearance.

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository to Vercel or Netlify
2. Set environment variables in the deployment platform
3. Deploy automatically on git push

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
