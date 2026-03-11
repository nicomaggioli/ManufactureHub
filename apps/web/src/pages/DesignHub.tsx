import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Image,
  File,
  PenTool,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { designAssetsApi, type DesignAsset } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MockupGenerator } from '@/components/design/MockupGenerator';
import { TechPack } from '@/components/design/TechPack';

function getAssetIcon(type: string) {
  switch (type) {
    case 'image': return Image;
    default: return File;
  }
}

export function DesignHub() {
  const queryClient = useQueryClient();
  const [assetsEnabled, setAssetsEnabled] = useState(false);

  const assetsQuery = useQuery({
    queryKey: ['design-assets'],
    queryFn: () => designAssetsApi.list(),
    enabled: assetsEnabled,
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

      <Tabs
        defaultValue="mockup"
        onValueChange={(v) => { if (v === 'assets') setAssetsEnabled(true); }}
      >
        <TabsList>
          <TabsTrigger value="mockup">
            <PenTool className="h-3.5 w-3.5 mr-1.5" />
            Mockup Studio
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Image className="h-3.5 w-3.5 mr-1.5" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="techpack">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            Tech Packs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mockup">
          <MockupGenerator />
        </TabsContent>

        <TabsContent value="assets">
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
        </TabsContent>

        <TabsContent value="techpack">
          <TechPack />
        </TabsContent>
      </Tabs>
    </div>
  );
}
