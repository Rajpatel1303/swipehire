/**
 * resumeNormalizer.ts
 * Normalizes resume structure, preserves standard section headers,
 * and organizes text for optimal LLM factual extraction.
 */

const SECTION_HEADERS = [
  'CONTACT',
  'SUMMARY',
  'PROFESSIONAL SUMMARY',
  'EXECUTIVE SUMMARY',
  'PROFILE',
  'OBJECTIVE',
  'CAREER OBJECTIVE',
  'SKILLS',
  'TECHNICAL SKILLS',
  'CORE COMPETENCIES',
  'EXPERIENCE',
  'WORK EXPERIENCE',
  'PROFESSIONAL EXPERIENCE',
  'EMPLOYMENT HISTORY',
  'WORK HISTORY',
  'EDUCATION',
  'ACADEMIC BACKGROUND',
  'PROJECTS',
  'PERSONAL PROJECTS',
  'KEY PROJECTS',
  'CERTIFICATIONS',
  'CERTIFICATES & LICENSES',
  'ACHIEVEMENTS',
  'HONORS & AWARDS',
  'AWARDS',
  'LANGUAGES',
  'PUBLICATIONS',
  'VOLUNTEERING',
  'COMMUNITY INVOLVEMENT',
  'INTERESTS',
  'ADDITIONAL INFORMATION'
];

export class ResumeNormalizer {
  /**
   * Alias for normalize()
   */
  static normalizeSections(text: string): string {
    return this.normalize(text);
  }

  /**
   * Structure and normalize extracted resume text to preserve distinct sections
   */
  static normalize(text: string): string {
    if (!text) return '';

    let lines = text.split('\n');
    const normalizedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        normalizedLines.push('');
        continue;
      }

      // Check if line matches a known resume section header
      const upperLine = line.toUpperCase().replace(/[:\-_#*]+$/, '').trim();
      const isHeader = SECTION_HEADERS.some((header) => {
        return upperLine === header || upperLine === `### ${header}` || upperLine === `## ${header}`;
      });

      if (isHeader) {
        // Ensure section header is cleanly demarcated with double linebreaks
        normalizedLines.push('');
        normalizedLines.push(`## ${upperLine}`);
        normalizedLines.push('');
      } else {
        normalizedLines.push(line);
      }
    }

    let result = normalizedLines.join('\n');
    // Collapse excess line breaks
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
  }
}
