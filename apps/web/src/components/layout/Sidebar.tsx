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
        'flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors duration-150',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        className={cn(
          'w-[18px] h-[18px] shrink-0',
          active ? 'text-primary' : ''
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
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[56px]">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
            <span className="text-sm font-bold">R</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-[15px] text-foreground tracking-tight truncate">
              RAVI
            </span>
          )}
        </Link>
      </div>

      {/* Create Mockup CTA */}
      {!isActive('/design') && (
        <div className="px-3 pb-2">
          <Link
            to="/design"
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2 text-[13px] font-medium rounded-lg transition-colors duration-150',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              collapsed && 'px-0'
            )}
            title={collapsed ? 'Create Mockup' : undefined}
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2} />
            {!collapsed && <span>New Mockup</span>}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.label ?? idx}>
            {section.label && !collapsed && (
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium px-3 pt-4 pb-1">
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 space-y-1 border-t border-sidebar-border pt-2">
        {bottomItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
        ))}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors duration-150 hover:bg-muted"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
