import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { BookOpen, HelpCircle, Users, Menu, Sun, Moon, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { toggleDarkMode } from '../../store/slices/uiSlice';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isDarkMode } = useAppSelector((state: any) => state.ui);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // In a real app, this would come from authentication context


  const navigationItems = [
    { id: "material", label: "Material", icon: BookOpen, path: "/material" },
    { id: "quiz", label: "Quiz", icon: HelpCircle, path: "/quiz" },
    { id: "referral", label: "Referral", icon: Users, path: "/referral" },
  ];

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    return navigationItems.find(item => item.path === currentPath)?.id || "material";
  };

  const currentPage = getCurrentPage();

  return (
    <div className={cn(
      "flex flex-col h-screen transition-colors duration-200",
      isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Header with Menu Button and Dark Mode Toggle */}
      <header className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <h1 className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Maraki
        </h1>
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            )}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {/* Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            )}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet context={{ isDarkMode }} />
      </main>

      {/* Bottom Navigation */}
      <nav className={cn(
        "border-t px-4 py-2",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex justify-around">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                  currentPage === item.id
                    ? isDarkMode
                      ? "text-blue-400 bg-blue-900/20"
                      : "text-blue-600 bg-blue-50"
                    : isDarkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className={cn(
              "fixed inset-0 z-40 backdrop-blur-sm",
              isDarkMode ? "bg-black bg-opacity-30" : "bg-white bg-opacity-50"
            )}
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className={cn(
            "fixed top-0 right-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out",
            isDarkMode ? "bg-gray-800" : "bg-white",
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="p-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className={cn(
                  "text-lg font-semibold",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  Menu
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="space-y-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                )}>
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    Welcome to Maraki! Access your materials, take quizzes, and manage referrals.
                  </p>
                </div>

                {/* Navigation Items */}
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.path);
                          setIsDrawerOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                          currentPage === item.id
                            ? isDarkMode
                              ? "text-blue-400 bg-blue-900/20"
                              : "text-blue-600 bg-blue-50"
                            : isDarkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Layout;
