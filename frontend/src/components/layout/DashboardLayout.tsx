'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export function DashboardLayout({ children, sidebar, bottomNav }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex">
        {sidebar && (
          <>
            {/* Desktop Sidebar - Hidden on mobile/tablet */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
              <div className="flex flex-col h-full pt-16">
                {sidebar}
              </div>
            </div>
          </>
        )}
        
        {/* Main content */}
        <div className={`flex-1 ${sidebar ? 'lg:ml-64' : ''} pb-16 lg:pb-0`}>
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation for Mobile/Tablet */}
      {(sidebar || bottomNav) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-4 py-2">
            {bottomNav || (
              <div className="flex justify-around items-center">
                {/* Convert sidebar content to horizontal bottom nav */}
                {sidebar}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
