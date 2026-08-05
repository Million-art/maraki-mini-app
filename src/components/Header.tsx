import { Menu } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar?: () => void;
  streak?: number;
  xp?: number;
}

export default function Header({ onOpenSidebar, streak = 0, xp = 0 }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-foreground hover:bg-muted md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-extrabold text-foreground tracking-tight">Maraki AI Live</h1>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-1 rounded-full">🔥 {streak}d</span>
          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full">⚡ {xp} XP</span>
        </div>
      </div>
    </header>
  );
}
