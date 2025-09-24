'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Building2 } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
  created_at: string;
}

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSuccess?: () => void;
}

interface EditOrganizationData {
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
}

export function EditOrganizationModal({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: EditOrganizationModalProps) {
  const [formData, setFormData] = useState<EditOrganizationData>({
    name: '',
    description: '',
    organization_type: 'Company',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (organization && open) {
      setFormData({
        name: organization.name,
        description: organization.description,
        organization_type: organization.organization_type,
      });
      setErrors({});
    }
  }, [organization, open]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization || !validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await organizationAPI.updateOrganization(organization.id, formData);
      toast.success('Organization updated successfully!');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to update organization:', error);
      toast.error(extractErrorMessage(error, 'Failed to update organization'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EditOrganizationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const hasChanges = () => {
    if (!organization) return false;
    return (
      formData.name !== organization.name ||
      formData.description !== organization.description ||
      formData.organization_type !== organization.organization_type
    );
  };

  if (!organization) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Organization
          </DialogTitle>
          <DialogDescription>
            Update the organization details. Changes will be reflected immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Organization Name *</Label>
            <Input
              id="edit-name"
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
            <Label htmlFor="edit-organization_type">Organization Type *</Label>
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
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !hasChanges()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}