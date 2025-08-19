import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Visits from './pages/Visits';
import Products from './pages/Products';
import Sales from './pages/Sales';
import AddDoctor from './pages/AddDoctor';
import AddVisit from './pages/AddVisit';
import AddProduct from './pages/AddProduct';
import DoctorDetail from './pages/DoctorDetail';
import EditDoctor from './pages/EditDoctor';
import EditProduct from './pages/EditProduct';
import VisitDetail from './pages/VisitDetail';
import EditVisit from './pages/EditVisit';
import MFASetup from './components/MFASetup';

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
