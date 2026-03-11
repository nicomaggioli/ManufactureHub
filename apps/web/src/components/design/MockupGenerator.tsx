import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Upload, Download, Send, ImageIcon, Sparkles, RotateCcw, ZoomIn } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ProductType = 'tshirt' | 'hoodie' | 'tote' | 'cap' | 'mug' | 'sweatshirt';
type ProductColor = 'white' | 'black' | 'navy' | 'grey' | 'red' | 'forest';
type LogoPosition = 'center' | 'left-chest' | 'full-back';

interface ProductOption { key: ProductType; label: string }
interface ColorOption { key: ProductColor; label: string; hex: string; svgFill: string }

const PRODUCTS: ProductOption[] = [
  { key: 'tshirt', label: 'T-Shirt' },
  { key: 'hoodie', label: 'Hoodie' },
  { key: 'tote', label: 'Tote Bag' },
  { key: 'cap', label: 'Cap' },
  { key: 'mug', label: 'Mug' },
  { key: 'sweatshirt', label: 'Sweatshirt' },
];

const COLORS: ColorOption[] = [
  { key: 'white', label: 'White', hex: '#FFFFFF', svgFill: '#F8F8F8' },
  { key: 'black', label: 'Black', hex: '#1A1A1A', svgFill: '#1A1A1A' },
  { key: 'navy', label: 'Navy', hex: '#1B2A4A', svgFill: '#1B2A4A' },
  { key: 'grey', label: 'Grey', hex: '#9E9E9E', svgFill: '#9E9E9E' },
  { key: 'red', label: 'Red', hex: '#C0392B', svgFill: '#C0392B' },
  { key: 'forest', label: 'Forest Green', hex: '#2D4A2D', svgFill: '#2D4A2D' },
];

const POSITIONS: { key: LogoPosition; label: string }[] = [
  { key: 'center', label: 'Center' },
  { key: 'left-chest', label: 'Left Chest' },
  { key: 'full-back', label: 'Full Back' },
];

const LOGO_AREA: Record<LogoPosition, { x: number; y: number; maxScale: number }> = {
  center: { x: 0.5, y: 0.45, maxScale: 1 },
  'left-chest': { x: 0.35, y: 0.35, maxScale: 0.5 },
  'full-back': { x: 0.5, y: 0.45, maxScale: 1.4 },
};

// ---------------------------------------------------------------------------
// Product SVGs — clean flat silhouettes
// ---------------------------------------------------------------------------

const PRODUCT_LABELS: Record<ProductType, string> = Object.fromEntries(PRODUCTS.map((p) => [p.key, p.label])) as Record<ProductType, string>;
const COLOR_MAP: Record<ProductColor, ColorOption> = Object.fromEntries(COLORS.map((c) => [c.key, c])) as Record<ProductColor, ColorOption>;
const POSITION_LABELS: Record<LogoPosition, string> = Object.fromEntries(POSITIONS.map((p) => [p.key, p.label])) as Record<LogoPosition, string>;

