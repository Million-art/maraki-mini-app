import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, HelpCircle, Users, MessageSquare, Settings } from 'lucide-react';
import { useAppSelector } from '../../store';
import { cn } from '../../lib/utils';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useAppSelector((state: any) => state.ui);

  const navigationItems = [
    { id: 'material', label: 'Materials', icon: BookOpen, path: '/material' },
    { id: 'quiz', label: 'Quizzes', icon: HelpCircle, path: '/quiz' },
    { id: 'referral', label: 'Referral', icon: Users, path: '/referral' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={cn(
      "w-64 border-r flex flex-col",
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h2 className={cn(
          "text-xl font-bold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Maraki
        </h2>
        <p className={cn(
          "text-sm",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Learn & Practice
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.path)
                      ? isDarkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t",
        isDarkMode ? "border-gray-700" : "border-gray-200"
      )}>
        <div className={cn(
          "text-xs text-center",
          isDarkMode ? "text-gray-400" : "text-gray-500"
        )}>
          © 2024 Maraki
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
