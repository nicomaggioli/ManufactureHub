import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Share2,
  FileDown,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Scissors,
  Layers,
  Ruler,
  Palette,
  Tag,
  Package,
  Shirt,
  ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MaterialRow {
  name: string;
  type: string;
  color: string;
  supplier: string;
  unitCost: number;
  usagePerUnit: string;
}

interface MeasurementRow {
  label: string;
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
}

interface ConstructionDetail {
  label: string;
  value: string;
}

interface Colorway {
  name: string;
  hex: string;
  pantone: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface LabelSpec {
  type: string;
  placement: string;
  content: string;
}

interface TechPackData {
  id: string;
  productName: string;
  sku: string;
  season: string;
  category: string;
  description: string;
  targetCost: number;
  targetRetail: number;
  status: 'draft' | 'review' | 'approved';
  materials: MaterialRow[];
  measurements: MeasurementRow[];
  construction: ConstructionDetail[];
  specialInstructions: string[];
  colorways: Colorway[];
  labels: LabelSpec[];
  careInstructions: string[];
  packagingRequirements: string[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const TECH_PACKS: TechPackData[] = [
  {
    id: 'tp-001',
    productName: 'Heritage Wool Blend Overcoat',
    sku: 'OC-HW-2026-001',
    season: 'FW26',
    category: 'Outerwear',
    description:
      'Double-breasted overcoat in a premium wool-cashmere blend. Features a notched lapel, flap pockets, and a half-canvas construction for a refined drape. Fully lined with a signature jacquard interior.',
    targetCost: 142.0,
    targetRetail: 495.0,
    status: 'review',
    materials: [
      { name: 'Wool-Cashmere Twill', type: 'Shell', color: 'Charcoal Melange', supplier: 'Loro Piana', unitCost: 48.5, usagePerUnit: '3.2 m' },
      { name: 'Cupro Bemberg', type: 'Lining', color: 'Burgundy', supplier: 'Asahi Kasei', unitCost: 12.0, usagePerUnit: '2.8 m' },
      { name: 'Horsehair Canvas', type: 'Interlining', color: 'Natural', supplier: 'Wendler', unitCost: 8.75, usagePerUnit: '0.6 m' },
      { name: 'Heckenbach Buttons', type: 'Trim', color: 'Dark Horn', supplier: 'EUTrim GmbH', unitCost: 3.2, usagePerUnit: '8 pcs' },
      { name: 'Coats Epic Thread', type: 'Thread', color: 'Charcoal #412', supplier: 'Coats Group', unitCost: 1.1, usagePerUnit: '320 m' },
      { name: 'Woven Edge Tape', type: 'Trim', color: 'Gold', supplier: 'Samtex', unitCost: 0.85, usagePerUnit: '2.4 m' },
    ],
    measurements: [
      { label: 'Chest (cm)', xs: 98, s: 102, m: 108, l: 114, xl: 120 },
      { label: 'Waist (cm)', xs: 90, s: 94, m: 100, l: 106, xl: 112 },
      { label: 'Body Length (cm)', xs: 102, s: 104, m: 106, l: 108, xl: 110 },
      { label: 'Sleeve Length (cm)', xs: 62, s: 63.5, m: 65, l: 66.5, xl: 68 },
      { label: 'Shoulder Width (cm)', xs: 43, s: 44.5, m: 46, l: 47.5, xl: 49 },
      { label: 'Back Width (cm)', xs: 38, s: 39.5, m: 41, l: 42.5, xl: 44 },
    ],
    construction: [
      { label: 'Seam Type', value: 'Open seam with 1.5 cm SA, pressed and edge-stitched' },
      { label: 'Stitch Count', value: '5 SPI (stitches per inch) body; 7 SPI topstitch' },
      { label: 'Shoulder Construction', value: 'Half-canvas with hand-padded lapels' },
      { label: 'Pocket Style', value: 'Double-welt flap pockets (flap 4.5 cm), 1 interior welt pocket' },
      { label: 'Button Attachment', value: 'Cross-stitch with shank, reinforced with stay button on reverse' },
      { label: 'Hem Finish', value: 'Blind hem stitch, 4 cm turn-up' },
      { label: 'Lining Attachment', value: 'Jump-stitched at shoulder, French tack at hem' },
    ],
    specialInstructions: [
      'Pattern must be matched at centre back seam and pocket flaps.',
      'Lapel roll line should break naturally at second button.',
      'All internal seams to be bound with lining fabric strip.',
      'Press garment with steam at controlled temperature (max 150 C) before shipping.',
    ],
    colorways: [
      { name: 'Charcoal Melange', hex: '#3B3B3B', pantone: '19-0201 TCX', status: 'approved' },
      { name: 'Camel', hex: '#C19A6B', pantone: '16-1334 TCX', status: 'approved' },
      { name: 'Navy Herringbone', hex: '#1B2A4A', pantone: '19-4028 TCX', status: 'pending' },
      { name: 'Heather Oat', hex: '#C8B99A', pantone: '14-1116 TCX', status: 'pending' },
    ],
    labels: [
      { type: 'Main Label', placement: 'Centre back neck, sewn into collar seam', content: 'Brand logo, woven damask on black satin ground' },
      { type: 'Size Label', placement: 'Below main label, centre back neck', content: 'Size designation (XS-XL), printed on white satin' },
      { type: 'Care Label', placement: 'Left side seam at waist, inside lining', content: 'Care symbols + composition in EN / FR / DE / ES / IT' },
      { type: 'Country of Origin', placement: 'Below care label', content: '"Made in Italy" printed label' },
      { type: 'Hangtag', placement: 'Attached to second button with waxed cord', content: 'Brand hangtag on 350 gsm cotton card with gold foil' },
    ],
    careInstructions: [
      'Dry clean only',
      'Do not bleach',
      'Iron on low heat with press cloth',
      'Do not tumble dry',
      'Store on padded hanger',
    ],
    packagingRequirements: [
      'Individual garment bag — non-woven breathable fabric, branded print',
      'Padded velvet hanger (black, gold hook)',
      'Tissue paper interleave at shoulders and in sleeves',
      'Hang-tag attached with waxed cotton cord, sealed with branded clasp',
      'Shipping carton: double-wall corrugated, max 6 units per box',
    ],
  },
  {
    id: 'tp-002',
    productName: 'Structured Linen Blazer',
    sku: 'BZ-SL-2026-003',
    season: 'SS26',
    category: 'Tailoring',
    description:
      'Unconstructed single-breasted blazer in washed European linen. Patch pockets, natural shoulder, and contrast melange lining for warm-weather sophistication.',
    targetCost: 78.0,
    targetRetail: 285.0,
    status: 'approved',
    materials: [
      { name: 'Belgian Linen Plainweave', type: 'Shell', color: 'Sand', supplier: 'Libeco', unitCost: 28.0, usagePerUnit: '2.1 m' },
      { name: 'Cotton-Linen Blend', type: 'Lining', color: 'Ecru Melange', supplier: 'Albini Group', unitCost: 9.5, usagePerUnit: '1.6 m' },
      { name: 'Corozo Buttons', type: 'Trim', color: 'Natural Tan', supplier: 'BYK Buttons', unitCost: 2.1, usagePerUnit: '5 pcs' },
      { name: 'Cotton Thread', type: 'Thread', color: 'Sand #208', supplier: 'Gutermann', unitCost: 0.9, usagePerUnit: '240 m' },
    ],
    measurements: [
      { label: 'Chest (cm)', xs: 96, s: 100, m: 106, l: 112, xl: 118 },
      { label: 'Waist (cm)', xs: 88, s: 92, m: 98, l: 104, xl: 110 },
      { label: 'Body Length (cm)', xs: 70, s: 72, m: 74, l: 76, xl: 78 },
      { label: 'Sleeve Length (cm)', xs: 60, s: 61.5, m: 63, l: 64.5, xl: 66 },
      { label: 'Shoulder Width (cm)', xs: 42, s: 43.5, m: 45, l: 46.5, xl: 48 },
    ],
    construction: [
      { label: 'Seam Type', value: 'Flat-felled seams, 1.2 cm SA' },
      { label: 'Stitch Count', value: '6 SPI body' },
      { label: 'Shoulder Construction', value: 'Unconstructed, natural shoulder with no padding' },
      { label: 'Pocket Style', value: 'Patch pockets with mitred corners, 1 interior welt pocket' },
      { label: 'Button Attachment', value: 'Cross-stitch, no shank' },
      { label: 'Hem Finish', value: 'Double-fold blind hem, 3 cm turn-up' },
    ],
    specialInstructions: [
      'Pre-wash shell fabric for lived-in hand feel.',
      'Slight natural wrinkling is acceptable and desired.',
      'Ensure pocket patch alignment is symmetrical.',
    ],
    colorways: [
      { name: 'Sand', hex: '#D2B48C', pantone: '14-1118 TCX', status: 'approved' },
      { name: 'Dusty Blue', hex: '#6B8FAD', pantone: '16-4120 TCX', status: 'approved' },
      { name: 'Olive', hex: '#6B6B3C', pantone: '18-0527 TCX', status: 'rejected' },
    ],
    labels: [
      { type: 'Main Label', placement: 'Centre back neck', content: 'Brand logo, woven on natural cotton' },
      { type: 'Size Label', placement: 'Below main label', content: 'Size designation (XS-XL)' },
      { type: 'Care Label', placement: 'Left side seam', content: 'Care symbols + composition, multi-language' },
    ],
    careInstructions: [
      'Machine wash cold, gentle cycle',
      'Hang dry',
      'Iron on medium heat',
      'Do not bleach',
    ],
    packagingRequirements: [
      'Folded in branded tissue paper',
      'Recyclable cardboard box with brand sticker seal',
      'Hang-tag attached with cotton string',
    ],
  },
  {
    id: 'tp-003',
    productName: 'Merino Turtleneck Sweater',
    sku: 'KN-MT-2026-007',
    season: 'FW26',
    category: 'Knitwear',
    description:
      'Fine-gauge turtleneck in extra-fine merino wool. Fully-fashioned construction with ribbed cuffs and hem. 12-gauge jersey knit body with 2x2 rib at neck, cuffs, and waistband.',
    targetCost: 52.0,
    targetRetail: 195.0,
    status: 'draft',
    materials: [
      { name: 'Extra-Fine Merino 19.5 mic', type: 'Yarn', color: 'Midnight', supplier: 'Zegna Baruffa', unitCost: 24.0, usagePerUnit: '380 g' },
      { name: 'Linking Thread', type: 'Thread', color: 'Midnight Match', supplier: 'Coats Group', unitCost: 0.6, usagePerUnit: '80 m' },
    ],
    measurements: [
      { label: 'Chest (cm)', xs: 94, s: 98, m: 104, l: 110, xl: 116 },
      { label: 'Body Length (cm)', xs: 64, s: 66, m: 68, l: 70, xl: 72 },
      { label: 'Sleeve Length (cm)', xs: 60, s: 61, m: 62.5, l: 64, xl: 65.5 },
      { label: 'Neck Height (cm)', xs: 18, s: 18, m: 18.5, l: 18.5, xl: 19 },
      { label: 'Cuff Width (cm)', xs: 8, s: 8.5, m: 9, l: 9.5, xl: 10 },
    ],
    construction: [
      { label: 'Knit Gauge', value: '12 GG jersey body, 12 GG 2x2 rib at neck / cuffs / hem' },
      { label: 'Linking', value: 'Fully-fashioned, 1x1 linked seams at shoulder and side' },
      { label: 'Neck Construction', value: 'Tubular knit turtleneck, double-layer fold' },
      { label: 'Finishing', value: 'Steam press, shape on form' },
    ],
    specialInstructions: [
      'All panels must be knit on same machine lot to avoid shade variation.',
      'Turtleneck must fold naturally without curl at top edge.',
      'Anti-pilling treatment required before finishing.',
    ],
    colorways: [
      { name: 'Midnight', hex: '#191970', pantone: '19-3933 TCX', status: 'approved' },
      { name: 'Ivory', hex: '#FFFFF0', pantone: '11-0602 TCX', status: 'approved' },
      { name: 'Forest', hex: '#2D4A2D', pantone: '19-6311 TCX', status: 'pending' },
      { name: 'Bordeaux', hex: '#6B1C2A', pantone: '19-1725 TCX', status: 'pending' },
      { name: 'Heather Grey', hex: '#9E9E9E', pantone: '16-4703 TCX', status: 'approved' },
    ],
    labels: [
      { type: 'Main Label', placement: 'Centre back neck, inside turtleneck fold', content: 'Printed heat-transfer logo on satin' },
      { type: 'Size Label', placement: 'Integrated with main label', content: 'Size designation' },
      { type: 'Care Label', placement: 'Left side seam at hip', content: 'Care symbols + 100% Extra-Fine Merino Wool' },
    ],
    careInstructions: [
      'Hand wash cold or dry clean',
      'Lay flat to dry',
      'Do not wring or tumble dry',
      'Cool iron if needed',
      'Store folded, not on hanger',
    ],
    packagingRequirements: [
      'Folded with acid-free tissue paper insert',
      'Polybag with ventilation holes (recyclable PE)',
      'Brand belly band with product info',
      'Shipping: flat-pack in carton, max 12 units per box',
    ],
  },
];

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'overview', label: 'Overview', icon: Layers },
  { key: 'materials', label: 'Materials & BOM', icon: Package },
  { key: 'measurements', label: 'Measurements', icon: Ruler },
  { key: 'construction', label: 'Construction', icon: Scissors },
  { key: 'colorways', label: 'Colorways', icon: Palette },
  { key: 'labels', label: 'Labels & Packaging', icon: Tag },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

const STATUS_BADGE_MAP: Record<TechPackData['status'], { label: string; variant: 'default' | 'warning' | 'outline'; icon: typeof CheckCircle2 }> = {
  draft: { label: 'Draft', variant: 'outline', icon: Clock },
  review: { label: 'In Review', variant: 'warning', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
};

const COLORWAY_STATUS_MAP: Record<Colorway['status'], { variant: 'default' | 'warning' | 'destructive'; icon: typeof CheckCircle2 }> = {
  approved: { variant: 'default', icon: CheckCircle2 },
  pending: { variant: 'warning', icon: Clock },
  rejected: { variant: 'destructive', icon: XCircle },
};

const MATERIAL_TYPE_COLORS: Record<string, string> = {
  Shell: 'bg-blue-500/10 text-blue-700 border-blue-200',
  Lining: 'bg-purple-500/10 text-purple-700 border-purple-200',
  Interlining: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  Trim: 'bg-amber-500/10 text-amber-700 border-amber-200',
  Thread: 'bg-gray-500/10 text-gray-600 border-gray-200',
  Yarn: 'bg-rose-500/10 text-rose-700 border-rose-200',
};

// Simple garment category icon mapping
const CATEGORY_ICON_COLOR: Record<string, string> = {
  Outerwear: '#3B3B3B',
  Tailoring: '#D2B48C',
  Knitwear: '#191970',
};

function StatusBadge({ status }: { status: TechPackData['status'] }) {
  const { label, variant, icon: Icon } = STATUS_BADGE_MAP[status];
  return (
    <Badge variant={variant} className="rounded-full gap-1 px-2.5">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ColorwayStatusBadge({ status }: { status: Colorway['status'] }) {
  const { variant, icon: Icon } = COLORWAY_STATUS_MAP[status];
  return (
    <Badge variant={variant} className="rounded-full gap-1 px-2.5">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function MaterialTypeBadge({ type }: { type: string }) {
  const colorClass = MATERIAL_TYPE_COLORS[type] || 'bg-gray-500/10 text-gray-600 border-gray-200';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', colorClass)}>
      {type}
    </span>
  );
}

// Care instruction icon mapping
const CARE_ICONS: Record<string, string> = {
  'Dry clean': '\u{1F9F9}',
  'Do not bleach': '\u{1F6AB}',
  'Iron': '\u{1F455}',
  'Do not tumble': '\u{1F300}',
  'Store': '\u{1F4E6}',
  'Machine wash': '\u{1F4A7}',
  'Hang dry': '\u{1F4A8}',
  'Hand wash': '\u{1F4A7}',
  'Lay flat': '\u{2195}',
  'Do not wring': '\u{1F6AB}',
  'Cool iron': '\u{1F455}',
};

function getCareIcon(instruction: string): string {
  for (const [key, icon] of Object.entries(CARE_ICONS)) {
    if (instruction.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '\u{2022}';
}

// Construction detail icons
const CONSTRUCTION_ICONS: Record<string, typeof Scissors> = {
  'Seam': Scissors,
  'Stitch': Scissors,
  'Shoulder': Shirt,
  'Pocket': Layers,
  'Button': Tag,
  'Hem': Ruler,
  'Lining': Layers,
  'Knit': Layers,
  'Linking': Scissors,
  'Neck': Shirt,
  'Finishing': CheckCircle2,
};

function getConstructionIcon(label: string): typeof Scissors {
  for (const [key, icon] of Object.entries(CONSTRUCTION_ICONS)) {
    if (label.includes(key)) return icon;
  }
  return Layers;
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function OverviewTab({ pack }: { pack: TechPackData }) {
  const bomCost = pack.materials.reduce((sum, m) => sum + m.unitCost, 0);
  const margin = ((pack.targetRetail - pack.targetCost) / pack.targetRetail) * 100;
  const bomPct = (bomCost / pack.targetRetail) * 100;
  const costPct = (pack.targetCost / pack.targetRetail) * 100;

  return (
    <div className="space-y-5">
      {/* Hero illustration + product info */}
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* Garment illustration placeholder */}
        <Card className="animate-in overflow-hidden">
          <div className="relative bg-gradient-to-br from-muted/30 to-muted/60 h-[320px] flex flex-col items-center justify-center">
            {/* Garment silhouette */}
            <div className="w-40 h-48 opacity-[0.12]">
              <svg viewBox="0 0 200 230" className="w-full h-full">
                {pack.category === 'Knitwear' ? (
                  <path d="M62 32 L40 50 L12 85 L38 100 L52 78 L52 200 L148 200 L148 78 L162 100 L188 85 L160 50 L138 32 Q120 48 100 48 Q80 48 62 32 Z" fill="currentColor" />
                ) : (
                  <path d="M65 35 L40 55 L10 90 L35 105 L50 80 L50 205 L150 205 L150 80 L165 105 L190 90 L160 55 L135 35 Q120 20 100 15 Q80 20 65 35 Z" fill="currentColor" />
                )}
              </svg>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Technical illustration</p>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">Flat sketch placeholder</p>
            </div>
            {/* Colorway dots */}
            <div className="absolute top-4 right-4 flex gap-1.5">
              {pack.colorways.slice(0, 4).map((cw, i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: cw.hex }}
                  title={cw.name}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Product details */}
        <div className="space-y-4">
          <Card className="animate-in">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{pack.productName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className="rounded-full">{pack.season}</Badge>
                    <Badge variant="outline" className="rounded-full">{pack.category}</Badge>
                    <StatusBadge status={pack.status} />
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">{pack.sku}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/70">{pack.description}</p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-5 pt-4 border-t">
                <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                  <Share2 className="h-3.5 w-3.5" />
                  Share Tech Pack
                </Button>
                <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                  <FileDown className="h-3.5 w-3.5" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cost summary — visual breakdown */}
          <Card className="animate-in">
            <CardContent className="p-6">
              <h4 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Cost Breakdown</h4>

              {/* Visual bar */}
              <div className="relative h-8 rounded-full overflow-hidden bg-muted/30 mb-4">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-500/20 rounded-l-full flex items-center justify-center"
                  style={{ width: `${bomPct}%` }}
                >
                  <span className="text-[10px] font-medium text-blue-700">BOM</span>
                </div>
                <div
                  className="absolute inset-y-0 bg-amber-500/20 flex items-center justify-center"
                  style={{ left: `${bomPct}%`, width: `${costPct - bomPct}%` }}
                >
                  <span className="text-[10px] font-medium text-amber-700">Labor</span>
                </div>
                <div
                  className="absolute inset-y-0 right-0 bg-emerald-500/15 rounded-r-full flex items-center justify-center"
                  style={{ width: `${100 - costPct}%` }}
                >
                  <span className="text-[10px] font-medium text-emerald-700">Margin</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-blue-500/[0.04] border border-blue-100">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">BOM Cost</p>
                  <p className="text-lg font-semibold data-value">{formatCurrency(bomCost)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/[0.04] border border-amber-100">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Target Cost</p>
                  <p className="text-lg font-semibold data-value">{formatCurrency(pack.targetCost)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-100">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Margin</p>
                  <p className="text-lg font-semibold data-value text-emerald-600">{margin.toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm">
                <span className="text-muted-foreground">Target Retail</span>
                <span className="font-semibold data-value">{formatCurrency(pack.targetRetail)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MaterialsTab({ pack }: { pack: TechPackData }) {
  const totalCost = pack.materials.reduce((sum, m) => sum + m.unitCost, 0);

  return (
    <div className="space-y-5">
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Bill of Materials</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full">{pack.materials.length} items</Badge>
              <Button size="sm" variant="outline" className="rounded-full gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Material
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {['Material', 'Type', 'Color', 'Supplier', 'Unit Cost', 'Usage / Unit'].map((h) => (
                    <th key={h} className="pb-2.5 pr-4 text-left text-xs font-medium text-muted-foreground last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pack.materials.map((m, i) => (
                  <tr key={i} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-medium">{m.name}</td>
                    <td className="py-3 pr-4">
                      <MaterialTypeBadge type={m.type} />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border shadow-sm shrink-0"
                          style={{
                            backgroundColor: getColorHex(m.color),
                          }}
                        />
                        <span className="text-sm">{m.color}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{m.supplier}</td>
                    <td className="py-3 pr-4 data-value font-medium">{formatCurrency(m.unitCost)}</td>
                    <td className="py-3 data-value">{m.usagePerUnit}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={4} className="pt-3 text-right pr-4 text-xs font-medium text-muted-foreground">
                    Total Material Cost
                  </td>
                  <td className="pt-3 font-bold data-value text-accent text-base">
                    {formatCurrency(totalCost)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Visual cost breakdown bar */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Cost Distribution</h4>
            <div className="flex h-6 rounded-full overflow-hidden bg-muted/20">
              {pack.materials.map((m, i) => {
                const pct = (m.unitCost / totalCost) * 100;
                const typeColor = MATERIAL_TYPE_COLORS[m.type] || '';
                const bgColor = typeColor.includes('blue') ? 'bg-blue-500/40'
                  : typeColor.includes('purple') ? 'bg-purple-500/40'
                  : typeColor.includes('amber') ? 'bg-amber-500/40'
                  : typeColor.includes('rose') ? 'bg-rose-500/40'
                  : typeColor.includes('indigo') ? 'bg-indigo-500/40'
                  : 'bg-gray-400/40';
                return (
                  <div
                    key={i}
                    className={cn('h-full flex items-center justify-center transition-all hover:opacity-80', bgColor, i === 0 && 'rounded-l-full', i === pack.materials.length - 1 && 'rounded-r-full')}
                    style={{ width: `${pct}%` }}
                    title={`${m.name}: ${formatCurrency(m.unitCost)} (${pct.toFixed(0)}%)`}
                  >
                    {pct > 12 && <span className="text-[9px] font-medium truncate px-1">{m.name.split(' ')[0]}</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {pack.materials.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <MaterialTypeBadge type={m.type} />
                  <span>{m.name.split(' ').slice(0, 2).join(' ')}</span>
                  <span className="font-medium">{((m.unitCost / totalCost) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MeasurementsTab({ pack }: { pack: TechPackData }) {
  const [selectedSize, setSelectedSize] = useState<string>('m');
  const sizes = ['XS', 'S', 'M', 'L', 'XL'] as const;
  const sizeKeys: (keyof MeasurementRow)[] = ['xs', 's', 'm', 'l', 'xl'];
  const sizeConversion: Record<string, { us: string; uk: string; eu: string }> = {
    XS: { us: '0-2', uk: '4-6', eu: '32-34' },
    S: { us: '4-6', uk: '8-10', eu: '36-38' },
    M: { us: '8-10', uk: '12-14', eu: '40-42' },
    L: { us: '12-14', uk: '16-18', eu: '44-46' },
    XL: { us: '16-18', uk: '20-22', eu: '48-50' },
  };

  return (
    <div className="space-y-5">
      {/* Measurement diagram placeholder */}
      <Card className="animate-in overflow-hidden">
        <div className="relative bg-gradient-to-br from-muted/20 to-muted/40 py-8 px-6 flex items-center gap-8">
          {/* Garment outline with measurement indicators */}
          <div className="w-36 h-44 shrink-0 relative opacity-[0.15] hidden sm:block">
            <svg viewBox="0 0 200 230" className="w-full h-full">
              <path d="M65 35 L40 55 L10 90 L35 105 L50 80 L50 205 L150 205 L150 80 L165 105 L190 90 L160 55 L135 35 Q120 20 100 15 Q80 20 65 35 Z" fill="currentColor" />
            </svg>
            {/* Measurement lines */}
            <div className="absolute top-[35%] left-[15%] right-[15%] border-t border-dashed border-primary/40" />
            <div className="absolute top-[30%] bottom-[10%] left-[50%] border-l border-dashed border-primary/40" />
            <div className="absolute top-[20%] left-[20%] right-[50%] border-t border-dashed border-amber-500/40" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-1">Measurement Reference</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All measurements are taken flat. Click on a size to highlight it in the table below.
              Dashed lines indicate primary measurement points on the garment.
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s.toLowerCase())}
                  className={cn(
                    'h-9 w-9 rounded-lg text-xs font-semibold transition-all duration-200',
                    selectedSize === s.toLowerCase()
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="animate-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Size Chart & Measurements</CardTitle>
            <Badge variant="outline" className="rounded-full">Tolerance +/- 1 cm</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">
                    Measurement
                  </th>
                  {sizes.map((s) => (
                    <th
                      key={s}
                      className={cn(
                        'pb-2.5 px-4 text-center text-xs font-medium transition-colors cursor-pointer',
                        selectedSize === s.toLowerCase()
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => setSelectedSize(s.toLowerCase())}
                    >
                      <div className={cn(
                        'rounded-lg py-1.5 -mx-1 transition-colors',
                        selectedSize === s.toLowerCase() && 'bg-primary/5'
                      )}>
                        <span className="font-semibold block">{s}</span>
                        <span className="text-[9px] text-muted-foreground/60 block mt-0.5">
                          US {sizeConversion[s].us}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pack.measurements.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-medium">{row.label}</td>
                    {sizeKeys.map((key) => (
                      <td
                        key={key}
                        className={cn(
                          'py-3 px-4 text-center data-value transition-all',
                          selectedSize === key
                            ? 'font-semibold text-primary bg-primary/[0.03]'
                            : ''
                        )}
                      >
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 pt-4 border-t rounded-xl bg-muted/20 p-4 -mx-1">
            <div className="flex items-start gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground/80 mb-1">Grading Notes</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All measurements taken flat. Tolerance: +/- 1 cm for body measurements, +/- 0.5 cm for detail measurements.
                  Grading based on 2 cm increments between sizes (chest/waist), 2 cm increments for length.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConstructionTab({ pack }: { pack: TechPackData }) {
  return (
    <div className="space-y-5">
      {/* Construction details as cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {pack.construction.map((detail, i) => {
          const Icon = getConstructionIcon(detail.label);
          return (
            <Card key={i} className="animate-in hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{detail.label}</h4>
                    <p className="text-sm leading-relaxed">{detail.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Special instructions — attention styling */}
      <Card className="animate-in border-amber-200 bg-amber-500/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-amber-800">Special Instructions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {pack.specialInstructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-amber-600">{i + 1}</span>
                </div>
                {instruction}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ColorwaysTab({ pack }: { pack: TechPackData }) {
  return (
    <div className="space-y-5">
      {/* Color palette strip */}
      <Card className="animate-in overflow-hidden">
        <div className="flex h-16">
          {pack.colorways.map((cw, i) => (
            <div
              key={i}
              className="flex-1 relative group cursor-default transition-all hover:flex-[1.5]"
              style={{ backgroundColor: cw.hex }}
              title={`${cw.name} — ${cw.pantone}`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm',
                  isLightColor(cw.hex) ? 'bg-black/10 text-foreground' : 'bg-white/20 text-white'
                )}>
                  {cw.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Colorway cards — large swatches */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Colorways</CardTitle>
            <Badge variant="outline" className="rounded-full">{pack.colorways.length} options</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pack.colorways.map((cw, i) => (
              <div
                key={i}
                className="rounded-xl border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                {/* Large swatch */}
                <div
                  className="h-24 w-full relative"
                  style={{ backgroundColor: cw.hex }}
                >
                  <div className={cn(
                    'absolute top-2 right-2',
                  )}>
                    <ColorwayStatusBadge status={cw.status} />
                  </div>
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-semibold">{cw.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-mono text-muted-foreground">{cw.hex.toUpperCase()}</span>
                    <span className="text-[10px] text-muted-foreground/60">|</span>
                    <span className="text-xs text-muted-foreground">{cw.pantone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LabelsTab({ pack }: { pack: TechPackData }) {
  return (
    <div className="space-y-5">
      {/* Label placement diagram placeholder */}
      <Card className="animate-in overflow-hidden">
        <div className="relative bg-gradient-to-br from-muted/20 to-muted/40 py-8 px-6 flex items-center gap-8">
          <div className="w-32 h-40 shrink-0 relative hidden sm:block">
            {/* Simplified garment outline with label positions */}
            <svg viewBox="0 0 200 250" className="w-full h-full opacity-[0.12]">
              <path d="M65 35 L40 55 L10 90 L35 105 L50 80 L50 220 L150 220 L150 80 L165 105 L190 90 L160 55 L135 35 Q120 20 100 15 Q80 20 65 35 Z" fill="currentColor" />
            </svg>
            {/* Label position indicators */}
            <div className="absolute top-[15%] left-[42%] w-4 h-4 rounded-full bg-primary/30 border-2 border-primary/50 animate-pulse" title="Main Label" />
            <div className="absolute top-[20%] left-[42%] w-3 h-3 rounded-full bg-amber-500/30 border-2 border-amber-500/50" title="Size Label" />
            <div className="absolute top-[55%] left-[18%] w-3 h-3 rounded-full bg-emerald-500/30 border-2 border-emerald-500/50" title="Care Label" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-1">Label Placement Guide</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Diagram shows approximate label positions on the garment. See table below for exact placement instructions.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="h-2.5 w-2.5 rounded-full bg-primary/50" />
                <span className="text-muted-foreground">Main Label</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                <span className="text-muted-foreground">Size Label</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                <span className="text-muted-foreground">Care Label</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Labels table — card-style */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Labels & Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pack.labels.map((label, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/20 hover:bg-muted/20 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{label.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label.placement}</p>
                  <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">{label.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Care instructions with visual symbols */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Care Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {pack.careInstructions.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-transparent hover:border-border transition-colors">
                <div className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-base">{getCareSymbol(item)}</span>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Packaging checklist */}
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Packaging Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pack.packagingRequirements.map((item, i) => (
              <li key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                <div className="h-5 w-5 rounded border-2 border-muted-foreground/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                </div>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getColorHex(colorName: string): string {
  const map: Record<string, string> = {
    'Charcoal Melange': '#3B3B3B',
    'Burgundy': '#800020',
    'Natural': '#F5F0DC',
    'Dark Horn': '#4A3B2A',
    'Gold': '#DAA520',
    'Sand': '#D2B48C',
    'Ecru Melange': '#E8DCC8',
    'Natural Tan': '#C4A882',
    'Midnight': '#191970',
    'Midnight Match': '#191970',
  };
  return map[colorName] || '#9E9E9E';
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function getCareSymbol(instruction: string): string {
  const lower = instruction.toLowerCase();
  if (lower.includes('dry clean')) return '\u2327'; // X mark for dry clean
  if (lower.includes('do not bleach') || lower.includes('do not wring')) return '\u26D4';
  if (lower.includes('iron')) return '\u2668';
  if (lower.includes('tumble dry')) return '\u29BB';
  if (lower.includes('machine wash') || lower.includes('hand wash')) return '\u2B55';
  if (lower.includes('hang dry')) return '\u2195';
  if (lower.includes('lay flat')) return '\u2194';
  if (lower.includes('store') || lower.includes('fold')) return '\u2610';
  return '\u2022';
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TechPack() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [showNewPackFlow, setShowNewPackFlow] = useState(false);
  const pack = TECH_PACKS[selectedPackIndex];

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab pack={pack} />;
      case 'materials':
        return <MaterialsTab pack={pack} />;
      case 'measurements':
        return <MeasurementsTab pack={pack} />;
      case 'construction':
        return <ConstructionTab pack={pack} />;
      case 'colorways':
        return <ColorwaysTab pack={pack} />;
      case 'labels':
        return <LabelsTab pack={pack} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tech Pack Builder</h1>
          <p className="text-sm text-muted-foreground mt-1 font-serif italic">
            Precision specifications for production-ready garments
          </p>
        </div>
        <Button
          className="rounded-full gap-1.5 shadow-sm"
          onClick={() => setShowNewPackFlow(!showNewPackFlow)}
        >
          <Plus className="h-4 w-4" />
          New Tech Pack
        </Button>
      </div>

      {/* New tech pack flow (guided) */}
      {showNewPackFlow && (
        <Card className="animate-in border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Create New Tech Pack</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Start with the basics and build your specification.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-7 w-7 p-0"
                onClick={() => setShowNewPackFlow(false)}
              >
                <span className="text-lg leading-none">&times;</span>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { step: 1, title: 'Product Info', desc: 'Name, SKU, season, category' },
                { step: 2, title: 'Materials', desc: 'Add fabrics, trims, and notions' },
                { step: 3, title: 'Specifications', desc: 'Measurements, construction, colorways' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{s.step}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4 rounded-full" size="sm">
              Get Started
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template selector — visual cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {TECH_PACKS.map((tp, i) => {
          const isActive = i === selectedPackIndex;
          const iconColor = CATEGORY_ICON_COLOR[tp.category] || '#6B7280';
          return (
            <button
              key={tp.id}
              onClick={() => {
                if (isActive) return;
                setSelectedPackIndex(i);
                setActiveTab('overview');
              }}
              className={cn(
                'flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all duration-200',
                isActive
                  ? 'border-primary bg-primary/[0.03] shadow-md shadow-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30 hover:bg-muted/20 hover:shadow-sm'
              )}
            >
              {/* Color swatch / category icon */}
              <div
                className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                <div
                  className="h-5 w-5 rounded-md"
                  style={{ backgroundColor: iconColor }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'text-sm font-semibold truncate',
                  isActive ? 'text-primary' : ''
                )}>
                  {tp.productName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{tp.season}</span>
                  <span className="text-[10px] text-muted-foreground/30">|</span>
                  <span className="text-[10px] text-muted-foreground">{tp.category}</span>
                </div>
                <div className="mt-2">
                  <StatusBadge status={tp.status} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pill tabs */}
      <div className="overflow-x-auto">
        <nav className="flex gap-1.5 p-1 bg-muted/30 rounded-full w-fit" aria-label="Tech pack sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                  activeTab === tab.key
                    ? 'bg-card text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {renderTab()}
    </div>
  );
}
