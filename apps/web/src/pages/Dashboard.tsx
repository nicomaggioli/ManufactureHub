import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Factory,
  Clock,
  Bell,
  ArrowRight,
  Activity,
  Pencil,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  PenLine,
  Mail,
  MailOpen,
  FileText,
  Package,
  ChevronRight,
  Inbox,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, remindersApi } from '@/lib/api';
import type { Reminder, ActivityItem } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────

function getGreeting(): { greeting: string; timeWord: string } {
  const h = new Date().getHours();
  if (h < 12) return { greeting: 'Good', timeWord: 'morning' };
  if (h < 18) return { greeting: 'Good', timeWord: 'afternoon' };
  return { greeting: 'Good', timeWord: 'evening' };
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDueDate(dateStr: string) {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getDueDateUrgency(dateStr: string, completed: boolean): 'overdue' | 'today' | 'normal' {
  if (completed) return 'normal';
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  return 'normal';
}

const urgencyColors = {
  overdue: 'text-red-600 font-semibold',
  today: 'text-amber-600 font-medium',
  normal: 'text-muted-foreground',
};

const urgencyBorder = {
  overdue: 'border-l-red-500',
  today: 'border-l-amber-500',
  normal: 'border-l-transparent',
};

// Activity type to icon mapping
function getActivityIcon(type: string) {
  switch (type) {
    case 'message_sent':
      return { icon: Mail, color: 'text-blue-500', border: 'border-l-blue-400', bg: 'bg-blue-50' };
    case 'message_received':
      return { icon: MailOpen, color: 'text-emerald-500', border: 'border-l-emerald-400', bg: 'bg-emerald-50' };
    case 'quote':
    case 'quote_received':
      return { icon: FileText, color: 'text-amber-500', border: 'border-l-amber-400', bg: 'bg-amber-50' };
    case 'sample':
    case 'sample_update':
      return { icon: Package, color: 'text-purple-500', border: 'border-l-purple-400', bg: 'bg-purple-50' };
    default:
      return { icon: Activity, color: 'text-muted-foreground', border: 'border-l-gray-300', bg: 'bg-muted' };
  }
}

// ── Stat card config ───────────────────────────────────────────────────

const statCards = [
  {
    key: 'projects',
    title: 'Active Projects',
    icon: FolderKanban,
    bg: 'bg-blue-50/80',
    iconBg: 'text-blue-200',
    accent: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    getValue: (s: any) => s?.activeProjects ?? 0,
    getSub: (s: any) => {
      const v = s?.activeProjects ?? 0;
      return v > 0 ? `${v} in progress` : 'None yet';
    },
  },
  {
    key: 'mfrs',
    title: 'Manufacturers',
    icon: Factory,
    bg: 'bg-emerald-50/80',
    iconBg: 'text-emerald-200',
    accent: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    getValue: (s: any) => s?.manufacturersContacted ?? s?.totalManufacturers ?? 0,
    getSub: () => 'Contacted',
  },
  {
    key: 'pending',
    title: 'Pending Replies',
    icon: Clock,
    bg: 'bg-amber-50/80',
    iconBg: 'text-amber-200',
    accent: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    getValue: (s: any) => s?.pendingReplies ?? 0,
    getSub: (s: any) => {
      const v = s?.pendingReplies ?? 0;
      return v > 0 ? 'Awaiting response' : 'All caught up';
    },
  },
  {
    key: 'reminders',
    title: 'Reminders',
    icon: Bell,
    bg: 'bg-purple-50/80',
    iconBg: 'text-purple-200',
    accent: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    getValue: (s: any) => s?.upcomingReminders ?? 0,
    getSub: (s: any) => {
      const v = s?.upcomingReminders ?? 0;
      return v > 0 ? 'Upcoming' : 'Nothing scheduled';
    },
  },
] as const;

// ── Pipeline stages ────────────────────────────────────────────────────

const pipelineStages = [
  { key: 'ideation', label: 'Ideation', badge: '1', gradient: 'from-slate-100 to-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  { key: 'sourcing', label: 'Sourcing', badge: '2', gradient: 'from-blue-100 to-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  { key: 'sampling', label: 'Sampling', badge: '3', gradient: 'from-amber-100 to-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  { key: 'production', label: 'Production', badge: '4', gradient: 'from-emerald-100 to-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  { key: 'shipped', label: 'Shipped', badge: '5', gradient: 'from-purple-100 to-purple-50', text: 'text-purple-700', ring: 'ring-purple-200' },
] as const;

const reminderTypeDot: Record<string, string> = {
  follow_up: 'bg-blue-500',
  deadline: 'bg-red-500',
  task: 'bg-amber-500',
  milestone: 'bg-indigo-500',
  inspection: 'bg-emerald-500',
};

// ── Skeleton loaders ───────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-8 w-14 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-32 mb-4 rounded" />
      <div className="flex items-center gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
      {children}
    </h2>
  );
}

// ── Main component ─────────────────────────────────────────────────────

export function Dashboard() {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.stats,
  });

  const activityQuery = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardApi.recentActivity,
  });

  const remindersQuery = useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: () => remindersApi.list({ upcoming: true }),
  });

  const toggleReminderMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      remindersApi.update(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });

  const stats = statsQuery.data;
  const activity: ActivityItem[] = activityQuery.data ?? [];
  const reminders: Reminder[] = remindersQuery.data ?? [];
  const hasProjects = (stats?.activeProjects ?? 0) > 0;

  const pipeline = stats?.pipeline ?? {};
  const { greeting, timeWord } = getGreeting();

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting} <span className="font-medium">{timeWord}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {getTodayFormatted()}
        </p>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

        {/* ━━ LEFT COLUMN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="space-y-8">

          {/* ── Pipeline overview ──────────────────────────────────── */}
          <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <SectionHeading>Pipeline</SectionHeading>
            {statsQuery.isLoading ? (
              <PipelineSkeleton />
            ) : statsQuery.isError ? (
              <Card>
                <CardContent className="py-6 text-center text-destructive text-sm">
                  Failed to load pipeline data.
                </CardContent>
              </Card>
            ) : (
              <div className="relative flex items-stretch gap-0">
                {/* Connecting line behind pills */}
                <div className="absolute top-1/2 left-4 right-4 h-px bg-border -translate-y-1/2 z-0" />

                {pipelineStages.map((stage, idx) => {
                  const count = pipeline[stage.key] ?? 0;
                  return (
                    <Link
                      key={stage.key}
                      to={`/projects?status=${stage.key}`}
                      className={`relative z-10 flex-1 group transition-[transform,box-shadow] duration-200 hover:scale-105 ${idx > 0 ? 'ml-2' : ''}`}
                    >
                      <div
                        className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-gradient-to-b ${stage.gradient} ring-1 ${stage.ring} group-hover:shadow-md transition-shadow`}
                      >
                        <span className="text-[10px] font-semibold text-muted-foreground/60 mb-0.5">{stage.badge}</span>
                        <span className={`text-2xl font-bold ${stage.text} data-value`}>{count}</span>
                        <span className="text-overline font-medium text-muted-foreground mt-1">{stage.label}</span>
                      </div>
                      {idx < pipelineStages.length - 1 && (
                        <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-20" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Empty state — no projects ──────────────────────────── */}
          {!statsQuery.isLoading && !hasProjects && (
            <Card className="animate-slide-up border-dashed" style={{ animationDelay: '100ms' }}>
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Start Your First Project</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Design a product mockup, find manufacturers, get quotes, and track production — all in one place.
                </p>
                <Button className="mt-6" asChild>
                  <Link to="/design">
                    <Pencil className="h-4 w-4 mr-2" />
                    Open Mockup Generator
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Recent Activity ─────────────────────────────────────── */}
          <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <SectionHeading>Recent Activity</SectionHeading>
            <Card>
              <CardContent className="p-0">
                {activityQuery.isLoading ? (
                  <div className="p-5 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4 rounded" />
                          <Skeleton className="h-3 w-1/4 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity.length === 0 ? (
                  <div className="py-14 text-center">
                    <Inbox className="mx-auto h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Activity will appear here as you work on projects.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border/50">
                      {activity.slice(0, 5).map((item) => {
                        const ai = getActivityIcon(item.type);
                        const IconComponent = ai.icon;
                        return (
                          <Link
                            key={item.id}
                            to={item.projectId ? `/projects/${item.projectId}` : '#'}
                            className={`flex items-start gap-3 px-5 py-4 border-l-[3px] ${ai.border} hover:bg-muted/30 transition-colors cursor-pointer`}
                          >
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ai.bg}`}>
                              <IconComponent className={`h-4 w-4 ${ai.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-snug">{item.description}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-muted-foreground data-value">
                                  {formatRelativeDate(item.timestamp)}
                                </span>
                                {item.project && (
                                  <Badge variant="outline" className="text-overline">
                                    {item.project}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 mt-1 shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                    {activity.length > 5 && (
                      <div className="px-5 py-3 border-t border-border/50">
                        <Link
                          to="/projects"
                          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View all activity
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ━━ RIGHT COLUMN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="space-y-8">

          {/* ── Stat Cards ─────────────────────────────────────────── */}
          <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <SectionHeading>Overview</SectionHeading>
            {statsQuery.isLoading ? (
              <StatsSkeleton />
            ) : statsQuery.isError ? (
              <Card>
                <CardContent className="py-6 text-center text-destructive text-sm">
                  Failed to load stats.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 grid-cols-2">
                {statCards.map((sc, idx) => (
                  <Card
                    key={sc.key}
                    className={`overflow-hidden ${sc.bg} border-0 shadow-sm animate-slide-up`}
                    style={{ animationDelay: `${(idx + 1) * 60}ms` }}
                  >
                    <CardContent className="p-4 relative">
                      {/* Large background icon */}
                      <sc.icon
                        className={`absolute -right-2 -bottom-2 h-16 w-16 ${sc.iconBg} opacity-50`}
                        strokeWidth={1}
                      />
                      <p className="text-overline font-medium text-muted-foreground relative z-10">{sc.title}</p>
                      <p className={`text-3xl font-bold tracking-tight mt-1 ${sc.accent} relative z-10 data-value`}>
                        {sc.getValue(stats)}
                      </p>
                      <p className="text-overline text-muted-foreground mt-1 relative z-10">
                        {sc.getSub(stats)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── Quick Actions ──────────────────────────────────────── */}
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <SectionHeading>Quick Actions</SectionHeading>
            <div className="space-y-2">
              <Link
                to="/design"
                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/[0.03] transition-[color,background-color,border-color,box-shadow] duration-150 hover:border-primary/40 hover:bg-primary/[0.06] hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Create Project</h3>
                  <p className="text-overline text-muted-foreground mt-0.5">Design a new product mockup</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>

              <Link
                to="/manufacturers"
                className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card transition-[color,background-color,border-color,box-shadow] duration-150 hover:shadow-sm hover:border-border/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
                  <Search className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Find Manufacturers</h3>
                  <p className="text-overline text-muted-foreground mt-0.5">Browse verified suppliers</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>

              <Link
                to="/communications"
                className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card transition-[color,background-color,border-color,box-shadow] duration-150 hover:shadow-sm hover:border-border/80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
                  <PenLine className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Draft Message</h3>
                  <p className="text-overline text-muted-foreground mt-0.5">Compose a new message</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            </div>
          </div>

          {/* ── Upcoming Tasks / Reminders ──────────────────────────── */}
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <SectionHeading>Reminders</SectionHeading>
            <Card>
              <CardContent className="p-0">
                {remindersQuery.isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-5 w-5 rounded shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-full rounded" />
                          <Skeleton className="h-3 w-1/2 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reminders.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">All clear</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      No upcoming reminders. Enjoy your day.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border/40">
                      {reminders.slice(0, 6).map((reminder) => {
                        const dotColor = reminderTypeDot[reminder.type] ?? 'bg-gray-400';
                        const urgency = getDueDateUrgency(reminder.dueAt, reminder.completed);
                        return (
                          <div
                            key={reminder.id}
                            className={`flex items-start gap-3 px-4 py-3 border-l-[3px] ${urgencyBorder[urgency]} ${reminder.completed ? 'opacity-40' : ''}`}
                          >
                            <button
                              type="button"
                              className="mt-0.5 shrink-0 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() =>
                                toggleReminderMutation.mutate({
                                  id: reminder.id,
                                  completed: !reminder.completed,
                                })
                              }
                              aria-label={reminder.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {reminder.completed ? (
                                <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                              ) : (
                                <Circle className="h-[18px] w-[18px] text-muted-foreground/40 hover:text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                                <p className={`text-sm leading-snug truncate ${reminder.completed ? 'line-through' : ''}`}>
                                  {reminder.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs ${urgencyColors[urgency]}`}>
                                  {formatDueDate(reminder.dueAt)}
                                </span>
                                {reminder.projectName && (
                                  <Link to={`/projects/${reminder.projectId}`}>
                                    <Badge variant="outline" className="text-overline cursor-pointer hover:bg-muted">
                                      {reminder.projectName}
                                    </Badge>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {reminders.length > 6 && (
                      <div className="px-4 py-3 border-t border-border/50">
                        <Link
                          to="/projects"
                          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View all reminders
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
