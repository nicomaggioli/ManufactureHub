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
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: React.ElementType };

const mainItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/design', label: 'Design Studio', icon: Wand2 },
  { to: '/manufacturers', label: 'Manufacturers', icon: Factory },
  { to: '/communications', label: 'Messages', icon: MessageSquare },
];

const bottomItems: NavItem[] = [
  { to: '/client', label: 'Client Portal', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/** Inverted corner that creates the goo/metaball curve */
function GooCorner({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div
      className="absolute right-0 w-[18px] h-[18px] pointer-events-none"
      style={{
        [position === 'top' ? 'bottom' : 'top']: '100%',
        background:
          position === 'top'
            ? 'radial-gradient(circle at 0% 100%, transparent 17px, rgba(255,255,255,0.2) 17.5px)'
            : 'radial-gradient(circle at 0% 0%, transparent 17px, rgba(255,255,255,0.2) 17.5px)',
      }}
    />
  );
}

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
        'relative flex items-center gap-3 py-2.5 text-[13px] transition-all duration-200',
        active
          ? 'bg-white/20 text-white font-medium pl-3 pr-4 rounded-l-[14px]'
          : 'text-white/60 hover:text-white hover:bg-white/10 rounded-lg px-3 mr-3',
        collapsed && 'justify-center px-2 mr-0'
      )}
      style={active ? { zIndex: 1 } : undefined}
      title={collapsed ? item.label : undefined}
    >
      {active && !collapsed && (
        <>
          <GooCorner position="top" />
          <GooCorner position="bottom" />
        </>
      )}
      <item.icon
        className="w-[18px] h-[18px] shrink-0"
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
        'flex flex-col h-full shrink-0 transition-all duration-200',
        collapsed ? 'w-[64px]' : 'w-[230px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[64px] shrink-0">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 text-white shrink-0">
            <span className="text-sm font-bold">S</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-[15px] text-white tracking-tight truncate">
              Sical
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 pl-3 overflow-visible">
        <div className="space-y-1">
          {mainItems.map((item) => (
            <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="pl-3 pb-4 space-y-1 pt-3 overflow-visible">
        {bottomItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
        ))}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 mt-1 text-white/30 hover:text-white/60 rounded-lg transition-colors duration-150 hover:bg-white/10 mr-3"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
