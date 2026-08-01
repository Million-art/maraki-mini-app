import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Sun, Moon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { toggleDarkMode } from '../../store/slices/uiSlice';

const Layout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isDarkMode } = useAppSelector((state: any) => state.ui);

  return (
    <div className={cn(
      "flex flex-col h-screen transition-colors duration-200",
      isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Header with Dark Mode Toggle */}
      <header className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <h1 className={cn(
            "text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          )}>
            Maraki AI Voice Practice
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-gray-700 text-amber-400" : "hover:bg-gray-100 text-gray-700"
            )}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet context={{ isDarkMode }} />
      </main>
    </div>
  );
};

export default Layout;
