'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, Filter, Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import { userAPI } from '@/lib/api';
import { CreateUserModal } from '@/components/modals/CreateUserModal';

interface User {
  id: number;
  phone_number: string;
  full_name: string;
  role: 'SuperAdmin' | 'Admin' | 'User' | 'AppAdmin';
  organization_id: number | null;
  organization_type: 'Vendor' | 'Company' | 'AppOwner';
  created_at: string;
  is_active: boolean;
}

interface Organization {
  id: number;
  name: string;
  organization_type: 'Vendor' | 'Company';
}

interface UsersPageProps {
  organizations: Organization[];
}

export function UsersPage({ organizations }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'SuperAdmin' | 'Admin' | 'User' | 'AppAdmin'>('all');
  const [filterOrgType, setFilterOrgType] = useState<'all' | 'Vendor' | 'Company' | 'AppOwner'>('all');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone_number.includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesOrgType = filterOrgType === 'all' || user.organization_type === filterOrgType;
    return matchesSearch && matchesRole && matchesOrgType;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Admin':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'AppAdmin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'User':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getOrgTypeBadgeColor = (orgType: string) => {
    switch (orgType) {
      case 'AppOwner':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'Company':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Vendor':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getOrganizationName = (orgId: number | null) => {
    if (!orgId) return 'N/A';
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users across all organizations
              </CardDescription>
            </div>
            <Button onClick={() => setCreateUserModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={(value: any) => setFilterRole(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="AppAdmin">App Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOrgType} onValueChange={(value: any) => setFilterOrgType(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="AppOwner">App Owner</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterRole !== 'all' || filterOrgType !== 'all'
                  ? 'Try adjusting your search or filters.' 
                  : 'No users registered yet.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Mobile/Tablet Card View */}
              <div className="grid gap-4 md:hidden">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{user.full_name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{user.phone_number}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className={`${getRoleBadgeColor(user.role)} text-xs`}>
                            {user.role}
                          </Badge>
                          <Badge variant="secondary" className={`${getOrgTypeBadgeColor(user.organization_type)} text-xs`}>
                            {user.organization_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Organization:</span>
                        <span className="font-medium">{getOrganizationName(user.organization_id)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Joined:</span>
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.full_name}</span>
                            <span className="text-sm text-gray-500">{user.phone_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getOrganizationName(user.organization_id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getOrgTypeBadgeColor(user.organization_type)}>
                            {user.organization_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreateUserModal
        open={createUserModalOpen}
        onOpenChange={setCreateUserModalOpen}
        organizations={organizations}
        onSuccess={() => {
          fetchUsers();
          setCreateUserModalOpen(false);
        }}
      />
    </div>
  );
}
