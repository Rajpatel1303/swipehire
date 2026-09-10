/**
 * ocrExtractor.ts
 * In-browser selective OCR using Tesseract.js for scanned, image-only, or degraded resume pages.
 * Features worker reuse and memory cleanup.
 */

import { createWorker, Worker } from 'tesseract.js';
import { PageExtraction } from './extractionTypes';
import { ExtractionUtils } from './extractionUtils';
import { TextCleaner } from './textCleaner';

export class OcrExtractor {
  private static workerInstance: Worker | null = null;
  private static isInitializing = false;

  /**
   * Gets or initializes a shared Tesseract worker
   */
  private static async getWorker(onProgress?: (pct: number) => void): Promise<Worker> {
    if (this.workerInstance) {
      return this.workerInstance;
    }

    if (this.isInitializing) {
      // Wait until initialized
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (this.workerInstance) return this.workerInstance;
    }

    this.isInitializing = true;
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text' && onProgress && typeof m.progress === 'number') {
            onProgress(Math.round(m.progress * 100));
          }
        },
      });

      this.workerInstance = worker;
      return worker;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Performs OCR on an HTML Canvas, Image, or Blob/File
   */
  public static async recognize(
    imageSource: HTMLCanvasElement | HTMLImageElement | Blob | string,
    pageNum: number = 1,
    onProgress?: (pct: number) => void
  ): Promise<PageExtraction> {
    const worker = await this.getWorker(onProgress);

    const result = await worker.recognize(imageSource);
    const rawText = result.data?.text || '';

    // Clean OCR artifacts, broken hyphens, noise
    const cleanedText = TextCleaner.cleanOcrNoise(rawText);
    const quality = ExtractionUtils.evaluateTextQuality(cleanedText, 1);

    const warnings: string[] = [...quality.warnings];
    if (result.data?.confidence && result.data.confidence < 60) {
      warnings.push(`Low OCR confidence: ${Math.round(result.data.confidence)}%`);
    }

    return {
      pageNumber: pageNum,
      text: cleanedText,
      method: 'ocr',
      qualityScore: quality.score,
      wordCount: quality.wordCount,
      charCount: quality.charCount,
      warnings,
    };
  }

  /**
   * Terminates the active Tesseract worker to free memory
   */
  public static async terminateWorker(): Promise<void> {
    if (this.workerInstance) {
      try {
        await this.workerInstance.terminate();
      } catch (err) {
        console.warn('Error terminating Tesseract worker:', err);
      } finally {
        this.workerInstance = null;
      }
    }
  }
}
