import {
  Search, Bell, LogOut, Settings, ChevronRight,
  FolderKanban, Factory, MessageSquare, Clock, Activity, CheckCheck,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  projectsApi, manufacturersApi, communicationsApi,
  remindersApi, dashboardApi,
} from '@/lib/api';
import type { Project, Manufacturer, Communication, Reminder, ActivityItem } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';

// ── Breadcrumbs ──────────────────────────────────────────────────────────

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  design: 'Design Studio',
  manufacturers: 'Manufacturers',
  projects: 'Projects',
  communications: 'Communications',
  quotes: 'Quotes',
  samples: 'Samples',
  settings: 'Settings',
};

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.replace(/^\//, '').split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; path: string }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const segment = segments[i];
    const label = routeLabels[segment] ?? segment;
    crumbs.push({ label, path });
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-foreground transition-colors text-muted-foreground/70">
        Home
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          {i < crumbs.length - 1 ? (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── Debounce hook ────────────────────────────────────────────────────────

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ── Header ───────────────────────────────────────────────────────────────

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Panels
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Refs for click outside
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Search ──────────────────────────────────────────────────────────

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
    staleTime: 60_000,
  });

  const mfrsQuery = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturersApi.list(),
    staleTime: 60_000,
  });

  const commsQuery = useQuery({
    queryKey: ['communications'],
    queryFn: () => communicationsApi.list(),
    staleTime: 60_000,
  });

  const searchResults = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return null;

    const projects = ((projectsQuery.data as Project[]) ?? [])
      .filter((p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .slice(0, 3);

    const mfrData = mfrsQuery.data;
    const manufacturers = (Array.isArray(mfrData) ? mfrData : (mfrData as any)?.data ?? [])
      .filter((m: Manufacturer) => m.name.toLowerCase().includes(q) || m.country?.toLowerCase().includes(q))
      .slice(0, 3);

    const communications = ((commsQuery.data as Communication[]) ?? [])
      .filter((c) => (c.manufacturer?.name ?? '').toLowerCase().includes(q) || (c.subject ?? '').toLowerCase().includes(q))
      .slice(0, 3);

    return { projects, manufacturers, communications };
  }, [debouncedSearch, projectsQuery.data, mfrsQuery.data, commsQuery.data]);

  const hasResults = searchResults && (
    searchResults.projects.length > 0 ||
    searchResults.manufacturers.length > 0 ||
    searchResults.communications.length > 0
  );

  const handleSearchNav = useCallback((path: string) => {
    setSearchTerm('');
    setSearchFocused(false);
    searchInputRef.current?.blur();
    navigate(path);
  }, [navigate]);

  // "/" keyboard shortcut
  useEffect(() => {
    function handleSlash(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleSlash);
    return () => document.removeEventListener('keydown', handleSlash);
  }, []);

  // ── Notifications ───────────────────────────────────────────────────

  const [readAt, setReadAt] = useState(() =>
    localStorage.getItem('ravi-notifications-read-at') || ''
  );

  const remindersQuery = useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: () => remindersApi.list({ upcoming: true }),
    staleTime: 60_000,
  });

  const activityQuery = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardApi.recentActivity,
    staleTime: 60_000,
  });

  const notifications = useMemo(() => {
    const items: { id: string; icon: typeof Clock; iconColor: string; message: string; timestamp: string; path: string }[] = [];

    const reminders = (remindersQuery.data ?? []) as Reminder[];
    for (const r of reminders) {
      if (r.completed) continue;
      items.push({
        id: `rem-${r.id}`,
        icon: Clock,
        iconColor: 'text-amber-500 bg-amber-50',
        message: r.title,
        timestamp: r.dueAt,
        path: r.projectId ? `/projects/${r.projectId}` : '/',
      });
    }

    const activity = (activityQuery.data ?? []) as ActivityItem[];
    for (const a of activity) {
      items.push({
        id: `act-${a.id}`,
        icon: Activity,
        iconColor: 'text-blue-500 bg-blue-50',
        message: a.description ?? '',
        timestamp: a.timestamp,
        path: a.projectId ? `/projects/${a.projectId}` : '/',
      });
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items;
  }, [remindersQuery.data, activityQuery.data]);

  const unreadCount = useMemo(() => {
    if (!readAt) return notifications.length;
    const readTime = new Date(readAt).getTime();
    return notifications.filter((n) => new Date(n.timestamp).getTime() > readTime).length;
  }, [notifications, readAt]);

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('ravi-notifications-read-at', now);
    setReadAt(now);
  };

  // ── Click outside ───────────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotificationsOpen(false);
      if (searchRef.current && !searchRef.current.contains(target)) setSearchFocused(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-[52px] px-5 border-b border-black/[0.06] bg-white/70 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
        {/* Spacer for mobile hamburger */}
        <div className="w-9 md:hidden" />
        <Breadcrumbs />
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-md" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search projects, manufacturers..."
            aria-label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchTerm('');
                setSearchFocused(false);
                searchInputRef.current?.blur();
              }
            }}
            className="w-full h-[34px] pl-10 pr-10 text-[13px] bg-black/[0.03] border border-black/[0.06] rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/25 focus:bg-white transition-all duration-150"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/40 font-mono bg-white/70 px-1.5 py-0.5 rounded border border-black/[0.06] hidden sm:inline">
            /
          </kbd>

          {/* Search results dropdown */}
          {searchFocused && searchTerm.trim() && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-lg shadow-lg z-50 overflow-hidden">
              {!hasResults ? (
                <div className="px-4 py-8 text-center">
                  <Search className="mx-auto h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No results for &ldquo;{searchTerm}&rdquo;</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="py-1 max-h-80 overflow-y-auto">
                  {searchResults.projects.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FolderKanban className="h-3 w-3" /> Projects
                      </div>
                      {searchResults.projects.map((p: Project) => (
                        <button
                          key={p.id}
                          onClick={() => handleSearchNav(`/projects/${p.id}`)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <span className="truncate">{p.title}</span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">{p.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.manufacturers.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-t border-border/50">
                        <Factory className="h-3 w-3" /> Manufacturers
                      </div>
                      {searchResults.manufacturers.map((m: Manufacturer) => (
                        <button
                          key={m.id}
                          onClick={() => handleSearchNav(`/manufacturers/${m.id}`)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <span className="truncate">{m.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">{m.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.communications.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-t border-border/50">
                        <MessageSquare className="h-3 w-3" /> Communications
                      </div>
                      {searchResults.communications.map((c: Communication) => (
                        <button
                          key={c.id}
                          onClick={() => handleSearchNav(`/communications/${c.id}`)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <span className="truncate">{c.subject ?? 'No subject'}</span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">{c.manufacturer?.name ?? 'Unknown'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotificationsOpen(!notificationsOpen); setMenuOpen(false); }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
            )}
          </button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              onKeyDown={(e) => { if (e.key === 'Escape') setNotificationsOpen(false); }}
              className="absolute right-0 top-full mt-1.5 w-80 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-lg shadow-lg z-50 animate-scale-in"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 15).map((notif) => {
                    const Icon = notif.icon;
                    const isUnread = !readAt || new Date(notif.timestamp).getTime() > new Date(readAt).getTime();
                    return (
                      <Link
                        key={notif.id}
                        to={notif.path}
                        onClick={() => setNotificationsOpen(false)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-black/[0.03] transition-colors border-b border-black/[0.04] last:border-0 ${isUnread ? '' : 'opacity-60'}`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ${notif.iconColor}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug truncate ${isUnread ? 'font-medium' : ''}`}>
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatRelativeDate(notif.timestamp)}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setNotificationsOpen(false); }}
            className="flex items-center gap-2 ml-1 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.firstName?.[0] ?? 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {user?.firstName ?? 'User'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-lg shadow-lg py-1 z-50 animate-scale-in">
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-black/[0.04] rounded-md mx-1 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Settings
              </Link>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 rounded-lg mx-1 transition-colors w-[calc(100%-8px)] text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
