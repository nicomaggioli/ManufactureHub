// ---------------------------------------------------------------------------
// Mock AI Engine for Tech Pack Builder
// Simulates AI analysis and guided question flow
// ---------------------------------------------------------------------------

export interface DesignAnalysis {
  garmentType: string;
  silhouette: string;
  detectedColors: { name: string; hex: string }[];
  constructionNotes: string[];
  suggestedCategory: string;
  suggestedFabric: string;
}

export interface QuestionStep {
  id: string;
  section: 'overview' | 'materials' | 'construction' | 'measurements' | 'colorways' | 'labels';
  question: string;
  field: string;
  options?: string[];
  type: 'select' | 'text' | 'confirm';
}

export interface TechPackField {
  field: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Analysis templates — picked based on simple filename heuristics
// ---------------------------------------------------------------------------

const ANALYSES: Record<string, DesignAnalysis> = {
  hoodie: {
    garmentType: 'Hoodie',
    silhouette: 'Relaxed fit with dropped shoulders and kangaroo pocket',
    detectedColors: [
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Off-White', hex: '#FAF9F6' },
    ],
    constructionNotes: [
      'Drawstring hood with metal eyelets',
      'Kangaroo pocket with reinforced edges',
      'Ribbed cuffs and hem',
      'Raglan sleeve construction',
    ],
    suggestedCategory: 'Tops',
    suggestedFabric: 'French Terry Cotton',
  },
  tshirt: {
    garmentType: 'T-Shirt',
    silhouette: 'Regular fit crew neck with set-in sleeves',
    detectedColors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
    ],
    constructionNotes: [
      'Crew neck with ribbed collar',
      'Double-needle hem at sleeves and bottom',
      'Side-seamed construction',
      'No chest pocket',
    ],
    suggestedCategory: 'Tops',
    suggestedFabric: 'Cotton Jersey',
  },
  jacket: {
    garmentType: 'Jacket',
    silhouette: 'Tailored fit with structured shoulders and front zip closure',
    detectedColors: [
      { name: 'Navy', hex: '#1B2A4A' },
      { name: 'Silver', hex: '#C0C0C0' },
    ],
    constructionNotes: [
      'Full front zip with storm flap',
      'Two side pockets with concealed zips',
      'Internal welt pocket',
      'Adjustable cuffs with snap buttons',
      'Lined interior',
    ],
    suggestedCategory: 'Outerwear',
    suggestedFabric: 'Nylon Ripstop',
  },
  dress: {
    garmentType: 'Dress',
    silhouette: 'A-line silhouette with fitted bodice and flared skirt',
    detectedColors: [
      { name: 'Sage Green', hex: '#9CAF88' },
      { name: 'Cream', hex: '#FFFDD0' },
    ],
    constructionNotes: [
      'Back zipper closure',
      'Darted bodice for shape',
      'French seam finishing on interior',
      'Hemmed at knee length',
    ],
    suggestedCategory: 'Dresses',
    suggestedFabric: 'Linen Blend',
  },
  default: {
    garmentType: 'Garment',
    silhouette: 'Standard fit with clean construction lines',
    detectedColors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
    ],
    constructionNotes: [
      'Standard seam construction',
      'Clean finished edges',
      'Consistent stitching throughout',
    ],
    suggestedCategory: 'Tops',
    suggestedFabric: 'Cotton',
  },
};

// ---------------------------------------------------------------------------
// Analyze design image (simulated)
// ---------------------------------------------------------------------------

