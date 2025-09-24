'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  User, 
  Phone, 
  Calendar, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
  created_at: string;
}

interface AdminUser {
  id: number;
  phone_number: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ViewOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onEdit?: (org: Organization) => void;
  onDelete?: (org: Organization) => void;
}

export function ViewOrganizationModal({
  open,
  onOpenChange,
  organization,
  onEdit,
  onDelete,
}: ViewOrganizationModalProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (organization && open) {
      fetchOrganizationDetails();
    }
  }, [organization, open]);

  const fetchOrganizationDetails = async () => {
    if (!organization) return;
    
    setLoading(true);
    try {
      // TODO: Implement API calls to fetch:
      // - Admin user details
      // - Organization statistics
      
      // Mock data for now
      setAdminUser({
        id: 1,
        phone_number: `${organization.id}admin`,
        full_name: `${organization.name} Administrator`,
        role: 'SuperAdmin',
        is_active: true,
        created_at: organization.created_at,
      });
      
      setStats({
        totalUsers: Math.floor(Math.random() * 50) + 1,
        totalProducts: Math.floor(Math.random() * 200) + 10,
        totalOrders: Math.floor(Math.random() * 1000) + 50,
      });
    } catch (error) {
      console.error('Failed to fetch organization details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    return type === 'Vendor' 
      ? 'bg-green-100 text-green-800 hover:bg-green-200'
      : 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!organization) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {organization.name}
          </DialogTitle>
          <DialogDescription>
            Organization details and statistics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <span className="font-medium">{organization.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <Badge variant="secondary" className={getTypeBadgeColor(organization.organization_type)}>
                      {organization.organization_type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">ID:</span>
                    <span className="font-mono text-sm">{organization.id}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">Created</span>
                      <span className="text-sm">{formatDate(organization.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <span className="text-sm font-medium text-gray-600">Description:</span>
                <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                  {organization.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Administrator Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Administrator
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : adminUser ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">Name</span>
                        <span className="font-medium">{adminUser.full_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">Phone</span>
                        <span className="font-mono">{adminUser.phone_number}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">Role</span>
                        <Badge variant="secondary" className="w-fit bg-red-100 text-red-800">
                          {adminUser.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${adminUser.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm">
                        {adminUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No administrator found</p>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900">{stats.totalUsers}</div>
                    <div className="text-sm text-blue-600">Users</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">{stats.totalProducts}</div>
                    <div className="text-sm text-green-600">Products</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-900">{stats.totalOrders}</div>
                    <div className="text-sm text-orange-600">Orders</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onEdit(organization);
                    onOpenChange(false);
                  }}
                >
                  Edit Organization
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    onDelete(organization);
                    onOpenChange(false);
                  }}
                >
                  Delete Organization
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}