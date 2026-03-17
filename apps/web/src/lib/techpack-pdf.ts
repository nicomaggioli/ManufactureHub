import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface TechPackPDFData {
  name: string;
  category?: string;
  season?: string;
  status?: string;
  materials: { name: string; type: string; composition?: string; color?: string; colorCode?: string; supplier?: string; costPerUnit?: number; unit?: string; placement?: string }[];
  measurements: { pointOfMeasure: string; sizes: Record<string, number>; tolerance?: number }[];
  construction: { title: string; value: string; category?: string; notes?: string }[];
  colorways: { name: string; hexCode: string; pantoneRef?: string; status?: string }[];
  labels: { type: string; text?: string; placement?: string; careSymbols?: string[] }[];
}

export function generateTechPackPDF(data: TechPackPDFData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Helper: add section header
  const sectionHeader = (title: string) => {
    if (y > 260) { doc.addPage(); y = margin; }
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 111, 191); // primary blue
    doc.text(title.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(46, 111, 191);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setTextColor(15, 29, 46); // navy
    doc.setFont('helvetica', 'normal');
  };

  // === COVER / HEADER ===
  doc.setFillColor(15, 29, 46); // navy
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.name, margin, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const meta = [data.category, data.season, data.status?.toUpperCase()].filter(Boolean).join('  \u2022  ');
  doc.text(meta, margin, 32);

  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 39);

  // RAVI branding
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RAVI', pageWidth - margin - 15, 22);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Tech Pack', pageWidth - margin - 15, 28);

  y = 55;
  doc.setTextColor(15, 29, 46);

  // === MATERIALS / BOM ===
  if (data.materials.length > 0) {
    sectionHeader('Bill of Materials');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Material', 'Type', 'Composition', 'Color', 'Supplier', 'Cost', 'Placement']],
      body: data.materials.map(m => [
        m.name, m.type, m.composition || '-', m.color || '-',
        m.supplier || '-',
        m.costPerUnit ? `$${m.costPerUnit.toFixed(2)}/${m.unit || 'unit'}` : '-',
        m.placement || '-'
      ]),
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [15, 29, 46], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 248, 250] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === MEASUREMENTS ===
  if (data.measurements.length > 0) {
    sectionHeader('Measurements');
    // Get all unique sizes
    const allSizes = [...new Set(data.measurements.flatMap(m => Object.keys(m.sizes)))];
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Point of Measure', ...allSizes, 'Tol. \u00b1']],
      body: data.measurements.map(m => [
        m.pointOfMeasure,
        ...allSizes.map(s => m.sizes[s]?.toString() || '-'),
        m.tolerance ? `${m.tolerance}` : '-'
      ]),
      styles: { fontSize: 8, cellPadding: 3, halign: 'center', font: 'helvetica' },
      headStyles: { fillColor: [15, 29, 46], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [247, 248, 250] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === CONSTRUCTION ===
  if (data.construction.length > 0) {
    sectionHeader('Construction Details');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Detail', 'Specification', 'Category', 'Notes']],
      body: data.construction.map(c => [c.title, c.value, c.category || '-', c.notes || '-']),
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [15, 29, 46], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 248, 250] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === COLORWAYS ===
  if (data.colorways.length > 0) {
    sectionHeader('Colorways');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Color Name', 'Hex Code', 'Pantone Ref', 'Status']],
      body: data.colorways.map(c => [c.name, c.hexCode, c.pantoneRef || '-', c.status || 'active']),
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [15, 29, 46], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 248, 250] },
      theme: 'grid',
      didDrawCell: (hookData: any) => {
        // Draw color swatch next to hex code
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const hex = data.colorways[hookData.row.index]?.hexCode;
          if (hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            doc.setFillColor(r, g, b);
            doc.roundedRect(hookData.cell.x + 1, hookData.cell.y + 1.5, 4, 4, 0.5, 0.5, 'F');
          }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === LABELS & CARE ===
  if (data.labels.length > 0) {
    sectionHeader('Labels & Care Instructions');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Label Type', 'Content', 'Placement', 'Care Symbols']],
      body: data.labels.map(l => [
        l.type.replace(/_/g, ' ').toUpperCase(),
        l.text || '-',
        l.placement || '-',
        l.careSymbols?.join(', ') || '-'
      ]),
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [15, 29, 46], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 248, 250] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === FOOTER on every page ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${data.name} \u2014 Tech Pack`, margin, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, doc.internal.pageSize.getHeight() - 8);
    doc.text('Generated by RAVI', pageWidth / 2 - 10, doc.internal.pageSize.getHeight() - 8);
  }

  // Save
  const fileName = `${data.name.replace(/[^a-zA-Z0-9]/g, '_')}_TechPack.pdf`;
  doc.save(fileName);
}
