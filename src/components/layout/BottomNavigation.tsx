import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic,
  GraduationCap,
  Globe2,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    id: 'speaking',
    label: 'Speaking',
    path: '/',
    icon: Mic,
  },
  {
    id: 'exam',
    label: 'Exam',
    path: '/exam',
    icon: GraduationCap,
  },
  {
    id: 'ielts',
    label: 'IELTS',
    path: '/ielts',
    icon: Globe2,
  },
  {
    id: 'sat',
    label: 'SAT',
    path: '/sat',
    icon: Sparkles,
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  return (
    <nav
      className="w-full bg-white border-t border-gray-100 px-3 py-2 z-50 shrink-0"
      aria-label="Global Navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? currentPath === '/' || currentPath === '/voice'
              : currentPath.startsWith(item.path);

          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl transition-all duration-200 group active:scale-95',
                isActive ? 'text-[#22C55E]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {/* Active Pill Background Animation */}
              {isActive && (
                <motion.div
                  layoutId="activeNavTab"
                  className="absolute inset-0 bg-gray-100 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <IconComponent
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isActive ? 'scale-105 stroke-[2.5]' : 'stroke-2 group-hover:scale-105'
                )}
              />

              <span
                className={cn(
                  'text-[10px] font-bold mt-1 tracking-tight',
                  isActive ? 'text-[#22C55E]' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
