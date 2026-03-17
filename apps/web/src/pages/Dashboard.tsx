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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, remindersApi } from '@/lib/api';
import type { Reminder, ActivityItem } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────

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

// Activity type border colors
function getActivityBorder(type: string) {
  switch (type) {
    case 'message_sent':
      return 'border-l-blue-400';
    case 'message_received':
      return 'border-l-emerald-400';
    case 'quote':
    case 'quote_received':
      return 'border-l-amber-400';
    case 'sample':
    case 'sample_update':
      return 'border-l-purple-400';
    default:
      return 'border-l-gray-300';
  }
}

// ── Stat card config ───────────────────────────────────────────────────

const statCards = [
  {
    key: 'projects',
    title: 'Active Projects',
    getValue: (s: any) => s?.activeProjects ?? 0,
    getSub: (s: any) => {
      const v = s?.activeProjects ?? 0;
      return v > 0 ? `${v} in progress` : 'None yet';
    },
  },
  {
    key: 'mfrs',
    title: 'Manufacturers',
    getValue: (s: any) => s?.manufacturersContacted ?? s?.totalManufacturers ?? 0,
    getSub: () => 'Contacted',
  },
  {
    key: 'pending',
    title: 'Pending Replies',
    getValue: (s: any) => s?.pendingReplies ?? 0,
    getSub: (s: any) => {
      const v = s?.pendingReplies ?? 0;
      return v > 0 ? 'Awaiting response' : 'All caught up';
    },
  },
  {
    key: 'reminders',
    title: 'Reminders',
    getValue: (s: any) => s?.upcomingReminders ?? 0,
    getSub: (s: any) => {
      const v = s?.upcomingReminders ?? 0;
      return v > 0 ? 'Upcoming' : 'Nothing scheduled';
    },
  },
] as const;

// ── Pipeline stages ────────────────────────────────────────────────────

const pipelineStages = [
  { key: 'ideation', label: 'Ideation', dot: 'bg-slate-400' },
  { key: 'sourcing', label: 'Sourcing', dot: 'bg-blue-500' },
  { key: 'sampling', label: 'Sampling', dot: 'bg-amber-500' },
  { key: 'production', label: 'Production', dot: 'bg-emerald-500' },
  { key: 'shipped', label: 'Shipped', dot: 'bg-purple-500' },
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
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
          <Skeleton key={i} className="flex-1 h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary mb-3">
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

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-sm text-muted-foreground mt-1">Overview of your manufacturing pipeline</p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div>
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
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {statCards.map((sc) => (
              <Card key={sc.key} className="bg-card border shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{sc.title}</p>
                  <p className="text-2xl font-bold text-foreground font-display mt-1 data-value">
                    {sc.getValue(stats)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sc.getSub(stats)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Two-column layout ───────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

        {/* LEFT COLUMN */}
        <div className="space-y-8">

          {/* ── Pipeline overview ──────────────────────────────────── */}
          <div>
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
                {/* Connecting line behind cards */}
                <div className="absolute top-1/2 left-4 right-4 h-px bg-border -translate-y-1/2 z-0" />

                {pipelineStages.map((stage, idx) => {
                  const count = pipeline[stage.key] ?? 0;
                  return (
                    <Link
                      key={stage.key}
                      to={`/projects?status=${stage.key}`}
                      className={`relative z-10 flex-1 group transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md ${idx > 0 ? 'ml-2' : ''}`}
                    >
                      <Card className="flex flex-col items-center justify-center py-4 px-2 bg-card border shadow-sm">
                        <span className={`h-2 w-2 rounded-full ${stage.dot} mb-2`} />
                        <span className="text-2xl font-bold text-foreground font-display data-value">{count}</span>
                        <span className="text-[10px] font-medium text-muted-foreground mt-1">{stage.label}</span>
                      </Card>
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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <p className="font-semibold text-base font-display">No projects yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first project to get started.</p>
                <Button className="mt-5" asChild>
                  <Link to="/design">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Recent Activity ─────────────────────────────────────── */}
          <div>
            <SectionHeading>Recent Activity</SectionHeading>
            <Card>
              <CardContent className="p-0">
                {activityQuery.isLoading ? (
                  <div className="p-5 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-4 w-1 rounded shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4 rounded" />
                          <Skeleton className="h-3 w-1/4 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity.length === 0 ? (
                  <div className="py-14 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Activity will appear here as you work on projects.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border/50">
                      {activity.slice(0, 5).map((item) => {
                        const borderClass = getActivityBorder(item.type);
                        return (
                          <Link
                            key={item.id}
                            to={item.projectId ? `/projects/${item.projectId}` : '#'}
                            className={`flex items-start gap-3 px-5 py-4 border-l-[3px] ${borderClass} hover:bg-muted/30 transition-colors cursor-pointer`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-sans leading-snug">{item.description}</p>
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

        {/* RIGHT COLUMN */}
        <div className="space-y-8">

          {/* ── Quick Actions ──────────────────────────────────────── */}
          <div>
            <SectionHeading>Quick Actions</SectionHeading>
            <div className="space-y-1">
              <Link
                to="/design"
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-primary hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Link>
              <Link
                to="/manufacturers"
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Search className="h-4 w-4" />
                Find Manufacturers
              </Link>
              <Link
                to="/communications"
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <PenLine className="h-4 w-4" />
                Draft Message
              </Link>
            </div>
          </div>

          {/* ── Upcoming Tasks / Reminders ──────────────────────────── */}
          <div>
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
                    <CalendarCheck className="mx-auto h-8 w-8 text-muted-foreground/20 mb-3" />
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
                            className={`flex items-start gap-3 px-4 py-3 ${reminder.completed ? 'opacity-40' : ''}`}
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
                                <p className={`text-sm font-sans leading-snug truncate ${reminder.completed ? 'line-through' : ''}`}>
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
