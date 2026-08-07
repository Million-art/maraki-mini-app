import { Menu } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
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
        <h1 className="text-lg font-extrabold text-foreground tracking-tight">Maraki AI</h1>
      </div>
    </header>
  );
}
