import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Upload, Download, Send, RotateCcw, ZoomIn, Check, ChevronLeft, ChevronRight, Ruler, Sparkles } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ProductType = 'tshirt' | 'hoodie' | 'tote' | 'cap' | 'mug' | 'sweatshirt';
type ProductColor = 'white' | 'black' | 'navy' | 'grey' | 'red' | 'forest' | 'cream' | 'dusty-rose' | 'sage';
type LogoPosition = 'center' | 'left-chest' | 'full-back';

interface ProductOption { key: ProductType; label: string; category: string }
interface ColorOption { key: ProductColor; label: string; hex: string; svgFill: string }

const PRODUCTS: ProductOption[] = [
  { key: 'tshirt', label: 'T-Shirt', category: 'Basics' },
  { key: 'hoodie', label: 'Hoodie', category: 'Outerwear' },
  { key: 'sweatshirt', label: 'Sweatshirt', category: 'Outerwear' },
  { key: 'tote', label: 'Tote Bag', category: 'Accessories' },
  { key: 'cap', label: 'Cap', category: 'Accessories' },
  { key: 'mug', label: 'Mug', category: 'Drinkware' },
];

const COLORS: ColorOption[] = [
  { key: 'white', label: 'White', hex: '#FFFFFF', svgFill: '#F8F8F8' },
  { key: 'cream', label: 'Cream', hex: '#F5F0E8', svgFill: '#F5F0E8' },
  { key: 'black', label: 'Black', hex: '#1A1A1A', svgFill: '#1A1A1A' },
  { key: 'navy', label: 'Navy', hex: '#1B2A4A', svgFill: '#1B2A4A' },
  { key: 'grey', label: 'Grey', hex: '#9E9E9E', svgFill: '#9E9E9E' },
  { key: 'red', label: 'Red', hex: '#C0392B', svgFill: '#C0392B' },
  { key: 'forest', label: 'Forest', hex: '#2D4A2D', svgFill: '#2D4A2D' },
  { key: 'dusty-rose', label: 'Dusty Rose', hex: '#D4A0A0', svgFill: '#D4A0A0' },
  { key: 'sage', label: 'Sage', hex: '#B2C4A8', svgFill: '#B2C4A8' },
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

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// ---------------------------------------------------------------------------
// Product SVGs
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<ProductColor, ColorOption> = Object.fromEntries(COLORS.map((c) => [c.key, c])) as Record<ProductColor, ColorOption>;

function ProductSvg({ product, fill }: { product: ProductType; fill: string }) {
  const stroke = fill === '#F8F8F8' || fill === '#F5F0E8' ? '#C8C5BC' : 'rgba(255,255,255,0.15)';
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
// Step indicator — visual flow
// ---------------------------------------------------------------------------

function StepFlow({ steps }: { steps: { label: string; done: boolean; active: boolean }[] }) {
  return (
    <div className="flex items-center gap-1" role="list" aria-label="Mockup progress">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1">
          <div
            role="listitem"
            aria-label={`${s.label}: ${s.done ? 'done' : s.active ? 'active' : 'pending'}`}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300',
              s.done
                ? 'bg-primary/10 text-primary'
                : s.active
                  ? 'bg-foreground/5 text-foreground'
                  : 'text-muted-foreground/50'
            )}
          >
            {s.done && <Check className="h-3 w-3" />}
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'h-px w-4 transition-colors duration-300',
              s.done ? 'bg-primary/30' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  );
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
  const [productIndex, setProductIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const activeColor = COLOR_MAP[color];
  const posConfig = LOGO_AREA[position];

  const steps = [
    { label: 'Upload', done: !!logo, active: activeStep === 0 },
    { label: 'Product', done: !!logo && product !== 'tshirt', active: activeStep === 1 },
    { label: 'Customize', done: color !== 'white' || position !== 'center' || scale !== 60, active: activeStep === 2 },
    { label: 'Generate', done: false, active: activeStep === 3 },
  ];

  useEffect(() => {
    const idx = PRODUCTS.findIndex((p) => p.key === product);
    if (idx >= 0) setProductIndex(idx);
  }, [product]);

  // Auto-advance active step
  useEffect(() => {
    if (!logo) setActiveStep(0);
    else if (product === 'tshirt') setActiveStep(1);
    else if (color === 'white' && position === 'center') setActiveStep(2);
    else setActiveStep(3);
  }, [logo, product, color, position]);

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

  const onUploadKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  // --- Product carousel ---
  const goProduct = useCallback((dir: 'left' | 'right') => {
    setSlideDir(dir);
    setTimeout(() => setSlideDir(null), 300);
    setProductIndex((prev) => {
      const next = dir === 'right'
        ? (prev + 1) % PRODUCTS.length
        : (prev - 1 + PRODUCTS.length) % PRODUCTS.length;
      setProduct(PRODUCTS[next].key);
      return next;
    });
  }, []);

  // --- Canvas download ---
  const downloadMockup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 800, H = 900;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#F0F2F5';
    ctx.fillRect(0, 0, W, H);

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
    setProductIndex(0);
    setIsZoomed(false);
  };

  // --- Logo overlay position ---
  const logoSizePct = (scale / 100) * 55 * posConfig.maxScale;
  const logoStyle = {
    width: `${logoSizePct}%`,
    left: `${posConfig.x * 100}%`,
    top: `${posConfig.y * 100}%`,
    transform: 'translate(-50%, -50%)',
  };

  const currentProduct = PRODUCTS[productIndex];

  return (
    <div className="space-y-5">
      {/* Progress flow + reset */}
      <div className="flex items-center justify-between">
        <StepFlow steps={steps} />
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground hover:text-foreground rounded-full">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ===== PREVIEW AREA ===== */}
        <div className="relative overflow-hidden bg-[#F0F2F5] min-h-[560px] flex flex-col border border-border rounded-xl">
          {/* Dot pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Zoom toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className={cn(
              'absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors',
              focusRing
            )}
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Product name label */}
          <div className="absolute top-3 left-3 z-20">
            <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm rounded-full text-xs">
              {currentProduct.label}
            </Badge>
          </div>

          {/* Product on stage */}
          <div
            className={cn(
              'flex-1 flex items-center justify-center relative z-10 transition-transform duration-500 ease-out cursor-pointer',
              isZoomed && 'scale-[1.4]'
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <div
              ref={productRef}
              className={cn(
                'relative w-[300px] h-[340px] sm:w-[360px] sm:h-[400px] transition-all duration-300 ease-out motion-reduce:transition-none',
                slideDir === 'right' && 'animate-slide-in-right',
                slideDir === 'left' && 'animate-slide-in-left',
              )}
            >
              <ProductSvg product={product} fill={activeColor.svgFill} />

              {/* Logo overlay */}
              {logo && (
                <img
                  src={logo}
                  alt="Logo preview"
                  className="absolute pointer-events-none object-contain transition-all duration-300 ease-out motion-reduce:transition-none"
                  style={logoStyle}
                />
              )}
            </div>

            {/* Shadow */}
            <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[200px] h-[4px] bg-foreground/[0.05] blur-[12px]" />
          </div>

          {/* Product carousel */}
          <div className="relative z-10 pb-5 px-4">
            <div className="flex items-center justify-center gap-4">
              <button
                aria-label="Previous product"
                onClick={() => goProduct('left')}
                className={cn(
                  'h-8 w-8 rounded-full border border-border bg-white/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-200 active:scale-95',
                  focusRing
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 min-w-[180px] justify-center">
                <div className="w-8 h-8">
                  <ProductSvg product={currentProduct.key} fill="#6B7280" />
                </div>
                <div>
                  <span className="font-semibold text-sm tracking-tight text-foreground block">
                    {currentProduct.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{currentProduct.category}</span>
                </div>
              </div>

              <button
                aria-label="Next product"
                onClick={() => goProduct('right')}
                className={cn(
                  'h-8 w-8 rounded-full border border-border bg-white/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-200 active:scale-95',
                  focusRing
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Dot nav */}
            <div className="flex justify-center gap-1.5 mt-3" role="tablist" aria-label="Product selector">
              {PRODUCTS.map((p, i) => (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={i === productIndex}
                  aria-label={p.label}
                  onClick={() => { setProduct(p.key); setProductIndex(i); }}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300 motion-reduce:transition-none',
                    focusRing,
                    i === productIndex
                      ? 'w-5 bg-primary/70'
                      : 'w-1.5 bg-foreground/15 hover:bg-foreground/30'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ===== CONTROLS ===== */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label={logo ? 'Logo uploaded. Click to change' : 'Upload logo. Drop image or click to browse'}
            onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={onUploadKeyDown}
            className={cn(
              'relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 overflow-hidden group',
              focusRing,
              isDragging
                ? 'border-primary bg-primary/5'
                : logo
                  ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
                  : 'border-border hover:border-primary/40'
            )}
          >
            {logo ? (
              <div className="flex items-center gap-3 p-3.5">
                <img src={logo} alt="Logo" className="h-14 w-14 object-contain bg-muted/30 rounded-lg p-1.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm font-medium">Logo ready</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Click to swap</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 px-4">
                <div className={cn(
                  'h-14 w-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-3 transition-all duration-200',
                  isDragging ? 'bg-primary/10 scale-110' : 'group-hover:bg-muted/40'
                )}>
                  <Upload className={cn(
                    'h-6 w-6 transition-all duration-150',
                    isDragging ? 'text-primary -translate-y-0.5' : 'text-muted-foreground/40 group-hover:text-muted-foreground/60'
                  )} />
                </div>
                <p className="text-sm font-medium">Drop your logo</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, SVG, or JPG</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

          {/* Product type tiles */}
          <fieldset className="border border-border bg-card rounded-xl p-4 space-y-3">
            <legend className="text-xs font-medium text-muted-foreground px-1">Garment Type</legend>
            <div className="grid grid-cols-3 gap-2">
              {PRODUCTS.map((p) => {
                const isActive = product === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => { setProduct(p.key); setProductIndex(PRODUCTS.findIndex(pr => pr.key === p.key)); }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg py-3 px-2 transition-all duration-200 border',
                      focusRing,
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-transparent hover:bg-muted/30 hover:border-border'
                    )}
                  >
                    <div className="w-8 h-8">
                      <ProductSvg product={p.key} fill={isActive ? activeColor.svgFill : '#D1D5DB'} />
                    </div>
                    <span className={cn(
                      'text-[11px] font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Color swatches grid */}
          <fieldset className="border border-border bg-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-medium text-muted-foreground px-1">Color</legend>
              <span className="text-xs font-medium">{activeColor.label}</span>
            </div>
            <div className="grid grid-cols-5 gap-2.5" role="radiogroup" aria-label="Product color">
              {COLORS.map((c) => {
                const isActive = color === c.key;
                return (
                  <button
                    key={c.key}
                    role="radio"
                    aria-checked={isActive}
                    aria-label={c.label}
                    onClick={() => setColor(c.key)}
                    className={cn(
                      'relative flex flex-col items-center gap-1 group/swatch',
                      focusRing,
                    )}
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-lg transition-all duration-200 border',
                      isActive
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-card border-transparent scale-105'
                        : 'border-border/60 hover:scale-105 hover:shadow-md'
                    )}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isActive && (
                        <Check className={cn(
                          'absolute inset-0 m-auto h-4 w-4',
                          c.key === 'white' || c.key === 'cream' || c.key === 'grey' || c.key === 'sage'
                            ? 'text-foreground/50'
                            : 'text-white/80'
                        )} />
                      )}
                    </div>
                    <span className={cn(
                      'text-[9px] font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground/60'
                    )}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Placement */}
          <fieldset className="border border-border bg-card rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
              <legend className="text-xs font-medium text-muted-foreground">Placement</legend>
            </div>

            <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/30 rounded-lg" role="radiogroup" aria-label="Logo position">
              {POSITIONS.map((p) => (
                <button
                  key={p.key}
                  role="radio"
                  aria-checked={position === p.key}
                  onClick={() => setPosition(p.key)}
                  className={cn(
                    'py-2 text-xs font-medium text-center rounded-md transition-colors duration-200',
                    focusRing,
                    position === p.key
                      ? 'bg-card text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Scale */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ZoomIn className="h-3 w-3 text-muted-foreground" />
                  <label htmlFor="logo-scale" className="text-xs font-medium text-muted-foreground">Scale</label>
                </div>
                <span className="text-xs font-mono font-medium tabular-nums text-foreground/70">
                  {scale}%
                </span>
              </div>
              <input
                id="logo-scale"
                type="range"
                min={20}
                max={100}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full h-1 appearance-none cursor-pointer bg-border rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:ring-2 [&:focus-visible::-webkit-slider-thumb]:ring-ring [&:focus-visible::-webkit-slider-thumb]:ring-offset-2"
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            {/* Generate / Download — premium button */}
            <Button
              className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              onClick={downloadMockup}
              disabled={!logo}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate & Download
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => navigate('/communications')}
              disabled={!logo}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Manufacturer
            </Button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
