import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchMaterials, viewMaterial } from "../../store/slices/materialsSlice";
import { addNotification } from "../../store/slices/uiSlice";
import { cn } from "../../lib/utils";
import { BookOpen, Eye, ExternalLink, FileText, Video, Image, Presentation } from "lucide-react";
import { Button, SkeletonLoader } from "../../components/ui";

interface MaterialPageContext {
  isDarkMode: boolean;
}

export default function MaterialPage() {
  const { isDarkMode } = useOutletContext<MaterialPageContext>();
  const dispatch = useAppDispatch();
  const { materials, isLoading, error } = useAppSelector((state: any) => state.materials);

  useEffect(() => {
    dispatch(fetchMaterials());
  }, [dispatch]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'presentation':
        return <Presentation className="w-4 h-4" />;
      case 'link':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };


  const handleView = async (material: any) => {
    try {
      await dispatch(viewMaterial(material.id)).unwrap();
      
      if (material.type === 'link' && material.url) {
        window.open(material.url, '_blank');
      } else if (material.filePath) {
        window.open(material.filePath, '_blank');
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'View Failed',
        message: error || 'Failed to view material'
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
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
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonLoader variant="card" count={6} />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className={cn(
              "text-red-600",
              isDarkMode ? "text-red-400" : "text-red-600"
            )}>
              {error}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className={cn(
                  "w-12 h-12 mx-auto mb-4",
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                )} />
                <p className={cn(
                  "text-gray-600",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  No materials available
                </p>
              </div>
            ) : (
              materials.map((material: any) => (
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
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(material.type)}
                        <h3 className={cn(
                          "font-semibold text-sm",
                          isDarkMode ? "text-white" : "text-gray-900"
                        )}>
                          {material.title}
                        </h3>
                      </div>
                      {material.description && (
                        <p className={cn(
                          "text-xs mb-2",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {material.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs">
                        <span className={cn(
                          "px-2 py-1 rounded-full flex items-center gap-1",
                          isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                        )}>
                          {getTypeIcon(material.type)}
                          {material.type.toUpperCase()}
                        </span>
                        <span className={cn(
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {formatFileSize(material.fileSize)}
                        </span>
                        {material.difficulty && (
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            material.difficulty === 'easy' ? "bg-green-100 text-green-700" :
                            material.difficulty === 'medium' ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {material.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span className={cn(
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          )}>
                            {material.viewCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={() => handleView(material)}
                      size="sm"
                      variant="primary"
                      icon={<Eye className="w-3 h-3" />}
                      className="w-full"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 