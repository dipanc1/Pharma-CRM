import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RoleRoute({ allowedRoles, children }) {
  const { user, loading, profileLoading, role } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles || !allowedRoles.includes(role)) {
    return <Navigate to="/visits" replace />;
  }

  return children;
}

export default RoleRoute;
