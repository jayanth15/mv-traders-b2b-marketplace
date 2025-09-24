'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav className={cn("flex justify-around items-center py-1", className)}>
      {items.map((item, index) => (
        <Button
          key={index}
          variant={item.isActive ? "default" : "ghost"}
          size="sm"
          className={cn(
            "flex flex-col items-center justify-center h-12 px-2 min-w-0 flex-1 max-w-[80px]",
            item.isActive 
              ? "bg-primary text-primary-foreground" 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          )}
          onClick={item.onClick}
        >
          <div className="flex flex-col items-center justify-center space-y-0.5">
            {item.icon}
            <span className="text-[10px] font-medium leading-none truncate">
              {item.label}
            </span>
          </div>
        </Button>
      ))}
    </nav>
  );
}
