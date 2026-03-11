import { Search, Bell, LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects, manufacturers..."
            className="w-full h-8 pl-9 pr-3 text-sm bg-muted/60 border-0 rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-muted transition-colors font-body"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 font-mono bg-background px-1.5 py-0.5 rounded border border-border hidden sm:inline">
            /
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-muted/60 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-heading font-semibold text-primary">
                {user?.firstName?.[0] ?? 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {user?.firstName ?? 'User'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-card rounded-lg border shadow-card-hover py-1 z-50 animate-in">
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <div className="border-t border-border my-1" />
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full text-left">
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
