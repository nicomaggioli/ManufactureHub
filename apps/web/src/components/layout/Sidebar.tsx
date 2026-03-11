import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Factory,
  MessageSquare,
  Wand2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function WizardHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="20" rx="10" ry="2.5" fill="currentColor" opacity="0.85" />
      <path d="M5.5 20 L12 3 L18.5 20" fill="currentColor" opacity="0.65" />
      <rect x="5.5" y="18.5" width="13" height="2" rx="0.5" fill="currentColor" opacity="0.95" />
      <path d="M15 9 L15.8 10.5 L17.5 10.8 L16.25 12 L16.6 13.7 L15 12.9 L13.4 13.7 L13.75 12 L12.5 10.8 L14.2 10.5 Z" fill="hsl(42, 88%, 52%)" opacity="0.9" />
      <circle cx="9.5" cy="12" r="0.7" fill="hsl(42, 88%, 62%)" opacity="0.65" />
    </svg>
  );
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/design', label: 'Design Studio', icon: Wand2 },
  { to: '/manufacturers', label: 'Manufacturers', icon: Factory },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/communications', label: 'Messages', icon: MessageSquare },
];

const bottomItems = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: { to: string; label: string; icon: React.ElementType };
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all duration-200 group relative',
        active
          ? 'bg-sidebar-muted/80 text-white'
          : 'text-sidebar-foreground hover:text-white hover:bg-sidebar-muted/40',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-sidebar-accent" />
      )}
      <item.icon
        className={cn(
          'w-[18px] h-[18px] shrink-0 transition-colors duration-200',
          active ? 'text-sidebar-accent' : 'text-sidebar-foreground group-hover:text-white'
        )}
        strokeWidth={active ? 2 : 1.7}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[232px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 bg-white/10 shrink-0">
            <WizardHat className="w-[18px] h-[18px] text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-[14px] text-white tracking-tight truncate leading-tight">
                Jace
              </span>
              <span className="text-[9px] text-sidebar-foreground/70 font-medium uppercase tracking-[0.15em] leading-tight">
                Manufacturing
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Create Mockup CTA — hide when already on /design */}
      {!isActive('/design') && (
        <div className="px-2 pt-3 pb-1">
          <Link
            to="/design"
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2 text-[13px] font-semibold transition-all duration-200',
              'bg-white text-black hover:bg-white/90',
              collapsed && 'px-0'
            )}
            title={collapsed ? 'Create Mockup' : undefined}
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            {!collapsed && <span>Create Mockup</span>}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto sidebar-scroll">
        {navItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-2 space-y-0.5 border-t border-sidebar-border pt-2">
        {bottomItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
        ))}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-sidebar-foreground/60 hover:text-white transition-colors duration-200 hover:bg-sidebar-muted/40"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
