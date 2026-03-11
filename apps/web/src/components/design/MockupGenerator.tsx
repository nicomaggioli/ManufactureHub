import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Upload, Download, Send, Sparkles, RotateCcw, ZoomIn, Check, ChevronLeft, ChevronRight, Crosshair, Trophy } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ProductType = 'tshirt' | 'hoodie' | 'tote' | 'cap' | 'mug' | 'sweatshirt';
type ProductColor = 'white' | 'black' | 'navy' | 'grey' | 'red' | 'forest';
type LogoPosition = 'center' | 'left-chest' | 'full-back';

interface ProductOption { key: ProductType; label: string; emoji: string }
interface ColorOption { key: ProductColor; label: string; hex: string; svgFill: string }

const PRODUCTS: ProductOption[] = [
  { key: 'tshirt', label: 'T-Shirt', emoji: '👕' },
  { key: 'hoodie', label: 'Hoodie', emoji: '🧥' },
  { key: 'tote', label: 'Tote Bag', emoji: '👜' },
  { key: 'cap', label: 'Cap', emoji: '🧢' },
  { key: 'mug', label: 'Mug', emoji: '☕' },
  { key: 'sweatshirt', label: 'Sweater', emoji: '🧶' },
];

const COLORS: ColorOption[] = [
  { key: 'white', label: 'White', hex: '#FFFFFF', svgFill: '#F8F8F8' },
  { key: 'black', label: 'Black', hex: '#1A1A1A', svgFill: '#1A1A1A' },
  { key: 'navy', label: 'Navy', hex: '#1B2A4A', svgFill: '#1B2A4A' },
  { key: 'grey', label: 'Grey', hex: '#9E9E9E', svgFill: '#9E9E9E' },
  { key: 'red', label: 'Red', hex: '#C0392B', svgFill: '#C0392B' },
  { key: 'forest', label: 'Forest', hex: '#2D4A2D', svgFill: '#2D4A2D' },
];

const POSITIONS: { key: LogoPosition; label: string; icon: string }[] = [
  { key: 'center', label: 'Center', icon: '◎' },
  { key: 'left-chest', label: 'Left Chest', icon: '◧' },
  { key: 'full-back', label: 'Full Back', icon: '▣' },
];

const LOGO_AREA: Record<LogoPosition, { x: number; y: number; maxScale: number }> = {
  center: { x: 0.5, y: 0.45, maxScale: 1 },
  'left-chest': { x: 0.35, y: 0.35, maxScale: 0.5 },
  'full-back': { x: 0.5, y: 0.45, maxScale: 1.4 },
};

// ---------------------------------------------------------------------------
// Product SVGs
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<ProductColor, ColorOption> = Object.fromEntries(COLORS.map((c) => [c.key, c])) as Record<ProductColor, ColorOption>;

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
// Sparkle burst effect
// ---------------------------------------------------------------------------

function SparkBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-accent"
          style={{
            left: '50%',
            top: '50%',
            animation: `spark-fly 0.6s ease-out ${i * 0.04}s forwards`,
            '--spark-angle': `${i * 45}deg`,
            opacity: 0,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress indicator (game-style completion tracker)
// ---------------------------------------------------------------------------

function StepTracker({ steps }: { steps: { label: string; done: boolean }[] }) {
  const completed = steps.filter((s) => s.done).length;
  const pct = (completed / steps.length) * 100;

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'linear-gradient(90deg, hsl(var(--success)), hsl(152 60% 50%))'
              : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
          }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-muted-foreground tabular-nums">
        {completed}/{steps.length}
      </span>
      {pct === 100 && (
        <Trophy className="h-4 w-4 text-accent animate-bounce" />
      )}
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
  const [sparkProduct, setSparkProduct] = useState(false);
  const [sparkColor, setSparkColor] = useState(false);
  const [productIndex, setProductIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);

  const activeColor = COLOR_MAP[color];
  const posConfig = LOGO_AREA[position];

  // Track completion for game-style progress
  const steps = [
    { label: 'Upload logo', done: !!logo },
    { label: 'Pick product', done: product !== 'tshirt' || !!logo },
    { label: 'Choose color', done: color !== 'white' },
    { label: 'Set placement', done: position !== 'center' || scale !== 60 },
  ];

  // Sync productIndex when product changes externally
  useEffect(() => {
    const idx = PRODUCTS.findIndex((p) => p.key === product);
    if (idx >= 0) setProductIndex(idx);
  }, [product]);

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

  // --- Product carousel navigation ---
  const goProduct = useCallback((dir: 'left' | 'right') => {
    setSlideDir(dir);
    setSparkProduct(true);
    setTimeout(() => { setSparkProduct(false); setSlideDir(null); }, 500);
    setProductIndex((prev) => {
      const next = dir === 'right'
        ? (prev + 1) % PRODUCTS.length
        : (prev - 1 + PRODUCTS.length) % PRODUCTS.length;
      setProduct(PRODUCTS[next].key);
      return next;
    });
  }, []);

  // --- Color with spark ---
  const selectColor = useCallback((c: ProductColor) => {
    setColor(c);
    setSparkColor(true);
    setTimeout(() => setSparkColor(false), 500);
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

    ctx.fillStyle = '#0C0A1A';
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
    <div className="space-y-4">
      {/* Game-style progress bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <StepTracker steps={steps} />
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* ===== STAGE — immersive preview area ===== */}
        <div className="relative rounded-2xl overflow-hidden bg-[#0C0A1A] min-h-[520px] flex flex-col">
          {/* Animated background layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full blur-[100px] transition-colors duration-700"
              style={{ backgroundColor: activeColor.hex === '#FFFFFF' ? 'rgba(139,92,246,0.08)' : `${activeColor.hex}22` }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0C0A1A] to-transparent" />
            {/* Grid floor effect */}
            <div className="absolute bottom-0 left-0 right-0 h-32 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 20px',
                transform: 'perspective(400px) rotateX(60deg)',
                transformOrigin: 'bottom',
              }}
            />
          </div>

          {/* Product on stage */}
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div
              ref={productRef}
              className={cn(
                'relative w-[280px] h-[320px] sm:w-[340px] sm:h-[380px] transition-all duration-500 ease-out',
                slideDir === 'right' && 'animate-slide-in-right',
                slideDir === 'left' && 'animate-slide-in-left',
              )}
            >
              <div className="transition-transform duration-300 ease-out hover:scale-[1.02] w-full h-full">
                <ProductSvg product={product} fill={activeColor.svgFill} />
              </div>

              {/* Logo overlay */}
              {logo && (
                <img
                  src={logo}
                  alt="Logo preview"
                  className="absolute pointer-events-none object-contain transition-all duration-500 ease-out drop-shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  style={logoStyle}
                />
              )}

              <SparkBurst active={sparkProduct || sparkColor} />
            </div>
          </div>

          {/* Product carousel controls — bottom of stage */}
          <div className="relative z-10 pb-4 px-4">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => goProduct('left')}
                className="h-9 w-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 min-w-[160px] justify-center">
                <span className="text-2xl">{currentProduct.emoji}</span>
                <span className="text-white font-heading font-semibold text-sm tracking-wide">
                  {currentProduct.label}
                </span>
              </div>

              <button
                onClick={() => goProduct('right')}
                className="h-9 w-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-2.5">
              {PRODUCTS.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => { setProduct(p.key); setProductIndex(i); }}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === productIndex
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-white/20 hover:bg-white/40'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-white/10 text-white/80 border-white/10 backdrop-blur-sm text-[11px]">
              <Sparkles className="h-3 w-3 mr-1 text-accent" />
              Live Preview
            </Badge>
          </div>
        </div>

        {/* ===== CONTROLS PANEL ===== */}
        <div className="space-y-3">
          {/* Upload zone — dramatic, game-like */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden group',
              isDragging
                ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                : logo
                  ? 'border-success/40 bg-success/5 hover:bg-success/8'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            {logo ? (
              <div className="flex items-center gap-3 p-3">
                <img src={logo} alt="Logo" className="h-14 w-14 object-contain rounded-lg bg-muted/20 p-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span className="text-sm font-medium text-success">Logo loaded</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Click to change</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 px-4">
                <div className={cn(
                  'h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300',
                  isDragging
                    ? 'bg-primary/20 scale-110 rotate-3'
                    : 'bg-muted/40 group-hover:bg-primary/10 group-hover:scale-105'
                )}>
                  <Upload className={cn(
                    'h-6 w-6 transition-colors duration-200',
                    isDragging ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-primary/60'
                  )} />
                </div>
                <p className="text-sm font-medium">Drop your logo here</p>
                <p className="text-[11px] text-muted-foreground mt-1">PNG, SVG, or JPG</p>
              </div>
            )}
            {isDragging && (
              <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

          {/* Color picker — orbiting swatches */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color</span>
              <span className="text-xs font-medium text-foreground">{activeColor.label}</span>
            </div>
            <div className="flex gap-2.5 justify-center">
              {COLORS.map((c) => {
                const isActive = color === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => selectColor(c.key)}
                    title={c.label}
                    className={cn(
                      'relative h-10 w-10 rounded-xl transition-all duration-300',
                      isActive
                        ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg'
                        : 'hover:scale-105 hover:shadow-md border border-border/50'
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && (
                      <Check className={cn(
                        'absolute inset-0 m-auto h-4 w-4',
                        c.key === 'white' || c.key === 'grey' ? 'text-foreground/70' : 'text-white/90'
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Placement — position + scale */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Crosshair className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Placement</span>
            </div>

            {/* Position toggle */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-muted/30">
              {POSITIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPosition(p.key)}
                  className={cn(
                    'rounded-lg py-2.5 text-center transition-all duration-200 relative',
                    position === p.key
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <div className="text-base leading-none">{p.icon}</div>
                  <div className="text-[10px] font-medium mt-1">{p.label}</div>
                </button>
              ))}
            </div>

            {/* Scale slider — styled as a game slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ZoomIn className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scale</span>
                </div>
                <span className="text-sm font-mono font-bold tabular-nums bg-muted/50 rounded-md px-2 py-0.5">
                  {scale}%
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.4)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-[0_0_16px_rgba(139,92,246,0.6)]"
                />
                {/* Filled track */}
                <div
                  className="absolute top-0 left-0 h-2 rounded-full pointer-events-none"
                  style={{
                    width: `${((scale - 20) / 80) * 100}%`,
                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons — dramatic CTA */}
          <div className="space-y-2 pt-1">
            <Button
              className={cn(
                'w-full h-11 font-heading font-semibold text-sm tracking-wide transition-all duration-300',
                logo
                  ? 'shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]'
                  : ''
              )}
              onClick={downloadMockup}
              disabled={!logo}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Mockup
            </Button>
            <Button
              variant="outline"
              className="w-full border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
              onClick={() => navigate('/communications')}
              disabled={!logo}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Manufacturer
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
