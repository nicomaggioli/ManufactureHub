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
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, remindersApi } from '@/lib/api';
import { formatRelativeDate, formatDate, cn } from '@/lib/utils';

const pipelineStages = [
  { key: 'ideation', label: 'Ideation', color: 'bg-violet-400/80' },
  { key: 'sourcing', label: 'Sourcing', color: 'bg-indigo-500/80' },
  { key: 'sampling', label: 'Sampling', color: 'bg-amber-500/80' },
  { key: 'production', label: 'Production', color: 'bg-emerald-500/80' },
  { key: 'shipped', label: 'Shipped', color: 'bg-green-600/80' },
] as const;

const statCards = [
  { key: 'projects', title: 'Active Projects', icon: FolderKanban, getValue: (s: any) => s?.activeProjects ?? 0, trend: '+2 this month' },
  { key: 'mfrs', title: 'Manufacturers', icon: Factory, getValue: (s: any) => s?.manufacturersContacted ?? s?.totalManufacturers ?? 0 },
  { key: 'pending', title: 'Pending Replies', icon: Clock, getValue: (s: any) => s?.pendingReplies ?? 0 },
  { key: 'reminders', title: 'Reminders', icon: Bell, getValue: (s: any) => s?.upcomingReminders ?? 0 },
] as const;

const quickActions = [
  { to: '/projects', icon: Plus, iconBg: 'bg-primary/8', iconColor: 'text-primary', title: 'New Project', desc: 'Start a manufacturing project' },
  { to: '/manufacturers', icon: Factory, iconBg: 'bg-indigo-500/8', iconColor: 'text-indigo-500', title: 'Browse Manufacturers', desc: 'Search global suppliers' },
  { to: '/communications', icon: MessageSquare, iconBg: 'bg-emerald-500/8', iconColor: 'text-emerald-500', title: 'Draft Message', desc: 'AI-powered communication' },
] as const;

function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-14" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
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
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your manufacturing operations at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/manufacturers">
              <Search className="h-3.5 w-3.5" />
              Find Manufacturers
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/projects">
              <Plus className="h-3.5 w-3.5" />
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((sc, idx) => (
            <Card key={sc.key} className="stat-card animate-in" style={{ animationDelay: `${idx * 40}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{sc.title}</p>
                    <p className="text-[28px] font-heading font-bold tracking-tight data-value leading-none">{sc.getValue(stats)}</p>
                    {sc.trend && (
                      <div className="flex items-center gap-1 text-[11px] text-success font-medium">
                        <TrendingUp className="h-3 w-3" />
                        {sc.trend}
                      </div>
                    )}
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/6">
                    <sc.icon className="h-[18px] w-[18px] text-primary/70" strokeWidth={1.7} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline + Quick Actions */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-in" style={{ animationDelay: '160ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Project Pipeline</CardTitle>
              <Link to="/projects" className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-medium">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[88px] flex-1 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {pipelineStages.map((stage) => {
                  const count = (stats?.pipelineCounts ?? stats?.pipeline)?.[stage.key] ?? 0;
                  return (
                    <div
                      key={stage.key}
                      className="flex flex-1 flex-col items-center rounded-xl border border-border/50 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40 hover:border-border group"
                    >
                      <div className={cn('h-2 w-2 rounded-full mb-2.5 transition-transform group-hover:scale-125', stage.color)} />
                      <span className="text-[22px] font-heading font-bold data-value leading-none">{count}</span>
                      <span className="text-[10px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-muted/15 hover:bg-muted/40 hover:border-border/60 transition-all duration-200 group"
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', action.iconBg)}>
                  <action.icon className={cn('h-4 w-4', action.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{action.title}</p>
                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity + Reminders */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-in" style={{ animationDelay: '240ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/25 mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-px">
                {activity.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/6">
                      <Activity className="h-3.5 w-3.5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug">{item.message ?? item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground data-value">
                          {formatRelativeDate(item.timestamp)}
                        </span>
                        {item.projectName && (
                          <Link to={`/projects/${item.projectId}`}>
                            <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted/50">
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

        <Card className="animate-in" style={{ animationDelay: '280ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Upcoming</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">Next 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {remindersQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/25 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming reminders</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {reminders.slice(0, 5).map((reminder) => (
                  <div key={reminder.id} className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/15 p-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-warning/8">
                      <Clock className="h-3 w-3 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{reminder.title}</p>
                      <p className="text-[11px] text-muted-foreground data-value mt-0.5">
                        {formatDate(reminder.dueDate)}
                      </p>
                      {reminder.projectName && (
                        <Badge variant="outline" className="mt-1.5 text-[10px]">{reminder.projectName}</Badge>
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
