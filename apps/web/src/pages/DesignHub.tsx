import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Image,
  File,
  PenTool,
  Sparkles,
  CheckCircle2,
  X,
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

function getAssetIcon(type: string) {
  switch (type) {
    case 'image': return Image;
    default: return File;
  }
}

export function DesignHub() {
  const queryClient = useQueryClient();
  const [assetsEnabled, setAssetsEnabled] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assetsQuery = useQuery({
    queryKey: ['design-assets'],
    queryFn: () => designAssetsApi.list(),
    enabled: assetsEnabled,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: FileList) => {
      const file = files[0];
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 15;
        });
      }, 200);

      return designAssetsApi.create({
        projectId: 'p1',
        type: 'reference',
        fileName: file?.name,
        fileUrl: URL.createObjectURL(file),
      }).finally(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1200);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-assets'] });
      toast({ title: 'Uploaded', description: 'Files uploaded successfully.' });
    },
    onError: () => {
      setUploadProgress(null);
      toast({ title: 'Error', description: 'Failed to upload files.', variant: 'destructive' });
    },
  });

  const assets = (assetsQuery.data ?? []) as DesignAsset[];

  const handleUpload = useCallback(
    (files: FileList) => uploadMutation.mutate(files),
    [uploadMutation]
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[17px] font-bold tracking-tight font-display">Design Studio</h1>
        <p className="text-sm text-muted-foreground font-sans mt-1">Create mockups and manage design assets.</p>
      </div>

      <Tabs
        defaultValue="mockup"
        onValueChange={(v) => { if (v === 'assets') setAssetsEnabled(true); }}
      >
        <TabsList className="h-9 p-1 bg-muted/50 rounded-md">
          <TabsTrigger value="mockup" className="rounded-md px-4 text-xs data-[state=active]:shadow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Mockup Studio
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-md px-4 text-xs data-[state=active]:shadow-sm">
            <Image className="h-3.5 w-3.5 mr-1.5" />
            Asset Gallery
          </TabsTrigger>
        </TabsList>

        {/* Mockup Studio */}
        <TabsContent value="mockup" className="mt-6">
          <MockupGenerator />
        </TabsContent>

        {/* Asset Gallery */}
        <TabsContent value="assets" className="mt-6">
          <div className="space-y-6">
            {/* Upload area */}
            <div
              className={`
                flex flex-col items-center justify-center
                border-2 border-dashed rounded-md
                min-h-[160px] px-8 py-10
                transition-colors duration-200 cursor-pointer
                ${isDragOver
                  ? 'border-primary bg-muted/30'
                  : 'border-border hover:border-muted-foreground/40'
                }
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadProgress !== null ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  <div className="relative h-12 w-12 flex items-center justify-center">
                    {uploadProgress >= 100 ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    )}
                  </div>
                  <div className="w-full">
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2 font-sans">
                      {uploadProgress >= 100 ? 'Upload complete' : `Uploading... ${uploadProgress}%`}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className={`h-6 w-6 mb-3 ${isDragOver ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <p className="text-sm font-medium font-sans">
                    {isDragOver ? 'Drop to upload' : 'Drop files here or browse'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">
                    PNG, JPG, SVG, PDF, AI up to 50 MB
                  </p>
                  <Button variant="outline" size="sm" className="rounded-md mt-3 text-xs">
                    Browse Files
                  </Button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.svg,.pdf,.ai"
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />

            {/* Asset gallery */}
            {assetsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-md" />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Image className="h-8 w-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-semibold font-display">No design assets yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-sans">Upload your first asset to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {assets.map((asset) => {
                  const Icon = getAssetIcon(asset.type);
                  return (
                    <Card
                      key={asset.id}
                      className="group overflow-hidden bg-card border rounded-md transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-md"
                    >
                      <div className="relative h-48 bg-muted/20 flex items-center justify-center overflow-hidden">
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt={asset.fileName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Icon className="h-10 w-10 text-muted-foreground/20" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium font-display truncate">{asset.fileName}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge variant="secondary" className="text-[10px] rounded-full">{asset.type}</Badge>
                          <span className="text-xs text-muted-foreground/60 data-value font-sans">{formatDate(asset.createdAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
