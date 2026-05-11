import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompaniesProvider } from './contexts/CompaniesContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import Layout from './components/layout/Layout';

// Auth pages
import Login from './pages/auth/Login';

// Dashboard pages
import Dashboard from './pages/dashboard';

// Sales pages
import Sales from './pages/sales';

// Inventory pages
import InventoryDashboard from './pages/inventory';

// Cash-Flow pages
import CashFlow from './pages/cashflow';

// Add Ledger pages
import Ledger from './pages/ledger';

// Cycle Planning pages
import CyclePlanning from './pages/cycle-planning';

// Core Doctors pages
import KOL from './pages/kol';

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

// Settings pages
import CompaniesManagement from './pages/settings';

function App() {
  useEffect(() => {
    const applyNoSuggestions = () => {
      document.querySelectorAll('form').forEach((form) => {
        form.setAttribute('autocomplete', 'off');
      });

      document.querySelectorAll('input, textarea').forEach((field) => {
        field.setAttribute('autocomplete', 'off');
        field.setAttribute('autocorrect', 'off');
        field.setAttribute('autocapitalize', 'off');
        field.setAttribute('spellcheck', 'false');
      });
    };

    applyNoSuggestions();

    const observer = new MutationObserver(() => {
      applyNoSuggestions();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <AuthProvider>
      <CompaniesProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
            <Route
              index
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <Dashboard />
                </RoleRoute>
              }
            />

            {/* Doctors Routes */}
            <Route
              path="doctors"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <Doctors />
                </RoleRoute>
              }
            />
            <Route
              path="doctors/add"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <AddDoctor />
                </RoleRoute>
              }
            />
            <Route
              path="doctors/:id"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <DoctorDetail />
                </RoleRoute>
              }
            />
            <Route
              path="doctors/:id/edit"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <EditDoctor />
                </RoleRoute>
              }
            />

            {/* Visits Routes */}
            <Route
              path="visits"
              element={
                <RoleRoute allowedRoles={['owner', 'rep']}>
                  <Visits />
                </RoleRoute>
              }
            />
            <Route
              path="visits/add"
              element={
                <RoleRoute allowedRoles={['owner', 'rep']}>
                  <AddVisit />
                </RoleRoute>
              }
            />
            <Route
              path="visits/:id"
              element={
                <RoleRoute allowedRoles={['owner', 'rep']}>
                  <VisitDetail />
                </RoleRoute>
              }
            />
            <Route
              path="visits/:id/edit"
              element={
                <RoleRoute allowedRoles={['owner', 'rep']}>
                  <EditVisit />
                </RoleRoute>
              }
            />

            {/* Products Routes */}
            <Route
              path="products"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <Products />
                </RoleRoute>
              }
            />
            <Route
              path="products/add"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <AddProduct />
                </RoleRoute>
              }
            />
            <Route
              path="products/:id/edit"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <EditProduct />
                </RoleRoute>
              }
            />

            {/* Sales Routes */}
            <Route
              path="sales"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <Sales />
                </RoleRoute>
              }
            />

            {/* Inventory Route */}
            <Route
              path="inventory"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <InventoryDashboard />
                </RoleRoute>
              }
            />

            {/* Cash-Flow Route */}
            <Route
              path="cash-flow"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <CashFlow />
                </RoleRoute>
              }
            />

            {/* Ledger Route */}
            <Route
              path="ledger"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <Ledger />
                </RoleRoute>
              }
            />

            {/* Cycle Planning Route */}
            <Route
              path="cycle-planning"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <CyclePlanning />
                </RoleRoute>
              }
            />

            {/* Core Doctors Route */}
            <Route
              path="kol"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <KOL />
                </RoleRoute>
              }
            />

            {/* Settings Routes */}
            <Route
              path="settings/companies"
              element={
                <RoleRoute allowedRoles={['owner']}>
                  <CompaniesManagement />
                </RoleRoute>
              }
            />

          </Route>
        </Routes>
        </div>
      </CompaniesProvider>
    </AuthProvider>
  );
}

export default App;
