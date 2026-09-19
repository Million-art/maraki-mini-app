import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAppSelector } from '../../store';
import BottomNavigation from './BottomNavigation';

const Layout: React.FC = () => {
  const { isDarkMode } = useAppSelector((state: any) => state.ui);

  return (
    <div className={cn(
      "flex flex-col h-screen w-full transition-colors duration-200 select-none",
      isDarkMode ? "bg-dark text-white" : "bg-light text-dark"
    )}>
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden w-full flex justify-center p-0 md:p-4">
        <div className="w-full max-w-md h-full flex flex-col md:rounded-2xl md:border md:border-gray-200 overflow-hidden bg-white dark:bg-dark-muted relative">
          <div className="flex-1 overflow-hidden relative">
            <Outlet context={{ isDarkMode }} />
          </div>
          {/* Global Bottom Navigation Bar */}
          <BottomNavigation />
        </div>
      </main>
    </div>
  );
};

export default Layout;
