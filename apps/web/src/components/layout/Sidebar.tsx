import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Factory,
  MessageSquare,
  Palette,
  FileText,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hexagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/manufacturers', label: 'Manufacturers', icon: Factory },
  { to: '/communications', label: 'Messages', icon: MessageSquare },
  { to: '/design', label: 'Design Hub', icon: Palette },
  { to: '/quotes', label: 'Quotes', icon: FileText },
  { to: '/samples', label: 'Samples', icon: Package },
];

const bottomItems = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

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
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 shrink-0">
            <Hexagon className="w-5 h-5 text-sidebar-accent" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-sm text-white tracking-tight truncate">
                ManufactureHub
              </span>
              <span className="text-[10px] text-sidebar-foreground font-medium uppercase tracking-widest">
                Platform
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto sidebar-scroll">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 group relative',
                active
                  ? 'bg-sidebar-muted text-white'
                  : 'text-sidebar-foreground hover:text-white hover:bg-sidebar-muted/60',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-accent" />
              )}
              <item.icon
                className={cn(
                  'w-[18px] h-[18px] shrink-0 transition-colors',
                  active ? 'text-sidebar-accent' : 'text-sidebar-foreground group-hover:text-white'
                )}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-2 space-y-0.5 border-t border-sidebar-border pt-2">
        {bottomItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150',
                active
                  ? 'bg-sidebar-muted text-white'
                  : 'text-sidebar-foreground hover:text-white hover:bg-sidebar-muted/60',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-sidebar-foreground hover:text-white transition-colors rounded-md hover:bg-sidebar-muted/60"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
