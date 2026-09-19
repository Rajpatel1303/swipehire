import { ParsedResumeResult } from "./types";
import type { ParsingProgressCallback, AIResumePayload } from "../resume";

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

        // 1. Browser-first extraction (dynamically loaded to keep initial landing page bundle lightweight)
        let extractionResult: any = null;
        try {
          const { BrowserResumeParser } = await import("../resume/browserResumeParser");
          extractionResult = await BrowserResumeParser.parse(file, onProgress);
          clientExtractedText = extractionResult?.cleanedText || "";
        } catch (clientErr) {
          console.warn("[ResumeParser] Client browser PDF extraction failed, attempting server extraction:", clientErr);
        }

        // 2. Dispatch to backend AI (with Dual-Pass: JSON if client extracted text, FormData file if client failed)
        if (onProgress) {
          onProgress("sending-to-ai", "Cloudflare Workers AI (Google Gemma 4) structuring candidate profile...", 85);
        }

        let response: Response;
        if (clientExtractedText && clientExtractedText.trim().length >= 80) {
          const { BrowserResumeParser } = await import("../resume/browserResumeParser");
          const aiPayload = BrowserResumeParser.toAIPayload(extractionResult, candidateName);

          response = await fetch("/api/ai/parse-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullText: clientExtractedText,
              payload: aiPayload,
              candidateName,
              fileName: resolvedName,
            }),
          });
        } else {
          // Dual-pass server fallback: upload file directly
          const formData = new FormData();
          formData.append("file", file);
          if (candidateName) formData.append("candidateName", candidateName);
          formData.append("fileName", resolvedName);
          if (clientExtractedText) formData.append("fullText", clientExtractedText);

          response = await fetch("/api/ai/parse-resume", {
            method: "POST",
            body: formData,
          });
        }

        if (response.ok) {
          if (onProgress) {
            onProgress("validating-result", "Validating extracted candidate credentials...", 95);
          }
          const data = await response.json();
          if (data.extracted) {
            return this.validateAndSanitize(data.extracted, candidateName, clientExtractedText);
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
            return this.validateAndSanitize(data.extracted, candidateName, clientExtractedText);
          }
        }
      }
    } catch (err: any) {
      console.warn("[ResumeParser] AI parsing encountered an issue, falling back to local extractor:", err);
    }

    return this.fallbackRegexParse(clientExtractedText || (typeof input === "string" ? input : ""), candidateName);
  }

  private static extractHeuristicSections(rawText: string): {
    education: Array<{ degree: string; institution: string; year: string }>;
    experience: Array<{ title: string; company: string; duration: string; description: string }>;
    projects: Array<{ name: string; description: string; technologies: string[] }>;
    skills: string[];
    summary: string;
  } {
    const lines = (rawText || "").split("\n").map(l => l.trim()).filter(Boolean);
    const sections: Record<string, string[]> = {
      education: [],
      experience: [],
      projects: [],
      skills: [],
      summary: [],
      other: [],
    };

    let currentSection = "other";
    const headerRegexes = [
      { type: "education", regex: /^(?:##\s*)?(?:education|academic|qualifications|degrees?)\b/i },
      { type: "experience", regex: /^(?:##\s*)?(?:experience|work experience|professional experience|employment history|work history)\b/i },
      { type: "projects", regex: /^(?:##\s*)?(?:projects|key projects|personal projects|featured projects|portfolio)\b/i },
      { type: "skills", regex: /^(?:##\s*)?(?:skills|technical skills|technologies|core competencies|tools)\b/i },
      { type: "summary", regex: /^(?:##\s*)?(?:summary|professional summary|about me|profile|objective)\b/i },
    ];

    for (const line of lines) {
      const matched = headerRegexes.find(h => h.regex.test(line));
      if (matched && line.length < 50) {
        currentSection = matched.type;
        continue;
      }
      sections[currentSection].push(line);
    }

    // 1. Education
    const education: Array<{ degree: string; institution: string; year: string }> = [];
    const eduLines = sections.education.length > 0 ? sections.education : lines;
    const degreeRegex = /\b(b\.?tech|b\.?e\.?|bachelor|master|m\.?tech|m\.?e\.?|bca|mca|b\.?sc|m\.?sc|mba|ph\.?d|diploma|higher secondary|senior secondary|12th|10th)\b/i;
    for (let i = 0; i < eduLines.length; i++) {
      const line = eduLines[i];
      if (degreeRegex.test(line) && line.length < 120) {
        const yearMatch = line.match(/\b(19\d\d|20\d\d)(?:\s*[-–to]\s*(?:19\d\d|20\d\d|present))?\b/i);
        let institution = "";
        if (eduLines[i + 1] && !degreeRegex.test(eduLines[i + 1]) && eduLines[i + 1].length < 100) {
          institution = eduLines[i + 1].replace(/\b(19\d\d|20\d\d).*$/, "").replace(/^[|\-•\s]+/, "").trim();
        }
        education.push({
          degree: line.replace(/\b(19\d\d|20\d\d).*$/, "").replace(/[|•,].*$/, "").trim(),
          institution: institution || "University / Institute",
          year: yearMatch ? yearMatch[0] : (eduLines[i + 1]?.match(/\b(19\d\d|20\d\d)\b/)?.[0] || ""),
        });
      }
    }

    // 2. Experience
    const experience: Array<{ title: string; company: string; duration: string; description: string }> = [];
    const expLines = sections.experience.length > 0 ? sections.experience : lines;
    const roleRegex = /\b(developer|engineer|lead|architect|manager|intern|consultant|analyst|specialist|designer|programmer|administrator)\b/i;
    const dateRegex = /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d\d|19\d\d)[a-z0-9\s]*[-–to]\s*(?:present|current|today|20\d\d|19\d\d|\w+))\b/i;

    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i];
      if (roleRegex.test(line) && line.length < 100 && !line.toLowerCase().includes("skills")) {
        const durationMatch = line.match(dateRegex) || expLines[i + 1]?.match(dateRegex);
        const companyMatch = line.split(/[|–\-@]/)[1] || expLines[i + 1]?.split(/[|–\-@]/)[0] || "Tech Company";
        const descLines: string[] = [];
        for (let j = i + 1; j < Math.min(i + 4, expLines.length); j++) {
          if (roleRegex.test(expLines[j]) && expLines[j].length < 80) break;
          if (expLines[j].startsWith("-") || expLines[j].startsWith("•") || expLines[j].length > 25) {
            descLines.push(expLines[j].replace(/^[-•*]\s*/, ""));
          }
        }
        experience.push({
          title: line.split(/[|–\-@]/)[0].trim(),
          company: companyMatch.replace(dateRegex, "").replace(/[|–\-]/g, "").trim() || "Tech Company",
          duration: durationMatch ? durationMatch[0].trim() : "Recent",
          description: descLines.slice(0, 2).join(". ") || "Core engineering and software development responsibilities.",
        });
      }
    }

    // 3. Projects
    const projects: Array<{ name: string; description: string; technologies: string[] }> = [];
    const projLines = sections.projects.length > 0 ? sections.projects : lines;
    for (let i = 0; i < projLines.length; i++) {
      const line = projLines[i];
      const isBulletOrHeader = /^[-•*]\s*[A-Z0-9]/i.test(line) || (sections.projects.length > 0 && !line.startsWith("-") && line.length < 70 && !line.includes("@"));
      if (isBulletOrHeader && line.length > 3 && line.length < 90) {
        const cleanName = line.replace(/^[-•*]\s*/, "").split(/[:|\-–]/)[0].trim();
        const descPart = line.split(/[:|\-–]/).slice(1).join(" ").trim() || (projLines[i + 1] && projLines[i + 1].length > 15 ? projLines[i + 1].replace(/^[-•*]\s*/, "") : "Full-stack application development and system architecture.");
        if (cleanName && cleanName.length >= 2 && !roleRegex.test(cleanName) && !degreeRegex.test(cleanName)) {
          projects.push({
            name: cleanName,
            description: descPart,
            technologies: [],
          });
        }
      }
    }

    // 4. Skills
    const textLower = (rawText || "").toLowerCase();
    const possibleSkills = [
      "React", "React Native", "Node.js", "TypeScript", "JavaScript", "Python", "Tailwind CSS",
      "PostgreSQL", "MongoDB", "Express", "Next.js", "GraphQL", "Docker", "AWS", "Git", "Figma", "Redux", "Flutter", "Golang",
      "C++", "C#", ".NET", "Java", "Kubernetes", "Redis", "Vue.js", "Angular", "HTML", "CSS", "SQL",
      "Accounting", "Financial Management", "Auditing", "GST", "Tally", "Excel", "Corporate Finance",
      "Django", "FastAPI", "REST APIs", "Microservices", "Linux", "CI/CD", "Prisma", "Supabase", "Firebase"
    ];
    const skills = possibleSkills.filter(s => textLower.includes(s.toLowerCase()));

    return {
      education: education.slice(0, 4),
      experience: experience.slice(0, 5),
      projects: projects.slice(0, 5),
      skills,
      summary: sections.summary.join(" ") || "",
    };
  }

  private static validateAndSanitize(data: any, candidateName?: string, rawResumeText?: string): ParsedResumeResult {
    let yoe = Number(data?.yearsOfExperience);
    if (isNaN(yoe) || yoe < 0) {
      yoe = 0;
    } else {
      yoe = Math.round(yoe * 10) / 10;
    }

    const heuristic = this.extractHeuristicSections(rawResumeText || "");

    // Polymorphic Education
    let rawEdu = data?.education;
    if (rawEdu && !Array.isArray(rawEdu) && typeof rawEdu === "object") {
      rawEdu = [rawEdu];
    }
    let education: Array<{ degree: string; institution: string; year: string }> = (Array.isArray(rawEdu) ? rawEdu : [])
      .map((e: any) => {
        if (typeof e === "string") return { degree: e.trim(), institution: "University / Institute", year: "" };
        const degree = String(e?.degree || e?.major || e?.title || e?.course || e?.qualification || "").trim();
        const institution = String(e?.institution || e?.university || e?.college || e?.school || e?.institute || "").trim();
        const year = String(e?.year || e?.graduation_year || e?.duration || e?.period || e?.dates || "").trim();
        return { degree, institution: institution || "University / Institute", year };
      })
      .filter((e: any) => e.degree || e.institution);

    if (education.length === 0 && heuristic.education.length > 0) {
      education = heuristic.education;
    }

    // Polymorphic Experience
    let rawExp = data?.experience;
    if (rawExp && !Array.isArray(rawExp) && typeof rawExp === "object") {
      rawExp = [rawExp];
    }
    let experience: Array<{ title: string; company: string; duration: string; description: string }> = (Array.isArray(rawExp) ? rawExp : [])
      .map((exp: any) => {
        if (typeof exp === "string") return { title: exp.trim(), company: "Tech Company", duration: "Recent", description: "Software development responsibilities." };
        const title = String(exp?.title || exp?.role || exp?.position || exp?.jobTitle || exp?.designation || "").trim();
        const company = String(exp?.company || exp?.organization || exp?.employer || exp?.workplace || "").trim();
        const duration = String(exp?.duration || exp?.period || exp?.dates || exp?.date_range || exp?.years || "Recent").trim();
        let description = exp?.description || exp?.summary || exp?.responsibilities || "";
        if (Array.isArray(description)) description = description.join(". ");
        return { title, company: company || "Tech Company", duration, description: String(description).trim() };
      })
      .filter((exp: any) => exp.title || exp.company);

    if (experience.length === 0 && heuristic.experience.length > 0) {
      experience = heuristic.experience;
    }

    if (yoe === 0 && experience.length > 0) {
      yoe = Math.min(Math.max(experience.length, 1), 8);
    }

    // Polymorphic Projects
    let rawProj = data?.projects;
    if (rawProj && !Array.isArray(rawProj) && typeof rawProj === "object") {
      rawProj = [rawProj];
    }
    let projects: Array<{ name: string; description: string; technologies: string[] }> = (Array.isArray(rawProj) ? rawProj : [])
      .map((p: any) => {
        if (typeof p === "string") {
          return { name: p.trim(), description: "Software engineering and implementation.", technologies: [] };
        }
        const name = String(p?.name || p?.title || p?.projectName || p?.project_name || "").trim();
        const description = String(p?.description || p?.summary || p?.details || "Application architecture and development.").trim();
        let technologies = p?.technologies || p?.tech_stack || p?.tools || p?.skills || [];
        if (typeof technologies === "string") {
          technologies = technologies.split(/[,|/]/).map((t: string) => t.trim()).filter(Boolean);
        }
        return {
          name,
          description,
          technologies: Array.isArray(technologies) ? technologies.map((t: any) => String(t).trim()).filter(Boolean) : []
        };
      })
      .filter((p: any) => p.name);

    if (projects.length === 0 && heuristic.projects.length > 0) {
      projects = heuristic.projects;
    }

    // Skills
    let skills: string[] = Array.isArray(data?.skills)
      ? Array.from(new Set(data.skills.map((s: any) => String(s).trim()).filter(Boolean)))
      : [];
    if (skills.length === 0 && heuristic.skills.length > 0) {
      skills = heuristic.skills;
    }

    let salary = (data?.expectedSalary || "").trim();
    if (!salary) {
      if (yoe <= 1) salary = "₹4–7 LPA";
      else if (yoe <= 3) salary = "₹7–11 LPA";
      else if (yoe <= 6) salary = "₹12–18 LPA";
      else salary = "₹20–30 LPA";
    }

    let headline = (data?.headline || "").trim();
    if (!headline || headline === "Professional" || headline === "Software Professional") {
      if (Array.isArray(data?.possibleRoles) && data.possibleRoles[0]) {
        headline = String(data.possibleRoles[0]).trim();
      } else if (experience[0]?.title) {
        headline = String(experience[0].title).trim();
      } else if (skills.length > 0) {
        headline = `${skills[0]} Developer`;
      } else {
        headline = "Software Engineer";
      }
    }

    const locLower = (data?.location || "").toLowerCase();
    let fullName = (data?.fullName || "").trim();
    const nameLower = fullName.toLowerCase();
    const isAddressOrVillage =
      (locLower && (locLower.includes(nameLower) || nameLower.includes(locLower))) ||
      /^(devpar|kutch|mandvi|bhuj|ahmedabad|surat|rajkot|vadodara|gujarat|india|mumbai|delhi|pune|bangalore)\b/i.test(fullName) ||
      /(-yax|-yaksh|village|taluka|district|nagar|colony|street|road|at\/?po)/i.test(fullName);

    if (!fullName || fullName.toLowerCase() === "candidate" || isAddressOrVillage) {
      if (data?.email && data.email.includes("@")) {
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
      email: data?.email || "",
      phone: data?.phone || "",
      location: data?.location || "",
      workPreference: data?.workPreference || "Hybrid",
      yearsOfExperience: yoe,
      skills: skills.length > 0 ? skills : ["Software Engineering", "Problem Solving"],
      possibleRoles: Array.isArray(data?.possibleRoles) && data.possibleRoles.length > 0
        ? data.possibleRoles
        : [headline, "Software Engineer"],
      education,
      experience,
      projects,
      certifications: Array.isArray(data?.certifications) ? data.certifications.map((c: any) => String(c).trim()).filter(Boolean) : [],
      expectedSalary: salary,
      preferredRole: data?.preferredRole || headline,
      bio: data?.bio || heuristic.summary || `${fullName} is an experienced professional specializing in ${skills.slice(0, 3).join(", ") || "modern engineering"}.`,
    };
  }

  private static fallbackRegexParse(input: string, candidateName?: string): ParsedResumeResult {
    const resumeText = input || "";
    const heuristic = this.extractHeuristicSections(resumeText);

    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    const lines = resumeText.split("\n").map(l => l.trim()).filter(Boolean);
    let extractedName = candidateName || "";
    if (!extractedName || extractedName.toLowerCase() === "candidate") {
      for (const line of lines.slice(0, 8)) {
        if (
          line.length >= 3 &&
          line.length <= 40 &&
          !line.includes("@") &&
          !/\d/.test(line) &&
          !/(-yax|-yaksh|village|taluka|district|gujarat|india|street|road|resume|curriculum|profile|contact)/i.test(line) &&
          !/^(contact|summary|skills|education|experience|projects)/i.test(line)
        ) {
          extractedName = line;
          break;
        }
      }
    }
    if (!extractedName) extractedName = "Candidate";

    const headline = heuristic.skills.length > 0
      ? `${heuristic.skills[0]} Developer`
      : (heuristic.experience[0]?.title || "Software Engineer");
    const yoe = Math.min(Math.max(heuristic.experience.length, 1), 8);
    const expectedSalary = yoe <= 1 ? "₹4–7 LPA" : yoe <= 3 ? "₹7–11 LPA" : yoe <= 6 ? "₹12–18 LPA" : "₹20–30 LPA";

    return {
      fullName: extractedName,
      headline,
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: "",
      workPreference: "Hybrid",
      yearsOfExperience: yoe,
      skills: heuristic.skills.length > 0 ? heuristic.skills : ["Software Engineering", "Problem Solving"],
      possibleRoles: [headline, "Software Engineer"],
      education: heuristic.education,
      experience: heuristic.experience,
      projects: heuristic.projects,
      certifications: [],
      expectedSalary,
      preferredRole: headline,
      bio: heuristic.summary || `${extractedName} is a software engineer with expertise in ${heuristic.skills.slice(0, 3).join(", ") || "modern application development"}.`,
    };
  }
}
