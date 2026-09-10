/**
 * browserResumeParser.ts
 * Master in-browser resume parser orchestrating validation, multi-format extraction,
 * selective OCR for scanned pages, text cleaning, section normalization, and AI payload preparation.
 */

import { 
  BrowserResumeExtractionResult, 
  PageExtraction, 
  ParsingProgressCallback, 
  AIResumePayload,
  ExtractionMethod 
} from './extractionTypes';
import { ExtractionUtils } from './extractionUtils';
import { TextCleaner } from './textCleaner';
import { ResumeNormalizer } from './resumeNormalizer';
import { PdfExtractor } from './pdfExtractor';
import { DocxExtractor } from './docxExtractor';
import { OcrExtractor } from './ocrExtractor';

export class BrowserResumeParser {
  /**
   * Main entrypoint to extract and normalize resume content completely inside the user's browser
   */
  public static async parse(
    file: File,
    onProgress?: ParsingProgressCallback
  ): Promise<BrowserResumeExtractionResult> {
    const notify = (state: any, msg: string, pct?: number) => {
      if (onProgress) onProgress(state, msg, pct);
    };

    // 1. Browser-side validation
    notify('validating', 'Validating resume file format and integrity...', 5);
    const validation = ExtractionUtils.validateFile(file);
    if (!validation.isValid) {
      notify('error', validation.error || 'Invalid file', 0);
      throw new Error(validation.error || 'File validation failed.');
    }

    notify('extracting', `Extracting content from ${validation.fileType.toUpperCase()} resume...`, 15);

    let rawText = '';
    let pages: PageExtraction[] = [];
    let method: ExtractionMethod = 'pdf-text';
    const extractionWarnings: string[] = [];

    try {
      if (validation.fileType === 'pdf') {
        const result = await this.processPdf(file, notify);
        pages = result.pages;
        method = result.method;
        extractionWarnings.push(...result.warnings);
      } else if (validation.fileType === 'docx') {
        method = 'docx-text';
        const result = await DocxExtractor.extract(file);
        pages = result.pages;
        extractionWarnings.push(...result.warnings);
      } else if (validation.fileType === 'txt') {
        method = 'plain-text';
        const content = await file.text();
        const quality = ExtractionUtils.evaluateTextQuality(content, 1);
        pages = [{
          pageNumber: 1,
          text: content,
          method: 'plain-text',
          qualityScore: quality.score,
          wordCount: quality.wordCount,
          charCount: quality.charCount,
          warnings: quality.warnings,
        }];
        extractionWarnings.push(...quality.warnings);
      } else if (validation.fileType === 'image') {
        method = 'ocr';
        notify('ocr', 'Performing browser OCR on resume image...', 30);
        const ocrResult = await OcrExtractor.recognize(file, 1, pct => {
          notify('ocr', `Running OCR: ${pct}%`, 30 + Math.round(pct * 0.4));
        });
        pages = [ocrResult];
        extractionWarnings.push(...ocrResult.warnings);
      }
    } catch (err: any) {
      notify('error', `Extraction failed: ${err.message}`, 0);
      throw new Error(`Resume extraction failed: ${err.message}`);
    }

    // 2. Aggregate and clean text
    notify('cleaning', 'Cleaning artifacts and normalizing resume sections...', 80);
    rawText = pages.map(p => p.text).join('\n\n--- PAGE BREAK ---\n\n');

    // Clean text retaining code/technical markers
    const cleanedPerPages = pages.map(p => ({
      ...p,
      text: TextCleaner.cleanExtractedText(p.text),
    }));

    // Normalize document section boundaries
    const unifiedText = cleanedPerPages.map(p => p.text).join('\n\n');
    const normalizedText = ResumeNormalizer.normalizeSections(unifiedText);

    // 3. Document-level quality assessment
    const pageQualities = cleanedPerPages.map(p => ({
      pageNumber: p.pageNumber,
      score: p.qualityScore,
      wordCount: p.wordCount,
      charCount: p.charCount,
      warnings: p.warnings,
      isScanned: p.qualityScore < 35,
    }));
    const overallQuality = ExtractionUtils.aggregateDocumentQuality(pageQualities);
    extractionWarnings.push(...overallQuality.warnings);

    // Terminate OCR worker if it was used to conserve client memory
    if (method === 'ocr' || method === 'hybrid') {
      await OcrExtractor.terminateWorker();
    }

    notify('complete', 'Resume extracted and normalized successfully!', 100);

    return {
      fileName: file.name,
      fileType: validation.fileType,
      fileSize: file.size,
      pageCount: pages.length,
      extractionMethod: method,
      rawText,
      cleanedText: normalizedText,
      pages: cleanedPerPages,
      extractionQuality: overallQuality,
      extractionWarnings: Array.from(new Set(extractionWarnings)),
    };
  }

