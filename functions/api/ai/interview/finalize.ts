declare type PagesFunction<Env = { AI?: { run: (model: string, inputs: Record<string, any>) => Promise<any> }; EDENAI_API_KEY?: string }> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response>;

import { computeCalibratedInterviewEvaluation } from "../../../../src/services/ai/interviewEvaluator";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = (await context.request.json()) as any;
    const { job = {}, candidate = {}, qaHistory = [] } = body || {};

    const systemInstruction = `You are SwipeHired's Lead Talent Assessment Architect powered by Google Gemma 4 26B on Cloudflare Workers AI.
Review the complete interview transcript and produce an objective, comprehensive evaluation report to assist the hiring manager.

CRITICAL DIRECTIVE:
1. Score each dimension on a calibrated 0-100 scale:
   - technical_score
   - problem_solving_score
   - project_understanding_score
   - communication_score
   - role_knowledge_score
2. Compute overall_score (weighted composite, 50-98).
3. Provide a clear verdict: "Strong Hire" | "Hire" | "Borderline" | "No Hire".
4. Highlight 2-4 concrete strengths and 2-3 areas to explore in later rounds.
5. Write a 2-paragraph executive summary for the hiring manager.
6. Respond strictly in valid JSON matching:
{
  "overall_score": 88,
  "technical_score": 90,
  "problem_solving_score": 85,
  "project_understanding_score": 88,
  "communication_score": 92,
  "role_knowledge_score": 85,
  "verdict": "Strong Hire",
  "strengths": ["Strength 1", "Strength 2"],
  "areas_to_explore": ["Area 1", "Area 2"],
  "ai_summary": "Summary..."
}`;

    const transcript = (qaHistory || []).map((item: any, i: number) => {
      return `[Q${i + 1}]: ${item.question}\n[Ans]: ${item.answer}\n[Quality]: ${item.qualityScore || "N/A"}\n[Assessment]: ${item.assessment || "N/A"}`;
    }).join("\n\n");

    const userPrompt = `ROLE: ${job.title || "Software Engineer"}
CANDIDATE: ${candidate.fullName || "Candidate"}
TRANSCRIPT:
${transcript || "No transcript"}
Generate the final interview evaluation report strictly matching the schema.`;

    let rawAiText = "";
    if (context.env.AI) {
      try {
        const aiRes = await context.env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 2000,
          temperature: 0.1,
        });
        rawAiText = typeof aiRes === "string" ? aiRes : aiRes?.response || aiRes?.generated_text || JSON.stringify(aiRes);
      } catch (cfErr) {
        console.warn("[Cloudflare Workers AI Finalize Failed]:", cfErr);
      }
    }

    let parsed: any = null;
    if (rawAiText) {
      const cleaned = rawAiText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1").trim();
      const f = cleaned.indexOf("{");
      const l = cleaned.lastIndexOf("}");
      if (f !== -1 && l !== -1) {
        try { parsed = JSON.parse(cleaned.substring(f, l + 1)); } catch {}
      }
    }

    // 1. Calculate calibrated evaluation based on actual candidate QA transcript
    const calibratedEval = computeCalibratedInterviewEvaluation({
      qaHistory,
      jobTitle: job.title,
      requiredSkills: job.requiredSkills || [],
      candidateName: candidate.fullName,
    });

    const evaluation = {
      overall_score: calibratedEval.overallScore,
      overallScore: calibratedEval.overallScore,
      technical_score: calibratedEval.technicalScore,
      technicalScore: calibratedEval.technicalScore,
      problem_solving_score: calibratedEval.problemSolvingScore,
      problemSolvingScore: calibratedEval.problemSolvingScore,
      project_understanding_score: calibratedEval.projectUnderstandingScore,
      projectUnderstandingScore: calibratedEval.projectUnderstandingScore,
      communication_score: calibratedEval.communicationScore,
      communicationScore: calibratedEval.communicationScore,
      role_knowledge_score: calibratedEval.roleKnowledgeScore,
      roleKnowledgeScore: calibratedEval.roleKnowledgeScore,
      verdict: calibratedEval.verdict,
      strengths: (Array.isArray(parsed?.strengths) && parsed.strengths.length > 0 && calibratedEval.overallScore >= 45)
        ? parsed.strengths
        : calibratedEval.strengths,
      areas_to_explore: (Array.isArray(parsed?.areas_to_explore) && parsed.areas_to_explore.length > 0 && calibratedEval.overallScore >= 45)
        ? parsed.areas_to_explore
        : calibratedEval.areasToExplore,
      areasToExplore: (Array.isArray(parsed?.areas_to_explore) && parsed.areas_to_explore.length > 0 && calibratedEval.overallScore >= 45)
        ? parsed.areas_to_explore
        : calibratedEval.areasToExplore,
      ai_summary: (parsed?.ai_summary && calibratedEval.overallScore >= 45)
        ? parsed.ai_summary
        : calibratedEval.aiSummary,
      aiSummary: (parsed?.ai_summary && calibratedEval.overallScore >= 45)
        ? parsed.ai_summary
        : calibratedEval.aiSummary,
    };

    return new Response(JSON.stringify({ success: true, evaluation }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
