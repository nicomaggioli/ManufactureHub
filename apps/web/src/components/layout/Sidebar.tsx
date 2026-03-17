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
  FileText,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: React.ElementType };
type NavSection = { label?: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { to: '/design', label: 'Design Studio', icon: Wand2 },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/manufacturers', label: 'Manufacturers', icon: Factory },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { to: '/quotes', label: 'Quotes', icon: FileText },
      { to: '/samples', label: 'Samples', icon: Package },
      { to: '/communications', label: 'Messages', icon: MessageSquare },
    ],
  },
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
        'flex items-center gap-2.5 px-2.5 py-[6px] text-[13px] rounded-md transition-all duration-100',
        active
          ? 'bg-black/[0.06] text-foreground font-medium shadow-[0_0.5px_1px_rgba(0,0,0,0.04)]'
          : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.04]',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        className={cn(
          'w-[16px] h-[16px] shrink-0',
          active ? 'text-primary' : 'opacity-70'
        )}
        strokeWidth={active ? 2 : 1.5}
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
        'flex flex-col h-screen glass-subtle border-r border-black/[0.08] transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] shrink-0">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gradient-to-b from-primary to-blue-600 text-white shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
            <span className="text-[11px] font-bold font-heading">S</span>
          </div>
          {!collapsed && (
            <span className="font-semibold font-heading text-[14px] text-foreground tracking-tight truncate">
              Sical
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1 px-2.5 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.label ?? idx}>
            {section.label && !collapsed && (
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-2.5 pt-4 pb-1">
                {section.label}
              </div>
            )}
            <div className="space-y-[2px]">
              {section.items.map((item) => (
                <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2.5 pb-2.5 space-y-[2px] border-t border-black/[0.06] pt-2">
        {bottomItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
        ))}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 text-muted-foreground/60 hover:text-muted-foreground rounded-md transition-colors duration-100 hover:bg-black/[0.04]"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
}
