import { CandidateProfile, Job } from "../types";
import { EdenAIService } from "./edenAiService";

export interface ParsedResumeResult {
  fullName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  workPreference?: string;
  yearsOfExperience?: number;
  skills?: string[];
  possibleRoles?: string[];
  education?: Array<{ degree: string; institution: string; year: string }>;
  experience?: Array<{ title: string; company: string; duration: string; description: string }>;
  projects?: Array<{ name: string; description: string; technologies: string[] }>;
  certifications?: string[];
  expectedSalary?: string;
  preferredRole?: string;
  bio?: string;
}

export interface GeneratedJobResult {
  title: string;
  department?: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  experience: string;
  salary: string;
  openings: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface MatchAnalysisResult {
  matchScore: number;
  fitVerdict?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  reasons: string[];
  strengths?: string[];
  concerns: string[];
  aiSummary: string;
  interviewQuestions?: string[];
}

export const GeminiService = {
  /**
   * Parse resume using Eden AI (Accepts raw text or File/Blob)
   */
  async parseResume(
    input: string | File | Blob,
    candidateName?: string,
    originalFileName?: string
  ): Promise<ParsedResumeResult> {
    try {
      if (typeof input !== "string") {
        // Binary File/Blob upload
        const formData = new FormData();
        formData.append("file", input, originalFileName || (input as any).name || "resume.pdf");
        if (candidateName) formData.append("candidateName", candidateName);

        const response = await fetch("/api/ai/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.extracted) return data.extracted;
        }

        // Direct Eden AI Client fallback
        return await EdenAIService.parseResumeFile(
          input,
          originalFileName || (input as any).name || "resume.pdf"
        );
      } else {
        // Text string input
        const response = await fetch("/api/ai/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: input, candidateName }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.extracted) return data.extracted;
        }

        // Direct Eden AI Client fallback
        return await EdenAIService.parseResumeText(input, candidateName);
      }
    } catch (err) {
      console.warn("Eden AI parse-resume failed, using fallback:", err);
    }

    // Dynamic fallback from actual uploaded text
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

    // Extract email if present
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
  },

  async generateJob(prompt: string, companyName?: string, companyLocation?: string): Promise<GeneratedJobResult> {
    try {
      const response = await fetch("/api/ai/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, companyName, companyLocation }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.job) {
          const j = data.job;
          return {
            title: j.title || "Full Stack Developer",
            department: j.department || "Engineering",
            location: j.location || companyLocation || "Ahmedabad, India",
            workMode: (j.workMode === "Remote" || j.workMode === "Onsite" ? j.workMode : "Hybrid") as any,
            experience: j.experience || "2–4 Years",
            salary: j.salary || "₹7–10 LPA",
            openings: j.openings || 1,
            description: j.description || `Exciting opportunity at ${companyName || "our high-growth tech team"}.`,
            responsibilities: j.responsibilities || [
              "Build responsive, modern UI components with React.",
              "Develop robust API endpoints and data workflows in Node.js.",
              "Collaborate with designers and product managers to release high-impact features.",
            ],
            requirements: j.requirements || [
              "2+ years of professional software engineering experience.",
              "Solid fundamentals in JavaScript/TypeScript and web development.",
              "Strong communication skills and willingness to collaborate.",
            ],
            requiredSkills: j.requiredSkills || ["React", "Node.js", "TypeScript", "Tailwind CSS"],
            preferredSkills: j.preferredSkills || ["Next.js", "PostgreSQL", "Docker"],
          };
        }
      }
    } catch (err) {
      console.warn("API generate-job failed, using structured template fallback:", err);
    }

    const lower = prompt.toLowerCase();
    let title = "Software Engineer";
    if (lower.includes("react")) title = "React Developer";
    if (lower.includes("full stack") || lower.includes("fullstack")) title = "Full Stack Developer";
    if (lower.includes("backend") || lower.includes("node")) title = "Backend Node.js Developer";
    if (lower.includes("frontend") || lower.includes("ui")) title = "Frontend Developer";
    if (lower.includes("mobile") || lower.includes("native")) title = "Mobile App Engineer";

    let exp = "2–4 Years";
    if (lower.includes("senior") || lower.includes("5") || lower.includes("6")) exp = "4–7 Years";
    if (lower.includes("junior") || lower.includes("1") || lower.includes("fresher")) exp = "1–2 Years";

    let salary = "₹7–10 LPA";
    if (lower.includes("lpa")) {
      const match = prompt.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?(?:\s*–\s*|\s*-\s*|\s*to\s*)\d+(?:\.\d+)?\s*lpa)/i);
      if (match) salary = match[1].toUpperCase();
    }

    let workMode: "Remote" | "Hybrid" | "Onsite" = "Hybrid";
    if (lower.includes("remote")) workMode = "Remote";
    if (lower.includes("onsite") || lower.includes("on-site")) workMode = "Onsite";

    return {
      title,
      department: "Engineering",
      location: companyLocation || "Ahmedabad, India",
      workMode,
      experience: exp,
      salary,
      openings: 2,
      description: `We are looking for an exceptional ${title} to join ${companyName || "our engineering team"}. You will architect modern systems, lead key product features, and shape our technical culture.`,
      responsibilities: [
        `Architect and build performant applications aligned with company product roadmaps.`,
        `Collaborate closely with product, UI/UX, and QA teams to ship scalable features.`,
        `Maintain high code standards through reviews, unit testing, and documentation.`,
        `Optimize system latency, client rendering speeds, and reliability.`,
      ],
      requirements: [
        `${exp} of proven hands-on software development experience.`,
        `Solid proficiency in modern web architecture, JavaScript/TypeScript, and API design.`,
        `Experience collaborating in agile sprint teams with Git version control.`,
      ],
      requiredSkills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
      preferredSkills: ["PostgreSQL", "Docker", "GraphQL", "Next.js"],
    };
  },

  async analyzeMatch(candidate: CandidateProfile, job: Job, customFocus?: string): Promise<MatchAnalysisResult> {
    try {
      const response = await fetch("/api/ai/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate, job, customFocus }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.matchScore) return data;
      }
    } catch (err) {
      console.warn("API match-analysis failed, using local scoring engine:", err);
    }

    // Local heuristic match engine
    const candSkills = (candidate.skills || []).map(s => s.trim());
    const jobReqSkills = (job.requiredSkills || []).map(s => s.trim());
    const jobPrefSkills = (job.preferredSkills || []).map(s => s.trim());

    const matchedReq = jobReqSkills.filter(js =>
      candSkills.some(cs => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase()))
    );
    const matchedPref = jobPrefSkills.filter(js =>
      candSkills.some(cs => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase()))
    );
    const matchedSkills = Array.from(new Set([...matchedReq, ...matchedPref]));
    const missingSkills = jobReqSkills.filter(js =>
      !candSkills.some(cs => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase()))
    );

    const matchRatio = matchedReq.length / Math.max(jobReqSkills.length, 1);
    let baseScore = Math.round(55 + matchRatio * 38);
    if (matchedReq.length === jobReqSkills.length) baseScore = Math.max(baseScore, 92);

    if (job.location.toLowerCase().includes("ahmedabad") && candidate.location.toLowerCase().includes("ahmedabad")) {
      baseScore += 3;
    }
    if (job.workMode === candidate.workPreference || job.workMode === "Remote") {
      baseScore += 2;
    }

    const finalScore = Math.min(Math.max(baseScore, 58), 98);

    let fitVerdict = "Strong Fit";
    if (finalScore >= 90) fitVerdict = "Exceptional Fit · Strong Hire Recommendation";
    else if (finalScore >= 80) fitVerdict = "Good Fit · Recommended with Quick Ramp-Up";
    else if (finalScore >= 70) fitVerdict = "Moderate Fit · Review Nuances";
    else fitVerdict = "Skill Gap · Requires Further Screening";

    const reasons: string[] = [];
    matchedSkills.slice(0, 3).forEach(s => {
      reasons.push(`${s} ✓ matches requirements`);
    });
    if (reasons.length === 0) {
      reasons.push("Core software development foundation");
    }
    reasons.push(`${candidate.yearsOfExperience} yrs experience aligns with ${job.experience}`);
    if (job.location.toLowerCase().includes(candidate.location.toLowerCase().split(",")[0].trim())) {
      reasons.push(`${candidate.location.split(",")[0]} ✓ exact location match`);
    }

    return {
      matchScore: finalScore,
      fitVerdict,
      matchedSkills: matchedSkills.length > 0 ? matchedSkills : candSkills.slice(0, 3),
      missingSkills,
      reasons,
      strengths: [
        `Strong mastery in ${matchedSkills.slice(0, 3).join(", ") || "core stack"}`,
        `${candidate.yearsOfExperience} years professional experience meets ${job.experience} criteria`,
        `Location preference (${candidate.location}) aligns with ${job.workMode} role`,
      ],
      concerns: missingSkills.length > 0 ? [`Missing specific hands-on experience in ${missingSkills.join(", ")}`] : [],
      aiSummary: `${candidate.fullName} is an excellent ${finalScore}% match for ${job.title} at ${job.companyName}. Demonstrates strong core competencies in ${(matchedSkills.length > 0 ? matchedSkills : candSkills).slice(0, 3).join(", ")}${missingSkills.length > 0 ? `, with minor ramp-up expected in ${missingSkills.join(", ")}` : " with complete skill alignment"}.`,
      interviewQuestions: [
        `How do you architect large-scale applications with ${matchedSkills[0] || "React"}?`,
        missingSkills.length > 0 ? `Have you worked with or learned ${missingSkills[0]} in personal projects or previous roles?` : `Can you describe your testing and deployment pipeline workflow?`,
      ],
    };
  },
};
