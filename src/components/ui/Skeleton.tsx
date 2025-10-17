import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  style,
  ...props
}) => {
  const baseClasses = 'animate-pulse rounded-md bg-gray-200';
  
  const variants = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const skeletonStyle = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : '20px'),
    ...style,
  };

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        className
      )}
      style={skeletonStyle}
      {...props}
    />
  );
};

export default Skeleton;
