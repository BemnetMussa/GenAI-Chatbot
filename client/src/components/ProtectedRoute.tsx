import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  if (isAuthenticated === false) return <Navigate to="/login" />;
  if (isAuthenticated === null) return <p>Loading...</p>;

  return <>{children}</>;
};

export default ProtectedRoute;