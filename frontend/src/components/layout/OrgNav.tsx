"use client";
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePathname, useRouter } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  show?: boolean; // conditional rendering
}

interface OrgSidebarNavProps {
  title: string;
  subtitle?: string;
  items: NavItem[];
}

export function OrgSidebarNav({ title, subtitle, items }: OrgSidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <nav className="space-y-2">
        {items.filter(i => i.show !== false).map(item => (
          <Button
            key={item.href}
            variant={pathname?.startsWith(item.href) ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => router.push(item.href)}
          >
            {item.icon}{item.icon && <span className="mr-2" />}{/* spacing if needed */}
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}

interface OrgBottomNavProps { items: NavItem[]; }
export function OrgBottomNav({ items }: OrgBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <BottomNav
      items={items.filter(i => i.show !== false).map(i => ({
        icon: i.icon as any,
        label: i.label,
        isActive: pathname?.startsWith(i.href) || false,
        onClick: () => router.push(i.href)
      }))}
    />
  );
}
