import { GeneratedJobResult } from "./types";

export class JobGenerator {
  /**
   * Generate Job posting specification from a brief
   */
  static async generate(
    prompt: string,
    companyName?: string,
    companyLocation?: string
  ): Promise<GeneratedJobResult> {
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
            salary: j.salary || "?7–10 LPA",
            openings: Number(j.openings) || 1,
            description: j.description || `Exciting opportunity at ${companyName || "our high-growth tech team"}.`,
            responsibilities: Array.isArray(j.responsibilities) ? j.responsibilities : [
              "Build responsive, modern UI components with React.",
              "Develop robust API endpoints and data workflows in Node.js.",
              "Collaborate with designers and product managers to release high-impact features.",
            ],
            requirements: Array.isArray(j.requirements) ? j.requirements : [
              "2+ years of professional software engineering experience.",
              "Solid fundamentals in JavaScript/TypeScript and web development.",
              "Strong communication skills and willingness to collaborate.",
            ],
            requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : ["React", "Node.js", "TypeScript", "Tailwind CSS"],
            preferredSkills: Array.isArray(j.preferredSkills) ? j.preferredSkills : ["Next.js", "PostgreSQL", "Docker"],
          };
        }
      }
    } catch (err) {
      console.warn("[JobGenerator] API generate-job failed, using structured template fallback:", err);
    }

    return this.fallbackJobTemplate(prompt, companyName, companyLocation);
  }

  private static fallbackJobTemplate(
    prompt: string,
    companyName?: string,
    companyLocation?: string
  ): GeneratedJobResult {
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

    let salary = "?7–10 LPA";
    if (lower.includes("lpa")) {
      const match = prompt.match(/(\d+(?:\.\d+)?\s*(?:-|–|to)\s*\d+(?:\.\d+)?\s*lpa)/i);
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
  }
}
