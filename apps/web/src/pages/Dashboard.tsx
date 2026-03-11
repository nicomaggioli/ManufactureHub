import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Factory,
  Clock,
  Bell,
  ArrowRight,
  Activity,
  Paintbrush,
  Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';

const statCards = [
  { key: 'projects', title: 'Active Projects', icon: FolderKanban, getValue: (s: any) => s?.activeProjects ?? 0 },
  { key: 'mfrs', title: 'Manufacturers', icon: Factory, getValue: (s: any) => s?.manufacturersContacted ?? s?.totalManufacturers ?? 0 },
  { key: 'pending', title: 'Pending Replies', icon: Clock, getValue: (s: any) => s?.pendingReplies ?? 0 },
  { key: 'reminders', title: 'Reminders', icon: Bell, getValue: (s: any) => s?.upcomingReminders ?? 0 },
] as const;

const secondaryActions = [
  { to: '/manufacturers', icon: Factory, iconBg: 'bg-indigo-500/8', iconColor: 'text-indigo-500', title: 'Find Manufacturers', desc: 'Search verified global suppliers and request quotes.', cta: 'Browse' },
  { to: '/projects', icon: FolderKanban, iconBg: 'bg-emerald-500/8', iconColor: 'text-emerald-500', title: 'View Projects', desc: 'Track your active projects from design to delivery.', cta: 'Open' },
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

  const stats = statsQuery.data;
  const activity = activityQuery.data ?? [];
  const hasProjects = (stats?.activeProjects ?? 0) > 0;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-[22px] font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Design, manufacture, and ship your product.
        </p>
      </div>

      {/* Hero workflow section */}
      <div className="grid gap-3 sm:grid-cols-3 animate-in">
        {/* Primary CTA — Create a Mockup */}
        <Link
          to="/design"
          className="sm:col-span-3 lg:col-span-1 group relative flex flex-col justify-between rounded-xl border-2 border-primary/20 bg-primary/[0.04] p-6 transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.07]"
        >
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-heading text-lg font-bold tracking-tight">Create a Mockup</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Design your product with the AI mockup generator — the first step to manufacturing.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-4 group-hover:gap-2.5 transition-all">
            Get started <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        {secondaryActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex flex-col justify-between rounded-xl border border-border/50 bg-muted/15 p-5 transition-all duration-200 hover:bg-muted/30 hover:border-border"
          >
            <div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.iconBg} mb-3`}>
                <action.icon className={`h-4 w-4 ${action.iconColor}`} />
              </div>
              <h3 className="font-heading text-[15px] font-semibold">{action.title}</h3>
              <p className="text-[12px] text-muted-foreground mt-1">{action.desc}</p>
            </div>
            <div className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground mt-3 group-hover:text-foreground transition-colors">
              {action.cta} <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Stat cards */}
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

      {/* Empty state CTA — shown when user has no projects */}
      {!statsQuery.isLoading && !hasProjects && (
        <Card className="animate-in border-dashed border-2 border-primary/15" style={{ animationDelay: '180ms' }}>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 mb-4">
              <Paintbrush className="h-7 w-7 text-primary/70" />
            </div>
            <h3 className="font-heading text-lg font-bold tracking-tight">Create Your First Mockup</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Start by designing a product mockup with our AI-powered tool. From there you can find manufacturers, get quotes, and track production.
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
      <Card className="animate-in" style={{ animationDelay: '220ms' }}>
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
              {activity.slice(0, 5).map((item) => (
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
    </div>
  );
}
