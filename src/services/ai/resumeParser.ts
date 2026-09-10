import { ParsedResumeResult } from "./types";
import { BrowserResumeParser, ParsingProgressCallback, AIResumePayload } from "../resume";

export class ResumeParser {
  /**
   * Parse resume input (Text string or File/Blob upload)
   * Runs the complete browser-first extraction pipeline (PDF layout sorting, DOCX, selective OCR, cleaning)
   * before sending the normalized text to Cloudflare Workers AI Gemma 4.
   */
  static async parse(
    input: string | File | Blob,
    candidateName?: string,
    originalFileName?: string,
    onProgress?: ParsingProgressCallback
  ): Promise<ParsedResumeResult> {
    let clientExtractedText = "";

    try {
      if (typeof input !== "string") {
        // Prepare File object
        let file: File;
        const resolvedName = originalFileName || (input as any).name || "resume.pdf";
        if (input instanceof File) {
          file = input;
        } else {
          file = new File([input], resolvedName, {
            type: input.type || "application/pdf",
          });
        }

        // 1. Browser-first extraction (PDF coordinate sorting, DOCX, selective OCR, text cleaning)
        const extractionResult = await BrowserResumeParser.parse(file, onProgress);
        clientExtractedText = extractionResult.cleanedText;

        const aiPayload: AIResumePayload = BrowserResumeParser.toAIPayload(extractionResult, candidateName);

        // 2. Dispatch to Cloudflare Workers AI Gemma 4 backend
        if (onProgress) {
          onProgress("sending-to-ai", "Cloudflare Workers AI (Google Gemma 4) structuring candidate profile...", 85);
        }

        const response = await fetch("/api/ai/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullText: extractionResult.cleanedText,
            payload: aiPayload,
            candidateName,
            fileName: resolvedName,
          }),
        });

        if (response.ok) {
          if (onProgress) {
            onProgress("validating-result", "Validating extracted candidate credentials...", 95);
          }
          const data = await response.json();
          if (data.extracted) {
            return this.validateAndSanitize(data.extracted, candidateName);
          }
        } else {
          console.warn("[ResumeParser] AI backend returned non-OK status:", response.status);
        }
      } else {
        clientExtractedText = input;
        if (onProgress) {
          onProgress("sending-to-ai", "Analyzing resume text with Google Gemma 4...", 50);
        }

        const response = await fetch("/api/ai/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullText: input, candidateName }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.extracted) {
            return this.validateAndSanitize(data.extracted, candidateName);
          }
        }
      }
    } catch (err: any) {
      console.warn("[ResumeParser] AI parsing encountered an issue, falling back to local extractor:", err);
    }

    return this.fallbackRegexParse(clientExtractedText || (typeof input === "string" ? input : ""), candidateName);
  }

  private static validateAndSanitize(data: any, candidateName?: string): ParsedResumeResult {
    let yoe = Number(data.yearsOfExperience);
    if (isNaN(yoe) || yoe < 0) {
      yoe = 0;
    } else {
      yoe = Math.round(yoe * 10) / 10;
    }
    if (yoe === 0 && Array.isArray(data.experience) && data.experience.length > 0) {
      yoe = 1;
    }

    let salary = (data.expectedSalary || "").trim();
    if (!salary) {
      if (yoe <= 1) salary = "₹4–7 LPA";
      else if (yoe <= 3) salary = "₹7–11 LPA";
      else if (yoe <= 6) salary = "₹12–18 LPA";
      else salary = "₹20–30 LPA";
    }

    let headline = (data.headline || "").trim();
    if (!headline || headline === "Professional" || headline === "Software Professional") {
      if (Array.isArray(data.possibleRoles) && data.possibleRoles[0]) {
        headline = String(data.possibleRoles[0]).trim();
      } else if (Array.isArray(data.experience) && data.experience[0]?.title) {
        headline = String(data.experience[0].title).trim();
      } else if (Array.isArray(data.skills) && data.skills.length > 0) {
        headline = `${data.skills[0]} Developer`;
      } else {
        headline = "Software Engineer";
      }
    }

    const locLower = (data.location || "").toLowerCase();
    let fullName = (data.fullName || "").trim();
    const nameLower = fullName.toLowerCase();
    const isAddressOrVillage =
      (locLower && (locLower.includes(nameLower) || nameLower.includes(locLower))) ||
      /^(devpar|kutch|mandvi|bhuj|ahmedabad|surat|rajkot|vadodara|gujarat|india|mumbai|delhi|pune|bangalore)\b/i.test(fullName) ||
      /(-yax|-yaksh|village|taluka|district|nagar|colony|street|road|at\/?po)/i.test(fullName);

    if (!fullName || fullName.toLowerCase() === "candidate" || isAddressOrVillage) {
      if (data.email && data.email.includes("@")) {
        const emailUser = data.email.split("@")[0].replace(/\d+/g, "").trim();
        const candidateSplits = emailUser.match(/[a-zA-Z][a-z]+/g);
        if (candidateSplits && candidateSplits.length >= 2) {
          fullName = candidateSplits.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ");
        } else {
          fullName = candidateName || "Candidate";
        }
      } else {
        fullName = candidateName || "Candidate";
      }
    }

    return {
      fullName,
      headline,
      email: data.email || "",
      phone: data.phone || "",
      location: data.location || "",
      workPreference: data.workPreference || "Hybrid",
      yearsOfExperience: yoe,
      skills: Array.isArray(data.skills) ? data.skills : [],
      possibleRoles: Array.isArray(data.possibleRoles) && data.possibleRoles.length > 0
        ? data.possibleRoles
        : [headline],
      education: Array.isArray(data.education) ? data.education : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      expectedSalary: salary,
      preferredRole: data.preferredRole || headline,
      bio: data.bio || "",
    };
  }

  private static fallbackRegexParse(input: string, candidateName?: string): ParsedResumeResult {
    const resumeText = input || "";
    const textLower = resumeText.toLowerCase();
    const skillsFound: string[] = [];
    const possibleSkills = [
      "React", "Node.js", "TypeScript", "JavaScript", "Python", "Tailwind CSS",
      "PostgreSQL", "MongoDB", "Express", "Next.js", "GraphQL", "Docker", "AWS", "Git", "Figma", "Redux", "Flutter", "Golang",
      "C++", "C#", ".NET", "Java", "Kubernetes", "Redis", "Vue.js", "Angular",
      "Accounting", "Financial Management", "Auditing", "GST", "Tally", "Excel", "Corporate Finance"
    ];

    possibleSkills.forEach(s => {
      if (textLower.includes(s.toLowerCase())) {
        skillsFound.push(s);
      }
    });

    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    const firstLine = resumeText.split("\n")[0]?.trim() || "";
    const extractedName = (!firstLine.includes("@") && !/\d/.test(firstLine) && firstLine.length < 50 && firstLine.length > 2)
      ? firstLine
      : (candidateName || "Candidate");

    const headline = skillsFound.length > 0 ? `${skillsFound[0]} Developer` : "Software Engineer";

    return {
      fullName: extractedName,
      headline,
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: "",
      workPreference: "Hybrid",
      yearsOfExperience: 1,
      skills: skillsFound,
      possibleRoles: [headline],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      expectedSalary: "₹4–7 LPA",
      preferredRole: headline,
      bio: "",
    };
  }
}
