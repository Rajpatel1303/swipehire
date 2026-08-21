import { CandidateProfile, Job } from "../types";
import { ParsedResumeResult, GeneratedJobResult, MatchAnalysisResult } from "./geminiService";

const EDENAI_API_URL = "https://api.edenai.run/v2";

export class EdenAIService {
  private static getApiKey(): string {
    const env = (import.meta as any).env || {};
    return env.VITE_EDENAI_API_KEY || "";
  }

  /**
   * Parse resume text using Eden AI OpenAI/LLM chat
   */
  static async parseResumeText(resumeText: string, candidateName?: string): Promise<ParsedResumeResult> {
    const apiKey = this.getApiKey();

    const prompt = `You are SwipeHired's high-precision AI Resume Parser. Extract all candidate information from the following resume text into a strict JSON object. If any field is missing or implied, provide high-quality professional inferences based on their skills and background.

Candidate Resume Text:
${resumeText}

Respond ONLY with a valid JSON object matching this schema without markdown codeblocks or extra text:
{
  "fullName": "Full Name of Candidate",
  "headline": "Professional Title / Headline (e.g. Senior Full Stack Engineer)",
  "email": "Email address",
  "phone": "Phone number with country code",
  "location": "City, State/Country",
  "workPreference": "Hybrid" or "Remote" or "Onsite",
  "yearsOfExperience": number (e.g. 3.5),
  "skills": ["Skill 1", "Skill 2", "Skill 3", ...],
  "possibleRoles": ["Role 1", "Role 2", ...],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University or College",
      "year": "Graduation year or date range"
    }
  ],
  "experience": [
    {
      "title": "Role Title",
      "company": "Company Name",
      "duration": "e.g. 2022 - Present (2 yrs)",
      "description": "Key achievements and responsibilities"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project overview",
      "technologies": ["Tech 1", "Tech 2"]
    }
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "expectedSalary": "e.g. ₹8–12 LPA",
  "preferredRole": "Primary Target Job Title",
  "bio": "A professional 2-3 sentence executive bio summarizing technical mastery and career focus."
}`;

    try {
      const res = await fetch(`${EDENAI_API_URL}/text/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providers: "openai",
          text: prompt,
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        throw new Error(`Eden AI chat responded with status ${res.status}`);
      }

      const json = await res.json();
      const rawText = json?.openai?.generated_text || "";
      const cleaned = rawText.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        fullName: parsed.fullName || candidateName || "Candidate",
        headline: parsed.headline || "Software Engineer",
        email: parsed.email || "candidate@example.com",
        phone: parsed.phone || "+91 98765 43210",
        location: parsed.location || "Ahmedabad, India",
        workPreference: parsed.workPreference || "Hybrid",
        yearsOfExperience: Number(parsed.yearsOfExperience) || 2,
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : ["React", "Node.js", "TypeScript"],
        possibleRoles: Array.isArray(parsed.possibleRoles) ? parsed.possibleRoles : ["Software Engineer"],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        expectedSalary: parsed.expectedSalary || "₹8–12 LPA",
        preferredRole: parsed.preferredRole || parsed.headline || "Full Stack Developer",
        bio: parsed.bio || "Motivated professional eager to build scalable web applications.",
      };
    } catch (err) {
      console.warn("Eden AI direct chat parse error:", err);
      throw err;
    }
  }

  /**
   * Parse resume file (PDF, DOCX, TXT) using Eden AI Resume Parser or OCR
   */
  static async parseResumeFile(file: File | Blob, fileName: string): Promise<ParsedResumeResult> {
    const apiKey = this.getApiKey();

    const formData = new FormData();
    formData.append("providers", "affinda");
    formData.append("file", file, fileName);

    try {
      const res = await fetch(`${EDENAI_API_URL}/ocr/resume_parser`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const affinda = data?.affinda?.extracted_data;
        if (affinda) {
          const pi = affinda.personal_infos || {};
          const name = pi.name?.raw_name || [pi.name?.first_name, pi.name?.last_name].filter(Boolean).join(" ") || "Candidate";
          const email = pi.mails?.[0] || "";
          const phone = pi.phones?.[0] || "";
          const location = pi.address?.formatted_location || pi.address?.city || "Ahmedabad, India";
          const skills = (affinda.skills || []).map((s: any) => s.name).filter(Boolean);
          const experience = (affinda.work_experience?.entries || []).map((exp: any) => ({
            title: exp.title || "Software Developer",
            company: exp.company || "Company",
            duration: [exp.start_date, exp.end_date || "Present"].filter(Boolean).join(" - "),
            description: exp.description || "",
          }));
          const education = (affinda.education?.entries || []).map((edu: any) => ({
            degree: edu.accreditation?.education || edu.degree || "Degree",
            institution: edu.establishment?.description || "University",
            year: edu.end_date || edu.start_date || "2021",
          }));
          const totalYears = affinda.work_experience?.total_years_experience || experience.length * 1.5 || 2;

          // Synthesize with AI prompt if needed
          return {
            fullName: name,
            headline: pi.current_profession || (skills.includes("React") ? "Frontend / React Engineer" : "Software Engineer"),
            email: email || "candidate@example.com",
            phone: phone || "+91 98765 43210",
            location: location,
            workPreference: "Hybrid",
            yearsOfExperience: Math.round(Number(totalYears) || 2),
            skills: skills.length > 0 ? skills.slice(0, 15) : ["React", "TypeScript", "Node.js"],
            possibleRoles: [pi.current_profession || "Full Stack Developer", "Software Engineer"],
            education: education.length > 0 ? education : [{ degree: "Bachelor's Degree", institution: "University", year: "2021" }],
            experience: experience.length > 0 ? experience : [],
            projects: [],
            certifications: (affinda.certifications || []).map((c: any) => c.name || c).filter(Boolean),
            expectedSalary: "₹8–12 LPA",
            preferredRole: pi.current_profession || "Software Developer",
            bio: pi.self_summary || `Software engineer with ${Math.round(totalYears)} years of experience.`,
          };
        }
      }
    } catch (err) {
      console.warn("Eden AI OCR Resume Parser failed, falling back to text chat parser:", err);
    }

    // Fallback: try reading as text
    const text = await file.text();
    return this.parseResumeText(text, fileName);
  }
}
