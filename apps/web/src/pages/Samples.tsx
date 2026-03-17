import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Upload,
  Camera,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Image,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { samplesApi, type Sample } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline' }
> = {
  requested: { label: 'Requested', icon: Clock, variant: 'secondary' },
  in_transit: { label: 'In Transit', icon: Truck, variant: 'default' },
  received: { label: 'Received', icon: Package, variant: 'outline' },
  approved: { label: 'Approved', icon: CheckCircle2, variant: 'success' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' },
};

const statusFlow = ['requested', 'in_transit', 'received', 'approved'];
const statusFlowLabels: Record<string, string> = {
  requested: 'Requested',
  in_transit: 'In Transit',
  received: 'Received',
  approved: 'Approved',
};

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = statusFlow.indexOf(currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <div className="py-3">
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-3 left-0 right-0 h-[2px] bg-muted-foreground/10 mx-6" />

        {statusFlow.map((step, idx) => {
          const completed = idx <= currentIdx && !isRejected;
          const isCurrent = idx === currentIdx && !isRejected;

          return (
            <div key={step} className="flex flex-col items-center relative z-10 flex-1">
              {/* Dot */}
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center transition-all border-2',
                  completed
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-muted-foreground/20'
                )}
              >
                {completed && (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </div>
              {/* Label */}
              <span className={cn(
                'text-[10px] mt-1.5 font-medium text-center leading-tight',
                isCurrent ? 'text-primary' : completed ? 'text-foreground' : 'text-muted-foreground/50'
              )}>
                {statusFlowLabels[step]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rejected overlay */}
      {isRejected && (
        <div className="flex items-center justify-center gap-1.5 mt-3 text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-semibold">Sample Rejected</span>
        </div>
      )}
    </div>
  );
}

export function Samples() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadDialogSampleId, setUploadDialogSampleId] = useState<string | null>(null);

  const samplesQuery = useQuery({
    queryKey: ['samples', statusFilter !== 'all' ? statusFilter : undefined],
    queryFn: () => samplesApi.list(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => samplesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      toast({ title: 'Status updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    },
  });

  const photoMutation = useMutation({
    mutationFn: ({ id, files }: { id: string; files: FileList }) => {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('photos', f));
      return samplesApi.uploadPhoto(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] });
      setUploadDialogSampleId(null);
      toast({ title: 'Photos uploaded' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to upload photos.', variant: 'destructive' });
    },
  });

  const samples: Sample[] = samplesQuery.data ?? [];

  const getNextStatus = (current: string): string | null => {
    const idx = statusFlow.indexOf(current);
    if (idx >= 0 && idx < statusFlow.length - 1) return statusFlow[idx + 1];
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Track</p>
          <h1 className="text-2xl font-semibold tracking-tight">Samples</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage product samples from request to approval.</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            All
          </button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sample cards */}
      {samplesQuery.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex justify-between">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-6 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : samplesQuery.isError ? (
        <Card>
          <CardContent className="py-16 text-center text-destructive">
            Failed to load samples.
          </CardContent>
        </Card>
      ) : samples.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-20">
            <div className="rounded-2xl bg-muted/60 p-5 mb-5">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-base font-medium text-muted-foreground mb-1">No samples found</p>
            <p className="text-sm text-muted-foreground/70 max-w-xs text-center">
              When you request samples from manufacturers, they will appear here for tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {samples.map((sample, i) => {
            const config = statusConfig[sample.status] ?? statusConfig.requested;
            const StatusIcon = config.icon;
            const nextStatus = getNextStatus(sample.status);

            return (
              <Card
                key={sample.id}
                className="animate-in hover:shadow-md transition-all"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <CardHeader className="p-5 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold">{sample.projectName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{sample.manufacturerName}</p>
                    </div>
                    <Badge variant={config.variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Visual status timeline */}
                  <StatusTimeline currentStatus={sample.status} />

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Requested</p>
                      <p className="text-sm font-medium data-value">{formatDate(sample.requestedAt)}</p>
                    </div>
                    {sample.receivedAt && (
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Received</p>
                        <p className="text-sm font-medium data-value">{formatDate(sample.receivedAt)}</p>
                      </div>
                    )}
                    {sample.trackingNumber && (
                      <div className="rounded-lg bg-muted/40 p-3 col-span-2">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Tracking</p>
                        <a
                          href={`https://track.aftership.com/${sample.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 data-value"
                        >
                          {sample.trackingNumber}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  {sample.photos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Photos</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {sample.photos.map((photo, j) => (
                          <img
                            key={j}
                            src={photo}
                            alt={`Sample photo ${j + 1}`}
                            className="h-20 w-20 rounded-lg object-cover shrink-0 border border-border hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {sample.notes && (
                    <p className="text-xs text-muted-foreground border-t border-border/50 pt-3 leading-relaxed">{sample.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nextStatus && sample.status !== 'approved' && sample.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs"
                        onClick={() => statusMutation.mutate({ id: sample.id, status: nextStatus })}
                        disabled={statusMutation.isPending}
                      >
                        <ArrowRight className="mr-1.5 h-3 w-3" />
                        Mark as {statusConfig[nextStatus]?.label}
                      </Button>
                    )}
                    {sample.status === 'received' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="rounded-lg text-xs"
                          onClick={() => statusMutation.mutate({ id: sample.id, status: 'approved' })}
                        >
                          <CheckCircle2 className="mr-1.5 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-lg text-xs"
                          onClick={() => statusMutation.mutate({ id: sample.id, status: 'rejected' })}
                        >
                          <XCircle className="mr-1.5 h-3 w-3" /> Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-xs"
                      onClick={() => setUploadDialogSampleId(sample.id)}
                    >
                      <Camera className="mr-1.5 h-3 w-3" /> Upload Photos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo upload dialog */}
      <Dialog open={!!uploadDialogSampleId} onOpenChange={() => setUploadDialogSampleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">Upload Sample Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8">
              <div className="rounded-2xl bg-muted/60 p-4 mb-3">
                <Image className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Drop photos here or click to browse</p>
              <p className="text-xs text-muted-foreground/60 mb-4">PNG, JPG up to 10MB</p>
              <Button variant="outline" size="sm" asChild className="rounded-lg">
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && uploadDialogSampleId) {
                        photoMutation.mutate({ id: uploadDialogSampleId, files: e.target.files });
                      }
                    }}
                  />
                </label>
              </Button>
            </div>
            {photoMutation.isPending && (
              <p className="text-sm text-center text-muted-foreground">Uploading...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
