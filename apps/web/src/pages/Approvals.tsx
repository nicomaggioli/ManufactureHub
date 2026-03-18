import { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Paintbrush,
  Package,
  Scissors,
  Printer,
  Send,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApprovalStatus = 'pending' | 'approved' | 'changes_requested';

type DeliverableType =
  | 'tech_pack'
  | 'mockup'
  | 'sample'
  | 'fabric_swatch'
  | 'production_proof';

interface ApprovalItem {
  id: string;
  projectName: string;
  deliverableName: string;
  type: DeliverableType;
  clientName: string;
  sentAt: string;
  status: ApprovalStatus;
  respondedAt?: string;
  feedback?: string;
}

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const statusConfig: Record<
  ApprovalStatus,
  {
    label: string;
    icon: React.ElementType;
    variant: 'warning' | 'success' | 'destructive';
    dotColor: string;
  }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'warning',
    dotColor: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    variant: 'success',
    dotColor: 'bg-emerald-500',
  },
  changes_requested: {
    label: 'Changes Requested',
    icon: AlertTriangle,
    variant: 'destructive',
    dotColor: 'bg-red-500',
  },
};

const typeConfig: Record<
  DeliverableType,
  { label: string; icon: React.ElementType; color: string }
> = {
  tech_pack: {
    label: 'Tech Pack',
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50',
  },
  mockup: {
    label: 'Mockup',
    icon: Paintbrush,
    color: 'text-violet-600 bg-violet-50',
  },
  sample: {
    label: 'Sample',
    icon: Package,
    color: 'text-emerald-600 bg-emerald-50',
  },
  fabric_swatch: {
    label: 'Fabric Swatch',
    icon: Scissors,
    color: 'text-rose-600 bg-rose-50',
  },
  production_proof: {
    label: 'Production Proof',
    icon: Printer,
    color: 'text-amber-600 bg-amber-50',
  },
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const approvals: ApprovalItem[] = [
  {
    id: '1',
    projectName: 'Heritage Wool Overcoat',
    deliverableName: 'Tech Pack v2',
    type: 'tech_pack',
    clientName: 'Margaux Studio',
    sentAt: '2026-03-14',
    status: 'pending',
  },
  {
    id: '2',
    projectName: 'Spring Linen Blazer',
    deliverableName: 'Front & Back Mockup',
    type: 'mockup',
    clientName: 'Haus Collective',
    sentAt: '2026-03-10',
    status: 'approved',
    respondedAt: '2026-03-12',
  },
  {
    id: '3',
    projectName: 'Organic Cotton Collection',
    deliverableName: 'Swatch Selection',
    type: 'fabric_swatch',
    clientName: 'Noma Apparel',
    sentAt: '2026-03-11',
    status: 'changes_requested',
    respondedAt: '2026-03-13',
    feedback: 'Prefer a warmer tone on the pastel rose. The current shade reads too cool against the linen base.',
  },
  {
    id: '4',
    projectName: 'Denim Capsule',
    deliverableName: 'Production Proof — Wash Swatch',
    type: 'production_proof',
    clientName: 'Serif & Co.',
    sentAt: '2026-03-16',
    status: 'pending',
  },
  {
    id: '5',
    projectName: 'Leather Wallet',
    deliverableName: 'Physical Sample',
    type: 'sample',
    clientName: 'Margaux Studio',
    sentAt: '2026-03-08',
    status: 'approved',
    respondedAt: '2026-03-10',
  },
  {
    id: '6',
    projectName: 'Athleisure Hoodie',
    deliverableName: 'Color Mockup — Navy & Stone',
    type: 'mockup',
    clientName: 'Haus Collective',
    sentAt: '2026-03-09',
    status: 'changes_requested',
    respondedAt: '2026-03-11',
    feedback: 'Navy is too dark, try a lighter shade closer to a dusty blue. Stone is perfect.',
  },
  {
    id: '7',
    projectName: 'Resort Swim Shorts',
    deliverableName: 'Tech Pack v1',
    type: 'tech_pack',
    clientName: 'Noma Apparel',
    sentAt: '2026-03-15',
    status: 'pending',
  },
  {
    id: '8',
    projectName: 'Cashmere Scarf',
    deliverableName: 'Yarn Swatch Card',
    type: 'fabric_swatch',
    clientName: 'Serif & Co.',
    sentAt: '2026-03-06',
    status: 'approved',
    respondedAt: '2026-03-07',
  },
  {
    id: '9',
    projectName: 'Canvas Tote',
    deliverableName: 'Production Proof — Print Placement',
    type: 'production_proof',
    clientName: 'Haus Collective',
    sentAt: '2026-03-13',
    status: 'changes_requested',
    respondedAt: '2026-03-15',
    feedback: 'Logo placement sits too low. Move up 2 cm and center horizontally.',
  },
  {
    id: '10',
    projectName: 'Merino Polo',
    deliverableName: 'Counter Sample',
    type: 'sample',
    clientName: 'Margaux Studio',
    sentAt: '2026-03-12',
    status: 'pending',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysWaiting(sentAt: string): number {
  const sent = new Date(sentAt);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Approvals() {
  const [tab, setTab] = useState('all');

  const counts = {
    pending: approvals.filter((a) => a.status === 'pending').length,
    approved: approvals.filter((a) => a.status === 'approved').length,
    changes_requested: approvals.filter((a) => a.status === 'changes_requested').length,
    total: approvals.length,
  };

  const filtered =
    tab === 'all'
      ? approvals
      : approvals.filter((a) => a.status === tab);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track deliverables sent to clients and their approval status.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Pending',
            value: counts.pending,
            icon: Clock,
            color: 'text-amber-500 bg-amber-50',
          },
          {
            label: 'Approved',
            value: counts.approved,
            icon: CheckCircle2,
            color: 'text-emerald-500 bg-emerald-50',
          },
          {
            label: 'Changes Requested',
            value: counts.changes_requested,
            icon: AlertTriangle,
            color: 'text-red-500 bg-red-50',
          },
          {
            label: 'Total Sent',
            value: counts.total,
            icon: Send,
            color: 'text-indigo-500 bg-indigo-50',
          },
        ].map((stat, idx) => (
          <Card
            key={stat.label}
            className="animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-semibold tracking-tight mt-2 data-value">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    stat.color,
                  )}
                >
                  <stat.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs + list */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="changes_requested">Changes Requested</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'approved', 'changes_requested'].map((t) => (
          <TabsContent key={t} value={t}>
            {filtered.length === 0 ? (
              <Card className="animate-in">
                <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mb-3 text-muted-foreground/30" />
                  <p className="text-sm">No approvals in this category</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((item, idx) => {
                  const sc = statusConfig[item.status];
                  const tc = typeConfig[item.type];
                  const StatusIcon = sc.icon;
                  const TypeIcon = tc.icon;
                  const waiting = daysWaiting(item.sentAt);

                  return (
                    <Card
                      key={item.id}
                      className="animate-in hover:border-primary/20 transition-colors"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <CardContent className="p-5 space-y-3">
                        {/* Top row: project + status badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {item.projectName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {item.deliverableName}
                            </p>
                          </div>
                          <Badge variant={sc.variant} className="shrink-0">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {sc.label}
                          </Badge>
                        </div>

                        {/* Type badge + client */}
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                              tc.color,
                            )}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {tc.label}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.clientName}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-muted-foreground">
                              Sent
                            </span>
                            <span className="data-value">
                              {formatDate(item.sentAt)}
                            </span>
                          </div>
                          {item.status === 'pending' && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-muted-foreground">
                                Waiting
                              </span>
                              <span
                                className={cn(
                                  'data-value',
                                  waiting >= 5 && 'text-amber-600 font-medium',
                                )}
                              >
                                {waiting === 0
                                  ? 'Today'
                                  : waiting === 1
                                    ? '1 day'
                                    : `${waiting} days`}
                              </span>
                            </div>
                          )}
                          {item.respondedAt && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-muted-foreground">
                                Responded
                              </span>
                              <span className="data-value">
                                {formatDate(item.respondedAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Client feedback */}
                        {item.feedback && (
                          <div className="rounded-md border border-red-200 bg-red-50/50 p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MessageSquare className="h-3 w-3 text-red-500" />
                              <span className="text-[11px] font-medium text-red-600">
                                Client Feedback
                              </span>
                            </div>
                            <p className="text-xs text-red-900/80 leading-relaxed">
                              {item.feedback}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-0.5">
                          {item.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                            >
                              <Send className="mr-1 h-3 w-3" />
                              Resend
                            </Button>
                          )}
                          {item.status === 'changes_requested' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                            >
                              <Send className="mr-1 h-3 w-3" />
                              Resend Updated
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