export function analyzeDesignImage(fileName: string): DesignAnalysis {
  const lower = fileName.toLowerCase();
  if (lower.includes('hoodie') || lower.includes('hood') || lower.includes('sweat')) {
    return ANALYSES.hoodie;
  }
  if (lower.includes('tee') || lower.includes('tshirt') || lower.includes('t-shirt') || lower.includes('shirt')) {
    return ANALYSES.tshirt;
  }
  if (lower.includes('jacket') || lower.includes('coat') || lower.includes('bomber') || lower.includes('parka')) {
    return ANALYSES.jacket;
  }
  if (lower.includes('dress') || lower.includes('skirt') || lower.includes('gown')) {
    return ANALYSES.dress;
  }
  // Random pick for generic filenames
  const keys = ['hoodie', 'tshirt', 'jacket', 'dress'];
  const pick = keys[Math.floor(Math.random() * keys.length)];
  return ANALYSES[pick];
}

// ---------------------------------------------------------------------------
// Question flow — builds the tech pack progressively
// ---------------------------------------------------------------------------

export function buildQuestionFlow(analysis: DesignAnalysis): QuestionStep[] {
  const colorList = analysis.detectedColors.map((c) => c.name).join(', ');

  return [
    // Overview
    {
      id: 'product-name',
      section: 'overview',
      question: `I've analyzed your design and identified it as a **${analysis.garmentType}** with a ${analysis.silhouette.toLowerCase()}. What would you like to name this product?`,
      field: 'productName',
      type: 'text',
    },
    {
      id: 'season',
      section: 'overview',
      question: 'What season is this for?',
      field: 'season',
      options: ['SS26', 'FW26', 'SS27', 'FW27'],
      type: 'select',
    },
    {
      id: 'target-retail',
      section: 'overview',
      question: "What's your target retail price point?",
      field: 'targetRetail',
      options: ['$25-50', '$50-100', '$100-200', '$200+'],
      type: 'select',
    },

    // Materials
    {
      id: 'primary-fabric',
      section: 'materials',
      question: `The fabric appears to be **${analysis.suggestedFabric}**. Is that correct, or would you like to specify something different?`,
      field: 'primaryFabric',
      options: [analysis.suggestedFabric, 'Cotton Jersey', 'French Terry', 'Fleece', 'Linen', 'Polyester Blend', 'Other'],
      type: 'select',
    },
    {
      id: 'fabric-weight',
      section: 'materials',
      question: 'What fabric weight are you targeting?',
      field: 'fabricWeight',
      options: ['Lightweight (100-150 gsm)', 'Medium (150-250 gsm)', 'Heavyweight (250-400 gsm)'],
      type: 'select',
    },
    {
      id: 'fabric-finish',
      section: 'materials',
      question: 'Any specific fabric finish or treatment?',
      field: 'fabricFinish',
      options: ['Garment dyed', 'Enzyme washed', 'Brushed', 'Mercerized', 'None / Raw'],
      type: 'select',
    },

    // Construction
    {
      id: 'seam-type',
      section: 'construction',
      question: 'What type of seam construction do you prefer?',
      field: 'seamType',
      options: ['Flat-felled seam', 'French seam', 'Overlock / Serged', 'Cover stitch'],
      type: 'select',
    },
    {
      id: 'special-details',
      section: 'construction',
      question: `I noticed these construction details: ${analysis.constructionNotes.slice(0, 2).join(', ')}. Any additional construction requirements or special details?`,
      field: 'specialDetails',
      type: 'text',
    },

    // Measurements
    {
      id: 'size-range',
      section: 'measurements',
      question: 'What size range do you need?',
      field: 'sizeRange',
      options: ['XS-XL', 'S-XXL', 'XS-3XL', 'One Size'],
      type: 'select',
    },
    {
      id: 'fit-type',
      section: 'measurements',
      question: 'What fit are you going for?',
      field: 'fitType',
      options: ['Slim fit', 'Regular fit', 'Relaxed fit', 'Oversized'],
      type: 'select',
    },

    // Colorways
    {
      id: 'colorways',
      section: 'colorways',
      question: `I detected these colors: **${colorList}**. Would you like to confirm these as your colorways, add more, or specify different ones?`,
      field: 'colorways',
      options: [`Confirm: ${colorList}`, 'Add more colors', 'Different colors'],
      type: 'select',
    },

    // Labels
    {
      id: 'care-instructions',
      section: 'labels',
      question: 'What care instructions should be included?',
      field: 'careInstructions',
      options: ['Machine wash cold', 'Hand wash only', 'Dry clean only', 'Machine wash warm'],
      type: 'select',
    },
    {
      id: 'label-type',
      section: 'labels',
      question: 'What type of main label do you want?',
      field: 'labelType',
      options: ['Woven label', 'Printed label', 'Heat transfer', 'Tagless / Screen print'],
      type: 'select',
    },
    {
      id: 'country-origin',
      section: 'labels',
      question: 'Where will this be manufactured? (for country of origin label)',
      field: 'countryOfOrigin',
      options: ['Portugal', 'Turkey', 'China', 'India', 'Vietnam', 'USA'],
      type: 'select',
    },
  ];
}

