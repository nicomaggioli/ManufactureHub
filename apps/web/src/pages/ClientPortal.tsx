import { useState } from 'react';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Palette,
  Package,
  Truck,
  ExternalLink,
  Activity,
  Eye,
  Scissors,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate, cn } from '@/lib/utils';
import { DEMO_MODE } from '@/lib/mock-data';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CLIENT_NAME = 'Sarah Chen';

const pipelineStages = [
  { key: 'ideation', label: 'Ideation' },
  { key: 'sourcing', label: 'Sourcing' },
  { key: 'sampling', label: 'Sampling' },
  { key: 'production', label: 'Production' },
  { key: 'shipped', label: 'Shipped' },
] as const;

type PipelineStage = (typeof pipelineStages)[number]['key'];

interface ClientProject {
  id: string;
  name: string;
  description: string;
  stage: PipelineStage;
  updatedAt: string;
  unitCount: number;
}

const projects: ClientProject[] = [
  {
    id: 'proj-1',
    name: 'Spring/Summer 2026 Capsule',
    description: '12-piece womenswear capsule collection. Linen and organic cotton blend.',
    stage: 'sampling',
    updatedAt: '2026-03-15T14:30:00Z',
    unitCount: 1200,
  },
  {
    id: 'proj-2',
    name: 'Resort Swimwear Line',
    description: '6 swim styles with matching cover-ups. Recycled nylon.',
    stage: 'production',
    updatedAt: '2026-03-12T09:15:00Z',
    unitCount: 3000,
  },
  {
    id: 'proj-3',
    name: 'Fall Outerwear Prototypes',
    description: 'Wool-blend overcoats and puffer jackets. 4 colorways.',
    stage: 'ideation',
    updatedAt: '2026-03-16T11:00:00Z',
    unitCount: 0,
  },
];

type ApprovalStatus = 'pending' | 'approved' | 'changes_requested';

interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  projectName: string;
  type: 'tech_pack' | 'mockup' | 'sample' | 'fabric_swatch';
  submittedAt: string;
  status: ApprovalStatus;
}

const approvals: ApprovalItem[] = [
  {
    id: 'appr-1',
    title: 'Spring Capsule Tech Pack v2',
    description: 'Updated tech pack with revised measurements and construction notes for the linen trouser and blouse set.',
    projectName: 'Spring/Summer 2026 Capsule',
    type: 'tech_pack',
    submittedAt: '2026-03-14T10:00:00Z',
    status: 'pending',
  },
  {
    id: 'appr-2',
    title: 'Bikini Top Mockup - Colorway B',
    description: 'Digital mockup for the triangle bikini in coral sunset colorway. Please review color accuracy and strap placement.',
    projectName: 'Resort Swimwear Line',
    type: 'mockup',
    submittedAt: '2026-03-13T16:45:00Z',
    status: 'pending',
  },
  {
    id: 'appr-3',
    title: 'Organic Cotton Swatch - Natural Oat',
    description: 'Physical fabric swatch shipped to your address. Please confirm hand-feel, drape, and color match expectations.',
    projectName: 'Spring/Summer 2026 Capsule',
    type: 'fabric_swatch',
    submittedAt: '2026-03-10T08:30:00Z',
    status: 'pending',
  },
  {
    id: 'appr-4',
    title: 'Swim Trunk Sample - Size M',
    description: 'First sample of the men\'s swim trunk in recycled nylon. Check fit, stitching quality, and elastic waistband.',
    projectName: 'Resort Swimwear Line',
    type: 'sample',
    submittedAt: '2026-03-11T13:00:00Z',
    status: 'approved',
  },
  {
    id: 'appr-5',
    title: 'Overcoat Silhouette Mockup',
    description: 'Initial silhouette exploration for the oversized wool-blend overcoat. Two collar variations included.',
    projectName: 'Fall Outerwear Prototypes',
    type: 'mockup',
    submittedAt: '2026-03-16T09:00:00Z',
    status: 'pending',
  },
];

type ShippingStatus = 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';

interface ShipmentEntry {
  id: string;
  itemName: string;
  projectName: string;
  courier: string;
  trackingNumber: string;
  status: ShippingStatus;
  estimatedDelivery: string;
  shippedAt: string;
}

