import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Image,
  File,
  PenTool,
  ClipboardList,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { designAssetsApi, type DesignAsset } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MockupGenerator } from '@/components/design/MockupGenerator';
import { TechPack } from '@/components/design/TechPack';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Design app chrome colors (Photoshop-inspired)
// ---------------------------------------------------------------------------

const chrome = {
  bg: 'bg-[#2B2B2B]',
  panel: 'bg-[#3C3C3C]',
  panelHover: 'hover:bg-[#454545]',
  toolbar: 'bg-[#323232]',
  border: 'border-[#1E1E1E]',
  borderLight: 'border-[#4A4A4A]',
  text: 'text-[#CCCCCC]',
  textDim: 'text-[#8A8A8A]',
  textBright: 'text-[#E8E8E8]',
  active: 'bg-[#4A4A4A]',
  accent: 'text-[#5B9BD5]',
};

function getAssetIcon(type: string) {
  switch (type) {
    case 'image': return Image;
    default: return File;
  }
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type AppTab = 'mockup' | 'assets' | 'techpack';

const APP_TABS: { key: AppTab; label: string; icon: React.ElementType }[] = [
  { key: 'mockup', label: 'Mockup Studio', icon: PenTool },
  { key: 'assets', label: 'Assets', icon: Image },
  { key: 'techpack', label: 'Tech Packs', icon: ClipboardList },
];

// ---------------------------------------------------------------------------
// Assets panel (rendered inside design app shell)
// ---------------------------------------------------------------------------

function AssetsPanel({
  assets,
  isLoading,
  onUpload,
}: {
  assets: DesignAsset[];
  isLoading: boolean;
  onUpload: (files: FileList) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Upload area */}
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 transition-colors',
          chrome.borderLight,
          'hover:border-[#5B9BD5]/40'
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files);
        }}
      >
        <Upload className={cn('h-8 w-8 mb-2', chrome.textDim)} />
        <p className={cn('text-sm font-medium', chrome.text)}>Drop files here or browse</p>
        <Button variant="outline" size="sm" className="mt-2 border-[#4A4A4A] bg-[#3C3C3C] text-[#CCCCCC] hover:bg-[#454545]" asChild>
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

      {/* Gallery */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 bg-[#454545]" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Image className={cn('h-12 w-12 mb-3', chrome.textDim)} />
          <p className={cn('text-sm', chrome.textDim)}>No design assets yet</p>
          <p className={cn('text-xs mt-1', chrome.textDim)}>Upload images, patterns, and reference files</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => {
            const Icon = getAssetIcon(asset.type);
            return (
              <div
                key={asset.id}
                className={cn(
                  'group overflow-hidden rounded-lg border transition-colors',
                  chrome.border,
                  'hover:border-[#5B9BD5]/30'
                )}
              >
                <div className={cn('relative h-32 flex items-center justify-center', chrome.panel)}>
                  {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.name} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className={cn('h-10 w-10', chrome.textDim)} />
                  )}
                </div>
                <div className={cn('p-2.5', chrome.panel)}>
                  <p className={cn('text-xs font-medium truncate', chrome.text)}>{asset.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn('text-[10px] uppercase tracking-wider', chrome.textDim)}>{asset.type}</span>
                    <span className={cn('text-[10px] font-mono', chrome.textDim)}>{formatDate(asset.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Design Hub — Photoshop-style application shell
// ---------------------------------------------------------------------------

export function DesignHub() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AppTab>('mockup');
  const [assetsEnabled, setAssetsEnabled] = useState(false);
  const [zoom, setZoom] = useState(100);

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

  const switchTab = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    if (tab === 'assets') setAssetsEnabled(true);
  }, []);

  return (
    <div className={cn('flex flex-col h-full', chrome.bg)}>
      {/* ===== APP TOOLBAR ===== */}
      <div className={cn('flex items-center h-9 px-2 border-b shrink-0', chrome.toolbar, chrome.border)}>
        {/* App tabs (like Photoshop document tabs) */}
        <div className="flex items-center gap-0.5">
          {APP_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-7 rounded text-[11px] font-medium transition-colors duration-100',
                  active
                    ? cn(chrome.active, chrome.textBright)
                    : cn('bg-transparent', chrome.textDim, chrome.panelHover, 'hover:text-[#CCCCCC]')
                )}
              >
                <tab.icon className="h-3 w-3" strokeWidth={active ? 2 : 1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Zoom controls (mockup tab only) */}
        {activeTab === 'mockup' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className={cn('h-6 w-6 rounded flex items-center justify-center', chrome.textDim, chrome.panelHover)}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className={cn('text-[10px] font-mono w-8 text-center tabular-nums', chrome.textDim)}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className={cn('h-6 w-6 rounded flex items-center justify-center', chrome.textDim, chrome.panelHover)}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            <div className={cn('w-px h-4 mx-1', chrome.borderLight)} />
            <button
              onClick={() => setZoom(100)}
              className={cn('h-6 w-6 rounded flex items-center justify-center', chrome.textDim, chrome.panelHover)}
              aria-label="Fit to screen"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* ===== MAIN WORKSPACE ===== */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'mockup' && <MockupGenerator zoom={zoom} />}
        {activeTab === 'assets' && (
          <AssetsPanel
            assets={assets}
            isLoading={assetsQuery.isLoading}
            onUpload={handleUpload}
          />
        )}
        {activeTab === 'techpack' && (
          <div className="flex-1 overflow-y-auto p-5">
            <TechPack />
          </div>
        )}
      </div>

      {/* ===== STATUS BAR ===== */}
      <div className={cn('flex items-center h-6 px-3 border-t shrink-0 gap-4', 'bg-[#007ACC]', 'border-[#005A9E]')}>
        <span className="text-[10px] text-white/90 font-medium">
          {activeTab === 'mockup' && 'Mockup Studio'}
          {activeTab === 'assets' && `Assets (${assets.length})`}
          {activeTab === 'techpack' && 'Tech Pack Builder'}
        </span>
        <div className="flex-1" />
        {activeTab === 'mockup' && (
          <>
            <span className="text-[10px] text-white/70 font-mono tabular-nums">800 x 900 px</span>
            <span className="text-[10px] text-white/70 font-mono tabular-nums">{zoom}%</span>
          </>
        )}
      </div>
    </div>
  );
}
