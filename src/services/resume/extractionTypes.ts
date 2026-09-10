/**
 * extractionTypes.ts
 * Types and interfaces for the browser-first resume extraction pipeline.
 */

export type ExtractionMethod = 
  | 'pdf-text' 
  | 'ocr' 
  | 'docx-text' 
  | 'plain-text' 
  | 'hybrid';

export type ParsingProgressState =
  | 'idle'
  | 'validating'
  | 'extracting'
  | 'ocr'
  | 'cleaning'
  | 'sending-to-ai'
  | 'processing'
  | 'validating-result'
  | 'saving'
  | 'complete'
  | 'error';

export type ParsingProgressCallback = (
  state: ParsingProgressState,
  message: string,
  progressPct?: number
) => void;

export interface PageExtraction {
  pageNumber: number;
  text: string;
  method: ExtractionMethod;
  qualityScore: number; // 0 - 100
  wordCount: number;
  charCount: number;
  warnings: string[];
}

export interface ExtractionQuality {
  score: number; // 0 - 100
  textLength: number;
  wordCount: number;
  pagesWithText: number;
  totalPages: number;
  requiresOCR: boolean;
  ocrPages: number[];
  warnings: string[];
}

export interface BrowserResumeExtractionResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  pageCount: number;
  extractionMethod: ExtractionMethod | string;
  rawText: string;
  cleanedText: string;
  pages: PageExtraction[];
  extractionQuality: ExtractionQuality;
  extractionWarnings: string[];
}

export interface AIResumePayload {
  fileName: string;
  pageCount: number;
  extractionMethod: string;
  extractionQuality: number;
  pages: Array<{ page: number; text: string }>;
  fullText: string;
  candidateName?: string;
}

export interface ExtractionValidationResult {
  isValid: boolean;
  error?: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'image' | 'unknown';
  mimeType: string;
  sizeBytes: number;
}
