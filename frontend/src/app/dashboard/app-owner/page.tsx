'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CreateOrganizationModal } from '@/components/modals/CreateOrganizationModal';
import { OrganizationCreatedModal } from '@/components/modals/OrganizationCreatedModal';
import { OrganizationsPage } from '@/components/pages/OrganizationsPage';
import { UsersPage } from '@/components/pages/UsersPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { organizationAPI } from '@/lib/api';
import { Building2, Users, ShoppingBag, TrendingUp, Plus, Home } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
  created_at: string;
}

interface DashboardStats {
  totalOrganizations: number;
  totalVendors: number;
  totalCompanies: number;
  totalUsers: number;
}

export default function AppOwnerDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalVendors: 0,
    totalCompanies: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdOrganization, setCreatedOrganization] = useState<any>(null);
  const [createdModalOpen, setCreatedModalOpen] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const data = await organizationAPI.getOrganizations();
      setOrganizations(data);
      
      // Calculate stats
      const vendors = data.filter((org: Organization) => org.organization_type === 'Vendor');
      const companies = data.filter((org: Organization) => org.organization_type === 'Company');
      
      setStats({
        totalOrganizations: data.length,
        totalVendors: vendors.length,
        totalCompanies: companies.length,
        totalUsers: 0, // We'll need to implement user counting
      });
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = () => {
    setCreateModalOpen(true);
  };

  const handleModalSuccess = (data: any) => {
    setCreatedOrganization(data);
    setCreatedModalOpen(true);
    fetchOrganizations(); // Refresh the data
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebar = (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          App Owner Panel
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage organizations and system
        </p>
      </div>
      
      <nav className="space-y-2">
        <Button 
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveTab('dashboard')}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button 
          variant={activeTab === 'organizations' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveTab('organizations')}
        >
          <Building2 className="mr-2 h-4 w-4" />
          Organizations
        </Button>
        <Button 
          variant={activeTab === 'users' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveTab('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          Users
        </Button>
        <Button 
          variant={activeTab === 'settings' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveTab('settings')}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button 
          variant={activeTab === 'analytics' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </nav>
    </div>
  );

  const bottomNav = (
    <BottomNav
      items={[
        {
          icon: <Home className="h-4 w-4" />,
          label: 'Dashboard',
          isActive: activeTab === 'dashboard',
          onClick: () => setActiveTab('dashboard'),
        },
        {
          icon: <Building2 className="h-4 w-4" />,
          label: 'Orgs',
          isActive: activeTab === 'organizations',
          onClick: () => setActiveTab('organizations'),
        },
        {
          icon: <Users className="h-4 w-4" />,
          label: 'Users',
          isActive: activeTab === 'users',
          onClick: () => setActiveTab('users'),
        },
        {
          icon: <ShoppingBag className="h-4 w-4" />,
          label: 'Settings',
          isActive: activeTab === 'settings',
          onClick: () => setActiveTab('settings'),
        },
        {
          icon: <TrendingUp className="h-4 w-4" />,
          label: 'Analytics',
          isActive: activeTab === 'analytics',
          onClick: () => setActiveTab('analytics'),
        },
      ]}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome to the MV Traders management panel
                </p>
              </div>
              <Button onClick={handleCreateOrganization}>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Organizations
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
                  <p className="text-xs text-muted-foreground">
                    Active organizations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVendors}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered vendors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Companies</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered companies
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Good</div>
                  <p className="text-xs text-muted-foreground">
                    All systems operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Organizations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Organizations</CardTitle>
                <CardDescription>
                  Recently registered organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading organizations...</div>
                ) : (
                  <div className="space-y-4">
                    {organizations.slice(0, 3).map((org) => (
                      <div
                        key={org.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <Building2 className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {org.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {org.description}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={org.organization_type === 'Vendor' ? 'default' : 'secondary'}
                        >
                          {org.organization_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'organizations':
        return <OrganizationsPage organizations={organizations} loading={loading} onRefresh={fetchOrganizations} />;

      case 'users':
        return <UsersPage organizations={organizations} />;

      case 'settings':
        return <SettingsPage />;

      case 'analytics':
        return <AnalyticsPage />;

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute allowedOrgTypes={['AppOwner']}>
      <DashboardLayout sidebar={sidebar} bottomNav={bottomNav}>
        {renderContent()}
      </DashboardLayout>

      <CreateOrganizationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleModalSuccess}
      />

      <OrganizationCreatedModal
        open={createdModalOpen}
        onOpenChange={setCreatedModalOpen}
        organization={createdOrganization?.organization || null}
        adminUser={createdOrganization?.admin_user || null}
      />
    </ProtectedRoute>
  );
}
