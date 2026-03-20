import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Package,
  Truck,
  ClipboardCheck,
  Send,
  Clock,
  MapPin,
  Palette,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { projectsApi, communicationsApi, quotesApi, samplesApi, designAssetsApi } from '@/lib/api';
import type { Project, Communication, Quote, Sample, DesignAsset, Milestone } from '@/lib/api';
import { TechPack } from '@/components/design/TechPack';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

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

  const project = projectQuery.data as Project | undefined;

  // Derive manufacturers from project data
  const projectManufacturers = useMemo(() => {
    const mfrMap = new Map<string, { id: string; name: string; hasComms: boolean; hasQuotes: boolean; hasSamples: boolean }>();

    for (const c of (commsQuery.data ?? [])) {
      const existing = mfrMap.get(c.manufacturerId) ?? { id: c.manufacturerId, name: c.manufacturer?.name ?? 'Unknown', hasComms: false, hasQuotes: false, hasSamples: false };
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

  const commColumns: ColumnDef<Communication>[] = [
    { key: 'manufacturerId', header: 'Manufacturer', sortable: true, render: (row) => <span>{row.manufacturer?.name ?? 'Unknown'}</span> },
    { key: 'subject', header: 'Subject' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'delivered' ? 'success' : row.status === 'failed' ? 'destructive' : 'secondary'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { key: 'sentAt', header: 'Sent At', sortable: true, render: (row) => <span className="data-value">{formatDate(row.sentAt ?? row.createdAt)}</span> },
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

  // Mock shipping data for this project
  const projectShipments = useMemo(() => {
    const allShipments = [
      { id: 'sh1', projectId: 'p1', item: 'Organic Cotton Swatches', courier: 'DHL', trackingNumber: 'DHL-8847562910', status: 'delivered', shipDate: '2026-03-03', estimatedDelivery: '2026-03-08', actualDelivery: '2026-03-08', manufacturer: 'Jiangyin Longma Textile' },
      { id: 'sh2', projectId: 'p2', item: '14oz Raw Selvedge Sample', courier: 'FedEx', trackingNumber: 'FEDEX-4423891057', status: 'in_transit', shipDate: '2026-03-10', estimatedDelivery: '2026-03-18', manufacturer: 'Nisha Texport Pvt. Ltd.' },
      { id: 'sh3', projectId: 'p6', item: 'Leather Wallet Samples', courier: 'UPS', trackingNumber: 'UPS-7756120384', status: 'delivered', shipDate: '2026-02-22', estimatedDelivery: '2026-02-28', actualDelivery: '2026-02-28', manufacturer: 'Guangzhou Boton Leather' },
      { id: 'sh4', projectId: 'p3', item: 'Hoodie Colorway Samples', courier: 'DHL', trackingNumber: 'DHL-9912340056', status: 'label_created', shipDate: '2026-03-15', estimatedDelivery: '2026-03-22', manufacturer: 'Guangzhou Shang Ding' },
      { id: 'sh5', projectId: 'p1', item: 'Cashmere Blend Fabric Cuts', courier: 'DHL', trackingNumber: 'DHL-5567891234', status: 'in_transit', shipDate: '2026-03-11', estimatedDelivery: '2026-03-17', manufacturer: 'Lanificio Fratelli Cerruti' },
      { id: 'sh6', projectId: 'p6', item: 'Production Run: Wallets (200 units)', courier: 'Sea Freight', trackingNumber: 'COSCO-BL884712', status: 'in_transit', shipDate: '2026-03-01', estimatedDelivery: '2026-04-05', manufacturer: 'Guangzhou Boton Leather' },
    ];
    return allShipments.filter(s => s.projectId === id);
  }, [id]);

  // Mock approval data for this project
  const projectApprovals = useMemo(() => {
    const allApprovals = [
      { id: 'ap1', projectId: 'p1', deliverable: 'Heritage Wool Overcoat Tech Pack', type: 'Tech Pack', clientName: 'Marcus Chen', sentDate: '2026-03-12', status: 'pending', description: 'Complete tech pack with materials, measurements, and construction specs for the FW26 overcoat.' },
      { id: 'ap2', projectId: 'p1', deliverable: 'Spring Linen Blazer Mockup', type: 'Mockup', clientName: 'Marcus Chen', sentDate: '2026-03-08', status: 'approved', description: 'Color mockup of the structured linen blazer in Sand and Dusty Blue colorways.' },
      { id: 'ap3', projectId: 'p1', deliverable: 'Organic Cotton Swatch Selection', type: 'Fabric Swatch', clientName: 'Marcus Chen', sentDate: '2026-03-10', status: 'changes_requested', description: 'Pastel colorway swatches for spring collection.', feedback: 'Prefer a warmer tone on the pastel rose. Can we get something closer to blush?' },
      { id: 'ap4', projectId: 'p2', deliverable: 'Denim Wash Specification', type: 'Tech Pack', clientName: 'Sarah Kim', sentDate: '2026-03-13', status: 'pending', description: 'Raw selvedge denim wash and distressing specifications.' },
      { id: 'ap5', projectId: 'p3', deliverable: 'Athleisure Hoodie Color Mockup', type: 'Mockup', clientName: 'Jake Torres', sentDate: '2026-03-14', status: 'changes_requested', description: 'Hoodie mockup in 3 Pantone-matched colorways.', feedback: 'Navy is too dark — try a lighter shade. Other colors look great.' },
      { id: 'ap6', projectId: 'p6', deliverable: 'Leather Wallet Production Sample', type: 'Sample', clientName: 'Marcus Chen', sentDate: '2026-02-25', status: 'approved', description: 'Full-grain leather bifold wallet with custom debossed logo.' },
      { id: 'ap7', projectId: 'p7', deliverable: 'Block Print Pattern Selection', type: 'Fabric Swatch', clientName: 'Emily Park', sentDate: '2026-03-11', status: 'pending', description: 'Natural indigo and turmeric dye block print patterns for kids line.' },
    ];
    return allApprovals.filter(a => a.projectId === id);
  }, [id]);

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

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Projects
          </Link>
        </Button>
      </div>

      {/* Title + status + timeline */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{project.description ?? ''}</p>
          </div>
          <Badge variant="outline" className="w-fit px-3 py-1">
            {project.status}
          </Badge>
        </div>
        <div className="flex justify-center py-5 mt-4 overflow-x-auto">
          <StatusTimeline currentStatus={project.status} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="communications">Messages</TabsTrigger>
          <TabsTrigger value="assets">Design</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="samples">Samples</TabsTrigger>
          <TabsTrigger value="techpacks">Tech Packs</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-in">
              <CardContent className="p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Manufacturers</span>
                  <span className="data-value">{projectManufacturers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Created</span>
                  <span className="data-value">{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="data-value">{formatDate(project.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="animate-in">
              <CardContent className="p-5">
                {((project as any).milestones as Milestone[] | undefined)?.length ? (
                  <div className="space-y-3">
                    {((project as any).milestones as Milestone[]).map((m: Milestone) => (
                      <div key={m.id} className="flex items-center gap-3">
                        {m.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
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

          {/* Manufacturers inline */}
          {projectManufacturers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Manufacturers</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projectManufacturers.map((mfr) => (
                  <Link key={mfr.id} to={`/manufacturers/${mfr.id}`}>
                    <Card className="h-full hover:shadow-card-hover transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <p className="font-medium text-sm">{mfr.name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="mt-6">
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
        <TabsContent value="assets" className="mt-6">
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
                  {(assetsQuery.data ?? []).map((asset: DesignAsset) => (
                    <div key={asset.id} className="rounded-lg border p-3 hover:border-primary/30 transition-colors">
                      <div className="h-28 bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground text-xs uppercase tracking-wider">
                        {asset.type}
                      </div>
                      <p className="text-sm font-medium truncate">{asset.fileName ?? 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground data-value">{formatDate(asset.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes */}
        <TabsContent value="quotes" className="mt-6">
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
        <TabsContent value="samples" className="mt-6">
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

        {/* Tech Packs */}
        <TabsContent value="techpacks" className="mt-6">
          <TechPack />
        </TabsContent>

        {/* Shipping */}
        <TabsContent value="shipping" className="mt-6">
          <ShippingTab projectId={id} />
        </TabsContent>

        {/* Approvals */}
        <TabsContent value="approvals" className="mt-6">
          <ApprovalsTab projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Shipping Tab ─────────────────────────────────────────────────────────

const shippingSteps = ['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'] as const;
const shippingStepLabels: Record<string, string> = {
  label_created: 'Label Created',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

const courierColors: Record<string, string> = {
  DHL: 'bg-amber-100 text-amber-700',
  FedEx: 'bg-purple-100 text-purple-700',
  UPS: 'bg-amber-900/10 text-amber-900',
  USPS: 'bg-blue-100 text-blue-700',
  'Sea Freight': 'bg-teal-100 text-teal-700',
};

function ShippingTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = shippingSteps.indexOf(currentStatus as any);
  return (
    <div className="flex items-center gap-0.5 mt-3">
      {shippingSteps.map((step, idx) => {
        const completed = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                completed ? 'border-primary bg-primary text-primary-foreground' : active ? 'border-primary bg-primary/10 text-primary' : 'border-muted-foreground/20 text-muted-foreground/30'
              }`}>
                {completed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${active ? 'text-primary' : completed ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {shippingStepLabels[step]}
              </span>
            </div>
            {idx < shippingSteps.length - 1 && (
              <div className={`mx-0.5 h-[1.5px] w-4 sm:w-6 rounded-full ${idx < currentIdx ? 'bg-primary' : 'bg-muted-foreground/15'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShippingTab({ projectId }: { projectId: string }) {
  // Use the parent's projectShipments - for now inline mock
  const shipments = [
    { id: 'sh1', projectId: 'p1', item: 'Organic Cotton Swatches', courier: 'DHL', trackingNumber: 'DHL-8847562910', status: 'delivered', shipDate: '2026-03-03', estimatedDelivery: '2026-03-08', actualDelivery: '2026-03-08', manufacturer: 'Jiangyin Longma Textile' },
    { id: 'sh2', projectId: 'p2', item: '14oz Raw Selvedge Sample', courier: 'FedEx', trackingNumber: 'FEDEX-4423891057', status: 'in_transit', shipDate: '2026-03-10', estimatedDelivery: '2026-03-18', manufacturer: 'Nisha Texport Pvt. Ltd.' },
    { id: 'sh3', projectId: 'p6', item: 'Leather Wallet Samples', courier: 'UPS', trackingNumber: 'UPS-7756120384', status: 'delivered', shipDate: '2026-02-22', estimatedDelivery: '2026-02-28', actualDelivery: '2026-02-28', manufacturer: 'Guangzhou Boton Leather' },
    { id: 'sh4', projectId: 'p3', item: 'Hoodie Colorway Samples', courier: 'DHL', trackingNumber: 'DHL-9912340056', status: 'label_created', shipDate: '2026-03-15', estimatedDelivery: '2026-03-22', manufacturer: 'Guangzhou Shang Ding' },
    { id: 'sh5', projectId: 'p1', item: 'Cashmere Blend Fabric Cuts', courier: 'DHL', trackingNumber: 'DHL-5567891234', status: 'in_transit', shipDate: '2026-03-11', estimatedDelivery: '2026-03-17', manufacturer: 'Lanificio Fratelli Cerruti' },
    { id: 'sh6', projectId: 'p6', item: 'Production Run: Wallets (200 units)', courier: 'Sea Freight', trackingNumber: 'COSCO-BL884712', status: 'in_transit', shipDate: '2026-03-01', estimatedDelivery: '2026-04-05', manufacturer: 'Guangzhou Boton Leather' },
  ].filter(s => s.projectId === projectId);

  if (shipments.length === 0) {
    return (
      <Card className="animate-in">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Truck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm">No shipments tracked for this project yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {shipments.map((shipment) => (
        <Card key={shipment.id} className="animate-in">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{shipment.item}</h3>
                  <Badge className={cn('text-[11px]', courierColors[shipment.courier] ?? 'bg-gray-100 text-gray-700')}>
                    {shipment.courier}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{shipment.manufacturer}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span className="font-mono text-foreground">{shipment.trackingNumber}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Shipped {formatDate(shipment.shipDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {shipment.status === 'delivered'
                      ? `Delivered ${formatDate(shipment.actualDelivery!)}`
                      : `Est. ${formatDate(shipment.estimatedDelivery)}`}
                  </span>
                </div>
              </div>
              <Badge variant={shipment.status === 'delivered' ? 'success' : shipment.status === 'in_transit' ? 'secondary' : 'outline'}>
                {shippingStepLabels[shipment.status] ?? shipment.status}
              </Badge>
            </div>
            <ShippingTimeline currentStatus={shipment.status} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Approvals Tab ────────────────────────────────────────────────────────

const approvalTypeColors: Record<string, string> = {
  'Tech Pack': 'bg-indigo-100 text-indigo-700',
  'Mockup': 'bg-violet-100 text-violet-700',
  'Sample': 'bg-emerald-100 text-emerald-700',
  'Fabric Swatch': 'bg-amber-100 text-amber-700',
  'Production Proof': 'bg-rose-100 text-rose-700',
};

function ApprovalsTab({ projectId }: { projectId: string }) {
  const [localApprovals, setLocalApprovals] = useState(() => {
    const allApprovals = [
      { id: 'ap1', projectId: 'p1', deliverable: 'Heritage Wool Overcoat Tech Pack', type: 'Tech Pack', clientName: 'Marcus Chen', sentDate: '2026-03-12', status: 'pending', description: 'Complete tech pack with materials, measurements, and construction specs for the FW26 overcoat.', feedback: '' },
      { id: 'ap2', projectId: 'p1', deliverable: 'Spring Linen Blazer Mockup', type: 'Mockup', clientName: 'Marcus Chen', sentDate: '2026-03-08', status: 'approved', description: 'Color mockup of the structured linen blazer in Sand and Dusty Blue colorways.', feedback: '' },
      { id: 'ap3', projectId: 'p1', deliverable: 'Organic Cotton Swatch Selection', type: 'Fabric Swatch', clientName: 'Marcus Chen', sentDate: '2026-03-10', status: 'changes_requested', description: 'Pastel colorway swatches for spring collection.', feedback: 'Prefer a warmer tone on the pastel rose. Can we get something closer to blush?' },
      { id: 'ap4', projectId: 'p2', deliverable: 'Denim Wash Specification', type: 'Tech Pack', clientName: 'Sarah Kim', sentDate: '2026-03-13', status: 'pending', description: 'Raw selvedge denim wash and distressing specifications.', feedback: '' },
      { id: 'ap5', projectId: 'p3', deliverable: 'Athleisure Hoodie Color Mockup', type: 'Mockup', clientName: 'Jake Torres', sentDate: '2026-03-14', status: 'changes_requested', description: 'Hoodie mockup in 3 Pantone-matched colorways.', feedback: 'Navy is too dark — try a lighter shade. Other colors look great.' },
      { id: 'ap6', projectId: 'p6', deliverable: 'Leather Wallet Production Sample', type: 'Sample', clientName: 'Marcus Chen', sentDate: '2026-02-25', status: 'approved', description: 'Full-grain leather bifold wallet with custom debossed logo.', feedback: '' },
      { id: 'ap7', projectId: 'p7', deliverable: 'Block Print Pattern Selection', type: 'Fabric Swatch', clientName: 'Emily Park', sentDate: '2026-03-11', status: 'pending', description: 'Natural indigo and turmeric dye block print patterns for kids line.', feedback: '' },
    ];
    return allApprovals.filter(a => a.projectId === projectId);
  });

  const handleStatusChange = useCallback((approvalId: string, newStatus: string) => {
    setLocalApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: newStatus } : a));
  }, []);

  if (localApprovals.length === 0) {
    return (
      <Card className="animate-in">
        <CardContent className="py-8 text-center text-muted-foreground">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm">No approval requests for this project yet.</p>
          <Button variant="outline" className="mt-4">
            <Send className="mr-2 h-4 w-4" /> Send for Approval
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = localApprovals.filter(a => a.status === 'pending').length;
  const approvedCount = localApprovals.filter(a => a.status === 'approved').length;
  const changesCount = localApprovals.filter(a => a.status === 'changes_requested').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-amber-50/50 border-amber-200/50 p-3 text-center">
          <p className="text-xl font-semibold text-amber-700 data-value">{pendingCount}</p>
          <p className="text-xs text-amber-600">Pending</p>
        </div>
        <div className="rounded-lg border bg-emerald-50/50 border-emerald-200/50 p-3 text-center">
          <p className="text-xl font-semibold text-emerald-700 data-value">{approvedCount}</p>
          <p className="text-xs text-emerald-600">Approved</p>
        </div>
        <div className="rounded-lg border bg-rose-50/50 border-rose-200/50 p-3 text-center">
          <p className="text-xl font-semibold text-rose-700 data-value">{changesCount}</p>
          <p className="text-xs text-rose-600">Changes Requested</p>
        </div>
      </div>

      {/* Approval cards */}
      {localApprovals.map((approval) => (
        <Card key={approval.id} className="animate-in">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{approval.deliverable}</h3>
                  <Badge className={cn('text-[11px]', approvalTypeColors[approval.type] ?? 'bg-gray-100 text-gray-700')}>
                    {approval.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{approval.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Client: <span className="text-foreground font-medium">{approval.clientName}</span></span>
                  <span>Sent {formatDate(approval.sentDate)}</span>
                  {approval.status === 'pending' && (
                    <span className="text-amber-600 font-medium">
                      {Math.ceil((Date.now() - new Date(approval.sentDate).getTime()) / (1000 * 60 * 60 * 24))}d waiting
                    </span>
                  )}
                </div>
                {approval.feedback && (
                  <div className="mt-3 p-2.5 rounded-md bg-rose-50 border border-rose-200/50">
                    <p className="text-xs font-medium text-rose-700 mb-0.5">Client Feedback:</p>
                    <p className="text-xs text-rose-600">{approval.feedback}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={
                  approval.status === 'approved' ? 'success'
                  : approval.status === 'changes_requested' ? 'destructive'
                  : 'secondary'
                }>
                  {approval.status === 'changes_requested' ? 'Changes Requested' : approval.status}
                </Badge>
                {approval.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(approval.id, 'changes_requested')}>
                      Request Changes
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange(approval.id, 'approved')}>
                      Approve
                    </Button>
                  </div>
                )}
                {approval.status === 'changes_requested' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <Send className="mr-1 h-3 w-3" /> Resend
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
