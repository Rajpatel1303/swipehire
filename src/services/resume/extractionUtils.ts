/**
 * extractionUtils.ts
 * File validation, quality assessment algorithms, reading-order coordinate helpers,
 * and deterministic fingerprints for the resume parsing pipeline.
 */

import { ExtractionValidationResult, ExtractionQuality } from './extractionTypes';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const SUPPORTED_EXTENSIONS: Record<string, 'pdf' | 'docx' | 'txt' | 'image'> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.doc': 'docx',
  '.txt': 'txt',
  '.md': 'txt',
  '.rtf': 'txt',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
};

const RESUME_KEYWORDS = [
  'experience', 'education', 'skills', 'projects', 'work', 'employment',
  'summary', 'profile', 'contact', 'email', 'phone', 'university', 'college',
  'bachelor', 'master', 'engineer', 'developer', 'manager', 'technologies',
  'certifications', 'curriculum', 'resume'
];

export class ExtractionUtils {
  /**
   * Validate uploaded resume file in the browser before processing
   */
  static validateFile(file: File): ExtractionValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided.',
        fileType: 'unknown',
        mimeType: '',
        sizeBytes: 0,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 25MB limit.`,
        fileType: 'unknown',
        mimeType: file.type || '',
        sizeBytes: file.size,
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'The uploaded file is empty (0 bytes).',
        fileType: 'unknown',
        mimeType: file.type || '',
        sizeBytes: 0,
      };
    }

    const nameLower = file.name.toLowerCase();
    const ext = nameLower.substring(nameLower.lastIndexOf('.'));
    const fileType = SUPPORTED_EXTENSIONS[ext];

    if (!fileType) {
      return {
        isValid: false,
        error: `Unsupported format: "${ext}". Please upload a PDF (.pdf), Word Document (.docx), or Text file (.txt).`,
        fileType: 'unknown',
        mimeType: file.type || '',
        sizeBytes: file.size,
      };
    }

    return {
      isValid: true,
      fileType,
      mimeType: file.type || '',
      sizeBytes: file.size,
    };
  }

  /**
   * Deterministic quality evaluation of extracted page text
   */
  static evaluateTextQuality(text: string, pageNumber: number = 1): {
    score: number;
    wordCount: number;
    charCount: number;
    warnings: string[];
    isScanned: boolean;
  } {
    const warnings: string[] = [];
    const trimmed = text.trim();
    const charCount = trimmed.length;
    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Zero or near-zero text strongly indicates scanned/image page
    if (charCount < 40 || wordCount < 10) {
      warnings.push(`Page ${pageNumber} has extremely low text volume (${charCount} chars, ${wordCount} words). Likely an image/scan.`);
      return { score: 10, wordCount, charCount, warnings, isScanned: true };
    }

    let score = 50; // Base score

    // 1. Text Volume Scoring
    if (charCount >= 500) score += 20;
    else if (charCount >= 200) score += 10;
    else score -= 15;

    // 2. Dictionary / Resume Keyword Presence
    const lower = trimmed.toLowerCase();
    let keywordHits = 0;
    for (const kw of RESUME_KEYWORDS) {
      if (lower.includes(kw)) keywordHits++;
    }
    score += Math.min(20, keywordHits * 4);

    // 3. Contact & Date Pattern Density
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed);
    const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(trimmed);
    const hasDate = /\b(19\d\d|20\d\d)\b/.test(trimmed);

    if (hasEmail || hasPhone) score += 10;
    if (hasDate) score += 10;

    // 4. Garbage / Corrupted Unicode Penalty
    const nonAsciiCount = (trimmed.match(/[^\x20-\x7E\t\n\r]/g) || []).length;
    const corruptionRatio = nonAsciiCount / charCount;
    if (corruptionRatio > 0.15) {
      score -= 30;
      warnings.push(`Page ${pageNumber} has high non-ASCII / Unicode corruption ratio (${(corruptionRatio * 100).toFixed(1)}%).`);
    }

    // Repeated identical character penalty (e.g. "aaaaaaa", ".....")
    if (/(.)\1{10,}/.test(trimmed)) {
      score -= 15;
      warnings.push(`Page ${pageNumber} has excessive repeated characters.`);
    }

    score = Math.max(0, Math.min(100, score));
    const isScanned = score < 35 || wordCount < 20;

    return { score, wordCount, charCount, warnings, isScanned };
  }

  /**
   * Aggregate overall document extraction quality across all pages
   */
  static aggregateDocumentQuality(
    pageQualities: Array<{ pageNumber: number; score: number; wordCount: number; charCount: number; warnings: string[]; isScanned: boolean }>
  ): ExtractionQuality {
    const totalPages = pageQualities.length || 1;
    let totalScore = 0;
    let totalWords = 0;
    let totalLength = 0;
    let pagesWithText = 0;
    const ocrPages: number[] = [];
    const allWarnings: string[] = [];

    for (const pq of pageQualities) {
      totalScore += pq.score;
      totalWords += pq.wordCount;
      totalLength += pq.charCount;
      if (pq.wordCount > 15) pagesWithText++;
      if (pq.isScanned) ocrPages.push(pq.pageNumber);
      allWarnings.push(...pq.warnings);
    }

    const averageScore = Math.round(totalScore / totalPages);
    const requiresOCR = ocrPages.length > 0;

    return {
      score: averageScore,
      textLength: totalLength,
      wordCount: totalWords,
      pagesWithText,
      totalPages,
      requiresOCR,
      ocrPages,
      warnings: allWarnings,
    };
  }

  /**
   * Generate a unique fingerprint to prevent re-parsing the identical document
   */
  static generateFileFingerprint(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
}
