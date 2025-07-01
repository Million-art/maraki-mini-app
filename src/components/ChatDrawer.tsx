import { useState } from "react";
import { cn } from "../lib/utils";
import { X, Plus, MessageSquare, Trash2, Settings, Sun, Moon } from "lucide-react";

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

// Mock data - in a real app, this would come from a service
const mockChatHistory: ChatHistory[] = [
  {
    id: "1",
    title: "How to build a React app",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    messageCount: 8,
  },
  {
    id: "2",
    title: "TypeScript best practices",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    messageCount: 12,
  },
  {
    id: "3",
    title: "Tailwind CSS tips",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    messageCount: 6,
  },
];

export default function ChatDrawer({
  isOpen,
  onClose,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isDarkMode,
  onToggleTheme,
}: ChatDrawerProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>(mockChatHistory);

  const handleNewChat = () => {
    onNewChat?.();
    onClose();
  };

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId);
    onClose();
  };

  const handleDeleteChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    onDeleteChat?.(chatId);
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          isDarkMode ? "bg-gray-800" : "bg-white",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          <h2 className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Chat History
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            )}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className={cn(
          "p-4 border-b",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          <button 
            onClick={handleNewChat}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors",
              isDarkMode
                ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-white"
                : "border-gray-300 bg-white hover:bg-gray-50 text-gray-900"
            )}
          >
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>
        
        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-12 px-4",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )}>
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-sm text-center">Start a new chat to begin your conversation</p>
            </div>
          ) : (
            <div className="p-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={cn(
                    "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    isDarkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-medium truncate",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {chat.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-xs",
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      )}>
                        {formatTimestamp(chat.timestamp)}
                      </span>
                      <span className={cn(
                        "text-xs",
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      )}>
                        • {chat.messageCount} messages
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
                      isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                    )}
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Settings */}
        <div className={cn(
          "p-4 border-t",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2",
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
            )}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-500" />
            )}
            <span className={cn(
              "font-medium",
              isDarkMode ? "text-white" : "text-gray-700"
            )}>
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          {/* Settings Button */}
          <button className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
          )}>
            <Settings className="w-5 h-5 text-gray-500" />
            <span className={cn(
              "font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Settings
            </span>
          </button>
        </div>
      </div>
    </>
  );
} 