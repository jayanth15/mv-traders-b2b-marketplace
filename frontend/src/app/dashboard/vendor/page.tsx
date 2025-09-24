'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, TrendingUp, Users, Home } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function VendorDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = useMemo(() => ([
    { key: 'dashboard', label: 'Dashboard', icon: <Home className="mr-2 h-4 w-4" />, href: '/dashboard/vendor', active: pathname?.startsWith('/dashboard/vendor') },
    { key: 'products', label: 'Products', icon: <Package className="mr-2 h-4 w-4" />, href: '/vendor/products', active: pathname?.startsWith('/vendor/products') },
    { key: 'orders', label: 'Orders', icon: <ShoppingBag className="mr-2 h-4 w-4" />, href: '/vendor/orders', active: pathname?.startsWith('/vendor/orders') },
    { key: 'team', label: 'Team', icon: <Users className="mr-2 h-4 w-4" />, href: '/vendor/team', active: pathname?.startsWith('/vendor/team') },
  ]), [pathname]);

  const sidebar = (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Vendor Panel
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage products and orders
        </p>
      </div>
      
      <nav className="space-y-2">
        {navItems.map(item => (
          <Button
            key={item.key}
            variant={item.active ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => router.push(item.href)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );

  const bottomNav = (
    <BottomNav
      items={navItems.map(item => ({
        icon: item.icon,
        label: item.label,
        isActive: !!item.active,
        onClick: () => router.push(item.href),
      }))}
    />
  );

  return (
    <ProtectedRoute allowedOrgTypes={['Vendor']}>
      <DashboardLayout sidebar={sidebar} bottomNav={bottomNav}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vendor Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome to your vendor management panel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Active products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Pending orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Active team members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Start using your vendor dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Welcome! Your vendor dashboard is ready. 
                  Start by adding your products and managing incoming orders.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
