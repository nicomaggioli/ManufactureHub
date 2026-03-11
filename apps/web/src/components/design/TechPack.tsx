import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';

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
// Mock data — three tech pack templates
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
  { key: 'overview', label: 'Overview' },
  { key: 'materials', label: 'Materials & BOM' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'construction', label: 'Construction' },
  { key: 'colorways', label: 'Colorways' },
  { key: 'labels', label: 'Labels & Packaging' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-heading text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </h4>
  );
}

function FieldPair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</dt>
      <dd className="text-sm font-body">{children}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: TechPackData['status'] }) {
  const map: Record<TechPackData['status'], { label: string; variant: 'default' | 'warning' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'outline' },
    review: { label: 'In Review', variant: 'warning' },
    approved: { label: 'Approved', variant: 'default' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function ColorwayStatusBadge({ status }: { status: Colorway['status'] }) {
  const map: Record<Colorway['status'], { variant: 'default' | 'warning' | 'destructive' }> = {
    approved: { variant: 'default' },
    pending: { variant: 'warning' },
    rejected: { variant: 'destructive' },
  };
  return <Badge variant={map[status].variant}>{status}</Badge>;
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function OverviewTab({ pack }: { pack: TechPackData }) {
  return (
    <div className="space-y-5">
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Product Details</CardTitle>
            <StatusBadge status={pack.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldPair label="Product Name">{pack.productName}</FieldPair>
            <FieldPair label="SKU"><span className="data-value">{pack.sku}</span></FieldPair>
            <FieldPair label="Season"><Badge variant="secondary">{pack.season}</Badge></FieldPair>
            <FieldPair label="Category">{pack.category}</FieldPair>
            <FieldPair label="Target Cost"><span className="data-value">{formatCurrency(pack.targetCost)}</span></FieldPair>
            <FieldPair label="Target Retail"><span className="data-value">{formatCurrency(pack.targetRetail)}</span></FieldPair>
          </dl>
          <div className="mt-5 pt-4 border-t">
            <SectionHeading>Description</SectionHeading>
            <p className="text-sm leading-relaxed text-foreground/80">{pack.description}</p>
          </div>
          <div className="mt-5 pt-4 border-t">
            <SectionHeading>Cost Summary</SectionHeading>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="bg-muted/40 border-0 shadow-none">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">BOM Cost</p>
                  <p className="text-lg font-heading font-bold data-value mt-0.5">
                    {formatCurrency(pack.materials.reduce((sum, m) => sum + m.unitCost, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-muted/40 border-0 shadow-none">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target Cost</p>
                  <p className="text-lg font-heading font-bold data-value mt-0.5">{formatCurrency(pack.targetCost)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/40 border-0 shadow-none">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Margin</p>
                  <p className="text-lg font-heading font-bold data-value mt-0.5" style={{ color: 'hsl(var(--gold))' }}>
                    {(((pack.targetRetail - pack.targetCost) / pack.targetRetail) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MaterialsTab({ pack }: { pack: TechPackData }) {
  const totalCost = pack.materials.reduce((sum, m) => sum + m.unitCost, 0);
  return (
    <Card className="animate-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Bill of Materials</CardTitle>
          <Badge variant="outline">{pack.materials.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {['Material', 'Type', 'Color', 'Supplier', 'Unit Cost', 'Usage / Unit'].map((h) => (
                  <th key={h} className="pb-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-heading last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {pack.materials.map((m, i) => (
                <tr key={i} className="group hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                  <td className="py-2.5 pr-4"><Badge variant="secondary">{m.type}</Badge></td>
                  <td className="py-2.5 pr-4">{m.color}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{m.supplier}</td>
                  <td className="py-2.5 pr-4 data-value">{formatCurrency(m.unitCost)}</td>
                  <td className="py-2.5 data-value">{m.usagePerUnit}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td colSpan={4} className="pt-2.5 text-right pr-4 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Material Cost
                </td>
                <td className="pt-2.5 font-bold data-value" style={{ color: 'hsl(var(--gold))' }}>
                  {formatCurrency(totalCost)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function MeasurementsTab({ pack }: { pack: TechPackData }) {
  const sizes = ['XS', 'S', 'M', 'L', 'XL'] as const;
  const sizeKeys: (keyof MeasurementRow)[] = ['xs', 's', 'm', 'l', 'xl'];

  return (
    <Card className="animate-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Size Chart & Measurements</CardTitle>
          <Badge variant="outline">Tolerance +/- 1 cm</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                  Measurement
                </th>
                {sizes.map((s) => (
                  <th key={s} className="pb-2.5 px-4 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {pack.measurements.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-4 font-medium">{row.label}</td>
                  {sizeKeys.map((key) => (
                    <td key={key} className="py-2.5 px-4 text-center data-value">
                      {row[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            All measurements taken flat. Tolerance: +/- 1 cm for body measurements, +/- 0.5 cm for detail measurements.
            Grading based on 2 cm increments between sizes (chest/waist), 2 cm increments for length.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ConstructionTab({ pack }: { pack: TechPackData }) {
  return (
    <div className="space-y-5">
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Construction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            {pack.construction.map((detail, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:gap-4">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-heading min-w-[180px] pt-0.5">
                  {detail.label}
                </dt>
                <dd className="text-sm leading-relaxed">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Special Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {pack.specialInstructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--gold))' }}
                />
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
    <Card className="animate-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Colorways</CardTitle>
          <Badge variant="outline">{pack.colorways.length} options</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pack.colorways.map((cw, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3 hover:border-primary/30 transition-colors"
            >
              <div
                className="h-12 w-12 shrink-0 rounded-md border shadow-sm"
                style={{ backgroundColor: cw.hex }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{cw.name}</p>
                <p className="text-xs text-muted-foreground data-value mt-0.5">{cw.hex.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cw.pantone}</p>
              </div>
              <ColorwayStatusBadge status={cw.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LabelsTab({ pack }: { pack: TechPackData }) {
  return (
    <div className="space-y-5">
      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Labels & Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {['Type', 'Placement', 'Content'].map((h) => (
                    <th key={h} className="pb-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-heading last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pack.labels.map((label, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{label.type}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{label.placement}</td>
                    <td className="py-2.5">{label.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Care Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pack.careInstructions.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="animate-in">
        <CardHeader className="pb-3">
          <CardTitle>Packaging Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pack.packagingRequirements.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--gold))' }}
                />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TechPack() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Tech Pack Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage product specifications, materials, and construction details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search tech packs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56"
          />
          <Button>New Tech Pack</Button>
        </div>
      </div>

      {/* Template selector */}
      <div className="flex flex-wrap gap-2">
        {TECH_PACKS.map((tp, i) => (
          <button
            key={tp.id}
            onClick={() => {
              setSelectedPackIndex(i);
              setActiveTab('overview');
            }}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition-all duration-150',
              i === selectedPackIndex
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/30 hover:bg-muted/30'
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{tp.productName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground data-value">{tp.sku}</span>
                <StatusBadge status={tp.status} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tech pack sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wider transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>{renderTab()}</div>
    </div>
  );
}
