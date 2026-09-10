declare type PagesFunction<Env = { AI?: { run: (model: string, inputs: Record<string, any>) => Promise<any> } }> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response>;

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = (await context.request.json()) as any;
    const { prompt: userPrompt, companyName = "Tech Team", companyLocation = "Ahmedabad, India", title, department } = body || {};

    const prompt = `You are SwipeHired's AI Job Architect powered by Google Gemma 4 26B on Cloudflare Workers AI.
Generate a comprehensive, attractive job description.

RECRUITER BRIEF:
"${(userPrompt || title || "Software Engineer").slice(0, 2000)}"

COMPANY: "${companyName}"
LOCATION: "${companyLocation}"

Respond strictly with valid JSON matching:
{
  "title": "${title || "Full Stack Developer"}",
  "department": "${department || "Engineering"}",
  "location": "${companyLocation}",
  "workMode": "Hybrid",
  "experience": "2-4 Years",
  "salary": "INR 7-12 LPA",
  "openings": 2,
  "description": "Compelling role overview.",
  "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "requiredSkills": ["React", "TypeScript", "Node.js"],
  "preferredSkills": ["PostgreSQL", "Next.js", "Docker"]
}`;

    let job: any = null;
    if (context.env.AI) {
      try {
        const aiRes = await context.env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
          prompt,
          max_tokens: 2000,
          temperature: 0.1,
        });

        let rawText = typeof aiRes === "string" ? aiRes : aiRes?.response || aiRes?.generated_text || JSON.stringify(aiRes);
        let cleaned = rawText.trim();
        const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlock && codeBlock[1]) cleaned = codeBlock[1].trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          job = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
      } catch (aiErr) {
        console.warn("Pages Function AI generate-job error:", aiErr);
      }
    }

    if (!job) {
      job = {
        title: title || "Full Stack Developer",
        department: department || "Engineering",
        location: companyLocation,
        workMode: "Hybrid",
        experience: "2-4 Years",
        salary: "INR 7-12 LPA",
        openings: 2,
        description: `Join ${companyName} to build high-scale software applications.`,
        responsibilities: [
          "Architect and maintain scalable frontend interfaces with React and TypeScript.",
          "Design high-throughput RESTful APIs in Node.js.",
          "Collaborate with team members to ship high-impact features.",
        ],
        requirements: [
          "2+ years of professional software engineering experience.",
          "Solid fundamentals in JavaScript/TypeScript and web development.",
        ],
        requiredSkills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
        preferredSkills: ["PostgreSQL", "Next.js", "Docker"],
      };
    }

    return new Response(JSON.stringify({ success: true, job }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "AI_JOB_GEN_FAILED", message: err.message || "Failed to generate job spec." },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
