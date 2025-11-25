import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Index from '@/pages/Index';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  console.log('ProtectedRoute - Loading:', loading, 'Current User:', currentUser?.email || 'No user');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Index />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;