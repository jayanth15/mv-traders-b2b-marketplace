'use client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrgSidebarNav, OrgBottomNav } from '@/components/layout/OrgNav';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingBag, Users, TrendingUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompanyReportsPage() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/company', icon: <Home className="h-4 w-4" /> },
    { label: 'Orders', href: '/company/orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { label: 'Vendors', href: '/company/vendors', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Team', href: '/company/team', icon: <Users className="h-4 w-4" /> },
    { label: 'Reports', href: '/company/reports', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <ProtectedRoute allowedOrgTypes={['Company']}>
  <DashboardLayout sidebar={<OrgSidebarNav title="Company Panel" subtitle="View insights" items={navItems} />} bottomNav={<OrgBottomNav items={navItems} /> }>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Reports</h1>
            <p className='text-muted-foreground'>Analytics & KPIs (implementation pending)</p>
          </div>
          <div className='rounded-md border p-6 text-sm text-muted-foreground'>Reporting UI coming soon.</div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
