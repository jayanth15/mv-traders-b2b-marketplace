'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { organizationAPI } from '@/lib/api';
import { CreateOrganizationModal } from '@/components/modals/CreateOrganizationModal';
import { OrganizationCreatedModal } from '@/components/modals/OrganizationCreatedModal';
import { ViewOrganizationModal } from '@/components/modals/ViewOrganizationModal';
import { EditOrganizationModal } from '@/components/modals/EditOrganizationModal';
import { DeleteOrganizationModal } from '@/components/modals/DeleteOrganizationModal';

interface Organization {
  id: number;
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Selected organization for modals
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [createdOrgData, setCreatedOrgData] = useState<any>(null);

  // Load organizations
  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationAPI.getOrganizations();
      setOrganizations(data);
      setFilteredOrganizations(data);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Filter organizations
  useEffect(() => {
    let filtered = organizations;
    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        org.organization_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(org => org.organization_type.toLowerCase() === typeFilter);
    }
    setFilteredOrganizations(filtered);
  }, [organizations, searchTerm, statusFilter, typeFilter]);

  // Modal handlers
  const handleView = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowViewModal(true);
  };
  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowEditModal(true);
  };
  const handleDelete = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowDeleteModal(true);
  };
  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowCreatedModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedOrganization(null);
    setCreatedOrgData(null);
  };
  const handleOrganizationCreated = (data: any) => {
    setCreatedOrgData(data);
    setShowCreateModal(false);
    setShowCreatedModal(true);
    loadOrganizations();
  };
  const handleOrganizationUpdated = () => {
    loadOrganizations();
    handleModalClose();
  };
  const handleOrganizationDeleted = () => {
    loadOrganizations();
    handleModalClose();
  };
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Vendor':
        return 'default';
      case 'Company':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage vendors and companies in your marketplace
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizations ({filteredOrganizations.length})
          </CardTitle>
          <CardDescription>
            View and manage all registered organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading organizations...</div>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No organizations found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No organizations match your current filters.'
                  : 'Get started by adding your first organization.'}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Organization
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">{org.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadge(org.organization_type)}>
                          {org.organization_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{org.email}</div>
                          <div className="text-sm text-muted-foreground">{org.phone}</div>
                          <div className="text-sm text-muted-foreground">{org.address}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(org.status)}>
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleView(org)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEdit(org)}
                            title="Edit Organization"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(org)}
                            title="Delete Organization"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Modals */}
      <CreateOrganizationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleOrganizationCreated}
      />
      <OrganizationCreatedModal
        open={showCreatedModal}
        onOpenChange={setShowCreatedModal}
        organization={createdOrgData?.organization || null}
        adminUser={createdOrgData?.admin_user || createdOrgData?.adminUser || null}
      />
      <ViewOrganizationModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        organization={selectedOrganization}
      />
      <EditOrganizationModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        organization={selectedOrganization}
        onSuccess={handleOrganizationUpdated}
      />
      <DeleteOrganizationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        organization={selectedOrganization}
        onSuccess={handleOrganizationDeleted}
      />
    </div>
  );
}
