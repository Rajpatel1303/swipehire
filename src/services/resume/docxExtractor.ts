/**
 * docxExtractor.ts
 * In-browser DOCX text extraction using Mammoth with table, heading, and list preservation.
 */

import mammoth from 'mammoth';
import { PageExtraction } from './extractionTypes';
import { ExtractionUtils } from './extractionUtils';
import { TextCleaner } from './textCleaner';

export class DocxExtractor {
  /**
   * Extracts structured text from a DOCX file or ArrayBuffer
   */
  public static async extract(fileOrBuffer: File | ArrayBuffer): Promise<{
    text: string;
    pages: PageExtraction[];
    warnings: string[];
  }> {
    const arrayBuffer = fileOrBuffer instanceof File 
      ? await fileOrBuffer.arrayBuffer() 
      : fileOrBuffer;

    const warnings: string[] = [];

    // Attempt HTML conversion first to preserve tables, lists, and headings
    let extractedText = '';
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      if (htmlResult.messages && htmlResult.messages.length > 0) {
        for (const msg of htmlResult.messages) {
          if (msg.type === 'warning') {
            warnings.push(msg.message);
          }
        }
      }

      extractedText = this.convertHtmlToStructuredText(htmlResult.value);
    } catch (e: any) {
      warnings.push(`HTML conversion failed (${e.message}), falling back to raw text extraction.`);
    }

    // Fallback or validation against raw text
    if (!extractedText || extractedText.trim().length < 20) {
      const rawResult = await mammoth.extractRawText({ arrayBuffer });
      extractedText = rawResult.value;
      if (rawResult.messages) {
        for (const msg of rawResult.messages) {
          if (msg.type === 'warning') warnings.push(msg.message);
        }
      }
    }

    const cleanedText = TextCleaner.cleanExtractedText(extractedText);
    const quality = ExtractionUtils.evaluateTextQuality(cleanedText, 1);
    warnings.push(...quality.warnings);

    const pageExtraction: PageExtraction = {
      pageNumber: 1,
      text: cleanedText,
      method: 'docx-text',
      qualityScore: quality.score,
      wordCount: quality.wordCount,
      charCount: quality.charCount,
      warnings: quality.warnings,
    };

    return {
      text: cleanedText,
      pages: [pageExtraction],
      warnings: Array.from(new Set(warnings)),
    };
  }

  /**
   * Converts Mammoth HTML output into formatted markdown/plain text preserving tables and lists
   */
  private static convertHtmlToStructuredText(html: string): string {
    if (!html) return '';

    // If running in browser with DOMParser
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Convert tables into markdown pipe tables
      const tables = doc.querySelectorAll('table');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        const markdownRows: string[] = [];
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, th');
          const cellTexts = Array.from(cells).map(cell => (cell.textContent || '').trim().replace(/\s+/g, ' '));
          if (cellTexts.some(c => c.length > 0)) {
            markdownRows.push(`| ${cellTexts.join(' | ')} |`);
          }
        });

        if (markdownRows.length > 0) {
          const tableNode = doc.createTextNode('\n\n' + markdownRows.join('\n') + '\n\n');
          table.parentNode?.replaceChild(tableNode, table);
        }
      });

      // Convert headings to markdown
      for (let level = 1; level <= 6; level++) {
        const headings = doc.querySelectorAll(`h${level}`);
        headings.forEach(h => {
          const prefix = '#'.repeat(Math.min(level + 1, 3)) + ' ';
          const textNode = doc.createTextNode(`\n\n${prefix}${h.textContent?.trim() || ''}\n`);
          h.parentNode?.replaceChild(textNode, h);
        });
      }

      // Convert list items
      const listItems = doc.querySelectorAll('li');
      listItems.forEach(li => {
        const textNode = doc.createTextNode(`\n- ${li.textContent?.trim() || ''}`);
        li.parentNode?.replaceChild(textNode, li);
      });

      // Convert paragraphs
      const paragraphs = doc.querySelectorAll('p');
      paragraphs.forEach(p => {
        const textNode = doc.createTextNode(`\n${p.textContent?.trim() || ''}\n`);
        p.parentNode?.replaceChild(textNode, p);
      });

      return doc.body.textContent || '';
    }

    // Regex fallback for non-DOM environments
    let output = html
      // Headings
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n## $1\n')
      // List items
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n- $1')
      // Table cells and rows
      .replace(/<tr[^>]*>(.*?)<\/tr>/gi, (_, rowContent) => {
        const cells = (rowContent.match(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi) || [])
          .map((c: string) => c.replace(/<\/?[^>]+(>|$)/g, '').trim());
        return cells.length > 0 ? `\n| ${cells.join(' | ')} |` : '';
      })
      // Paragraphs & breaks
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // Strip remaining HTML tags
      .replace(/<\/?[^>]+(>|$)/g, '');

    return output;
  }
}
