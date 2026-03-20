import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Factory,
  Clock,
  Bell,
  Activity,
  Pencil,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, remindersApi } from '@/lib/api';
import type { Reminder } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const statCards = [
  { key: 'projects', title: 'Active Projects', icon: FolderKanban, color: 'text-primary bg-primary/8', getValue: (s: any) => s?.activeProjects ?? 0 },
  { key: 'mfrs', title: 'Manufacturers', icon: Factory, color: 'text-emerald-600 bg-emerald-50', getValue: (s: any) => s?.manufacturersContacted ?? s?.totalManufacturers ?? 0 },
  { key: 'approvals', title: 'Awaiting Approval', icon: ClipboardCheck, color: 'text-amber-600 bg-amber-50', getValue: (s: any) => s?.pendingApprovals ?? 0 },
  { key: 'shipping', title: 'In Transit', icon: Truck, color: 'text-blue-600 bg-blue-50', getValue: (s: any) => s?.shipmentsInTransit ?? 0 },
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
  milestone: 'bg-primary',
  inspection: 'bg-emerald-500',
};

function StatsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-9 w-16 rounded" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
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
      <CardHeader>
        <Skeleton className="h-5 w-40 rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 text-center py-4 border border-border first:rounded-l-xl last:rounded-r-xl -ml-px first:ml-0">
              <Skeleton className="h-8 w-10 mx-auto rounded" />
              <Skeleton className="h-3 w-16 mx-auto mt-2 rounded" />
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
  const { user } = useAuth();

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

  const pipeline = stats?.pipeline ?? {};
  const maxPipelineCount = Math.max(...pipelineStages.map((s) => pipeline[s.key] ?? 0), 0);

  return (
    <div className="space-y-10">
      {/* Welcome header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold font-heading tracking-tight">
          Welcome Back, {user?.firstName || 'there'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening across your manufacturing pipeline.
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((sc, idx) => (
            <Card key={sc.key} className="animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${sc.color}`}>
                    <sc.icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-heading tracking-tight data-value">{sc.getValue(stats)}</p>
                    <p className="text-xs text-muted-foreground">{sc.title}</p>
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
        <div className="animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold font-heading">Pipeline</h2>
          </div>
          <div className="flex items-center gap-0">
            {pipelineStages.map((stage) => {
              const count = pipeline[stage.key] ?? 0;
              const isMax = count > 0 && count === maxPipelineCount;
              return (
                <div
                  key={stage.key}
                  className={`flex-1 text-center py-4 border border-border/60 first:rounded-l-xl last:rounded-r-xl -ml-px first:ml-0 transition-colors ${isMax ? 'bg-primary/5' : 'bg-white'}`}
                >
                  <p className="text-xl font-bold font-heading data-value">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stage.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!statsQuery.isLoading && !hasProjects && (
        <Card className="animate-in border-dashed border-2" style={{ animationDelay: '300ms' }}>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Pencil className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold font-heading text-lg">Create Your First Mockup</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Start by designing a product mockup. From there you can find manufacturers, get quotes, and track production.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/design">
                <Pencil className="h-4 w-4" />
                Open Mockup Generator
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity + Tasks — two column */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Recent Activity (3/5) */}
        <Card className="lg:col-span-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader>
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
                <Activity className="mx-auto h-7 w-7 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div>
                {activity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground data-value">
                          {formatRelativeDate(item.timestamp)}
                        </span>
                        {item.project && (
                          <Link to={`/projects/${item.projectId}`} className="text-xs text-primary hover:underline">
                            {item.project}
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

        {/* Upcoming Tasks (2/5) */}
        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <CardHeader>
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
                <CheckCircle2 className="mx-auto h-7 w-7 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming tasks</p>
              </div>
            ) : (
              <div>
                {reminders.slice(0, 6).map((reminder) => {
                  const dotColor = reminderTypeDot[reminder.type] ?? 'bg-gray-400';
                  const isOverdue = new Date(reminder.dueAt) < new Date() && !reminder.completed;
                  return (
                    <div
                      key={reminder.id}
                      className={`flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-0 ${reminder.completed ? 'opacity-40' : ''}`}
                    >
                      <div className="mt-1 shrink-0">
                        {reminder.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <span className={`block h-2.5 w-2.5 rounded-full mt-0.5 ${dotColor}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug truncate ${reminder.completed ? 'line-through' : ''}`}>
                          {reminder.title}
                        </p>
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {formatDueDate(reminder.dueAt)}
                        </span>
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
  );
}
