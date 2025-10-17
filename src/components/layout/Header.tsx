import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, User } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { toggleDarkMode } from '../../store/slices/uiSlice';
import { cn } from '../../lib/utils';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isDarkMode } = useAppSelector((state: any) => state.ui);
  const { user } = useAppSelector((state: any) => state.student);

  const toggleTheme = () => {
    dispatch(toggleDarkMode());
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/material':
        return 'Materials';
      case '/quiz':
        return 'Quizzes';
      case '/referral':
        return 'Referral';
      default:
        return 'Maraki';
    }
  };

  return (
    <header className={cn(
      "flex items-center justify-between px-6 py-4 border-b",
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          )}
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <h1 className={cn(
          "text-xl font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          )}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          )}>
            <User className="w-4 h-4" />
          </div>
          <span className={cn(
            "text-sm font-medium",
            isDarkMode ? "text-gray-300" : "text-gray-700"
          )}>
            {user?.firstName || 'Student'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
