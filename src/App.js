import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/layout/Layout';

// Auth pages
import Login from './pages/auth/Login';

// Dashboard pages
import Dashboard from './pages/dashboard';

// Sales pages
import Sales from './pages/sales';

// Inventory pages
import InventoryDashboard from './pages/inventory';

// Products pages
import Products from './pages/products/Products';
import AddProduct from './pages/products/AddProduct';
import EditProduct from './pages/products/EditProduct';

// Doctors pages
import Doctors from './pages/doctors/Doctors';
import AddDoctor from './pages/doctors/AddDoctor';
import DoctorDetail from './pages/doctors/DoctorDetail';
import EditDoctor from './pages/doctors/EditDoctor';

// Visits pages
import Visits from './pages/visits/Visits';
import AddVisit from './pages/visits/AddVisit';
import VisitDetail from './pages/visits/VisitDetail';
import EditVisit from './pages/visits/EditVisit';

// Cash Flow pages
import CashFlow from './pages/cashflow';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />

            {/* Doctors Routes */}
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/add" element={<AddDoctor />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="doctors/:id/edit" element={<EditDoctor />} />

            {/* Visits Routes */}
            <Route path="visits" element={<Visits />} />
            <Route path="visits/add" element={<AddVisit />} />
            <Route path="visits/:id" element={<VisitDetail />} />
            <Route path="visits/:id/edit" element={<EditVisit />} />

            {/* Products Routes */}
            <Route path="products" element={<Products />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/:id/edit" element={<EditProduct />} />

            {/* Sales Routes */}
            <Route path="sales" element={<Sales />} />

            {/* Inventory Route */}
            <Route path="/inventory" element={<InventoryDashboard />} />


            {/* Cash Flow Route */}
            <Route path="/cash-flow" element={<CashFlow />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
