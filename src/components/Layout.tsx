import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { cn } from "../lib/utils";
import { MessageSquare, BookOpen, HelpCircle, Users } from "lucide-react";
import ChatDrawer from "./ChatDrawer";

export default function Layout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navigationItems = [
    { id: "chat", label: "Chat", icon: MessageSquare, path: "/" },
    { id: "material", label: "Material", icon: BookOpen, path: "/material" },
    { id: "quiz", label: "Quiz", icon: HelpCircle, path: "/quiz" },
    { id: "referral", label: "Referral", icon: Users, path: "/referral" },
  ];

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    return navigationItems.find(item => item.path === currentPath)?.id || "chat";
  };

  const currentPage = getCurrentPage();

  return (
    <div className={cn(
      "flex flex-col h-screen transition-colors duration-200",
      isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet context={{ isDarkMode, onMenuClick: () => setIsDrawerOpen(true) }} />
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

      {/* Chat Drawer */}
      <ChatDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleDarkMode}
      />
    </div>
  );
} 