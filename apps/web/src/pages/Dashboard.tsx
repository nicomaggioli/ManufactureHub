import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Factory,
  Clock,
  Bell,
  Plus,
  Search,
  MessageSquare,
  ArrowRight,
  Activity,
  TrendingUp,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, remindersApi } from '@/lib/api';
import { formatRelativeDate, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const pipelineStages = [
  { key: 'ideation', label: 'Ideation', color: 'bg-violet-400', textColor: 'text-violet-600' },
  { key: 'sourcing', label: 'Sourcing', color: 'bg-indigo-500', textColor: 'text-indigo-600' },
  { key: 'sampling', label: 'Sampling', color: 'bg-amber-500', textColor: 'text-amber-600' },
  { key: 'production', label: 'Production', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  { key: 'shipped', label: 'Shipped', color: 'bg-green-600', textColor: 'text-green-700' },
] as const;

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  delay,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  delay?: number;
}) {
  return (
    <Card className="stat-card animate-in" style={{ animationDelay: `${delay ?? 0}ms` }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-3xl font-heading font-bold tracking-tight data-value">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8">
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
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
    queryFn: () => remindersApi.list({ upcoming: true, days: 7 }),
  });

  const stats = statsQuery.data;
  const activity = activityQuery.data ?? [];
  const reminders = remindersQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your manufacturing operations at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/manufacturers">
              <Search className="mr-2 h-3.5 w-3.5" />
              Find Manufacturers
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/projects">
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {statsQuery.isLoading ? (
        <StatsSkeleton />
      ) : statsQuery.isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive text-sm">
            Failed to load dashboard stats. Please try again.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Projects" value={stats?.activeProjects ?? 0} icon={FolderKanban} delay={0} />
          <StatCard title="Manufacturers" value={stats?.manufacturersContacted ?? stats?.totalManufacturers ?? 0} icon={Factory} delay={50} />
          <StatCard title="Pending Replies" value={stats?.pendingReplies ?? 0} icon={Clock} delay={100} />
          <StatCard title="Reminders" value={stats?.upcomingReminders ?? 0} icon={Bell} delay={150} />
        </div>
      )}

      {/* Pipeline + Quick Actions row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pipeline */}
        <Card className="lg:col-span-2 animate-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Project Pipeline</CardTitle>
              <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <div className="flex gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 flex-1 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {pipelineStages.map((stage, i) => {
                  const count = (stats?.pipelineCounts ?? stats?.pipeline)?.[stage.key] ?? 0;
                  return (
                    <div
                      key={stage.key}
                      className="flex flex-1 flex-col items-center rounded-lg border border-border/60 bg-muted/30 p-4 transition-all hover:bg-muted/60 hover:border-border group"
                    >
                      <div className={cn('h-2 w-2 rounded-full mb-3', stage.color)} />
                      <span className="text-2xl font-heading font-bold data-value">{count}</span>
                      <span className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="animate-in" style={{ animationDelay: '250ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/projects"
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">New Project</p>
                <p className="text-xs text-muted-foreground">Start a manufacturing project</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </Link>

            <Link
              to="/manufacturers"
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/10">
                <Factory className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Browse Manufacturers</p>
                <p className="text-xs text-muted-foreground">Search global suppliers</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </Link>

            <Link
              to="/communications"
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Draft Message</p>
                <p className="text-xs text-muted-foreground">AI-powered communication</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Activity + Reminders */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 animate-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.slice(0, 8).map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/8">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{item.message ?? item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground data-value">
                          {formatRelativeDate(item.timestamp)}
                        </span>
                        {item.projectName && (
                          <Link to={`/projects/${item.projectId}`}>
                            <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent">
                              {item.projectName}
                              <ArrowRight className="ml-1 h-2.5 w-2.5" />
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

        {/* Upcoming Reminders */}
        <Card className="animate-in" style={{ animationDelay: '350ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Upcoming</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Next 7 days
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {remindersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming reminders</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.slice(0, 5).map((reminder) => (
                  <div key={reminder.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-warning/10">
                      <Clock className="h-3 w-3 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground data-value mt-0.5">
                        {formatDate(reminder.dueDate)}
                      </p>
                      {reminder.projectName && (
                        <Badge variant="outline" className="mt-1.5 text-[10px]">
                          {reminder.projectName}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