function ProductSvg({ product, fill }: { product: ProductType; fill: string }) {
  const stroke = fill === '#F8F8F8' ? '#D4D4D8' : 'rgba(255,255,255,0.15)';
  const common = { fill, stroke, strokeWidth: 1.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

  switch (product) {
    case 'tshirt':
      return (
        <svg viewBox="0 0 200 220" className="w-full h-full">
          <path d="M60 30 L40 45 L15 75 L35 90 L50 70 L50 195 L150 195 L150 70 L165 90 L185 75 L160 45 L140 30 Q120 50 100 50 Q80 50 60 30 Z" {...common} />
        </svg>
      );
    case 'hoodie':
      return (
        <svg viewBox="0 0 200 230" className="w-full h-full">
          <path d="M65 35 L40 55 L10 90 L35 105 L50 80 L50 205 L150 205 L150 80 L165 105 L190 90 L160 55 L135 35 Q120 20 100 15 Q80 20 65 35 Z" {...common} />
          <path d="M80 35 Q100 55 120 35" fill="none" stroke={stroke} strokeWidth={1.5} />
          <ellipse cx="100" cy="22" rx="12" ry="8" fill={fill} stroke={stroke} strokeWidth={1.5} />
          <path d="M50 130 L75 140 L75 205" fill="none" stroke={stroke} strokeWidth={1} />
        </svg>
      );
    case 'tote':
      return (
        <svg viewBox="0 0 200 230" className="w-full h-full">
          <path d="M40 70 L40 205 L160 205 L160 70 Z" {...common} />
          <path d="M70 70 Q70 30 100 30 Q130 30 130 70" fill="none" stroke={stroke} strokeWidth={2.5} />
        </svg>
      );
    case 'cap':
      return (
        <svg viewBox="0 0 200 180" className="w-full h-full">
          <path d="M30 110 Q30 50 100 40 Q170 50 170 110 L30 110 Z" {...common} />
          <path d="M20 110 L180 110 Q185 115 180 120 L20 120 Q15 115 20 110 Z" fill={fill} stroke={stroke} strokeWidth={1.5} />
          <path d="M30 110 L5 125 Q2 130 10 132 L35 120" fill={fill} stroke={stroke} strokeWidth={1.5} />
          <ellipse cx="100" cy="42" rx="6" ry="4" fill={fill} stroke={stroke} strokeWidth={1} />
        </svg>
      );
    case 'mug':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M45 45 L40 170 Q40 185 100 185 Q160 185 160 170 L155 45 Z" {...common} />
          <path d="M155 70 Q185 70 185 105 Q185 140 155 140" fill="none" stroke={stroke} strokeWidth={2} />
          <ellipse cx="100" cy="45" rx="57" ry="8" fill={fill} stroke={stroke} strokeWidth={1.5} />
        </svg>
      );
    case 'sweatshirt':
      return (
        <svg viewBox="0 0 200 230" className="w-full h-full">
          <path d="M62 32 L40 50 L12 85 L38 100 L52 78 L52 200 L148 200 L148 78 L162 100 L188 85 L160 50 L138 32 Q120 48 100 48 Q80 48 62 32 Z" {...common} />
          <path d="M78 32 Q100 52 122 32" fill="none" stroke={stroke} strokeWidth={1.5} />
          <path d="M52 195 L148 195" fill="none" stroke={stroke} strokeWidth={1.5} />
          <path d="M52 190 L148 190" fill="none" stroke={stroke} strokeWidth={0.8} />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MockupGenerator() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  const [logo, setLogo] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductType>('tshirt');
  const [color, setColor] = useState<ProductColor>('white');
  const [position, setPosition] = useState<LogoPosition>('center');
  const [scale, setScale] = useState(60);
  const [isDragging, setIsDragging] = useState(false);

  const activeColor = COLOR_MAP[color];
  const posConfig = LOGO_AREA[position];

  // --- File handling ---

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setLogo(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // --- Canvas download ---

  const downloadMockup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 800, H = 900;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = '#0C0A1A';
    ctx.fillRect(0, 0, W, H);

    // Render product SVG to canvas via ref
    const svgEl = productRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    const filename = `mockup-${product}-${color}.png`;

    img.onload = () => {
      const prodW = 500, prodH = 560;
      ctx.drawImage(img, (W - prodW) / 2, (H - prodH) / 2 + 20, prodW, prodH);
      URL.revokeObjectURL(url);

      const finish = () => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };

      // Render logo on top
      if (logo) {
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoSize = (scale / 100) * 240 * posConfig.maxScale;
          const aspect = logoImg.width / logoImg.height;
          const lw = logoSize;
          const lh = logoSize / aspect;
          const lx = W * posConfig.x - lw / 2;
          const ly = H * posConfig.y - lh / 2;
          ctx.drawImage(logoImg, lx, ly, lw, lh);
          finish();
        };
        logoImg.src = logo;
      } else {
        finish();
      }
    };
    img.src = url;
  }, [logo, scale, posConfig, product, color]);

  const reset = () => {
    setLogo(null);
    setProduct('tshirt');
    setColor('white');
    setPosition('center');
    setScale(60);
  };

  // --- Logo overlay position ---
  const logoSizePct = (scale / 100) * 55 * posConfig.maxScale;
  const logoStyle = {
    width: `${logoSizePct}%`,
    left: `${posConfig.x * 100}%`,
    top: `${posConfig.y * 100}%`,
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className="space-y-5">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Drop your logo, pick a product, and download your mockup.
        </p>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Preview */}
        <Card className="stat-card animate-in overflow-hidden">
          <CardContent className="p-0">
            <div className="relative flex items-center justify-center bg-[#0C0A1A] min-h-[480px] rounded-xl overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/8 rounded-full blur-[80px]" />
              </div>

              {/* Product */}
              <div ref={productRef} className="relative w-[280px] h-[320px] sm:w-[340px] sm:h-[380px]">
                <ProductSvg product={product} fill={activeColor.svgFill} />

                {/* Logo overlay */}
                {logo && (
                  <img
                    src={logo}
                    alt="Logo preview"
                    className="absolute pointer-events-none object-contain transition-all duration-300 ease-out drop-shadow-lg"
                    style={logoStyle}
                  />
                )}
              </div>

              {/* Badges */}
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                <Badge variant="secondary">{PRODUCT_LABELS[product]}</Badge>
                <Badge variant="secondary">{activeColor.label}</Badge>
                {logo && <Badge>{POSITION_LABELS[position]}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls sidebar */}
        <div className="space-y-4">
          {/* Upload */}
          <Card className="stat-card animate-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all duration-200',
                  isDragging
                    ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30',
                  logo && 'py-3'
                )}
              >
                {logo ? (
                  <img src={logo} alt="Uploaded logo" className="h-16 object-contain rounded" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-[13px] text-muted-foreground text-center">
                      Drop your logo here or <span className="text-primary font-medium">browse</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">PNG, SVG, or JPG</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </CardContent>
          </Card>

          {/* Product type */}
          <Card className="stat-card animate-in">
            <CardHeader className="pb-3">
              <CardTitle>Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-1.5">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setProduct(p.key)}
                    className={cn(
                      'rounded-lg px-2 py-2 text-[12px] font-medium transition-all duration-150',
                      product === p.key
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color */}
          <Card className="stat-card animate-in">
            <CardHeader className="pb-3">
              <CardTitle>Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setColor(c.key)}
                    title={c.label}
                    className={cn(
                      'h-9 w-9 rounded-full border-2 transition-all duration-150 shadow-sm',
                      color === c.key
                        ? 'border-primary ring-2 ring-primary/30 scale-110'
                        : 'border-border hover:scale-105'
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Position & scale */}
          <Card className="stat-card animate-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-primary" /> Placement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-1.5">
                {POSITIONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPosition(p.key)}
                    className={cn(
                      'flex-1 rounded-lg px-2 py-2 text-[12px] font-medium transition-all duration-150',
                      position === p.key
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scale</span>
                  <span className="text-[13px] font-medium tabular-nums">{scale}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-primary/30"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="stat-card animate-in border-primary/20">
            <CardContent className="p-4 space-y-2">
              <Button className="w-full" onClick={downloadMockup} disabled={!logo}>
                <Download className="h-4 w-4 mr-2" /> Download Mockup
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/20 hover:bg-primary/5"
                onClick={() => navigate('/communications')}
                disabled={!logo}
              >
                <Send className="h-4 w-4 mr-2" /> Send to Manufacturer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
