import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Upload, Camera, Truck, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Samples</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track and manage product samples.</p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sample list */}
      {samplesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : samplesQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Failed to load samples.
          </CardContent>
        </Card>
      ) : samples.length === 0 ? (
        <Card className="animate-in">
          <CardContent className="flex flex-col items-center py-10 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 text-muted-foreground/40" />
            <p className="text-sm">No samples found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {samples.map((sample) => {
            const config = statusConfig[sample.status] ?? statusConfig.requested;
            const StatusIcon = config.icon;
            const nextStatus = getNextStatus(sample.status);

            return (
              <Card key={sample.id} className="animate-in hover:border-primary/20 transition-colors">
                <CardHeader className="pb-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{sample.projectName}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{sample.manufacturerName}</p>
                    </div>
                    <Badge variant={config.variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {/* Status workflow dots */}
                  <div className="flex items-center gap-0.5 overflow-x-auto py-0.5">
                    {statusFlow.map((step, idx) => {
                      const stepIdx = statusFlow.indexOf(sample.status);
                      const completed = idx <= stepIdx;
                      return (
                        <div key={step} className="flex items-center">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0 transition-colors',
                              completed ? 'bg-primary' : 'bg-muted-foreground/15'
                            )}
                          />
                          {idx < statusFlow.length - 1 && (
                            <div
                              className={cn(
                                'h-[1.5px] w-6 rounded-full',
                                idx < stepIdx ? 'bg-primary' : 'bg-muted-foreground/15'
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Info */}
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">Requested</span>
                      <span className="data-value">{formatDate(sample.requestedAt)}</span>
                    </div>
                    {sample.receivedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Received</span>
                        <span className="data-value">{formatDate(sample.receivedAt)}</span>
                      </div>
                    )}
                    {sample.trackingNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Tracking</span>
                        <span className="data-value text-xs">{sample.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  {sample.photos.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto">
                      {sample.photos.map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt={`Sample photo ${i + 1}`}
                          className="h-14 w-14 rounded-md object-cover shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {sample.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">{sample.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-0.5">
                    {nextStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => statusMutation.mutate({ id: sample.id, status: nextStatus })}
                        disabled={statusMutation.isPending}
                      >
                        <ArrowRight className="mr-1 h-3 w-3" />
                        Mark as {statusConfig[nextStatus]?.label}
                      </Button>
                    )}
                    {sample.status === 'received' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => statusMutation.mutate({ id: sample.id, status: 'approved' })}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => statusMutation.mutate({ id: sample.id, status: 'rejected' })}
                        >
                          <XCircle className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setUploadDialogSampleId(sample.id)}
                    >
                      <Camera className="mr-1 h-3 w-3" /> Photos
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
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6">
              <Upload className="h-7 w-7 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-2.5">Select photos to upload</p>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
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
