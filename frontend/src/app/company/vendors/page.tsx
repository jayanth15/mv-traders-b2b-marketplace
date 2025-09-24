'use client';
import { useEffect, useState, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrgSidebarNav, OrgBottomNav } from '@/components/layout/OrgNav';
import { usePathname } from 'next/navigation';
import { Building2, ShoppingBag, Users, Home, TrendingUp, PackageSearch } from 'lucide-react';
import { organizationAPI, productAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/utils';

interface Org { id: number; name?: string; organization_type: string; }

export default function CompanyVendorsPage() {
  const pathname = usePathname();
  const [vendors, setVendors] = useState<Org[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
           const vendorOrgs = await organizationAPI.getVendors();
           setVendors(vendorOrgs);
      } catch (e: any) {
        toast.error(extractErrorMessage(e, 'Failed to load vendors'));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = useMemo(() => vendors.filter(v => !search || (v.name || String(v.id)).toLowerCase().includes(search.toLowerCase())), [vendors, search]);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/company', icon: <Home className="h-4 w-4" /> },
    { label: 'Orders', href: '/company/orders', icon: <PackageSearch className="h-4 w-4" /> },
    { label: 'Vendors', href: '/company/vendors', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Team', href: '/company/team', icon: <Users className="h-4 w-4" /> },
    { label: 'Reports', href: '/company/reports', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <ProtectedRoute allowedOrgTypes={['Company']}>
      <DashboardLayout
        sidebar={<OrgSidebarNav title="Company Panel" subtitle="Browse vendors" items={navItems} />}
        bottomNav={<OrgBottomNav items={navItems} />}
      >
        <div className='space-y-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Vendors</h1>
              <p className='text-muted-foreground'>Browse and open vendor catalogs</p>
            </div>
            <Input placeholder='Search vendors...' value={search} onChange={e => setSearch(e.target.value)} className='md:w-64' />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div>No vendors found.</div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filtered.map(v => (
                <Card key={v.id} className='hover:border-primary transition-colors'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base flex items-center gap-2'>
                      <Building2 className='h-4 w-4 text-muted-foreground' />
                      {v.name || `Vendor #${v.id}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='flex items-center justify-between'>
                    <Link href={`/company/vendors/${v.id}`} className='text-sm underline hover:text-primary'>View Products</Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
