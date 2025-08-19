import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';

// auth
import Login from './pages/auth/Login';

// dashboard
import Dashboard from './pages/dashboard/Dashboard';

// sales
import Sales from './pages/sales/Sales';

// products
import Products from './pages/products/Products';
import AddProduct from './pages/products/AddProduct';
import EditProduct from './pages/products/EditProduct';

// doctors
import Doctors from './pages/doctors/Doctors';
import AddDoctor from './pages/doctors/AddDoctor';
import DoctorDetail from './pages/doctors/DoctorDetail';
import EditDoctor from './pages/doctors/EditDoctor';

// visits
import Visits from './pages/visits/Visits';
import AddVisit from './pages/visits/AddVisit';
import VisitDetail from './pages/visits/VisitDetail';
import EditVisit from './pages/visits/EditVisit';

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
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/add" element={<AddDoctor />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="doctors/:id/edit" element={<EditDoctor />} />
            <Route path="visits" element={<Visits />} />
            <Route path="visits/add" element={<AddVisit />} />
            <Route path="visits/:id" element={<VisitDetail />} />
            <Route path="visits/:id/edit" element={<EditVisit />} />
            <Route path="products" element={<Products />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/:id/edit" element={<EditProduct />} />
            <Route path="sales" element={<Sales />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
