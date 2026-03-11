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
    <header className="flex items-center justify-between h-[52px] px-6 border-b border-border bg-card sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search projects, manufacturers..."
            className="w-full h-8 pl-9 pr-3 text-[13px] bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:bg-white transition-all duration-200 font-body"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 font-mono bg-background/60 px-1.5 py-0.5 border border-border hidden sm:inline">
            /
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1.5">
        <button className="relative flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
          <Bell className="w-[15px] h-[15px]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-foreground" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 hover:bg-muted/50 transition-all duration-200"
          >
            <div className="w-7 h-7 bg-foreground/10 flex items-center justify-center">
              <span className="text-xs font-heading font-semibold text-foreground">
                {user?.firstName?.[0] ?? 'U'}
              </span>
            </div>
            <span className="text-[13px] font-medium text-foreground hidden sm:inline">
              {user?.firstName ?? 'User'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border shadow-md py-1 z-50 animate-in">
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                Settings
              </Link>
              <div className="border-t border-border/60 my-1" />
              <button className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-destructive hover:bg-destructive/5 transition-colors w-full text-left">
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
