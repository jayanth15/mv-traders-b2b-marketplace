'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect authenticated users to their dashboard
      switch (user.organization_type) {
        case 'AppOwner':
          router.push('/dashboard/app-owner');
          break;
        case 'Company':
          router.push('/dashboard/company');
          break;
        case 'Vendor':
          router.push('/dashboard/vendor');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}
