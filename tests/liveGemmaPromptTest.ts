import dotenv from "dotenv";
import {
  classifyJobRole,
  createInterviewBlueprint,
  validateGeneratedQuestions,
  getRoleSpecificFallbackQuestions,
} from "../src/services/ai/interviewRoleClassifier";

dotenv.config();

const DEFAULT_EDENAI_API_KEY = "sk-eden-live-wbucgfVF_sDpqDQ3BA6eeINC4JS-ad7FZQLvYLnJW883c97dff8";
const apiKey = process.env.EDENAI_API_KEY || DEFAULT_EDENAI_API_KEY;

async function testLiveGeneration() {
  console.log("=== TESTING LIVE GEMMA 4 PROMPT ON COMPUTER OPERATOR JOB ===");

  const job = {
    title: "Computer operator",
    department: "Administration",
    requiredSkills: ["MS Office", "Data Entry", "Excel", "Typing"],
    description: "Manage digital documentation, record customer files into Excel, verify data accuracy, and generate daily reports.",
    responsibilities: [
      "Enter daily transactional data into spreadsheets",
      "Format official documents in Microsoft Word",
      "Verify accuracy and eliminate duplicates",
    ],
  };

  const candidate = {
    fullName: "Akki Rathod",
    headline: "Software Engineer | React Developer", // Contaminated candidate profile
    yearsOfExperience: 2,
    skills: ["React", "TypeScript", "Node.js", "Docker", "MS Office"],
    projects: [
      { name: "E-Commerce App", description: "Full stack shopping platform", technologies: ["React", "Node.js"] },
    ],
  };

  const classification = classifyJobRole(job);
  console.log("Classification Result:", classification);

  const blueprint = createInterviewBlueprint(job, classification);
  console.log("Blueprint:", {
    category: blueprint.category,
    jobTitle: blueprint.jobTitle,
    forbiddenTopicsCount: blueprint.forbiddenTopics.length,
    primarySkills: blueprint.primarySkills,
  });

  const forbiddenListStr = blueprint.forbiddenTopics.length > 0
    ? `\n4. FORBIDDEN TOPICS (Never mention in this interview under any circumstances): ${blueprint.forbiddenTopics.slice(0, 15).join(", ")}.`
    : "";

  const systemInstruction = `You are SwipeHired's Principal Interviewer.
You are generating authentic, practical, scenario-based interview questions for this specific JOB OPENING.

CRITICAL DIRECTIVES:
1. The JOB OPENING (${blueprint.jobTitle} in category: ${blueprint.category}) is 100% AUTHORITATIVE. Under no circumstances infer the job type from candidate data.
2. Formulate practical questions focused directly on the day-to-day duties, workflows, and core skills of a ${blueprint.jobTitle}.
3. Core skills for this job: ${blueprint.primarySkills.join(", ") || "Role Fundamentals"}.${forbiddenListStr}
5. Respond strictly in valid JSON matching the schema below without markdown formatting, thinking blocks, or conversational text.

SCHEMA:
{
  "questions": [
    {
      "order": 1,
      "question": "Realistic scenario or workflow question for a ${blueprint.jobTitle}",
      "category": "Core Competencies",
      "difficulty": "Practical",
      "idealCriteria": "Concise key indicators (under 20 words)"
    }
  ]
}`;

  const userPrompt = `TARGET JOB OPENING:
Title: ${blueprint.jobTitle}
Category: ${blueprint.category}
Required Skills: ${blueprint.primarySkills.join(", ")}
Responsibilities: ${job.responsibilities.slice(0, 3).join("; ")}

<CANDIDATE_DATA>
Name: ${candidate.fullName}
Headline: ${candidate.headline}
Years of Experience: ${candidate.yearsOfExperience}
Skills: ${candidate.skills.slice(0, 10).join(", ")}
Key Projects:
E-Commerce App: Full stack shopping platform (React, Node.js)
</CANDIDATE_DATA>

Generate exactly 3 candidate-specific, practical interview questions for this ${blueprint.jobTitle} role. Keep idealCriteria concise.`;

  console.log("Sending request to Eden AI Gemma 4...");
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

  try {
    const response = await fetch("https://api.edenai.run/v3/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    const elapsed = Date.now() - startTime;
    console.log(`Response received in ${elapsed}ms (status: ${response.status})`);

    const result = (await response.json()) as any;
    const rawContent = result.choices?.[0]?.message?.content || "";
    console.log("Raw LLM Output Preview:\n", rawContent.slice(0, 400));

    let cleaned = rawContent.trim();
    const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlock && codeBlock[1]) cleaned = codeBlock[1].trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    let parsed: any = null;
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e) {
        console.error("JSON parse error:", e);
      }
    }

    const validation = validateGeneratedQuestions(parsed?.questions, blueprint);
    console.log("Validation Result:", {
      isValid: validation.isValid,
      questionsCount: validation.questions.length,
      failedReason: validation.failedReason,
    });

    if (validation.isValid) {
      console.log("Generated Questions (Verified):");
      validation.questions.forEach(q => {
        console.log(`[Q${q.order}] (${q.category}) ${q.question}`);
      });
    } else {
      console.log("Validation failed, testing fallback bank...");
      const fallback = getRoleSpecificFallbackQuestions(blueprint, 3);
      fallback.forEach(q => {
        console.log(`[Fallback Q${q.order}] (${q.category}) ${q.question}`);
      });
    }
  } catch (err: any) {
    console.error("Request error:", err?.message || err);
  } finally {
    clearTimeout(timeoutId);
  }
}

testLiveGeneration();
