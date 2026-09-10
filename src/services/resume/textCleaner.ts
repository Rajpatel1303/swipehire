/**
 * textCleaner.ts
 * Deterministic text cleaning and normalization for extracted resume content.
 * Cleans OCR artifacts and layout formatting while strictly preserving technical terms,
 * contact information, and bullet point structures.
 */

// Critical technical terms with punctuation that must NEVER be corrupted
const PROTECTED_TERMS = [
  'C++', 'C#', '.NET', 'ASP.NET', 'VB.NET',
  'Node.js', 'React.js', 'Vue.js', 'Next.js', 'Nuxt.js', 'Express.js',
  'Angular.js', 'Backbone.js', 'Ember.js', 'Three.js', 'Chart.js',
  'CI/CD', 'TCP/IP', 'REST/GraphQL', 'HTML5/CSS3', 'PL/SQL', 'T-SQL',
  'PostgreSQL', 'Socket.io'
];

export class TextCleaner {
  /**
   * Alias for clean()
   */
  static cleanExtractedText(rawText: string): string {
    return this.clean(rawText);
  }

  /**
   * Clean and normalize raw extracted resume text
   */
  static clean(rawText: string): string {
    if (!rawText || typeof rawText !== 'string') return '';

    let text = rawText;

    // 1. Normalize line endings to LF
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. Remove null bytes and non-printable control characters (keep \t, \n)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');

    // 3. Repair soft hyphenation at line breaks (e.g., "engi-\nneer" -> "engineer")
    text = text.replace(/(\b[a-zA-Z]{2,})-\n\s*([a-zA-Z]{2,}\b)/g, '$1$2');

    // 4. Protect known technical keywords with placeholder tokens
    const placeholders: Array<{ token: string; value: string }> = [];
    PROTECTED_TERMS.forEach((term, index) => {
      const token = `__SWIPEHIRED_TERM_${index}__`;
      const regex = new RegExp(this.escapeRegExp(term), 'gi');
      if (regex.test(text)) {
        placeholders.push({ token, value: term });
        text = text.replace(regex, token);
      }
    });

    // 5. Standardize bullet characters
    text = text.replace(/[▪▫▶►➢✔✓]/g, '•');
    text = text.replace(/\s*•\s*/g, '\n• ');

    // 6. Clean isolated header/footer artifacts like "Page 1 of 3", "Page 2/4", lone page digits
    text = text
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        if (/^page\s*\d+\s*(of|\/)\s*\d+$/i.test(trimmed)) return false;
        if (/^page\s*\d+$/i.test(trimmed)) return false;
        if (/^-\s*\d+\s*-$/.test(trimmed)) return false;
        if (/^\d+\s*\/\s*\d+$/.test(trimmed)) return false;
        return true;
      })
      .join('\n');

    // 7. Normalize horizontal whitespace on each line (collapse repeated spaces/tabs)
    text = text
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n');

    // 8. Collapse excessive blank lines (keep maximum of 2 consecutive newlines)
    text = text.replace(/\n{3,}/g, '\n\n');

    // 9. Restore protected technical keywords
    placeholders.forEach(({ token, value }) => {
      text = text.replace(new RegExp(token, 'g'), value);
    });

    return text.trim();
  }

  /**
   * Remove OCR-specific scan artifacts (e.g., stray punctuation, misread vertical bars)
   */
  static cleanOcrNoise(text: string): string {
    if (!text) return '';

    let cleaned = this.clean(text);

    // Remove single stray symbols on their own lines (e.g., "~", "`", "^", "|", "_")
    cleaned = cleaned
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        if (/^[~`^|_]{1,2}$/.test(trimmed)) return false;
        return true;
      })
      .join('\n');

    // Fix spaced out letters caused by OCR (e.g. "E X P E R I E N C E" -> "EXPERIENCE")
    cleaned = cleaned.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z]+)\b/g, (match) => {
      return match.replace(/\s+/g, '');
    });

    return cleaned.trim();
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
