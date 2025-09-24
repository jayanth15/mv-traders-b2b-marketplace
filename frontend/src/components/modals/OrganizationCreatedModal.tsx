'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Eye, EyeOff, Building2, User, Phone, Key } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: number;
  phone_number: string;
  full_name: string;
  role: string;
  temporary_password: string;
}

interface Organization {
  id: number;
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
  created_at: string;
}

interface OrganizationCreatedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  adminUser: AdminUser | null;
}

export function OrganizationCreatedModal({
  open,
  onOpenChange,
  organization,
  adminUser,
}: OrganizationCreatedModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getOrgTypeBadgeColor = (type: string) => {
    return type === 'Vendor' 
      ? 'bg-green-100 text-green-800 hover:bg-green-200'
      : 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  };

  if (!organization || !adminUser) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Organization Created Successfully!
          </DialogTitle>
          <DialogDescription>
            The organization has been created along with a SuperAdmin account. Share these credentials with the organization administrator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="font-medium">{organization.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <Badge variant="secondary" className={getOrgTypeBadgeColor(organization.organization_type)}>
                  {organization.organization_type}
                </Badge>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-600">Description:</span>
                <span className="text-right max-w-xs text-sm">{organization.description}</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Credentials */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                <Key className="h-4 w-4" />
                Administrator Login Credentials
              </CardTitle>
              <CardDescription className="text-orange-700">
                Share these credentials securely with the organization administrator. They should change the password after first login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Admin Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Administrator Name
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={adminUser.full_name} 
                    readOnly 
                    className="bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(adminUser.full_name, 'Name')}
                  >
                    {copiedField === 'Name' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  Phone Number (Username)
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={adminUser.phone_number} 
                    readOnly 
                    className="bg-white font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(adminUser.phone_number, 'Phone')}
                  >
                    {copiedField === 'Phone' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Note: This is a placeholder. Update it with the actual phone number before sharing.
                </p>
              </div>

              {/* Temporary Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  Temporary Password
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      value={adminUser.temporary_password} 
                      readOnly 
                      className="bg-white font-mono pr-10"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(adminUser.temporary_password, 'Password')}
                  >
                    {copiedField === 'Password' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-orange-600">
                  ⚠️ This password will only be shown once. Make sure to save it securely!
                </p>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Role:</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {adminUser.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. Update the phone number with the actual administrator's number</li>
                <li>2. Share these credentials securely with the organization administrator</li>
                <li>3. Instruct them to change their password after first login</li>
                <li>4. The administrator can then create additional users for their organization</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                const credentials = `Organization: ${organization.name}\nUsername: ${adminUser.phone_number}\nPassword: ${adminUser.temporary_password}`;
                copyToClipboard(credentials, 'All Credentials');
              }}
            >
              Copy All Credentials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
