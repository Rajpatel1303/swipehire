/**
 * pdfExtractor.ts
 * Browser-first PDF text extraction using PDF.js with coordinate-aware layout sorting,
 * multi-column detection, table preservation, and canvas rendering for selective OCR.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PageExtraction } from './extractionTypes';
import { ExtractionUtils } from './extractionUtils';
import { TextCleaner } from './textCleaner';

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
}

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PdfExtractor {
  /**
   * Loads a PDF Document from an ArrayBuffer or File
   */
  public static async loadDocument(fileOrBuffer: File | ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
    const arrayBuffer = fileOrBuffer instanceof File 
      ? await fileOrBuffer.arrayBuffer() 
      : fileOrBuffer;

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });

    return await loadingTask.promise;
  }

  /**
   * Extracts text from all pages in a PDF document using coordinate layout analysis
   */
  public static async extractAllPages(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    onPageProgress?: (current: number, total: number) => void
  ): Promise<PageExtraction[]> {
    const totalPages = pdfDoc.numPages;
    const pages: PageExtraction[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onPageProgress) {
        onPageProgress(pageNum, totalPages);
      }

      const page = await pdfDoc.getPage(pageNum);
      const pageExtraction = await this.extractPage(page, pageNum);
      pages.push(pageExtraction);
    }

    return pages;
  }

  /**
   * Extracts text from a single PDF page with layout-aware coordinate sorting
   */
  public static async extractPage(
    page: pdfjsLib.PDFPageProxy,
    pageNum: number
  ): Promise<PageExtraction> {
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items: PdfTextItem[] = [];
    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
        // transform: [scaleX, skewY, skewX, scaleY, transX, transY]
        // transX is item.transform[4], transY is item.transform[5]
        items.push({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || 0,
          height: item.height || 0,
        });
      }
    }

    if (items.length === 0) {
      return {
        pageNumber: pageNum,
        text: '',
        method: 'pdf-text',
        qualityScore: 0,
        wordCount: 0,
        charCount: 0,
        warnings: ['Page contains no digital text elements (scanned/image page)'],
      };
    }

    // Process layout and reconstruct text in human reading order
    const rawPageText = this.reconstructPageLayout(items, viewport.width, viewport.height);
    const cleanedText = TextCleaner.cleanExtractedText(rawPageText);

    // Evaluate quality
    const quality = ExtractionUtils.evaluateTextQuality(cleanedText, 1);

    const warnings: string[] = [...quality.warnings];
    if (quality.score < 40) {
      warnings.push('Low quality text extraction; page might be scanned or heavily stylized.');
    }

    return {
      pageNumber: pageNum,
      text: cleanedText,
      method: 'pdf-text',
      qualityScore: quality.score,
      wordCount: quality.wordCount,
      charCount: quality.charCount,
      warnings,
    };
  }

  /**
   * Reconstructs reading order: checks for two-column layout or processes lines top-to-bottom
   */
  private static reconstructPageLayout(items: PdfTextItem[], pageWidth: number, _pageHeight: number): string {
    // Check if the page is divided into two distinct columns
    const twoColumnSplit = this.detectTwoColumns(items, pageWidth);

    if (twoColumnSplit !== null) {
      // Split items into left and right columns
      const leftItems = items.filter(it => (it.x + it.width) <= twoColumnSplit + 10);
      const rightItems = items.filter(it => it.x >= twoColumnSplit - 10);
      const spanningItems = items.filter(it => !leftItems.includes(it) && !rightItems.includes(it));

      // Header/spanning items on top, then left column, then right column
      const maxLeftY = leftItems.length > 0 ? Math.max(...leftItems.map(l => l.y)) : 0;
      const headerItems = spanningItems.filter(it => it.y > maxLeftY - 50);
      const remainingLeft = [...leftItems, ...spanningItems.filter(it => !headerItems.includes(it) && it.x < twoColumnSplit)];
      const remainingRight = [...rightItems, ...spanningItems.filter(it => !headerItems.includes(it) && it.x >= twoColumnSplit)];

      const headerText = this.processLines(headerItems);
      const leftText = this.processLines(remainingLeft);
      const rightText = this.processLines(remainingRight);

      return [headerText, leftText, rightText].filter(t => t.trim().length > 0).join('\n\n');
    }

    // Standard single column / table layout
    return this.processLines(items);
  }

  /**
   * Groups items into lines by Y coordinate and sorts tokens left-to-right by X
   */
  private static processLines(items: PdfTextItem[]): string {
    if (items.length === 0) return '';

    // Sort items by Y descending (PDF coordinates have Y=0 at bottom)
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

    const lines: Array<{ y: number; items: PdfTextItem[] }> = [];
    const Y_TOLERANCE = 4.0; // Items within 4px vertically belong to the same line

    for (const item of sorted) {
      let matchedLine = lines.find(line => Math.abs(line.y - item.y) <= Y_TOLERANCE);
      if (matchedLine) {
        matchedLine.items.push(item);
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    }

    // Sort lines by Y descending (top-to-bottom on page)
    lines.sort((a, b) => b.y - a.y);

    const resultLines: string[] = [];

    for (const line of lines) {
      // Sort items in this line left-to-right
      line.items.sort((a, b) => a.x - b.x);

      // Join items with appropriate spacing
      let lineText = '';
      for (let i = 0; i < line.items.length; i++) {
        const current = line.items[i];
        if (i === 0) {
          lineText += current.str;
        } else {
          const prev = line.items[i - 1];
          const gap = current.x - (prev.x + prev.width);
          // If there is an evident gap, add space or tab (for tabular data)
          if (gap > 20) {
            lineText += '   ' + current.str;
          } else if (gap > 2 || (!current.str.startsWith(' ') && !lineText.endsWith(' '))) {
            lineText += ' ' + current.str;
          } else {
            lineText += current.str;
          }
        }
      }

      if (lineText.trim().length > 0) {
        resultLines.push(lineText.trim());
      }
    }

    return resultLines.join('\n');
  }

  /**
   * Detects if items conform to a 2-column layout with a vertical gutter
   */
  private static detectTwoColumns(items: PdfTextItem[], pageWidth: number): number | null {
    if (items.length < 15 || pageWidth < 300) return null;

    // We look for a gutter between 25% and 65% of page width
    const minSplit = pageWidth * 0.25;
    const maxSplit = pageWidth * 0.65;
    const STEP = 15;

    let bestSplit: number | null = null;
    let maxGutterClearance = 0;

    for (let splitX = minSplit; splitX <= maxSplit; splitX += STEP) {
      const leftCount = items.filter(it => it.x + it.width < splitX).length;
      const rightCount = items.filter(it => it.x > splitX).length;
      const crossingCount = items.filter(it => it.x <= splitX && it.x + it.width >= splitX).length;

      // Both sides must have substantial content (at least 20% each)
      const minRequired = items.length * 0.2;
      if (leftCount >= minRequired && rightCount >= minRequired) {
        // We want minimal crossing items
        if (crossingCount <= items.length * 0.08) {
          const balanceScore = Math.min(leftCount, rightCount) - (crossingCount * 4);
          if (balanceScore > maxGutterClearance) {
            maxGutterClearance = balanceScore;
            bestSplit = splitX;
          }
        }
      }
    }

    return bestSplit;
  }

  /**
   * Renders a PDF page to an off-screen HTMLCanvasElement for OCR processing
   */
  public static async renderPageToCanvas(
    page: pdfjsLib.PDFPageProxy,
    scale: number = 2.0
  ): Promise<HTMLCanvasElement> {
    if (typeof document === 'undefined') {
      throw new Error('Canvas rendering is only supported in browser environments.');
    }

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D canvas rendering context.');
    }

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    return canvas;
  }
}
