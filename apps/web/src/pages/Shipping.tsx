import { useState } from 'react';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Ship,
  Tag,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_MODE } from '@/lib/mock-data';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ShippingStatus = 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';

type Courier = 'DHL' | 'FedEx' | 'UPS' | 'USPS' | 'Sea Freight';

interface Shipment {
  id: string;
  itemName: string;
  projectName: string;
  projectId: string;
  manufacturerName: string;
  courier: Courier;
  trackingNumber: string;
  status: ShippingStatus;
  shipDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const shippingStages: { key: ShippingStatus; label: string }[] = [
  { key: 'label_created', label: 'Label Created' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const statusConfig: Record<
  ShippingStatus,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline' }
> = {
  label_created: { label: 'Label Created', icon: Tag, variant: 'secondary' },
  picked_up: { label: 'Picked Up', icon: Package, variant: 'outline' },
  in_transit: { label: 'In Transit', icon: Truck, variant: 'default' },
  out_for_delivery: { label: 'Out for Delivery', icon: MapPin, variant: 'warning' },
  delivered: { label: 'Delivered', icon: CheckCircle2, variant: 'success' },
};

const courierStyle: Record<Courier, { bg: string; text: string; dot: string }> = {
  DHL: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  FedEx: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  UPS: { bg: 'bg-amber-900/5', text: 'text-amber-900', dot: 'bg-amber-800' },
  USPS: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Sea Freight': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
};

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const shipments: Shipment[] = [
  {
    id: 's1',
    itemName: 'Organic Cotton Swatches - Spring 2026',
    projectName: 'Spring 2026 Collection',
    projectId: 'proj-001',
    manufacturerName: 'Rajput Textiles',
    courier: 'DHL',
    trackingNumber: 'DHL-8847562910',
    status: 'delivered',
    shipDate: '2026-02-18',
    estimatedDelivery: '2026-02-25',
    actualDelivery: '2026-02-24',
  },
  {
    id: 's2',
    itemName: '14oz Raw Selvedge Sample',
    projectName: 'Heritage Denim Line',
    projectId: 'proj-002',
    manufacturerName: 'Kuroki Mills',
    courier: 'FedEx',
    trackingNumber: 'FEDEX-4423891057',
    status: 'in_transit',
    shipDate: '2026-03-10',
    estimatedDelivery: '2026-03-19',
  },
  {
    id: 's3',
    itemName: 'Leather Wallet Samples',
    projectName: 'Leather Accessories',
    projectId: 'proj-003',
    manufacturerName: 'Officina Pelletteria',
    courier: 'UPS',
    trackingNumber: 'UPS-7756120384',
    status: 'delivered',
    shipDate: '2026-02-28',
    estimatedDelivery: '2026-03-06',
    actualDelivery: '2026-03-05',
  },
  {
    id: 's4',
    itemName: 'Hoodie Colorway Samples',
    projectName: 'Streetwear Capsule',
    projectId: 'proj-004',
    manufacturerName: 'Guangzhou Garments Co.',
    courier: 'DHL',
    trackingNumber: 'DHL-9912034871',
    status: 'label_created',
    shipDate: '2026-03-16',
    estimatedDelivery: '2026-03-26',
  },
  {
    id: 's5',
    itemName: 'Cashmere Blend Fabric Cuts',
    projectName: 'Luxury Knitwear',
    projectId: 'proj-005',
    manufacturerName: 'Inner Mongolia Cashmere',
    courier: 'DHL',
    trackingNumber: 'DHL-5578920143',
    status: 'in_transit',
    shipDate: '2026-03-08',
    estimatedDelivery: '2026-03-20',
  },
  {
    id: 's6',
    itemName: 'Production Run: Leather Wallets (200 units)',
    projectName: 'Leather Accessories',
    projectId: 'proj-003',
    manufacturerName: 'Officina Pelletteria',
    courier: 'Sea Freight',
    trackingNumber: 'MAERSK-BL7820341',
    status: 'in_transit',
    shipDate: '2026-02-20',
    estimatedDelivery: '2026-04-05',
  },
  {
    id: 's7',
    itemName: 'Block Print Onesie Samples',
    projectName: 'Kidswear Capsule',
    projectId: 'proj-006',
    manufacturerName: 'Jaipur Hand Block Co.',
    courier: 'FedEx',
    trackingNumber: 'FEDEX-6609812345',
    status: 'picked_up',
    shipDate: '2026-03-14',
    estimatedDelivery: '2026-03-22',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function stageIndex(status: ShippingStatus) {
  return shippingStages.findIndex((s) => s.key === status);
}

/* ------------------------------------------------------------------ */
/*  Summary Cards                                                      */
/* ------------------------------------------------------------------ */

const summaryCards = [
  {
    title: 'In Transit',
    icon: Truck,
    color: 'text-blue-500 bg-blue-50',
    count: shipments.filter((s) => s.status === 'in_transit').length,
  },
  {
    title: 'Out for Delivery',
    icon: MapPin,
    color: 'text-amber-500 bg-amber-50',
    count: shipments.filter((s) => s.status === 'out_for_delivery').length,
  },
  {
    title: 'Delivered',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-50',
    count: shipments.filter((s) => s.status === 'delivered').length,
  },
  {
    title: 'Total Shipments',
    icon: Package,
    color: 'text-indigo-500 bg-indigo-50',
    count: shipments.length,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Shipping() {
  const [tab, setTab] = useState('all');

  const filtered =
    tab === 'all'
      ? shipments
      : shipments.filter((s) => s.status === tab);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Shipping</h1>
          {DEMO_MODE && <Badge variant="outline" className="text-[11px]">Demo</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track shipments across all projects — samples, production runs, and materials.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="animate-in">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-semibold tracking-tight mt-1">{card.count}</p>
                  </div>
                  <div className={cn('flex items-center justify-center h-9 w-9 rounded-xl', card.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="label_created">Label Created</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <Card className="animate-in">
              <CardContent className="flex flex-col items-center py-10 text-muted-foreground">
                <Package className="h-10 w-10 mb-3 text-muted-foreground/40" />
                <p className="text-sm">No shipments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((shipment) => (
                <ShipmentCard key={shipment.id} shipment={shipment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shipment Card                                                      */
/* ------------------------------------------------------------------ */

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const config = statusConfig[shipment.status];
  const StatusIcon = config.icon;
  const courier = courierStyle[shipment.courier];
  const currentIdx = stageIndex(shipment.status);

  return (
    <Card className="animate-in hover:border-primary/20 transition-colors">
      <CardHeader className="pb-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-snug">{shipment.itemName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{shipment.projectName}</p>
          </div>
          <Badge variant={config.variant} className="shrink-0">
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Manufacturer + Courier */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{shipment.manufacturerName}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium',
              courier.bg,
              courier.text
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', courier.dot)} />
            {shipment.courier}
          </span>
        </div>

        {/* Tracking number */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Tracking</span>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-foreground/80 bg-black/[0.03] rounded px-1.5 py-0.5 select-all cursor-pointer hover:bg-black/[0.06] transition-colors">
            {shipment.trackingNumber}
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/60" />
          </span>
        </div>

        {/* Dates */}
        <div className="text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">Shipped</span>
            <span className="data-value">{formatDate(shipment.shipDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">
              {shipment.actualDelivery ? 'Delivered' : 'Est. Delivery'}
            </span>
            <span className="data-value">
              {formatDate(shipment.actualDelivery ?? shipment.estimatedDelivery)}
            </span>
          </div>
        </div>

        {/* Status timeline */}
        <div className="pt-1">
          <div className="flex items-center gap-0">
            {shippingStages.map((stage, idx) => {
              const completed = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={stage.key} className="flex items-center flex-1 last:flex-none">
                  {/* Dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full shrink-0 transition-all duration-300',
                        completed
                          ? isCurrent
                            ? 'bg-primary ring-2 ring-primary/20'
                            : 'bg-primary'
                          : 'bg-muted-foreground/15'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[9px] mt-1 whitespace-nowrap leading-none',
                        completed ? 'text-foreground/70 font-medium' : 'text-muted-foreground/50'
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                  {/* Connector */}
                  {idx < shippingStages.length - 1 && (
                    <div
                      className={cn(
                        'h-[1.5px] flex-1 mx-1 rounded-full transition-colors duration-300',
                        idx < currentIdx ? 'bg-primary' : 'bg-muted-foreground/15'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
