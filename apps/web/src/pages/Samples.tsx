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
  { label: string; icon: React.ElementType; pillColor: string }
> = {
  requested: { label: 'Requested', icon: Clock, pillColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_transit: { label: 'In Transit', icon: Truck, pillColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  received: { label: 'Received', icon: Package, pillColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', icon: CheckCircle2, pillColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rejected', icon: XCircle, pillColor: 'bg-rose-100 text-rose-800 border-rose-200' },
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
        <div className="absolute top-2 left-0 right-0 h-px bg-border mx-6" />

        {statusFlow.map((step, idx) => {
          const completed = idx <= currentIdx && !isRejected;
          const isCurrent = idx === currentIdx && !isRejected;

          return (
            <div key={step} className="flex flex-col items-center relative z-10 flex-1">
              {/* Dot */}
              <div
                className={cn(
                  'h-4 w-4 rounded-full flex items-center justify-center transition-colors border',
                  completed
                    ? 'bg-primary border-primary'
                    : 'bg-background border-muted-foreground/20'
                )}
              >
                {completed && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
              {/* Label */}
              <span className={cn(
                'text-[10px] mt-1.5 font-medium text-center leading-tight font-sans',
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[17px] font-bold tracking-tight font-display">Samples</h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">Track and manage product samples from request to approval.</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          All
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Sample cards */}
      {samplesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex justify-between">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-4 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : samplesQuery.isError ? (
        <Card>
          <CardContent className="py-16 text-center text-destructive text-sm">
            Failed to load samples.
          </CardContent>
        </Card>
      ) : samples.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <p className="text-sm font-semibold font-display text-muted-foreground mb-1">No samples found</p>
            <p className="text-sm text-muted-foreground/70 max-w-xs text-center font-sans">
              When you request samples from manufacturers, they will appear here for tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {samples.map((sample, i) => {
            const config = statusConfig[sample.status] ?? statusConfig.requested;
            const nextStatus = getNextStatus(sample.status);

            return (
              <Card
                key={sample.id}
                className="bg-card border rounded-md transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-md"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-semibold font-display">{sample.projectName}</CardTitle>
                      <p className="text-xs text-muted-foreground font-sans mt-0.5">{sample.manufacturerName}</p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border shrink-0',
                      config.pillColor
                    )}>
                      {config.label}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Visual status timeline */}
                  <StatusTimeline currentStatus={sample.status} />

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Requested</p>
                      <p className="text-sm font-medium data-value font-sans">{formatDate(sample.requestedAt)}</p>
                    </div>
                    {sample.receivedAt && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Received</p>
                        <p className="text-sm font-medium data-value font-sans">{formatDate(sample.receivedAt)}</p>
                      </div>
                    )}
                    {sample.trackingNumber && (
                      <div className="col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Tracking</p>
                        <a
                          href={`https://track.aftership.com/${sample.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 data-value font-sans"
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
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary mb-2">Photos</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {sample.photos.map((photo, j) => (
                          <img
                            key={j}
                            src={photo}
                            alt={`Sample photo ${j + 1}`}
                            className="h-20 w-20 rounded-md object-cover shrink-0 border border-border hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {sample.notes && (
                    <p className="text-xs text-muted-foreground font-sans border-t border-border/50 pt-3 leading-relaxed">{sample.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nextStatus && sample.status !== 'approved' && sample.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-md text-xs"
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
                          className="rounded-md text-xs"
                          onClick={() => statusMutation.mutate({ id: sample.id, status: 'approved' })}
                        >
                          <CheckCircle2 className="mr-1.5 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-md text-xs"
                          onClick={() => statusMutation.mutate({ id: sample.id, status: 'rejected' })}
                        >
                          <XCircle className="mr-1.5 h-3 w-3" /> Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md text-xs"
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
            <DialogTitle className="text-[17px] font-bold tracking-tight font-display">Upload Sample Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border p-8">
              <Image className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground font-sans mb-1">Drop photos here or click to browse</p>
              <p className="text-xs text-muted-foreground/60 font-sans mb-4">PNG, JPG up to 10MB</p>
              <Button variant="outline" size="sm" asChild className="rounded-md">
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
              <p className="text-sm text-center text-muted-foreground font-sans">Uploading...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