// ---------------------------------------------------------------------------
// Build tech pack data from collected responses
// ---------------------------------------------------------------------------

export interface CollectedResponses {
  [field: string]: string;
}

export interface BuiltTechPack {
  productName: string;
  sku: string;
  season: string;
  category: string;
  description: string;
  targetCost: number;
  targetRetail: number;
  status: 'draft';
  materials: { name: string; type: string; color: string; supplier: string; unitCost: number; usagePerUnit: string }[];
  measurements: { label: string; xs: number; s: number; m: number; l: number; xl: number }[];
  construction: { label: string; value: string }[];
  specialInstructions: string[];
  colorways: { name: string; hex: string; pantone: string; status: 'pending' }[];
  labels: { type: string; placement: string; content: string }[];
  careInstructions: string[];
  packagingRequirements: string[];
}

function parseRetailPrice(value: string): number {
  if (value.includes('25-50')) return 40;
  if (value.includes('50-100')) return 75;
  if (value.includes('100-200')) return 150;
  if (value.includes('200+')) return 250;
  return 75;
}

function generateSKU(name: string, season: string): string {
  const prefix = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 3);
  return `${prefix}-${season}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function buildMeasurements(sizeRange: string, fitType: string): BuiltTechPack['measurements'] {
  const base = fitType.includes('Slim') ? -1 : fitType.includes('Oversized') ? 2 : fitType.includes('Relaxed') ? 1 : 0;
  return [
    { label: 'Chest Width', xs: 46 + base, s: 49 + base, m: 52 + base, l: 55 + base, xl: 58 + base },
    { label: 'Body Length', xs: 66, s: 68, m: 70, l: 72, xl: 74 },
    { label: 'Sleeve Length', xs: 59, s: 61, m: 63, l: 65, xl: 67 },
    { label: 'Shoulder Width', xs: 42 + base, s: 44 + base, m: 46 + base, l: 48 + base, xl: 50 + base },
    { label: 'Hem Width', xs: 44 + base, s: 47 + base, m: 50 + base, l: 53 + base, xl: 56 + base },
  ];
}

export function buildTechPack(
  responses: CollectedResponses,
  analysis: DesignAnalysis
): BuiltTechPack {
  const productName = responses.productName || `Custom ${analysis.garmentType}`;
  const season = responses.season || 'SS26';
  const retailPrice = parseRetailPrice(responses.targetRetail || '$50-100');
  const fabric = responses.primaryFabric || analysis.suggestedFabric;
  const weight = responses.fabricWeight || 'Medium (150-250 gsm)';
  const finish = responses.fabricFinish || 'None / Raw';
  const sizeRange = responses.sizeRange || 'S-XXL';
  const fitType = responses.fitType || 'Regular fit';

  return {
    productName,
    sku: generateSKU(productName, season),
    season,
    category: analysis.suggestedCategory,
    description: `${fitType} ${analysis.garmentType.toLowerCase()} in ${fabric.toLowerCase()}. ${analysis.silhouette}.`,
    targetCost: Math.round(retailPrice * 0.3),
    targetRetail: retailPrice,
    status: 'draft',
    materials: [
      {
        name: `Shell — ${fabric}`,
        type: fabric,
        color: analysis.detectedColors[0]?.name || 'TBD',
        supplier: 'TBD',
        unitCost: Math.round(retailPrice * 0.12),
        usagePerUnit: weight.includes('Light') ? '1.2m' : weight.includes('Heavy') ? '1.8m' : '1.5m',
      },
      {
        name: 'Thread',
        type: 'Polyester Core-Spun',
        color: 'Matching',
        supplier: 'TBD',
        unitCost: 0.5,
        usagePerUnit: '120m',
      },
      ...(finish !== 'None / Raw'
        ? [
            {
              name: `Finish — ${finish}`,
              type: 'Treatment',
              color: 'N/A',
              supplier: 'TBD',
              unitCost: Math.round(retailPrice * 0.03),
              usagePerUnit: 'Per unit',
            },
          ]
        : []),
    ],
    measurements: buildMeasurements(sizeRange, fitType),
    construction: [
      { label: 'Seam Type', value: responses.seamType || 'Overlock / Serged' },
      ...analysis.constructionNotes.map((note) => ({
        label: 'Detail',
        value: note,
      })),
      ...(responses.specialDetails
        ? [{ label: 'Special', value: responses.specialDetails }]
        : []),
    ],
    specialInstructions: [
      `Fit type: ${fitType}`,
      `Size range: ${sizeRange}`,
      ...(responses.specialDetails ? [responses.specialDetails] : []),
    ],
    colorways: analysis.detectedColors.map((c) => ({
      name: c.name,
      hex: c.hex,
      pantone: 'TBD',
      status: 'pending' as const,
    })),
    labels: [
      {
        type: responses.labelType || 'Woven label',
        placement: 'Center back neck',
        content: 'Brand logo + size',
      },
      {
        type: 'Care label',
        placement: 'Left side seam',
        content: `${responses.careInstructions || 'Machine wash cold'}. ${responses.countryOfOrigin ? `Made in ${responses.countryOfOrigin}` : ''}`.trim(),
      },
    ],
    careInstructions: [
      responses.careInstructions || 'Machine wash cold',
      'Do not bleach',
      'Tumble dry low',
      'Iron on low heat if needed',
    ],
    packagingRequirements: [
      'Individual polybag with brand sticker',
      'Hang tag attached',
      'Tissue paper wrap',
    ],
  };
}

// ---------------------------------------------------------------------------
// Section completion calculator
// ---------------------------------------------------------------------------

export type SectionName = 'overview' | 'materials' | 'construction' | 'measurements' | 'colorways' | 'labels';

const SECTION_FIELDS: Record<SectionName, string[]> = {
  overview: ['productName', 'season', 'targetRetail'],
  materials: ['primaryFabric', 'fabricWeight', 'fabricFinish'],
  construction: ['seamType', 'specialDetails'],
  measurements: ['sizeRange', 'fitType'],
  colorways: ['colorways'],
  labels: ['careInstructions', 'labelType', 'countryOfOrigin'],
};

export function getSectionCompletion(
  section: SectionName,
  responses: CollectedResponses
): { filled: number; total: number } {
  const fields = SECTION_FIELDS[section];
  const filled = fields.filter((f) => responses[f] && responses[f].trim() !== '').length;
  return { filled, total: fields.length };
}

export function getOverallCompletion(responses: CollectedResponses): number {
  const sections = Object.keys(SECTION_FIELDS) as SectionName[];
  let filled = 0;
  let total = 0;
  for (const s of sections) {
    const c = getSectionCompletion(s, responses);
    filled += c.filled;
    total += c.total;
  }
  return total === 0 ? 0 : Math.round((filled / total) * 100);
}
