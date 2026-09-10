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
    const { roleTitle = "Software Engineer", requiredSkills = [] } = body || {};

    const prompt = `You are SwipeHired's Principal Technical Interviewer powered by Google Gemma 4 26B on Cloudflare Workers AI.
Generate a structured interview kit for "${roleTitle}" with required skills: ${requiredSkills.join(", ") || "General Engineering"}.

Respond ONLY in valid JSON matching:
{
  "roleTitle": "${roleTitle}",
  "technicalQuestions": [
    {
      "question": "Deep technical question",
      "idealAnswer": "Key architectural expectations",
      "evaluationCriteria": "Rubric for scoring",
      "category": "Architecture",
      "difficulty": "Practical"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Situational question",
      "whatToLookFor": "Communication and alignment"
    }
  ],
  "systemDesignPrompt": "High-scale design problem prompt"
}`;

    let kit: any = null;
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
          kit = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
      } catch (aiErr) {
        console.warn("Pages Function AI interview kit error:", aiErr);
      }
    }

    if (!kit) {
      kit = {
        roleTitle,
        technicalQuestions: [
          {
            question: `Explain how you approach component lifecycle, state management, and performance optimization when using ${requiredSkills[0] || "React"}.`,
            idealAnswer: "Candidate explains architectural decoupling, memoization, and profiling bottlenecks.",
            evaluationCriteria: "Depth of practical knowledge and edge case awareness.",
            category: "Technical Mastery",
            difficulty: "Practical",
          },
        ],
        behavioralQuestions: [
          {
            question: "Tell us about a time you gave constructive feedback during code review.",
            whatToLookFor: "Collaborative mindset and clear technical rationale.",
          },
        ],
        systemDesignPrompt: "Architect a scalable, real-time event pipeline supporting 100k concurrent users.",
      };
    }

    return new Response(JSON.stringify({ success: true, kit }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "AI_INTERVIEW_FAILED", message: err.message || "Failed to generate interview kit." },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