const shipments: ShipmentEntry[] = [
  {
    id: 'ship-1',
    itemName: 'Organic Cotton Swatch Pack',
    projectName: 'Spring/Summer 2026 Capsule',
    courier: 'DHL Express',
    trackingNumber: 'DHL-8294751036',
    status: 'out_for_delivery',
    estimatedDelivery: '2026-03-17T18:00:00Z',
    shippedAt: '2026-03-14T06:00:00Z',
  },
  {
    id: 'ship-2',
    itemName: 'Swim Trunk Sample (Size M)',
    projectName: 'Resort Swimwear Line',
    courier: 'FedEx',
    trackingNumber: 'FX-449827163502',
    status: 'delivered',
    estimatedDelivery: '2026-03-11T17:00:00Z',
    shippedAt: '2026-03-08T10:30:00Z',
  },
  {
    id: 'ship-3',
    itemName: 'Linen Trouser Pre-production Sample',
    projectName: 'Spring/Summer 2026 Capsule',
    courier: 'UPS',
    trackingNumber: '1Z-999AA10123456784',
    status: 'in_transit',
    estimatedDelivery: '2026-03-20T17:00:00Z',
    shippedAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'ship-4',
    itemName: 'Puffer Jacket Fabric Swatches',
    projectName: 'Fall Outerwear Prototypes',
    courier: 'DHL Express',
    trackingNumber: 'DHL-5501827394',
    status: 'label_created',
    estimatedDelivery: '2026-03-24T17:00:00Z',
    shippedAt: '2026-03-17T08:00:00Z',
  },
];

interface ActivityEntry {
  id: string;
  message: string;
  projectName: string;
  timestamp: string;
}

