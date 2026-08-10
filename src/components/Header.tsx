import { Menu, Crown } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { currentStudent } = useSelector((state: RootState) => state.student);
  
  const isPremium = currentStudent?.isPremium || currentStudent?.isMarakiPremium;

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="p-2 rounded-lg text-foreground hover:bg-muted md:hidden -ml-2"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-extrabold text-foreground tracking-tight">Maraki AI</h1>
        </div>

        {/* Dynamic Status Badge */}
        {currentStudent && (
          <div className="flex items-center">
            {isPremium ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-sm">
                <Crown className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                <span className="text-xs font-bold text-white tracking-wide uppercase">Premium</span>
              </div>
            ) : (
              <div className="flex items-center px-3 py-1 bg-muted rounded-full border border-border/50">
                <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Freemium</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
