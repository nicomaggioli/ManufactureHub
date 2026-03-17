declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    head?: any[][];
    body?: any[][];
    styles?: any;
    headStyles?: any;
    bodyStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: Record<number, any>;
    theme?: string;
    didDrawCell?: (data: any) => void;
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
