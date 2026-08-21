import { ParsedResumeResult } from "./types";

export class ResumeParser {
  /**
   * Parse resume input (Text string or File upload)
   */
  static async parse(
    input: string | File | Blob,
    candidateName?: string,
    originalFileName?: string
  ): Promise<ParsedResumeResult> {
    try {
      if (typeof input !== "string") {
        const formData = new FormData();
        formData.append("file", input, originalFileName || (input as any).name || "resume.pdf");
        if (candidateName) formData.append("candidateName", candidateName);

        const response = await fetch("/api/ai/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.extracted) return this.validateAndSanitize(data.extracted, candidateName);
        }
      } else {
        const response = await fetch("/api/ai/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: input, candidateName }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.extracted) return this.validateAndSanitize(data.extracted, candidateName);
        }
      }
    } catch (err) {
      console.warn("[ResumeParser] Server parsing unavailable, using local heuristic parser:", err);
    }

    return this.fallbackRegexParse(input, candidateName);
  }

  private static validateAndSanitize(data: any, candidateName?: string): ParsedResumeResult {
    return {
      fullName: data.fullName || candidateName || "",
      headline: data.headline || "Professional",
      email: data.email || "",
      phone: data.phone || "",
      location: data.location || "",
      workPreference: data.workPreference || "Hybrid",
      yearsOfExperience: Number(data.yearsOfExperience) || 0,
      skills: Array.isArray(data.skills) ? data.skills : [],
      possibleRoles: Array.isArray(data.possibleRoles) ? data.possibleRoles : [],
      education: Array.isArray(data.education) ? data.education : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      expectedSalary: data.expectedSalary || "",
      preferredRole: data.preferredRole || data.headline || "",
      bio: data.bio || "",
    };
  }

  private static fallbackRegexParse(input: string | File | Blob, candidateName?: string): ParsedResumeResult {
    const resumeText = typeof input === "string" ? input : "";
    const textLower = resumeText.toLowerCase();
    const skillsFound: string[] = [];
    const possibleSkills = [
      "React", "Node.js", "TypeScript", "JavaScript", "Python", "Tailwind CSS",
      "PostgreSQL", "MongoDB", "Express", "Next.js", "GraphQL", "Docker", "AWS", "Git", "Figma", "Redux", "Flutter", "Golang",
      "Accounting", "Financial Management", "Auditing", "GST", "Tally", "Excel", "Corporate Finance"
    ];
    possibleSkills.forEach(s => {
      if (textLower.includes(s.toLowerCase())) {
        skillsFound.push(s);
      }
    });

    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    return {
      fullName: candidateName || "",
      headline: skillsFound.length > 0 ? `${skillsFound.slice(0, 2).join(" & ")} Professional` : "Professional",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: "",
      workPreference: "Hybrid",
      yearsOfExperience: 1,
      skills: skillsFound,
      possibleRoles: skillsFound.length > 0 ? [`${skillsFound[0]} Specialist`] : [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      expectedSalary: "",
      preferredRole: "",
      bio: "",
    };
  }
}
