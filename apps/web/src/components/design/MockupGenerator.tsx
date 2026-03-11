import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Upload, Download, Send, RotateCcw, ZoomIn, Check,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Ruler, Palette, MapPin, Image as ImageIcon, Layers,
} from 'lucide-react';

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
  { key: 'forest', label: 'Forest', hex: '#2D4A2D', svgFill: '#2D4A2D' },
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

const COLOR_MAP: Record<ProductColor, ColorOption> = Object.fromEntries(COLORS.map((c) => [c.key, c])) as Record<ProductColor, ColorOption>;

// Chrome tokens
const c = {
  panel: 'bg-[#3C3C3C]',
  panelAlt: 'bg-[#333333]',
  border: 'border-[#1E1E1E]',
  borderLight: 'border-[#4A4A4A]',
  text: 'text-[#CCCCCC]',
  textDim: 'text-[#8A8A8A]',
  textBright: 'text-[#E8E8E8]',
  input: 'bg-[#2B2B2B]',
  hover: 'hover:bg-[#454545]',
  active: 'bg-[#4A4A4A]',
  focusRing: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9BD5]',
};

// ---------------------------------------------------------------------------
// Product SVGs
// ---------------------------------------------------------------------------

function ProductSvg({ product, fill }: { product: ProductType; fill: string }) {
  const stroke = fill === '#F8F8F8' ? '#C8C5BC' : 'rgba(255,255,255,0.15)';
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
// Collapsible panel section (like Photoshop properties)
// ---------------------------------------------------------------------------

function PanelSection({
  icon: Icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('border-b', c.border)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-left transition-colors',
          c.hover, c.focusRing
        )}
      >
        <Icon className={cn('h-3 w-3 shrink-0', c.textDim)} />
        <span className={cn('text-[11px] font-semibold uppercase tracking-wider flex-1', c.text)}>
          {title}
        </span>
        {open ? (
          <ChevronUp className={cn('h-3 w-3', c.textDim)} />
        ) : (
          <ChevronDown className={cn('h-3 w-3', c.textDim)} />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MockupGenerator({ zoom = 100 }: { zoom?: number }) {
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

  const activeColor = COLOR_MAP[color];
  const posConfig = LOGO_AREA[position];
  const currentProduct = PRODUCTS[productIndex];

  useEffect(() => {
    const idx = PRODUCTS.findIndex((p) => p.key === product);
    if (idx >= 0) setProductIndex(idx);
  }, [product]);

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

  const goProduct = useCallback((dir: 'left' | 'right') => {
    setProductIndex((prev) => {
      const next = dir === 'right'
        ? (prev + 1) % PRODUCTS.length
        : (prev - 1 + PRODUCTS.length) % PRODUCTS.length;
      setProduct(PRODUCTS[next].key);
      return next;
    });
  }, []);

  const downloadMockup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 800, H = 900;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#ECEAE4';
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

  const logoSizePct = (scale / 100) * 55 * posConfig.maxScale;
  const logoStyle = {
    width: `${logoSizePct}%`,
    left: `${posConfig.x * 100}%`,
    top: `${posConfig.y * 100}%`,
    transform: 'translate(-50%, -50%)',
  };

  const canvasScale = zoom / 100;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== CANVAS WORKSPACE ===== */}
      <div className="flex-1 overflow-auto relative bg-[#1E1E1E]">
        {/* Checkerboard pattern (like transparency in Photoshop) */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />

        {/* Canvas artboard */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative bg-[#ECEAE4] shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.4)] transition-transform duration-200 motion-reduce:transition-none"
            style={{
              width: 440,
              height: 500,
              transform: `scale(${canvasScale})`,
            }}
          >
            {/* Product centered on artboard */}
            <div ref={productRef} className="absolute inset-0 flex items-center justify-center p-8">
              <div className="relative w-[280px] h-[320px]">
                <ProductSvg product={product} fill={activeColor.svgFill} />
                {logo && (
                  <img
                    src={logo}
                    alt="Logo preview"
                    className="absolute pointer-events-none object-contain transition-all duration-200 motion-reduce:transition-none"
                    style={logoStyle}
                  />
                )}
              </div>
            </div>

            {/* Artboard label */}
            <div className="absolute -top-5 left-0">
              <span className="text-[10px] font-mono text-[#8A8A8A]">
                {currentProduct.label} — {activeColor.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PROPERTIES PANEL (right side, like Photoshop) ===== */}
      <div className={cn('w-[260px] shrink-0 flex flex-col border-l overflow-y-auto', c.panel, c.border)}>
        {/* Panel header */}
        <div className={cn('px-3 py-2 border-b flex items-center justify-between', c.border)}>
          <span className={cn('text-[11px] font-semibold uppercase tracking-wider', c.text)}>Properties</span>
          <button
            onClick={reset}
            className={cn('h-5 w-5 rounded flex items-center justify-center', c.textDim, c.hover, c.focusRing)}
            aria-label="Reset all"
            title="Reset all"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        {/* === Logo section === */}
        <PanelSection icon={ImageIcon} title="Logo">
          <div
            role="button"
            tabIndex={0}
            aria-label={logo ? 'Logo uploaded. Click to change' : 'Upload logo'}
            onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={onUploadKeyDown}
            className={cn(
              'rounded border border-dashed cursor-pointer transition-colors duration-150',
              c.focusRing,
              isDragging
                ? 'border-[#5B9BD5] bg-[#5B9BD5]/10'
                : logo
                  ? 'border-[#4A4A4A] bg-[#2B2B2B]'
                  : cn('border-[#4A4A4A]', c.hover)
            )}
          >
            {logo ? (
              <div className="flex items-center gap-2 p-2">
                <img src={logo} alt="Logo" className="h-10 w-10 object-contain rounded bg-[#2B2B2B] p-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-[#4EC9B0]" />
                    <span className={cn('text-[11px]', c.text)}>Loaded</span>
                  </div>
                  <p className={cn('text-[10px]', c.textDim)}>Click to swap</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 px-2">
                <Upload className={cn('h-4 w-4 mb-1.5', c.textDim)} />
                <p className={cn('text-[11px]', c.textDim)}>Drop logo or click</p>
                <p className={cn('text-[9px] mt-0.5', 'text-[#666]')}>PNG, SVG, JPG</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </PanelSection>

        {/* === Product section === */}
        <PanelSection icon={Layers} title="Product">
          <div className="flex items-center gap-1.5">
            <button
              aria-label="Previous product"
              onClick={() => goProduct('left')}
              className={cn('h-6 w-6 rounded flex items-center justify-center shrink-0', c.input, c.hover, c.textDim, c.focusRing)}
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <div className={cn('flex-1 text-center text-[11px] font-medium py-1 rounded', c.input, c.text)}>
              {currentProduct.label}
            </div>
            <button
              aria-label="Next product"
              onClick={() => goProduct('right')}
              className={cn('h-6 w-6 rounded flex items-center justify-center shrink-0', c.input, c.hover, c.textDim, c.focusRing)}
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {/* Product grid */}
          <div className="grid grid-cols-3 gap-1 mt-2">
            {PRODUCTS.map((p) => (
              <button
                key={p.key}
                onClick={() => setProduct(p.key)}
                className={cn(
                  'rounded px-1 py-1.5 text-[10px] font-medium text-center transition-colors duration-100',
                  c.focusRing,
                  product === p.key
                    ? cn(c.active, c.textBright)
                    : cn(c.textDim, c.hover)
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </PanelSection>

        {/* === Color section === */}
        <PanelSection icon={Palette} title="Color">
          <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Product color">
            {COLORS.map((col) => {
              const isActive = color === col.key;
              return (
                <button
                  key={col.key}
                  role="radio"
                  aria-checked={isActive}
                  aria-label={col.label}
                  onClick={() => setColor(col.key)}
                  className={cn(
                    'relative h-7 w-7 rounded transition-all duration-100',
                    c.focusRing,
                    isActive
                      ? 'ring-1 ring-[#5B9BD5] ring-offset-1 ring-offset-[#3C3C3C]'
                      : 'ring-1 ring-[#1E1E1E] hover:ring-[#5B9BD5]/50'
                  )}
                  style={{ backgroundColor: col.hex }}
                >
                  {isActive && (
                    <Check className={cn(
                      'absolute inset-0 m-auto h-3 w-3',
                      col.key === 'white' || col.key === 'grey' ? 'text-[#333]' : 'text-white/80'
                    )} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className={cn('text-[10px]', c.textDim)}>Active</span>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm border border-[#1E1E1E]" style={{ backgroundColor: activeColor.hex }} />
              <span className={cn('text-[10px] font-mono', c.text)}>{activeColor.hex}</span>
            </div>
          </div>
        </PanelSection>

        {/* === Position section === */}
        <PanelSection icon={MapPin} title="Position">
          <div className={cn('grid grid-cols-3 gap-0.5 p-0.5 rounded', c.input)} role="radiogroup" aria-label="Logo position">
            {POSITIONS.map((p) => (
              <button
                key={p.key}
                role="radio"
                aria-checked={position === p.key}
                onClick={() => setPosition(p.key)}
                className={cn(
                  'rounded py-1.5 text-[10px] font-medium text-center transition-colors duration-100',
                  c.focusRing,
                  position === p.key
                    ? cn(c.active, c.textBright)
                    : cn(c.textDim, c.hover)
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </PanelSection>

        {/* === Scale section === */}
        <PanelSection icon={ZoomIn} title="Scale">
          <div className="flex items-center gap-2">
            <input
              id="logo-scale"
              type="range"
              min={20}
              max={100}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className={cn(
                'flex-1 h-1 rounded-full appearance-none cursor-pointer bg-[#1E1E1E]',
                '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#CCCCCC] [&::-webkit-slider-thumb]:border-[1px] [&::-webkit-slider-thumb]:border-[#1E1E1E]',
                'focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:ring-1 [&:focus-visible::-webkit-slider-thumb]:ring-[#5B9BD5]'
              )}
            />
            <input
              type="number"
              min={20}
              max={100}
              value={scale}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 20 && v <= 100) setScale(v);
              }}
              className={cn(
                'w-12 h-5 text-[10px] font-mono text-center rounded border tabular-nums',
                c.input, c.borderLight, c.text,
                c.focusRing
              )}
            />
          </div>
        </PanelSection>

        {/* Spacer */}
        <div className="flex-1" />

        {/* === Export actions (bottom of panel) === */}
        <div className={cn('p-3 border-t space-y-1.5', c.border)}>
          <button
            onClick={downloadMockup}
            disabled={!logo}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full h-7 rounded text-[11px] font-medium transition-colors duration-100',
              c.focusRing,
              logo
                ? 'bg-[#5B9BD5] text-white hover:bg-[#4A8BC4]'
                : 'bg-[#4A4A4A] text-[#666] cursor-not-allowed'
            )}
          >
            <Download className="h-3 w-3" />
            Export PNG
          </button>
          <button
            onClick={() => navigate('/communications')}
            disabled={!logo}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full h-7 rounded text-[11px] font-medium transition-colors duration-100 border',
              c.focusRing,
              logo
                ? cn(c.borderLight, c.text, c.hover)
                : 'border-[#3C3C3C] text-[#666] cursor-not-allowed'
            )}
          >
            <Send className="h-3 w-3" />
            Send to Manufacturer
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
