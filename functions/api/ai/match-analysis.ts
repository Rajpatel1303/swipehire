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
    const { candidate, job, deterministicScore = 88, deterministicReasons = [], customFocus } = body || {};

    const prompt = `You are SwipeHired's Lead AI Technical Recruiter powered by Google Gemma 4 26B on Cloudflare Workers AI.
Evaluate candidate fit and explain the match score.

AUTHORITATIVE DETERMINISTIC SCORE: ${deterministicScore}%

CANDIDATE:
- Name: ${candidate?.fullName}
- Headline: ${candidate?.headline}
- Experience: ${candidate?.yearsOfExperience} years
- Skills: ${(candidate?.skills || []).slice(0, 15).join(", ")}
- Location: ${candidate?.location} (${candidate?.workPreference})

JOB:
- Title: ${job?.title}
- Required Skills: ${(job?.requiredSkills || []).join(", ")}
- Preferred Skills: ${(job?.preferredSkills || []).join(", ")}
- Experience Required: ${job?.experience}
- Location & Mode: ${job?.location} (${job?.workMode})
${customFocus ? `- Custom Recruiter Focus: "${customFocus}"` : ""}

Respond ONLY in valid JSON matching:
{
  "matchScore": ${deterministicScore},
  "fitVerdict": "Exceptional Fit" or "Strong Fit" or "Good Fit" or "Skill Gap",
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Missing Skill"],
  "reasons": ["Reason 1", "Reason 2"],
  "strengths": ["Strength 1", "Strength 2"],
  "concerns": ["Risk or gap 1"],
  "aiSummary": "2-3 sentence executive recruiter summary.",
  "interviewQuestions": ["Technical question 1", "Technical question 2"]
}`;

    let analysis: any = null;
    if (context.env.AI) {
      try {
        const aiRes = await context.env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
          prompt,
          max_tokens: 1800,
          temperature: 0.1,
        });

        let rawText = typeof aiRes === "string" ? aiRes : aiRes?.response || aiRes?.generated_text || JSON.stringify(aiRes);
        let cleaned = rawText.trim();
        const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlock && codeBlock[1]) cleaned = codeBlock[1].trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          analysis = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
      } catch (aiErr) {
        console.warn("Pages Function AI match-analysis error:", aiErr);
      }
    }

    if (!analysis) {
      analysis = {
        matchScore: deterministicScore,
        fitVerdict: deterministicScore >= 90 ? "Exceptional Fit" : deterministicScore >= 80 ? "Strong Fit" : "Good Fit",
        matchedSkills: (candidate?.skills || []).slice(0, 3),
        missingSkills: [],
        reasons: deterministicReasons.length > 0 ? deterministicReasons : ["Core technical background aligns with role"],
        strengths: ["Strong modern software engineering foundation"],
        concerns: [],
        aiSummary: `${candidate?.fullName || "Candidate"} is a strong ${deterministicScore}% match for ${job?.title || "this role"}.`,
        interviewQuestions: ["Walk us through your component hierarchy and state management approach."],
      };
    }

    // Guarantee deterministic score is preserved
    analysis.matchScore = deterministicScore;

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "AI_MATCH_FAILED", message: err.message || "Failed to analyze match." },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
