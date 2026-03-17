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
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
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
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.06] border border-border/50 px-8 py-10">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold tracking-tight">Design Studio</h1>
          <p className="text-base text-muted-foreground mt-1.5 font-serif italic">
            Bring your vision to life
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="mockup"
        onValueChange={(v) => { if (v === 'assets') setAssetsEnabled(true); }}
      >
        <TabsList className="h-11 p-1 bg-muted/50 rounded-full">
          <TabsTrigger value="mockup" className="rounded-full px-5 data-[state=active]:shadow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Mockup Studio
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-full px-5 data-[state=active]:shadow-sm">
            <Image className="h-3.5 w-3.5 mr-2" />
            Asset Gallery
          </TabsTrigger>
        </TabsList>

        {/* Mockup Studio — hero content */}
        <TabsContent value="mockup" className="mt-6">
          <MockupGenerator />
        </TabsContent>

        {/* Asset Gallery */}
        <TabsContent value="assets" className="mt-6">
          <div className="space-y-6">
            {/* Upload area — large drop zone */}
            <Card className="animate-in overflow-hidden border-0 shadow-none">
              <CardContent className="p-0">
                <div
                  className={`
                    relative flex flex-col items-center justify-center
                    border-2 border-dashed rounded-xl
                    min-h-[200px] px-8 py-12
                    transition-all duration-300 ease-out cursor-pointer
                    ${isDragOver
                      ? 'border-primary bg-primary/[0.04] scale-[1.01] shadow-lg shadow-primary/5'
                      : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20'
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
                  {/* Animated border on drag */}
                  {isDragOver && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                      <div className="absolute inset-0 border-2 border-primary rounded-xl animate-pulse" />
                    </div>
                  )}

                  {uploadProgress !== null ? (
                    <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                      <div className="relative h-16 w-16 flex items-center justify-center">
                        {uploadProgress >= 100 ? (
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-in zoom-in-50" />
                        ) : (
                          <div className="h-10 w-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                        )}
                      </div>
                      <div className="w-full">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {uploadProgress >= 100 ? 'Upload complete' : `Uploading... ${uploadProgress}%`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`
                        h-16 w-16 rounded-2xl flex items-center justify-center mb-4
                        transition-all duration-300
                        ${isDragOver
                          ? 'bg-primary/10 scale-110'
                          : 'bg-muted/40'
                        }
                      `}>
                        <Upload className={`
                          h-7 w-7 transition-all duration-300
                          ${isDragOver ? 'text-primary -translate-y-0.5' : 'text-muted-foreground/40'}
                        `} />
                      </div>
                      <p className="text-base font-medium">
                        {isDragOver ? 'Drop to upload' : 'Drop files here or browse'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG, SVG, PDF, AI up to 50 MB
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <Button variant="outline" size="sm" className="rounded-full px-5">
                          Browse Files
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        {['PNG', 'JPG', 'SVG', 'PDF', 'AI'].map((fmt) => (
                          <span key={fmt} className="text-[10px] font-mono text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded">
                            .{fmt.toLowerCase()}
                          </span>
                        ))}
                      </div>
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
              </CardContent>
            </Card>

            {/* Asset gallery — visual grid with hover zoom */}
            {assetsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <div className="h-20 w-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                  <Image className="h-10 w-10 text-muted-foreground/25" />
                </div>
                <p className="text-base font-medium">No design assets yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Upload your first asset to get started</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {assets.map((asset) => {
                  const Icon = getAssetIcon(asset.type);
                  const isHovered = hoveredAsset === asset.id;
                  return (
                    <Card
                      key={asset.id}
                      className="group overflow-hidden animate-in hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 rounded-xl"
                      onMouseEnter={() => setHoveredAsset(asset.id)}
                      onMouseLeave={() => setHoveredAsset(null)}
                    >
                      <div className="relative h-52 bg-muted/30 flex items-center justify-center overflow-hidden">
                        {asset.thumbnailUrl ? (
                          <img
                            src={asset.thumbnailUrl}
                            alt={asset.fileName}
                            className={`
                              h-full w-full object-cover transition-transform duration-500 ease-out
                              ${isHovered ? 'scale-110' : 'scale-100'}
                            `}
                          />
                        ) : (
                          <Icon className="h-12 w-12 text-muted-foreground/20" />
                        )}
                        {/* Hover overlay */}
                        <div className={`
                          absolute inset-0 bg-black/40 flex items-center justify-center gap-2
                          transition-opacity duration-300
                          ${isHovered ? 'opacity-100' : 'opacity-0'}
                        `}>
                          <Button size="sm" variant="secondary" className="rounded-full h-8 px-3 text-xs">
                            View
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-3.5">
                        <p className="text-sm font-medium truncate">{asset.fileName}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge variant="secondary" className="text-[10px] rounded-full">{asset.type}</Badge>
                          <span className="text-xs text-muted-foreground/60 data-value">{formatDate(asset.createdAt)}</span>
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
