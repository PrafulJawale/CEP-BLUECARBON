import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const RoleRoute: React.FC<{ allowed: UserRole[]; children: React.ReactNode }> = ({ allowed, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!user) return <Navigate to="/login" replace />;

  if (!allowed.includes(user.role)) {
    return <NotAuthorized />;
  }

  return <>{children}</>;
};

export const NotAuthorized: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-semibold">Not authorized</h1>
    <p className="mt-2">You do not have permission to view this page.</p>
  </div>
);

export default {} as never;
