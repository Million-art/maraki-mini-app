import { useState } from "react";
import { cn } from "../lib/utils";
import { BookOpen, Download, Eye, Search, Filter } from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string;
  type: "PDF" | "Video" | "Document";
  size: string;
  downloads: number;
  views: number;
  category: string;
  tags: string[];
}

interface MaterialPageProps {}

const mockMaterials: Material[] = [
  {
    id: "1",
    title: "Introduction to React",
    description: "Learn the basics of React development with practical examples",
    type: "PDF",
    size: "2.3 MB",
    downloads: 124,
    views: 456,
    category: "Frontend",
    tags: ["React", "JavaScript", "Beginner"],
  },
  {
    id: "2",
    title: "Advanced TypeScript",
    description: "Master TypeScript for better development experience",
    type: "Video",
    size: "45.2 MB",
    downloads: 89,
    views: 234,
    category: "Backend",
    tags: ["TypeScript", "Advanced"],
  },
  {
    id: "3",
    title: "Tailwind CSS Guide",
    description: "Complete guide to Tailwind CSS utility-first framework",
    type: "PDF",
    size: "1.8 MB",
    downloads: 156,
    views: 789,
    category: "Frontend",
    tags: ["CSS", "Tailwind", "Styling"],
  },
  {
    id: "4",
    title: "API Development",
    description: "Build robust APIs with Node.js and Express",
    type: "Video",
    size: "67.1 MB",
    downloads: 67,
    views: 123,
    category: "Backend",
    tags: ["Node.js", "API", "Express"],
  },
];

export default function MaterialPage({}: MaterialPageProps) {
  const [materials] = useState<Material[]>(mockMaterials);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(materials.map(m => m.category)))];

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (materialId: string) => {
    // In a real app, this would trigger a download
    console.log(`Downloading material: ${materialId}`);
  };

  const handlePreview = (materialId: string) => {
    // In a real app, this would open a preview
    console.log(`Previewing material: ${materialId}`);
  };

  const getTypeIcon = (type: Material["type"]) => {
    switch (type) {
      case "PDF":
        return "📄";
      case "Video":
        return "🎥";
      case "Document":
        return "📝";
      default:
        return "📄";
    }
  };

  const getTypeColor = (type: Material["type"]) => {
    switch (type) {
      case "PDF":
        return "bg-red-100 text-red-700";
      case "Video":
        return "bg-blue-100 text-blue-700";
      case "Document":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Learning Materials</h1>
        <p className="text-sm text-gray-600">Access educational content and resources</p>
      </header>

      {/* Search and Filter */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === category
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-sm text-gray-500 text-center">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(material.type)}</span>
                    <div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getTypeColor(material.type)
                      )}>
                        {material.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{material.size}</span>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-gray-900 mb-2">{material.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{material.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {material.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {material.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {material.views}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(material.id)}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handlePreview(material.id)}
                    className="py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 