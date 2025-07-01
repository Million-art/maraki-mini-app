import { useState } from "react";
import { cn } from "./lib/utils";
import { MessageSquare, BookOpen, HelpCircle, Users, Menu, X } from "lucide-react";
import ChatPage from "./components/ChatPage";
import MaterialPage from "./components/MaterialPage";
import QuizPage from "./components/QuizPage";
import ReferralPage from "./components/ReferralPage";
import ChatDrawer from "./components/ChatDrawer";

type Page = "chat" | "material" | "quiz" | "referral";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("chat");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navigationItems = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "material", label: "Material", icon: BookOpen },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
    { id: "referral", label: "Referral", icon: Users },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "chat":
        return <ChatPage onMenuClick={() => setIsDrawerOpen(true)} isDarkMode={isDarkMode} />;
      case "material":
        return <MaterialPage isDarkMode={isDarkMode} />;
      case "quiz":
        return <QuizPage isDarkMode={isDarkMode} />;
      case "referral":
        return <ReferralPage isDarkMode={isDarkMode} />;
      default:
        return <ChatPage onMenuClick={() => setIsDrawerOpen(true)} isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen transition-colors duration-200",
      isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderPage()}
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
                onClick={() => setCurrentPage(item.id as Page)}
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
