'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirect to appropriate dashboard
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
      } else {
        // Redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null; // Will redirect, so no need to render anything
}
