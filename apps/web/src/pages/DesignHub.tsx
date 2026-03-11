import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Image,
  FileText,
  Box,
  Palette,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  File,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { designAssetsApi, aiApi, type DesignAsset } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';

const typeFilters = [
  { value: '', label: 'All' },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'document', label: 'Documents', icon: FileText },
  { value: 'cad', label: 'CAD Files', icon: Box },
  { value: 'spec_sheet', label: 'Spec Sheets', icon: FileText },
  { value: 'mood_board', label: 'Mood Boards', icon: Palette },
];

function DropZone({ onUpload }: { onUpload: (files: FileList) => void }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
      }
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40'
      )}
    >
      <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
      <p className="text-sm font-medium">Drag and drop files here</p>
      <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
      <input
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
        style={{ position: 'relative' }}
      />
      <Button variant="outline" size="sm" className="mt-2.5" asChild>
        <label className="cursor-pointer">
          Browse Files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && onUpload(e.target.files)}
          />
        </label>
      </Button>
    </div>
  );
}

export function DesignHub() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(false);

  const assetsQuery = useQuery({
    queryKey: ['design-assets', typeFilter || undefined],
    queryFn: () => designAssetsApi.list(typeFilter ? { type: typeFilter } : undefined),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      return designAssetsApi.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-assets'] });
      toast({ title: 'Uploaded', description: 'Files uploaded successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to upload files.', variant: 'destructive' });
    },
  });

  // AI insights for first project (simplified)
  const insightsQuery = useQuery({
    queryKey: ['ai', 'creative-insights'],
    queryFn: () => aiApi.creativeInsights('default'),
    enabled: insightsOpen,
  });

  const assets = assetsQuery.data ?? [];

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'cad': return Box;
      case 'mood_board': return Palette;
      default: return File;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Design Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage design assets and creative materials.</p>
        </div>
        <Button variant="outline" onClick={() => setInsightsOpen(!insightsOpen)}>
          <Sparkles className="mr-2 h-4 w-4" />
          AI Insights
          {insightsOpen ? <ChevronRight className="ml-2 h-4 w-4" /> : <ChevronLeft className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 space-y-5">
          {/* Upload area */}
          <Card className="animate-in">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upload Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <DropZone onUpload={(files) => uploadMutation.mutate(files)} />
              {uploadMutation.isPending && (
                <div className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Uploading...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Type filters */}
          <div className="flex flex-wrap gap-1.5">
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={typeFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(filter.value)}
                className="h-7 text-xs"
              >
                {filter.icon && <filter.icon className="mr-1 h-3 w-3" />}
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Asset gallery */}
          {assetsQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <Card className="animate-in">
              <CardContent className="flex flex-col items-center py-10 text-muted-foreground">
                <Image className="h-10 w-10 mb-3 text-muted-foreground/40" />
                <p className="text-sm">No design assets yet</p>
                <p className="text-xs mt-0.5">Upload files to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => {
                const Icon = getAssetIcon(asset.type);
                return (
                  <Card key={asset.id} className="group overflow-hidden animate-in hover:border-primary/30 transition-colors">
                    <div className="relative h-36 bg-muted flex items-center justify-center">
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon className="h-10 w-10 text-muted-foreground/30" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    </div>
                    <CardContent className="p-2.5">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="secondary">{asset.type}</Badge>
                        <span className="text-xs text-muted-foreground data-value">{formatDate(asset.uploadedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Mood Board Builder placeholder */}
          <Card className="animate-in">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Palette className="h-4 w-4" /> Mood Board Builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-center justify-center rounded-md border-2 border-dashed bg-muted/30 text-muted-foreground">
                <div className="text-center">
                  <Palette className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm">Canvas area for mood board builder</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Drag assets here to create mood boards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Creative Insights panel */}
        {insightsOpen && (
          <Card className="w-80 shrink-0 self-start animate-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2.5 px-4 pt-3">
              <CardTitle className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Creative Insights
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setInsightsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              {insightsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : insightsQuery.isError ? (
                <p className="text-sm text-muted-foreground">Unable to load insights right now.</p>
              ) : insightsQuery.data ? (
                <>
                  <div>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</h4>
                    <ul className="space-y-1.5">
                      {insightsQuery.data.suggestions.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                          <Sparkles className="h-3 w-3 mt-1 text-primary shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trend Analysis</h4>
                    <p className="text-sm leading-relaxed">{insightsQuery.data.trendAnalysis}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Material Recommendations</h4>
                    <div className="flex flex-wrap gap-1">
                      {insightsQuery.data.materialRecommendations.map((m, i) => (
                        <Badge key={i} variant="outline">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No insights available.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
