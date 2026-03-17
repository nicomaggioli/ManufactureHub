import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Plus,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { communicationsApi } from '@/lib/api';
import type { Communication } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────────────────

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};
type NavSection = { label: string; items: NavItem[] };

// ── Quick-create actions ────────────────────────────────────────────────

const quickCreateActions = [
  { label: 'New Project', path: '/projects/new', icon: FolderKanban },
  { label: 'New Quote', path: '/quotes/new', icon: FileText },
  { label: 'New Communication', path: '/communications/new', icon: MessageSquare },
];

// ── Nav link component ──────────────────────────────────────────────────

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-2.5 py-2.5 px-3 text-sm rounded-none transition-colors duration-150 group relative',
        active
          ? 'bg-primary/5 text-primary font-semibold border-l-[3px] border-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-[3px] border-transparent',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.label : undefined}
    >
      <div
        className={cn(
          'flex items-center justify-center shrink-0 transition-colors duration-150',
          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
      >
        <item.icon
          className="w-[18px] h-[18px]"
          strokeWidth={1.5}
        />
      </div>
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-medium px-1.5 bg-primary/10 text-primary"
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

// ── Main Sidebar ────────────────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch unread communications count for badge
  const commsQuery = useQuery({
    queryKey: ['communications'],
    queryFn: () => communicationsApi.list(),
    staleTime: 60_000,
  });

  const unreadCommsCount = (() => {
    const comms = (commsQuery.data ?? []) as Communication[];
    // Count communications that are pending/unread
    return comms.filter((c) => c.status === 'draft').length;
  })();

  // Nav sections with badges
  const navSections: NavSection[] = [
    {
      label: 'Main',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Work',
      items: [
        { to: '/projects', label: 'Projects', icon: FolderKanban },
        { to: '/manufacturers', label: 'Manufacturers', icon: Factory },
        { to: '/communications', label: 'Communications', icon: MessageSquare, badge: unreadCommsCount },
      ],
    },
    {
      label: 'Production',
      items: [
        { to: '/quotes', label: 'Quotes', icon: FileText },
        { to: '/samples', label: 'Samples', icon: Package },
      ],
    },
    {
      label: 'Creative',
      items: [
        { to: '/design', label: 'Design Studio', icon: Wand2 },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close create dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="flex items-center gap-2.5 px-4 h-[54px] shrink-0 border-b border-border">
        <Link to="/" className="flex items-center min-w-0">
          {!collapsed ? (
            <span className="font-display text-lg font-bold text-foreground tracking-tight">
              RAVI
            </span>
          ) : (
            <span className="font-display text-lg font-bold text-foreground tracking-tight">
              R
            </span>
          )}
        </Link>
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick-create button */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 relative" ref={createRef}>
          <button
            onClick={() => setCreateOpen(!createOpen)}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted/50 transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>

          {createOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-card border border-border rounded-md shadow-elevated z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150" role="menu" onKeyDown={(e) => { if (e.key === 'Escape') setCreateOpen(false); }}>
              {quickCreateActions.map((action) => (
                <button
                  key={action.path}
                  role="menuitem"
                  onClick={() => {
                    setCreateOpen(false);
                    navigate(action.path);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <action.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {collapsed && (
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={() => setCreateOpen(!createOpen)}
            className="flex items-center justify-center w-full py-2 rounded-md border border-border text-foreground hover:bg-muted/50 transition-colors duration-150"
            title="Create"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-0 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.label}>
            {idx > 0 && (
              <div className="mx-3 my-2 border-t border-border" />
            )}
            {!collapsed && (
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary px-3 pt-2 pb-1.5">
                {section.label}
              </div>
            )}
            {collapsed && idx > 0 && (
              <div className="mx-1 my-1.5 border-t border-border" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  item={item}
                  active={isActive(item.to)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-0 pb-3 pt-2 border-t border-border space-y-1">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-2.5 py-2.5 px-3 text-sm rounded-none transition-colors duration-150 group',
            isActive('/settings')
              ? 'bg-primary/5 text-primary font-semibold border-l-[3px] border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-[3px] border-transparent',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold shrink-0',
                isActive('/settings')
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <User className="w-3.5 h-3.5" />
            </div>
            {!collapsed && <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />}
          </div>
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 text-muted-foreground/50 hover:text-muted-foreground rounded-md transition-colors duration-150 hover:bg-muted/50 hidden md:flex"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex items-center justify-center w-9 h-9 rounded-md bg-card border border-border shadow-sm text-foreground hover:bg-muted/50 transition-colors md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="w-4.5 h-4.5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-[232px] bg-card border-r border-border transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen bg-card border-r border-border transition-[width] duration-200',
          collapsed ? 'w-[60px]' : 'w-[232px]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
