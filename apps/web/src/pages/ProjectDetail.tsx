import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Factory,
  MessageSquare,
  Palette,
  FileText,
  Package,
  Users,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { projectsApi, communicationsApi, quotesApi, samplesApi, designAssetsApi } from '@/lib/api';
import type { Communication, Quote, Sample, DesignAsset } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

const pipelineSteps = ['ideation', 'sourcing', 'sampling', 'production', 'shipped'] as const;
const stepLabels: Record<string, string> = {
  ideation: 'Ideation',
  sourcing: 'Sourcing',
  sampling: 'Sampling',
  production: 'Production',
  shipped: 'Shipped',
};

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = pipelineSteps.indexOf(currentStatus as any);

  return (
    <div className="flex items-center gap-0.5">
      {pipelineSteps.map((step, idx) => {
        const completed = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                  completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/20 text-muted-foreground/40'
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  active ? 'text-primary' : completed ? 'text-foreground' : 'text-muted-foreground/60'
                }`}
              >
                {stepLabels[step]}
              </span>
            </div>
            {idx < pipelineSteps.length - 1 && (
              <div
                className={`mx-0.5 h-[2px] w-8 sm:w-12 md:w-16 rounded-full ${
                  idx < currentIdx ? 'bg-primary' : 'bg-muted-foreground/15'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams() as { id: string };

  const projectQuery = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  });

  const commsQuery = useQuery({
    queryKey: ['communications', { projectId: id }],
    queryFn: () => communicationsApi.list({ projectId: id }),
    enabled: !!id,
  });

  const quotesQuery = useQuery({
    queryKey: ['quotes', { projectId: id }],
    queryFn: () => quotesApi.list({ projectId: id }),
    enabled: !!id,
  });

  const samplesQuery = useQuery({
    queryKey: ['samples', { projectId: id }],
    queryFn: () => samplesApi.list({ projectId: id }),
    enabled: !!id,
  });

  const assetsQuery = useQuery({
    queryKey: ['design-assets', { projectId: id }],
    queryFn: () => designAssetsApi.list({ projectId: id }),
    enabled: !!id,
  });

  const project = projectQuery.data;

  // Derive manufacturers from project data
  const projectManufacturers = useMemo(() => {
    const mfrMap = new Map<string, { id: string; name: string; hasComms: boolean; hasQuotes: boolean; hasSamples: boolean }>();

    for (const c of (commsQuery.data ?? [])) {
      const existing = mfrMap.get(c.manufacturerId) ?? { id: c.manufacturerId, name: c.manufacturerName, hasComms: false, hasQuotes: false, hasSamples: false };
      existing.hasComms = true;
      mfrMap.set(c.manufacturerId, existing);
    }
    for (const q of (quotesQuery.data ?? [])) {
      const existing = mfrMap.get(q.manufacturerId) ?? { id: q.manufacturerId, name: q.manufacturerName, hasComms: false, hasQuotes: false, hasSamples: false };
      existing.hasQuotes = true;
      mfrMap.set(q.manufacturerId, existing);
    }
    for (const s of (samplesQuery.data ?? [])) {
      const existing = mfrMap.get(s.manufacturerId) ?? { id: s.manufacturerId, name: s.manufacturerName, hasComms: false, hasQuotes: false, hasSamples: false };
      existing.hasSamples = true;
      mfrMap.set(s.manufacturerId, existing);
    }

    return Array.from(mfrMap.values());
  }, [commsQuery.data, quotesQuery.data, samplesQuery.data]);

  if (projectQuery.isLoading) return <DetailSkeleton />;

  if (projectQuery.isError || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Project not found or failed to load.
          </CardContent>
        </Card>
      </div>
    );
  }

  const commColumns: ColumnDef<Communication>[] = [
    { key: 'manufacturerName', header: 'Manufacturer', sortable: true },
    { key: 'subject', header: 'Subject' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'reply_received' ? 'success' : row.status === 'follow_up_due' ? 'warning' : 'secondary'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { key: 'lastMessageAt', header: 'Last Message', sortable: true, render: (row) => <span className="data-value">{formatDate(row.lastMessageAt)}</span> },
  ];

  const quoteColumns: ColumnDef<Quote>[] = [
    { key: 'manufacturerName', header: 'Manufacturer', sortable: true },
    { key: 'unitPrice', header: 'Unit Price', sortable: true, render: (row) => <span className="data-value">{formatCurrency(row.unitPrice, row.currency)}</span> },
    { key: 'moq', header: 'MOQ', sortable: true, render: (row) => <span className="data-value">{row.moq}</span> },
    { key: 'leadTimeDays', header: 'Lead Time', render: (row) => <span className="data-value">{row.leadTimeDays} days</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'accepted' ? 'success' : row.status === 'rejected' ? 'destructive' : 'secondary'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  const sampleColumns: ColumnDef<Sample>[] = [
    { key: 'manufacturerName', header: 'Manufacturer', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'destructive' : 'secondary'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { key: 'requestedAt', header: 'Requested', sortable: true, render: (row) => <span className="data-value">{formatDate(row.requestedAt)}</span> },
    { key: 'trackingNumber', header: 'Tracking', render: (row) => <span className="data-value">{row.trackingNumber ?? '--'}</span> },
  ];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Projects
          </Link>
        </Button>
      </div>

      {/* Title + status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1">
          {project.status}
        </Badge>
      </div>

      {/* Status timeline */}
      <Card className="animate-in">
        <CardContent className="flex justify-center py-5 overflow-x-auto">
          <StatusTimeline currentStatus={project.status} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manufacturers">
            <Factory className="mr-1 h-4 w-4" /> Manufacturers
          </TabsTrigger>
          <TabsTrigger value="communications">
            <MessageSquare className="mr-1 h-4 w-4" /> Communications
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Palette className="mr-1 h-4 w-4" /> Design Assets
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <FileText className="mr-1 h-4 w-4" /> Quotes
          </TabsTrigger>
          <TabsTrigger value="samples">
            <Package className="mr-1 h-4 w-4" /> Samples
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="animate-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Project Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Manufacturers</span>
                  <span className="data-value">{project.manufacturerCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Created</span>
                  <span className="data-value">{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Last Updated</span>
                  <span className="data-value">{formatDate(project.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-2.5">
                    {project.milestones.map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        {m.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${m.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {m.title}
                          </p>
                          <p className="text-xs text-muted-foreground data-value">{formatDate(m.dueDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No milestones yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manufacturers */}
        <TabsContent value="manufacturers" className="mt-4">
          {projectManufacturers.length === 0 ? (
            <Card className="animate-in">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Factory className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm">No manufacturers linked yet.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/manufacturers">Browse Manufacturers</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projectManufacturers.map((mfr) => (
                <Link key={mfr.id} to={`/manufacturers/${mfr.id}`}>
                  <Card className="h-full hover:shadow-card-hover transition-all cursor-pointer animate-in">
                    <CardContent className="p-5">
                      <p className="font-semibold text-sm">{mfr.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {mfr.hasComms && <Badge variant="secondary" className="text-[10px]">Messages</Badge>}
                        {mfr.hasQuotes && <Badge variant="secondary" className="text-[10px]">Quotes</Badge>}
                        {mfr.hasSamples && <Badge variant="secondary" className="text-[10px]">Samples</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="mt-4">
          <Card className="animate-in">
            <CardContent className="pt-5">
              <DataTable
                columns={commColumns}
                data={commsQuery.data ?? []}
                keyExtractor={(r) => r.id}
                emptyMessage="No communications for this project yet"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Assets */}
        <TabsContent value="assets" className="mt-4">
          <Card className="animate-in">
            <CardContent className="pt-5">
              {(assetsQuery.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Palette className="h-10 w-10 mb-3 text-muted-foreground/40" />
                  <p className="text-sm">No design assets uploaded yet</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to="/design">Go to Design Hub</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(assetsQuery.data ?? []).map((asset) => (
                    <div key={asset.id} className="rounded-lg border p-3 hover:border-primary/30 transition-colors">
                      <div className="h-28 bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground text-xs uppercase tracking-wider">
                        {asset.type}
                      </div>
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground data-value">{formatDate(asset.uploadedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes */}
        <TabsContent value="quotes" className="mt-4">
          <Card className="animate-in">
            <CardContent className="pt-5">
              <DataTable
                columns={quoteColumns}
                data={quotesQuery.data ?? []}
                keyExtractor={(r) => r.id}
                emptyMessage="No quotes received yet"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Samples */}
        <TabsContent value="samples" className="mt-4">
          <Card className="animate-in">
            <CardContent className="pt-5">
              <DataTable
                columns={sampleColumns}
                data={samplesQuery.data ?? []}
                keyExtractor={(r) => r.id}
                emptyMessage="No samples tracked yet"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
