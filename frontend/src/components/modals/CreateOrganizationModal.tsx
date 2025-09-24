'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { organizationAPI } from '@/lib/api';
import { extractErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: any) => void;
}

interface CreateOrganizationData {
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
  admin_name: string;
  admin_phone: string;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationModalProps) {
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    description: '',
    organization_type: 'Company',
    admin_name: '',
    admin_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.organization_type) {
      newErrors.organization_type = 'Organization type is required';
    }

    if (!formData.admin_name.trim()) {
      newErrors.admin_name = 'Administrator name is required';
    } else if (formData.admin_name.length < 2) {
      newErrors.admin_name = 'Administrator name must be at least 2 characters';
    }

    if (!formData.admin_phone.trim()) {
      newErrors.admin_phone = 'Administrator phone is required';
    } else if (!/^\d{10}$/.test(formData.admin_phone.replace(/\D/g, ''))) {
      newErrors.admin_phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Send all organization and admin data to the API
      const response = await organizationAPI.createOrganization(formData);
      toast.success('Organization created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        organization_type: 'Company',
        admin_name: '',
        admin_phone: '',
      });
      setErrors({});
      
      onOpenChange(false);
      
      // Pass the response data to success callback
      onSuccess?.(response);
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      toast.error(extractErrorMessage(error, 'Failed to create organization'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateOrganizationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Add a new vendor or company organization to the marketplace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organization name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization_type">Organization Type *</Label>
            <Select
              value={formData.organization_type}
              onValueChange={(value: 'Vendor' | 'Company') => 
                handleInputChange('organization_type', value)
              }
            >
              <SelectTrigger className={errors.organization_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Company">Company</SelectItem>
                <SelectItem value="Vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
            {errors.organization_type && (
              <p className="text-sm text-red-500">{errors.organization_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Enter organization description"
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Administrator Details */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
            <div className="space-y-2">
              <Label className="text-blue-800 font-medium">Administrator Details</Label>
              <p className="text-sm text-blue-600">
                A SuperAdmin account will be created for this organization
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin_name">Administrator Name *</Label>
                <Input
                  id="admin_name"
                  value={formData.admin_name}
                  onChange={(e) => handleInputChange('admin_name', e.target.value)}
                  placeholder="Enter administrator full name"
                  className={errors.admin_name ? 'border-red-500' : ''}
                />
                {errors.admin_name && (
                  <p className="text-sm text-red-500">{errors.admin_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin_phone">Administrator Phone *</Label>
                <Input
                  id="admin_phone"
                  value={formData.admin_phone}
                  onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  className={errors.admin_phone ? 'border-red-500' : ''}
                />
                {errors.admin_phone && (
                  <p className="text-sm text-red-500">{errors.admin_phone}</p>
                )}
              </div>
            </div>
            
            <p className="text-xs text-blue-600">
              💡 A temporary password will be generated and shown after creation
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
