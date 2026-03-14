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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';

const statCards = [
  { key: 'projects', title: 'Active Projects', icon: FolderKanban, color: 'text-indigo-500 bg-indigo-50', getValue: (s: any) => s?.activeProjects ?? 0 },
  { key: 'mfrs', title: 'Manufacturers', icon: Factory, color: 'text-emerald-500 bg-emerald-50', getValue: (s: any) => s?.manufacturersContacted ?? s?.totalManufacturers ?? 0 },
  { key: 'pending', title: 'Pending Replies', icon: Clock, color: 'text-amber-500 bg-amber-50', getValue: (s: any) => s?.pendingReplies ?? 0 },
  { key: 'reminders', title: 'Reminders', icon: Bell, color: 'text-rose-500 bg-rose-50', getValue: (s: any) => s?.upcomingReminders ?? 0 },
] as const;

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

export function Dashboard() {
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.stats,
  });

  const activityQuery = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardApi.recentActivity,
  });

  const stats = statsQuery.data;
  const activity = activityQuery.data ?? [];
  const hasProjects = (stats?.activeProjects ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your manufacturing pipeline.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3 animate-in">
        <Link
          to="/design"
          className="group relative flex items-center gap-4 p-5 rounded-xl border-2 border-primary/20 bg-primary/[0.03] transition-all duration-150 hover:border-primary/40 hover:bg-primary/[0.06]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Pencil className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm">Create Mockup</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Design your product</p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          to="/manufacturers"
          className="group flex items-center gap-4 p-5 rounded-xl border border-border bg-card transition-all duration-150 hover:shadow-card-hover"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
            <Factory className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm">Find Manufacturers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Browse suppliers</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          to="/projects"
          className="group flex items-center gap-4 p-5 rounded-xl border border-border bg-card transition-all duration-150 hover:shadow-card-hover"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
            <FolderKanban className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm">View Projects</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track progress</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
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
            <Card key={sc.key} className="animate-in" style={{ animationDelay: `${idx * 50}ms` }}>
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

      {/* Empty state */}
      {!statsQuery.isLoading && !hasProjects && (
        <Card className="animate-in border-dashed" style={{ animationDelay: '200ms' }}>
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

      {/* Recent Activity */}
      <Card className="animate-in" style={{ animationDelay: '250ms' }}>
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
                    <p className="text-sm leading-snug">{item.message ?? item.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground data-value">
                        {formatRelativeDate(item.timestamp)}
                      </span>
                      {item.projectName && (
                        <Link to={`/projects/${item.projectId}`}>
                          <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted">
                            {item.projectName}
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
  );
}
