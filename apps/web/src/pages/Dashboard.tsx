import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, remindersApi } from '@/lib/api';
import type { Reminder } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';

const statCards = [
  { key: 'projects', title: 'Active Projects', icon: FolderKanban, color: 'text-indigo-500 bg-indigo-50', getValue: (s: any) => s?.activeProjects ?? 0 },
  { key: 'mfrs', title: 'Manufacturers', icon: Factory, color: 'text-emerald-500 bg-emerald-50', getValue: (s: any) => s?.manufacturersContacted ?? s?.totalManufacturers ?? 0 },
  { key: 'pending', title: 'Pending Replies', icon: Clock, color: 'text-amber-500 bg-amber-50', getValue: (s: any) => s?.pendingReplies ?? 0 },
  { key: 'reminders', title: 'Reminders', icon: Bell, color: 'text-rose-500 bg-rose-50', getValue: (s: any) => s?.upcomingReminders ?? 0 },
] as const;

const pipelineStages = [
  { key: 'ideation', label: 'Ideation' },
  { key: 'sourcing', label: 'Sourcing' },
  { key: 'sampling', label: 'Sampling' },
  { key: 'production', label: 'Production' },
  { key: 'shipped', label: 'Shipped' },
] as const;

const reminderTypeDot: Record<string, string> = {
  follow_up: 'bg-blue-500',
  deadline: 'bg-red-500',
  task: 'bg-amber-500',
  milestone: 'bg-indigo-500',
  inspection: 'bg-emerald-500',
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-8 w-14 rounded" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-36 rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 text-center py-3 border border-border first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0">
              <Skeleton className="h-7 w-8 mx-auto rounded" />
              <Skeleton className="h-3 w-16 mx-auto mt-1.5 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
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

export function Dashboard() {
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

  const stats = statsQuery.data;
  const activity = activityQuery.data ?? [];
  const reminders: Reminder[] = remindersQuery.data ?? [];
  const hasProjects = (stats?.activeProjects ?? 0) > 0;

  // Pipeline counts
  const pipeline = stats?.pipeline ?? {};
  const maxPipelineCount = Math.max(...pipelineStages.map((s) => pipeline[s.key] ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your manufacturing pipeline.
        </p>
      </div>

      {/* Stat cards */}
      {statsQuery.isLoading ? (
        <StatsSkeleton />
      ) : statsQuery.isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive text-sm">
            Failed to load dashboard stats.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((sc, idx) => (
            <Card key={sc.key} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{sc.title}</p>
                    <p className="text-3xl font-semibold tracking-tight mt-2 data-value">{sc.getValue(stats)}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sc.color}`}>
                    <sc.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline overview */}
      {statsQuery.isLoading ? (
        <PipelineSkeleton />
      ) : !statsQuery.isError && (
        <Card className="animate-scale-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3">
            <CardTitle>Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-0">
              {pipelineStages.map((stage) => {
                const count = pipeline[stage.key] ?? 0;
                const isMax = count > 0 && count === maxPipelineCount;
                return (
                  <div
                    key={stage.key}
                    className={`flex-1 text-center py-3 border border-border first:rounded-l-lg last:rounded-r-lg -ml-px first:ml-0 ${isMax ? 'bg-primary/5' : ''}`}
                  >
                    <p className="text-2xl font-semibold data-value">{count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!statsQuery.isLoading && !hasProjects && (
        <Card className="animate-in border-dashed" style={{ animationDelay: '250ms' }}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Pencil className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Create Your First Mockup</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
              Start by designing a product mockup. From there you can find manufacturers, get quotes, and track production.
            </p>
            <Button className="mt-5" asChild>
              <Link to="/design">
                <Pencil className="h-4 w-4" />
                Open Mockup Generator
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Two-column layout: main content + sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions — compact horizontal */}
          <div className="grid gap-3 sm:grid-cols-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link
              to="/design"
              className="group relative flex items-center gap-3 p-3 rounded-lg border-2 border-primary/20 bg-primary/[0.03] transition-all duration-150 hover:border-primary/40 hover:bg-primary/[0.06]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Pencil className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm">Create Mockup</h2>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              to="/manufacturers"
              className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-all duration-150 hover:shadow-card-hover"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 shrink-0">
                <Factory className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm">Find Manufacturers</h2>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              to="/projects"
              className="group flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-all duration-150 hover:shadow-card-hover"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 shrink-0">
                <FolderKanban className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm">View Projects</h2>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Recent Activity */}
          <Card className="animate-slide-up" style={{ animationDelay: '350ms' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/4 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div className="py-10 text-center">
                  <Activity className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground data-value">
                            {formatRelativeDate(item.timestamp)}
                          </span>
                          {item.project && (
                            <Link to={`/projects/${item.projectId}`}>
                              <Badge variant="outline" className="text-[11px] cursor-pointer hover:bg-muted">
                                {item.project}
                              </Badge>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3) — Upcoming Tasks */}
        <div className="lg:col-span-1">
          <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Upcoming Tasks</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {remindersQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reminders.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {reminders.slice(0, 8).map((reminder) => {
                    const dotColor = reminderTypeDot[reminder.type] ?? 'bg-gray-400';
                    const isOverdue = new Date(reminder.dueAt) < new Date() && !reminder.completed;
                    return (
                      <div
                        key={reminder.id}
                        className={`flex items-start gap-2.5 py-2.5 border-b border-border/50 last:border-0 ${reminder.completed ? 'opacity-50' : ''}`}
                      >
                        <div className="mt-1.5 shrink-0">
                          {reminder.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                            <p className={`text-sm leading-snug truncate ${reminder.completed ? 'line-through' : ''}`}>
                              {reminder.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                              {formatDueDate(reminder.dueAt)}
                            </span>
                            {reminder.projectName && (
                              <Link to={`/projects/${reminder.projectId}`}>
                                <Badge variant="outline" className="text-[11px] cursor-pointer hover:bg-muted">
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
