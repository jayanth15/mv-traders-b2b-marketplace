'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedOrgTypes?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowedOrgTypes,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (user) {
        // Check role permissions
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.push('/unauthorized');
          return;
        }

        // Check organization type permissions
        if (allowedOrgTypes && !allowedOrgTypes.includes(user.organization_type)) {
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [user, loading, isAuthenticated, router, allowedRoles, allowedOrgTypes, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  if (allowedOrgTypes && user && !allowedOrgTypes.includes(user.organization_type)) {
    return null;
  }

  return <>{children}</>;
}
