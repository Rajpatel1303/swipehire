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
    const { templateType = "interview", candidateName = "Candidate", jobTitle = "Role", companyName = "Company", recruiterName = "Hiring Team" } = body || {};

    const prompt = `You are SwipeHired's Recruiter Communications Writer powered by Google Gemma 4 26B on Cloudflare Workers AI.
Draft an email:
- Category: "${templateType}"
- Candidate: "${candidateName}"
- Role: "${jobTitle}"
- Company: "${companyName}"
- Sender: "${recruiterName}"

Respond ONLY in valid JSON matching:
{
  "subject": "Email subject",
  "body": "Plain text email body with linebreaks (\\n)",
  "html": "<p>HTML email body</p>"
}`;

    let email: any = null;
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
          email = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
      } catch (aiErr) {
        console.warn("Pages Function AI generate-email error:", aiErr);
      }
    }

    if (!email) {
      email = {
        subject: `Interview Invitation: ${jobTitle} @ ${companyName}`,
        body: `Hi ${candidateName.split(" ")[0]},\n\nWe were impressed with your background and would love to invite you for an interview for the ${jobTitle} role at ${companyName}.\n\nBest regards,\n${recruiterName}`,
        html: `<p>Hi ${candidateName.split(" ")[0]},</p><p>We were impressed with your background and would love to invite you for an interview for the <strong>${jobTitle}</strong> role at <strong>${companyName}</strong>.</p><p>Best regards,<br>${recruiterName}</p>`,
      };
    }

    return new Response(JSON.stringify({ success: true, email }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "AI_EMAIL_FAILED", message: err.message || "Failed to generate email." },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
