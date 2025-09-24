"use client";
import React from 'react';
import { OrgSidebarNav, OrgBottomNav } from './OrgNav';
import { Home, Package, ShoppingBag, Users, Building2, FileText } from 'lucide-react';

// Vendor navigation definitions
export const VendorNav: React.FC = () => {
  const items = [
    { label: 'Dashboard', href: '/dashboard/vendor', icon: <Home className="h-4 w-4" /> },
    { label: 'Products', href: '/vendor/products', icon: <Package className="h-4 w-4" /> },
    { label: 'Orders', href: '/vendor/orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { label: 'Team', href: '/vendor/team', icon: <Users className="h-4 w-4" /> },
  ];
  return (
    <>
      <OrgSidebarNav title="Vendor Panel" subtitle="Manage products and orders" items={items} />
      <OrgBottomNav items={items} />
    </>
  );
};

// AppOwner navigation definitions
export const AppOwnerNav: React.FC = () => {
  const items = [
    { label: 'Dashboard', href: '/dashboard/app-owner', icon: <Home className="h-4 w-4" /> },
    { label: 'Organizations', href: '/app-owner/organizations', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Users', href: '/app-owner/users', icon: <Users className="h-4 w-4" /> },
    { label: 'Reports', href: '/app-owner/reports', icon: <FileText className="h-4 w-4" /> },
  ];
  return (
    <>
      <OrgSidebarNav title="App Owner" subtitle="Platform administration" items={items} />
      <OrgBottomNav items={items} />
    </>
  );
};
