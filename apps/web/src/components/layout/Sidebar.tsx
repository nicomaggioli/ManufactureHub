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
  ClipboardCheck,
  Truck,
  Users,
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
      { to: '/approvals', label: 'Approvals', icon: ClipboardCheck },
      { to: '/shipping', label: 'Shipping', icon: Truck },
      { to: '/communications', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Client',
    items: [
      { to: '/client', label: 'Client Portal', icon: Users },
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
        'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150',
        active
          ? 'bg-primary/8 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
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
        'flex flex-col h-screen bg-white border-r border-border/60 transition-all duration-200',
        collapsed ? 'w-[64px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[60px] shrink-0 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-white shrink-0">
            <span className="text-xs font-bold font-heading">S</span>
          </div>
          {!collapsed && (
            <span className="font-bold font-heading text-base text-foreground tracking-tight truncate">
              Sical
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.label ?? idx} className={idx > 0 ? 'mt-5' : ''}>
            {section.label && !collapsed && (
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-3 pb-2">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 space-y-0.5 border-t border-border/40 pt-3">
        {bottomItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
        ))}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-muted-foreground/50 hover:text-muted-foreground rounded-lg transition-colors duration-150 hover:bg-muted/40"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
