import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'lime' | 'orange' | 'dark' | 'light' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'lime',
  size = 'md',
  pulse = false,
  children,
  ...props
}) => {
  const variants = {
    lime:    'bg-lime    text-dark  font-bold',
    orange:  'bg-orange  text-white font-bold',
    dark:    'bg-dark    text-white font-semibold',
    light:   'bg-light   text-dark  font-medium',
    outline: 'border-2 border-orange text-orange bg-transparent font-semibold',
  };

  const sizes = {
    sm: 'px-2   py-0.5 text-xs  rounded-md',
    md: 'px-2.5 py-1   text-xs  rounded-lg',
    lg: 'px-3   py-1.5 text-sm  rounded-lg',
  };

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 leading-none tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      {...(props as any)}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </motion.div>
  );
};

export default Badge;
