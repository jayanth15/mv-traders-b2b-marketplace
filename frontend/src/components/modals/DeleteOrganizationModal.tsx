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
import { organizationAPI } from '@/lib/api';
import { extractErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Building2 } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description: string;
  organization_type: 'Vendor' | 'Company';
  created_at: string;
}

interface DeleteOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSuccess?: () => void;
}

export function DeleteOrganizationModal({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: DeleteOrganizationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!organization) return;

    setLoading(true);
    
    try {
      await organizationAPI.deleteOrganization(organization.id);
      toast.success('Organization deleted successfully!');
      
      setConfirmText('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to delete organization:', error);
      toast.error(extractErrorMessage(error, 'Failed to delete organization'));
    } finally {
      setLoading(false);
    }
  };

  const isConfirmationValid = confirmText === organization?.name;

  const handleCancel = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  if (!organization) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Organization
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the organization and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Organization Details */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Organization to be deleted:</span>
            </div>
            <div className="space-y-1 ml-6">
              <p className="text-sm"><strong>Name:</strong> {organization.name}</p>
              <p className="text-sm"><strong>Type:</strong> {organization.organization_type}</p>
              <p className="text-sm"><strong>ID:</strong> {organization.id}</p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-2">⚠️ Warning: This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>The organization and all its data</li>
                  <li>The administrator account associated with this organization</li>
                  <li>All users belonging to this organization</li>
                  <li>All products, orders, and related records</li>
                  <li>All documents and files</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              To confirm, type the organization name <strong>"{organization.name}"</strong> below:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type "${organization.name}" to confirm`}
              className={`${
                confirmText && !isConfirmationValid 
                  ? 'border-red-500 focus-visible:ring-red-500' 
                  : ''
              }`}
            />
            {confirmText && !isConfirmationValid && (
              <p className="text-xs text-red-500">
                Organization name doesn't match. Please type "{organization.name}" exactly.
              </p>
            )}
          </div>

          {/* Additional Confirmation */}
          <div className="p-3 bg-gray-50 border rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Make sure you have backed up any important data before proceeding. 
              This action is immediate and cannot be reversed.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !isConfirmationValid}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Delete Organization
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}