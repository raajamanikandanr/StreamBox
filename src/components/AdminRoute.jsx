import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from './Button';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-prime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-bg-surface border border-text-muted/20 rounded-xl p-8 text-center shadow-2xl animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            The Administrator Console is restricted to authorized admin accounts. Your account (<span className="text-text-primary font-medium">{user?.phone}</span>) does not have administrative access.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="md"
              icon={ArrowLeft}
              className="w-full justify-center"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
