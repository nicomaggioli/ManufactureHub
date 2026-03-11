import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Image,
  File,
  Wand2,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { designAssetsApi, type DesignAsset } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { MockupGenerator } from '@/components/design/MockupGenerator';
import { TechPack } from '@/components/design/TechPack';

const tabs = [
  { key: 'mockup', label: 'Mockup Studio', icon: Wand2 },
  { key: 'assets', label: 'Assets', icon: Image },
  { key: 'techpack', label: 'Tech Packs', icon: ClipboardList },
] as const;

type TabKey = (typeof tabs)[number]['key'];

function getAssetIcon(type: string) {
  switch (type) {
    case 'image': return Image;
    default: return File;
  }
}

export function DesignHub() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('mockup');

  const assetsQuery = useQuery({
    queryKey: ['design-assets'],
    queryFn: () => designAssetsApi.list(),
    enabled: activeTab === 'assets',
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

  const assets = (assetsQuery.data ?? []) as DesignAsset[];

  const handleUpload = useCallback(
    (files: FileList) => uploadMutation.mutate(files),
    [uploadMutation]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Design Studio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create mockups, manage assets, and build tech packs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-heading font-semibold uppercase tracking-wider rounded-t-md transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-primary text-foreground bg-card'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mockup Studio Tab */}
      {activeTab === 'mockup' && <MockupGenerator />}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          {/* Upload area */}
          <Card className="animate-in">
            <CardContent className="p-5">
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/40 border-muted-foreground/20"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
                }}
              >
                <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">Drop files here or browse</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <label className="cursor-pointer">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleUpload(e.target.files)}
                    />
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

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
                        <img src={asset.thumbnailUrl} alt={asset.name} className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-10 w-10 text-muted-foreground/30" />
                      )}
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
        </div>
      )}

      {/* Tech Pack Tab */}
      {activeTab === 'techpack' && <TechPack />}
    </div>
  );
}
