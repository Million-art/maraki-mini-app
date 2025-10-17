import React from 'react';
import { cn } from '../../lib/utils';
import Skeleton from './Skeleton';

interface SkeletonLoaderProps {
  variant?: 'page' | 'card' | 'list' | 'table' | 'form';
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'page',
  count = 1,
  className,
}) => {
  const renderPageSkeleton = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height="32px" width="60%" />
        <Skeleton height="20px" width="40%" />
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <Skeleton height="200px" width="100%" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton height="150px" width="100%" />
          <Skeleton height="150px" width="100%" />
        </div>
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      {/* Card Header */}
      <div className="flex items-center gap-3">
        <Skeleton height="24px" width="24px" variant="circular" />
        <Skeleton height="16px" width="60px" />
      </div>
      
      {/* Card Title */}
      <Skeleton height="20px" width="100%" />
      <Skeleton height="20px" width="80%" />
      
      {/* Card Description */}
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="70%" />
      
      {/* Card Actions */}
      <div className="flex gap-2 pt-2">
        <Skeleton height="32px" width="80px" />
        <Skeleton height="32px" width="80px" />
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Skeleton height="20px" width="20px" variant="circular" />
          <Skeleton height="20px" width="20px" />
          <Skeleton height="20px" width="70%" />
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-4 p-3 border-b border-gray-200 dark:border-gray-700">
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="100%" />
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-3 border-b border-gray-200 dark:border-gray-700">
          <Skeleton height="20px" width="100%" />
          <Skeleton height="20px" width="100%" />
          <Skeleton height="20px" width="100%" />
          <Skeleton height="20px" width="100%" />
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton height="16px" width="100px" />
        <Skeleton height="40px" width="100%" />
      </div>
      <div className="space-y-2">
        <Skeleton height="16px" width="120px" />
        <Skeleton height="40px" width="100%" />
      </div>
      <div className="space-y-2">
        <Skeleton height="16px" width="80px" />
        <Skeleton height="100px" width="100%" />
      </div>
      <div className="flex gap-2">
        <Skeleton height="40px" width="100px" />
        <Skeleton height="40px" width="100px" />
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      default:
        return renderPageSkeleton();
    }
  };

  return (
    <div className={cn('animate-pulse', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={count > 1 ? 'mb-4' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
