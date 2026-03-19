import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { Download, Send, ChevronDown, ChevronRight, Check, Circle } from 'lucide-react';
import { generateTechPackPDF } from '@/lib/techpack-pdf';
import { useNavigate } from 'react-router-dom';
import type { BuiltTechPack, SectionName, CollectedResponses } from '@/lib/techpack-ai';
import { getSectionCompletion, getOverallCompletion } from '@/lib/techpack-ai';

interface TechPackPreviewProps {
  techPack: BuiltTechPack | null;
  responses: CollectedResponses;
  designImage: string | null;
  isComplete: boolean;
}

const SECTIONS: { key: SectionName; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'materials', label: 'Materials & BOM' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'construction', label: 'Construction' },
  { key: 'colorways', label: 'Colorways' },
  { key: 'labels', label: 'Labels & Care' },
];

export function TechPackPreview({ techPack, responses, designImage, isComplete }: TechPackPreviewProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<SectionName | null>('overview');
  const overall = getOverallCompletion(responses);

  const handleExportPDF = () => {
    if (!techPack) return;
    generateTechPackPDF({
      productName: techPack.productName,
      sku: techPack.sku,
      season: techPack.season,
      category: techPack.category,
      description: techPack.description,
      materials: techPack.materials.map((m) => ({
        name: m.name,
        specification: `${m.type} — ${m.color}`,
        supplier: m.supplier,
        unitCost: m.unitCost,
      })),
      measurements: techPack.measurements,
      constructionDetails: techPack.construction.map((c) => `${c.label}: ${c.value}`),
      colorways: techPack.colorways.map((c) => ({
        name: c.name,
        hex: c.hex,
        pantone: c.pantone,
      })),
      labelRequirements: techPack.labels.map((l) => `${l.type} (${l.placement}): ${l.content}`),
      packagingRequirements: techPack.packagingRequirements,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Tech Pack Preview</p>
            <p className="text-[11px] text-gray-400">{overall}% complete</p>
          </div>
          <Badge variant={isComplete ? 'default' : 'secondary'} className="text-[11px]">
            {isComplete ? 'Complete' : 'In Progress'}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {SECTIONS.map(({ key, label }) => {
          const completion = getSectionCompletion(key, responses);
          const isExpanded = expanded === key;
          const isFilled = completion.filled > 0;

          return (
            <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50/50 transition-colors"
              >
                {/* Status icon */}
                {completion.filled === completion.total && completion.total > 0 ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : isFilled ? (
                  <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-200" />
                )}

                <span className={cn('text-sm flex-1', isFilled ? 'text-gray-900 font-medium' : 'text-gray-400')}>
                  {label}
                </span>
                <span className="text-[11px] text-gray-400">
                  {completion.filled}/{completion.total}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                )}
              </button>

              {isExpanded && techPack && (
                <div className="px-3 pb-3 pt-1">
                  <SectionContent section={key} techPack={techPack} designImage={designImage} />
                </div>
              )}

              {isExpanded && !techPack && (
                <div className="px-3 pb-3 pt-1">
                  <p className="text-xs text-gray-400 italic">Waiting for your answers...</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        <Button
          onClick={handleExportPDF}
          disabled={!isComplete}
          className="w-full h-10 text-sm bg-gray-900 hover:bg-gray-800 rounded-xl gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/communications')}
          disabled={!isComplete}
          className="w-full h-10 text-sm rounded-xl gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          Send to Manufacturer
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section content renderers
// ---------------------------------------------------------------------------

function SectionContent({
  section,
  techPack,
  designImage,
}: {
  section: SectionName;
  techPack: BuiltTechPack;
  designImage: string | null;
}) {
  switch (section) {
    case 'overview':
      return (
        <div className="space-y-2">
          {designImage && (
            <img src={designImage} alt="Design" className="w-full h-24 object-contain rounded-lg bg-gray-50 mb-2" />
          )}
          <Row label="Product" value={techPack.productName} />
          <Row label="SKU" value={techPack.sku} />
          <Row label="Season" value={techPack.season} />
          <Row label="Category" value={techPack.category} />
          <Row label="Target Cost" value={formatCurrency(techPack.targetCost)} />
          <Row label="Target Retail" value={formatCurrency(techPack.targetRetail)} />
          <p className="text-xs text-gray-500 mt-2">{techPack.description}</p>
        </div>
      );

    case 'materials':
      return (
        <div className="space-y-1.5">
          {techPack.materials.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
              <span className="text-gray-700 font-medium">{m.name}</span>
              <span className="text-gray-400">{m.usagePerUnit} · {formatCurrency(m.unitCost)}</span>
            </div>
          ))}
        </div>
      );

    case 'measurements':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left py-1 font-normal">Spec</th>
                <th className="text-center py-1 font-normal">XS</th>
                <th className="text-center py-1 font-normal">S</th>
                <th className="text-center py-1 font-normal">M</th>
                <th className="text-center py-1 font-normal">L</th>
                <th className="text-center py-1 font-normal">XL</th>
              </tr>
            </thead>
            <tbody>
              {techPack.measurements.map((m, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-1 text-gray-700">{m.label}</td>
                  <td className="py-1 text-center text-gray-500">{m.xs}</td>
                  <td className="py-1 text-center text-gray-500">{m.s}</td>
                  <td className="py-1 text-center text-gray-500">{m.m}</td>
                  <td className="py-1 text-center text-gray-500">{m.l}</td>
                  <td className="py-1 text-center text-gray-500">{m.xl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'construction':
      return (
        <div className="space-y-1.5">
          {techPack.construction.map((c, i) => (
            <div key={i} className="text-xs">
              <span className="text-gray-400">{c.label}: </span>
              <span className="text-gray-700">{c.value}</span>
            </div>
          ))}
        </div>
      );

    case 'colorways':
      return (
        <div className="flex flex-wrap gap-2">
          {techPack.colorways.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-100">
              <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.hex }} />
              <span className="text-xs text-gray-700">{c.name}</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{c.status}</Badge>
            </div>
          ))}
        </div>
      );

    case 'labels':
      return (
        <div className="space-y-2">
          {techPack.labels.map((l, i) => (
            <div key={i} className="text-xs">
              <span className="text-gray-700 font-medium">{l.type}</span>
              <span className="text-gray-400"> — {l.placement}</span>
              <p className="text-gray-500 mt-0.5">{l.content}</p>
            </div>
          ))}
          {techPack.careInstructions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-50">
              <p className="text-[11px] text-gray-400 mb-1">Care Instructions</p>
              <div className="flex flex-wrap gap-1">
                {techPack.careInstructions.map((c, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-gray-50 text-gray-600">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium">{value || '—'}</span>
    </div>
  );
}
