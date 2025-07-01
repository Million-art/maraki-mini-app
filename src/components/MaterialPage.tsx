import { useOutletContext } from "react-router-dom";
import { cn } from "../lib/utils";
import { BookOpen, Download, Eye, Star } from "lucide-react";

interface MaterialPageContext {
  isDarkMode: boolean;
}

export default function MaterialPage() {
  const { isDarkMode } = useOutletContext<MaterialPageContext>();

  const materials = [
    {
      id: 1,
      title: "Introduction to React",
      description: "Learn the basics of React development",
      type: "PDF",
      size: "2.5 MB",
      rating: 4.8,
      downloads: 1250,
      views: 3200,
    },
    {
      id: 2,
      title: "Advanced TypeScript",
      description: "Master TypeScript for better development",
      type: "Video",
      size: "45 MB",
      rating: 4.9,
      downloads: 890,
      views: 2100,
    },
    {
      id: 3,
      title: "UI/UX Design Principles",
      description: "Essential design principles for modern apps",
      type: "PDF",
      size: "1.8 MB",
      rating: 4.7,
      downloads: 1560,
      views: 4100,
    },
    {
      id: 4,
      title: "API Development Guide",
      description: "Complete guide to building RESTful APIs",
      type: "Document",
      size: "3.2 MB",
      rating: 4.6,
      downloads: 720,
      views: 1800,
    },
  ];

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-200",
      isDarkMode ? "bg-gray-900" : "bg-white"
    )}>
      {/* Header */}
      <header className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      )}>
        <h1 className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Learning Materials
        </h1>
        <BookOpen className={cn(
          "w-6 h-6",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )} />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-750" 
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={cn(
                    "font-semibold text-sm mb-1",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>
                    {material.title}
                  </h3>
                  <p className={cn(
                    "text-xs mb-2",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {material.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded-full",
                      isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                    )}>
                      {material.type}
                    </span>
                    <span className={cn(
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      {material.size}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className={cn(
                      "text-xs font-medium",
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {material.rating}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span className={cn(
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        {material.downloads}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className={cn(
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        {material.views}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors",
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                )}>
                  Download
                </button>
                <button className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors",
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}>
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 