  private static readonly MAX_PARSED_PAGES = 5;

  /**
   * Processes PDF files with multi-page coordinate extraction and selective OCR for scanned pages
   */
  private static async processPdf(
    file: File,
    notify: (state: any, msg: string, pct?: number) => void
  ): Promise<{ pages: PageExtraction[]; method: ExtractionMethod; warnings: string[] }> {
    const pdfDoc = await PdfExtractor.loadDocument(file);
    const totalPages = pdfDoc.numPages;
    const pagesToProcess = Math.min(totalPages, this.MAX_PARSED_PAGES);
    const pages: PageExtraction[] = [];
    const warnings: string[] = [];
    let usedOcr = false;
    let usedDigitalText = false;

    if (totalPages > this.MAX_PARSED_PAGES) {
      warnings.push(`Document contains ${totalPages} pages. Processed the primary ${this.MAX_PARSED_PAGES} pages to optimize speed and browser performance.`);
    }

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const stepPct = 15 + Math.round((pageNum / pagesToProcess) * 50);
      notify('extracting', `Analyzing PDF page ${pageNum} of ${pagesToProcess}...`, stepPct);

      const page = await pdfDoc.getPage(pageNum);
      let pageExt = await PdfExtractor.extractPage(page, pageNum);

      // Check if page has no or very low quality text (e.g. scanned image or vector drawing)
      const needsOcr = pageExt.qualityScore < 35 || pageExt.text.trim().length < 80;

      if (needsOcr && typeof document !== 'undefined') {
        notify('ocr', `Running selective browser OCR on page ${pageNum}...`, stepPct + 5);
        try {
          const canvas = await PdfExtractor.renderPageToCanvas(page, 2.0);
          const ocrExt = await OcrExtractor.recognize(canvas, pageNum);

          // If OCR produced meaningful text that scores better, use OCR
          if (ocrExt.qualityScore > pageExt.qualityScore || ocrExt.text.trim().length > pageExt.text.trim().length * 1.5) {
            pageExt = ocrExt;
            usedOcr = true;
          } else {
            usedDigitalText = true;
          }
        } catch (ocrErr: any) {
          warnings.push(`OCR failed on page ${pageNum}: ${ocrErr.message}`);
          usedDigitalText = true;
        }
      } else {
        usedDigitalText = true;
      }

      pages.push(pageExt);
    }

    let finalMethod: ExtractionMethod = 'pdf-text';
    if (usedOcr && usedDigitalText) {
      finalMethod = 'hybrid';
    } else if (usedOcr && !usedDigitalText) {
      finalMethod = 'ocr';
    }

    return {
      pages,
      method: finalMethod,
      warnings,
    };
  }

  /**
   * Prepares the lightweight AI payload containing extracted text ready for Cloudflare Workers AI
   */
  public static toAIPayload(
    result: BrowserResumeExtractionResult,
    candidateName?: string
  ): AIResumePayload {
    return {
      fileName: result.fileName,
      pageCount: result.pageCount,
      extractionMethod: result.extractionMethod,
      extractionQuality: result.extractionQuality.score,
      pages: result.pages.map(p => ({ page: p.pageNumber, text: p.text })),
      fullText: result.cleanedText,
      candidateName,
    };
  }
}