const recentActivity: ActivityEntry[] = [
  { id: 'act-1', message: 'Tech pack v2 uploaded for your review', projectName: 'Spring/Summer 2026 Capsule', timestamp: '2026-03-14T10:00:00Z' },
  { id: 'act-2', message: 'Sample approved and production order confirmed', projectName: 'Resort Swimwear Line', timestamp: '2026-03-13T17:00:00Z' },
  { id: 'act-3', message: 'Fabric swatch shipped via DHL Express', projectName: 'Spring/Summer 2026 Capsule', timestamp: '2026-03-12T09:30:00Z' },
  { id: 'act-4', message: 'Initial mood board and silhouette concepts added', projectName: 'Fall Outerwear Prototypes', timestamp: '2026-03-11T14:20:00Z' },
  { id: 'act-5', message: 'Manufacturer confirmed production timeline: 6 weeks', projectName: 'Resort Swimwear Line', timestamp: '2026-03-10T11:00:00Z' },
  { id: 'act-6', message: 'New colorway mockup added for bikini top', projectName: 'Resort Swimwear Line', timestamp: '2026-03-09T16:45:00Z' },
  { id: 'act-7', message: 'Linen supplier sourced - pricing confirmed at $8.50/yd', projectName: 'Spring/Summer 2026 Capsule', timestamp: '2026-03-08T10:15:00Z' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stageBadgeVariant: Record<PipelineStage, 'secondary' | 'default' | 'warning' | 'outline' | 'success'> = {
  ideation: 'secondary',
  sourcing: 'default',
  sampling: 'warning',
  production: 'outline',
  shipped: 'success',
};

const approvalTypeIcon: Record<string, React.ElementType> = {
  tech_pack: FileText,
  mockup: Palette,
  sample: Scissors,
  fabric_swatch: Eye,
};

const approvalTypeLabel: Record<string, string> = {
  tech_pack: 'Tech Pack',
  mockup: 'Mockup',
  sample: 'Sample',
  fabric_swatch: 'Fabric Swatch',
};

const approvalStatusConfig: Record<ApprovalStatus, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  pending: { label: 'Pending Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  changes_requested: { label: 'Changes Requested', variant: 'destructive' },
};

const shippingStatusConfig: Record<ShippingStatus, { label: string; color: string }> = {
  label_created: { label: 'Label Created', color: 'text-gray-500 bg-gray-50' },
  picked_up: { label: 'Picked Up', color: 'text-blue-600 bg-blue-50' },
  in_transit: { label: 'In Transit', color: 'text-indigo-600 bg-indigo-50' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-amber-600 bg-amber-50' },
  delivered: { label: 'Delivered', color: 'text-emerald-600 bg-emerald-50' },
};

const shippingStatusOrder: ShippingStatus[] = ['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];

function relativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClientPortal() {
  const [approvalState, setApprovalState] = useState<Record<string, ApprovalStatus>>(
    () => Object.fromEntries(approvals.map((a) => [a.id, a.status]))
  );

  const pendingCount = Object.values(approvalState).filter((s) => s === 'pending').length;

  function handleApprove(id: string) {
    setApprovalState((prev) => ({ ...prev, [id]: 'approved' }));
  }

  function handleRequestChanges(id: string) {
    setApprovalState((prev) => ({ ...prev, [id]: 'changes_requested' }));
  }

  return (
    <div className="space-y-8">
      {/* Branded header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Scissors className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Garment Architect</p>
            <p className="text-[11px] text-muted-foreground/60">Client Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {CLIENT_NAME}</h1>
          {DEMO_MODE && <Badge variant="outline" className="text-[11px]">Demo</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Here is the latest on your projects. Review pending items, track shipments, and stay up to date.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Active Projects', value: projects.length, icon: FolderKanban, color: 'text-indigo-500 bg-indigo-50' },
          { title: 'Pending Approvals', value: pendingCount, icon: AlertCircle, color: 'text-amber-500 bg-amber-50' },
          { title: 'Shipments In Transit', value: shipments.filter((s) => s.status !== 'delivered' && s.status !== 'label_created').length, icon: Truck, color: 'text-blue-500 bg-blue-50' },
          { title: 'Recent Updates', value: recentActivity.length, icon: Activity, color: 'text-emerald-500 bg-emerald-50' },
        ].map((stat, idx) => (
          <Card key={stat.title} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-semibold tracking-tight mt-2">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main tabbed content */}
      <Tabs defaultValue="projects" className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* ---- Projects Tab ---- */}
        <TabsContent value="projects" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, idx) => {
              const currentIdx = pipelineStages.findIndex((s) => s.key === project.stage);
              return (
                <Card
                  key={project.id}
                  className="animate-in transition-all hover:shadow-md hover:border-border/80"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight">{project.name}</CardTitle>
                      <Badge variant={stageBadgeVariant[project.stage]} className="shrink-0 text-[11px] uppercase tracking-wider">
                        {project.stage}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Pipeline progress */}
                    <div className="flex items-center gap-0.5">
                      {pipelineStages.map((stage, sIdx) => (
                        <div key={stage.key} className="flex items-center">
                          <div
                            className={cn(
                              'h-2.5 w-2.5 rounded-full shrink-0 transition-colors',
                              sIdx <= currentIdx ? 'bg-primary' : 'bg-muted-foreground/15'
                            )}
                          />
                          {sIdx < pipelineStages.length - 1 && (
                            <div
                              className={cn(
                                'h-[1.5px] w-5 rounded-full',
                                sIdx < currentIdx ? 'bg-primary' : 'bg-muted-foreground/15'
                              )}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated {relativeTime(project.updatedAt)}
                      </span>
                      {project.unitCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {project.unitCount.toLocaleString()} units
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ---- Approvals Tab ---- */}
        <TabsContent value="approvals" className="mt-6">
          <div className="space-y-4">
            {approvals.map((item, idx) => {
              const status = approvalState[item.id];
              const statusCfg = approvalStatusConfig[status];
              const TypeIcon = approvalTypeIcon[item.type] ?? FileText;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'animate-in transition-all',
                    status === 'pending' && 'border-amber-200/60'
                  )}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <TypeIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold leading-tight">{item.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[11px]">
                                {approvalTypeLabel[item.type]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{item.projectName}</span>
                            </div>
                          </div>
                          <Badge variant={statusCfg.variant} className="shrink-0 text-[11px]">
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between mt-3.5">
                          <span className="text-xs text-muted-foreground">
                            Submitted {formatDate(item.submittedAt)}
                          </span>
                          {status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                onClick={() => handleRequestChanges(item.id)}
                              >
                                Request Changes
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleApprove(item.id)}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ---- Shipping Tab ---- */}
        <TabsContent value="shipping" className="mt-6">
          <div className="space-y-4">
            {shipments.map((shipment, idx) => {
              const statusCfg = shippingStatusConfig[shipment.status];
              const currentStepIdx = shippingStatusOrder.indexOf(shipment.status);

              return (
                <Card
                  key={shipment.id}
                  className="animate-in"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold">{shipment.itemName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{shipment.projectName}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', statusCfg.color)}>
                        {shipment.status === 'delivered' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Truck className="h-3 w-3" />
                        )}
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Tracking progress bar */}
                    <div className="flex items-center gap-0.5 mb-3">
                      {shippingStatusOrder.map((step, sIdx) => (
                        <div key={step} className="flex items-center">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0',
                              sIdx <= currentStepIdx ? 'bg-primary' : 'bg-muted-foreground/15'
                            )}
                          />
                          {sIdx < shippingStatusOrder.length - 1 && (
                            <div
                              className={cn(
                                'h-[1.5px] flex-1 min-w-6 rounded-full',
                                sIdx < currentStepIdx ? 'bg-primary' : 'bg-muted-foreground/15'
                              )}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">Courier</p>
                        <p>{shipment.courier}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">Tracking Number</p>
                        <p className="flex items-center gap-1">
                          <span className="font-mono text-[11px]">{shipment.trackingNumber}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">Shipped</p>
                        <p>{formatDate(shipment.shippedAt)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">Est. Delivery</p>
                        <p className={cn(shipment.status !== 'delivered' && 'font-medium')}>
                          {formatDate(shipment.estimatedDelivery)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ---- Activity Tab ---- */}
        <TabsContent value="activity" className="mt-6">
          <Card className="animate-in">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Recent Updates</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{item.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {relativeTime(item.timestamp)}
                        </span>
                        <Badge variant="outline" className="text-[11px]">
                          {item.projectName}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
