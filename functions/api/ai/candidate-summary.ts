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
    const { candidate } = body || {};

    const prompt = `You are SwipeHired's Executive Talent Evaluator powered by Google Gemma 4 26B on Cloudflare Workers AI.
Generate a concise candidate summary for:
- Name: ${candidate?.fullName}
- Headline: ${candidate?.headline}
- Experience: ${candidate?.yearsOfExperience} Years
- Skills: ${(candidate?.skills || []).join(", ")}

Respond ONLY in valid JSON matching:
{
  "summary": "2-3 sentence overview.",
  "keyStrengths": ["Strength 1", "Strength 2"],
  "standoutSkills": ["Skill 1", "Skill 2"],
  "growthAreas": [],
  "recruiterRecommendation": "Strong Hire / Recommended"
}`;

    let summary: any = null;
    if (context.env.AI) {
      try {
        const aiRes = await context.env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
          prompt,
          max_tokens: 1200,
          temperature: 0.1,
        });

        let rawText = typeof aiRes === "string" ? aiRes : aiRes?.response || aiRes?.generated_text || JSON.stringify(aiRes);
        let cleaned = rawText.trim();
        const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlock && codeBlock[1]) cleaned = codeBlock[1].trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          summary = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
      } catch (aiErr) {
        console.warn("Pages Function AI candidate-summary error:", aiErr);
      }
    }

    if (!summary) {
      summary = {
        summary: `${candidate?.fullName || "Candidate"} is a skilled ${candidate?.headline || "Software Engineer"} with ${candidate?.yearsOfExperience || 2} years of experience.`,
        keyStrengths: ["Strong technical foundation", "Demonstrated software engineering capability"],
        standoutSkills: (candidate?.skills || []).slice(0, 3),
        growthAreas: [],
        recruiterRecommendation: "Recommended for Technical Screening",
      };
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "AI_SUMMARY_FAILED", message: err.message || "Failed to generate candidate summary." },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
