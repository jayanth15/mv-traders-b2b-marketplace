'use client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompanyProductsPage() {
  const pathname = usePathname();
  const router = useRouter();

  const sidebar = (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Company Panel</h2>
        <p className="text-sm text-muted-foreground">Browse vendor products</p>
      </div>
      <nav className="space-y-2">
        <Button variant={pathname?.startsWith('/dashboard/company') ? 'default':'ghost'} className="w-full justify-start" onClick={()=>router.push('/dashboard/company')}><Home className="mr-2 h-4 w-4"/>Dashboard</Button>
        <Button variant={pathname?.startsWith('/company/orders') ? 'default':'ghost'} className="w-full justify-start" onClick={()=>router.push('/company/orders')}><Package className="mr-2 h-4 w-4"/>Orders</Button>
        <Button variant={pathname?.startsWith('/company/products') ? 'default':'ghost'} className="w-full justify-start" onClick={()=>router.push('/company/products')}><ShoppingBag className="mr-2 h-4 w-4"/>Products</Button>
        <Button variant={pathname?.startsWith('/company/team') ? 'default':'ghost'} className="w-full justify-start" onClick={()=>router.push('/company/team')}><Users className="mr-2 h-4 w-4"/>Team</Button>
        <Button variant={pathname?.startsWith('/company/reports') ? 'default':'ghost'} className="w-full justify-start" onClick={()=>router.push('/company/reports')}><TrendingUp className="mr-2 h-4 w-4"/>Reports</Button>
      </nav>
    </div>
  );

  const bottomNav = (
    <BottomNav items={[
      { icon: <Home className='h-4 w-4'/>, label:'Dashboard', isActive: pathname?.startsWith('/dashboard/company')||false, onClick:()=>router.push('/dashboard/company')},
      { icon: <Package className='h-4 w-4'/>, label:'Orders', isActive: pathname?.startsWith('/company/orders')||false, onClick:()=>router.push('/company/orders')},
      { icon: <ShoppingBag className='h-4 w-4'/>, label:'Products', isActive: pathname?.startsWith('/company/products')||false, onClick:()=>router.push('/company/products')},
      { icon: <Users className='h-4 w-4'/>, label:'Team', isActive: pathname?.startsWith('/company/team')||false, onClick:()=>router.push('/company/team')},
      { icon: <TrendingUp className='h-4 w-4'/>, label:'Reports', isActive: pathname?.startsWith('/company/reports')||false, onClick:()=>router.push('/company/reports')},
    ]} />
  );

  return (
    <ProtectedRoute allowedOrgTypes={['Company']}>
      <DashboardLayout sidebar={sidebar} bottomNav={bottomNav}>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Products</h1>
            <p className='text-muted-foreground'>Browse available vendor products (implementation pending)</p>
          </div>
          <div className='rounded-md border p-6 text-sm text-muted-foreground'>Product browsing UI coming soon.</div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
