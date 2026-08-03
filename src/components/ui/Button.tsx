import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    fullWidth,
    ...props
  }, ref) => {

    const base = [
      'inline-flex items-center justify-center font-semibold',
      'transition-all duration-150 cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60',
      'disabled:opacity-50 disabled:pointer-events-none',
    ].join(' ');

    const variants = {
      primary: 'bg-orange text-white shadow-[0_4px_16px_rgba(252,74,1,0.30)] hover:bg-orange-soft',
      accent:  'bg-lime text-dark shadow-[0_4px_16px_rgba(197,244,0,0.30)] hover:bg-lime-soft',
      outline: 'border-2 border-orange text-orange bg-transparent hover:bg-orange hover:text-white',
      ghost:   'bg-transparent text-dark hover:bg-light',
      dark:    'bg-dark text-white hover:bg-dark-muted',
    };

    const sizes = {
      sm:   'h-8  px-3  text-sm   rounded-full gap-1.5',
      md:   'h-11 px-5  text-sm   rounded-full gap-2',
      lg:   'h-13 px-7  text-base rounded-full gap-2',
      icon: 'h-10 w-10 text-sm   rounded-full',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        {...props}
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            {icon && iconPosition === 'left'  && <span className="shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
