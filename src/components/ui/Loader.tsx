import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'spinner',
  className,
  text,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  };

  const renderSpinner = () => (
    <motion.div
      className={cn("border-4 border-light-dim border-t-orange rounded-full", sizes[size])}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
    />
  );

  const renderDots = () => (
    <div className="flex space-x-1.5 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            'rounded-full bg-orange',
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2.5 h-2.5' : 'w-4.5 h-4.5'
          )}
          animate={{
            y: ["0%", "-60%", "0%"]
          }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut",
            delay: i * 0.15
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <motion.div
      className={cn('rounded-full bg-lime shadow-[0_0_15px_rgba(197,244,0,0.5)]', sizes[size])}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{
        repeat: Infinity,
        duration: 1.2,
        ease: "easeInOut"
      }}
    />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={cn('flex items-center justify-center font-sans', className)}>
      <div className="flex flex-col items-center space-y-3">
        {renderLoader()}
        {text && (
          <span className={cn('text-dark/60 tracking-wide', textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export default Loader;
