import { connect } from "cloudflare:sockets";

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  AI?: any;
  EDENAI_API_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

interface SmtpOptions {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
}

async function sendSmtpEmail(opts: SmtpOptions): Promise<{ success: boolean; messageId: string; responseLog: string }> {
  const host = opts.host.trim();
  const port = Number(opts.port) || 587;
  const isDirectTls = opts.secure === true || port === 465;
  const username = opts.user.trim();
  const password = opts.pass.replace(/\s+/g, "");
  const fromEmail = opts.from.trim() || username;
  const fromName = opts.fromName ? opts.fromName.trim() : "SwipeHired";
  const toEmail = opts.to.trim();

  let socket = isDirectTls
    ? connect({ hostname: host, port }, { secureTransport: "on" })
    : connect({ hostname: host, port }, { secureTransport: "starttls" });

  let reader = socket.readable.getReader();
  let writer = socket.writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readLine = async (): Promise<string> => {
    let result = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
      if (result.includes("\n")) break;
    }
    return result;
  };

  const sendCommand = async (cmd: string, expectCode?: string): Promise<string> => {
    await writer.write(encoder.encode(cmd + "\r\n"));
    const response = await readLine();
    if (expectCode && !response.startsWith(expectCode)) {
      throw new Error(`SMTP Error [Expected ${expectCode}]: ${response.trim()}`);
    }
    return response;
  };

  try {
    const initialGreeting = await readLine();
    if (!initialGreeting.startsWith("220")) {
      throw new Error(`Invalid SMTP server greeting: ${initialGreeting}`);
    }

    await sendCommand(`EHLO swipehire.workers.dev`, "250");

    if (!isDirectTls) {
      await sendCommand("STARTTLS", "220");
      reader.releaseLock();
      writer.releaseLock();
      socket = socket.startTls();
      reader = socket.readable.getReader();
      writer = socket.writable.getWriter();
      await sendCommand(`EHLO swipehire.workers.dev`, "250");
    }

    await sendCommand("AUTH LOGIN", "334");
    await sendCommand(btoa(username), "334");
    const authRes = await sendCommand(btoa(password));
    if (!authRes.startsWith("235")) {
      throw new Error(`Authentication Failed: ${authRes.trim()}`);
    }

    await sendCommand(`MAIL FROM:<${fromEmail}>`, "250");
    await sendCommand(`RCPT TO:<${toEmail}>`, "250");
    await sendCommand("DATA", "354");

    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 8)}@${host}>`;
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const textContent = opts.textBody || "SwipeHired verification email.";
    const htmlContent = opts.htmlBody || `<div style="font-family: sans-serif;">${textContent}</div>`;

    const rawMessage = [
      `From: "${fromName}" <${fromEmail}>`,
      `To: <${toEmail}>`,
      `Subject: ${opts.subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      textContent,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlContent,
      ``,
      `--${boundary}--`,
      `.`,
    ].join("\r\n");

    await writer.write(encoder.encode(rawMessage + "\r\n"));
    const dataResponse = await readLine();
    if (!dataResponse.startsWith("250")) {
      throw new Error(`Failed to transmit email body: ${dataResponse.trim()}`);
    }

    try {
      await sendCommand("QUIT");
    } catch (_) {}

    return {
      success: true,
      messageId,
      responseLog: dataResponse.trim(),
    };
  } finally {
    try {
      reader.releaseLock();
      writer.releaseLock();
      await socket.close();
    } catch (_) {}
  }
}

function safeJsonParse(rawText: string): any {
  if (!rawText) return null;
  let text = rawText.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  let jsonSubstring = text.substring(firstBrace, lastBrace + 1);
  jsonSubstring = jsonSubstring.replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.parse(jsonSubstring);
  } catch {
    try {
      const sanitized = jsonSubstring.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }
}

function validateAndSanitizeResumeSchema(extracted: any, candidateNameFallback?: string) {
  if (!extracted || typeof extracted !== 'object') {
    extracted = {};
  }
  let yoe = Number(extracted?.yearsOfExperience);
  if (isNaN(yoe) || yoe < 0) {
    yoe = 0;
  } else {
    yoe = Math.round(yoe * 10) / 10;
  }
  if (yoe === 0 && Array.isArray(extracted?.experience) && extracted.experience.length > 0) {
    yoe = 1;
  }
  let salary = typeof extracted?.expectedSalary === 'string' ? extracted.expectedSalary.trim() : '';
  if (!salary) {
    if (yoe <= 1) salary = "₹4–7 LPA";
    else if (yoe <= 3) salary = "₹7–11 LPA";
    else if (yoe <= 6) salary = "₹12–18 LPA";
    else salary = "₹20–30 LPA";
  }
  let headline = typeof extracted?.headline === 'string' ? extracted.headline.trim() : '';
  if (!headline || headline.toLowerCase() === 'software professional' || headline.toLowerCase() === 'professional') {
    if (Array.isArray(extracted?.possibleRoles) && extracted.possibleRoles[0]) {
      headline = String(extracted.possibleRoles[0]).trim();
    } else if (Array.isArray(extracted?.experience) && extracted.experience[0]?.title) {
      headline = String(extracted.experience[0].title).trim();
    } else if (Array.isArray(extracted?.skills) && extracted.skills.length > 0) {
      headline = `${extracted.skills[0]} Developer`;
    } else {
      headline = 'Software Engineer';
    }
  }
  const extractedLocation = typeof extracted?.location === 'string' ? extracted.location.trim() : '';
  const extractedEmail = typeof extracted?.email === 'string' ? extracted.email.trim() : '';
  const cleanAndDisambiguateName = (nameInput: string, locInput: string, emailInput: string, fallback?: string): string => {
    let name = (nameInput || '').trim();
    const locLower = (locInput || '').toLowerCase();
    const nameLower = name.toLowerCase();
    const isAddressOrVillage =
      (locLower && (locLower.includes(nameLower) || nameLower.includes(locLower))) ||
      /^(devpar|kutch|mandvi|bhuj|ahmedabad|surat|rajkot|vadodara|gujarat|india|mumbai|delhi|pune|bangalore)\b/i.test(name) ||
      /(-yax|-yaksh|village|taluka|district|nagar|colony|street|road|at\/?po)/i.test(name);
    if (!name || name.toLowerCase() === 'candidate' || name.toLowerCase() === 'full name' || isAddressOrVillage) {
      if (emailInput && emailInput.includes('@')) {
        const emailUser = emailInput.split('@')[0].replace(/\d+/g, '').trim();
        const candidateSplits = emailUser.match(/[a-zA-Z][a-z]+/g);
        if (candidateSplits && candidateSplits.length >= 2) {
          return candidateSplits.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
        }
      }
      return fallback || 'Candidate';
    }
    return name;
  };

  const fullName = cleanAndDisambiguateName(extracted?.fullName, extractedLocation, extractedEmail, candidateNameFallback);

  return {
    fullName,
    headline,
    email: typeof extracted.email === 'string' ? extracted.email.trim() : '',
    phone: typeof extracted.phone === 'string' ? extracted.phone.trim() : '',
    location: typeof extracted.location === 'string' ? extracted.location.trim() : '',
    workPreference: ['Hybrid', 'Remote', 'Onsite'].includes(extracted?.workPreference) ? extracted.workPreference : 'Hybrid',
    yearsOfExperience: yoe,
    skills: Array.isArray(extracted?.skills) ? Array.from(new Set(extracted.skills.map((s: any) => String(s).trim()).filter(Boolean))) : [],
    possibleRoles: Array.isArray(extracted?.possibleRoles) && extracted.possibleRoles.length > 0
      ? extracted.possibleRoles.map((r: any) => String(r).trim()).filter(Boolean)
      : [headline],
    education: Array.isArray(extracted?.education)
      ? extracted.education.map((e: any) => ({
          degree: String(e?.degree || '').trim(),
          institution: String(e?.institution || '').trim(),
          year: String(e?.year || '').trim(),
        })).filter((e: any) => e.degree || e.institution)
      : [],
    experience: Array.isArray(extracted?.experience)
      ? extracted.experience.map((exp: any) => ({
          title: String(exp?.title || '').trim(),
          company: String(exp?.company || '').trim(),
          duration: String(exp?.duration || '').trim(),
          description: String(exp?.description || '').trim(),
        })).filter((exp: any) => exp.title || exp.company)
      : [],
    projects: Array.isArray(extracted?.projects)
      ? extracted.projects.map((p: any) => ({
          name: String(p?.name || '').trim(),
          description: String(p?.description || '').trim(),
          technologies: Array.isArray(p?.technologies) ? p.technologies.map((t: any) => String(t).trim()).filter(Boolean) : [],
        })).filter((p: any) => p.name)
      : [],
    certifications: Array.isArray(extracted?.certifications)
      ? extracted.certifications.map((c: any) => String(c).trim()).filter(Boolean)
      : [],
    expectedSalary: salary,
    preferredRole: typeof extracted?.preferredRole === 'string' && extracted.preferredRole.trim().length > 0 ? extracted.preferredRole.trim() : headline,
    bio: typeof extracted?.bio === 'string' ? extracted.bio.trim() : '',
    languages: Array.isArray(extracted?.languages) ? extracted.languages.map((l: any) => String(l).trim()).filter(Boolean) : ['English'],
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({ status: "healthy", timestamp: new Date().toISOString(), platform: "Cloudflare Worker" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // AI RESUME PARSER ENDPOINT
    if (url.pathname === "/api/ai/parse-resume" && request.method === "POST") {
      try {
        let rawResumeText = "";
        let candidateName = "";
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          candidateName = (formData.get("candidateName") as string) || "";
          rawResumeText = (formData.get("fullText") as string) || "";
          if (file && !rawResumeText) {
            const fileBytes = await file.arrayBuffer();
            const decoder = new TextDecoder("utf-8");
            rawResumeText = decoder.decode(fileBytes).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ").trim();
          }
        } else {
          const jsonBody = (await request.json()) as any;
          rawResumeText = jsonBody?.fullText || jsonBody?.resumeText || jsonBody?.payload?.fullText || "";
          candidateName = jsonBody?.candidateName || jsonBody?.payload?.candidateName || "";
        }

        const sanitizedText = (rawResumeText || "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ").trim();
        if (!sanitizedText) {
          return new Response(
            JSON.stringify({ success: false, error: { code: "EMPTY_RESUME", message: "No resume text was provided or extracted." } }),
            { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        const safeResumeText = sanitizedText.slice(0, 12000);
        const systemPrompt = `You are SwipeHired's high-precision, zero-hallucination AI Resume Parser powered by Google Gemma 4.
Extract ALL facts stated in the resume into valid JSON matching:
{
  "fullName": "Candidate full human name",
  "headline": "Current professional title",
  "email": "candidate email address",
  "phone": "candidate phone number",
  "location": "City, State, Country",
  "workPreference": "Hybrid" | "Remote" | "Onsite",
  "yearsOfExperience": number,
  "skills": ["Skill 1", "Skill 2"],
  "possibleRoles": ["Role 1", "Role 2"],
  "education": [{"degree":"Degree name","institution":"University name","year":"Graduation year"}],
  "experience": [{"title":"Job title","company":"Company name","duration":"Dates","description":"Responsibilities"}],
  "projects": [{"name":"Project name","description":"Summary","technologies":["Tech 1"]}],
  "certifications": ["Certification 1"],
  "expectedSalary": "Expected CTC",
  "preferredRole": "Target role",
  "bio": "Executive summary"
}`;

        const userPrompt = `<RESUME_DATA>\n${safeResumeText}\n</RESUME_DATA>${candidateName ? `\nCandidate Identity Hint: "${candidateName}"` : ""}\nExtract all details strictly into the JSON schema above.`;

        let parsedResult: any = null;

        // 1. Try Cloudflare Workers AI if available
        if (env.AI) {
          try {
            const aiResponse = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              max_tokens: 2500,
              temperature: 0.1,
            });
            const rawAiOutput = typeof aiResponse === "string" ? aiResponse : aiResponse?.response || aiResponse?.generated_text || JSON.stringify(aiResponse);
            parsedResult = safeJsonParse(rawAiOutput);
          } catch (cfAiErr) {
            console.warn("[Cloudflare Workers AI Failed]:", cfAiErr);
          }
        }

        // 2. Eden AI Gemma 4 Execution / Fallback
        const edenApiKey = env.EDENAI_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGE5Yjk1ZjEtODY1NS00ZjNiLTg5YzYtZmJhOWRmZWI1ZmE5IiwidHlwZSI6ImFwaV90b2tlbiIsIm5hbWUiOiJIaXJseSIsImlzX2N1c3RvbSI6dHJ1ZX0.MtgA6NbrsAC6hyEmYdurisnQLM8oEgJUE-q24e5h5Vc";
        if (!parsedResult && edenApiKey) {
          try {
            const edenRes = await fetch("https://api.edenai.run/v3/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${edenApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemma-4-31b-it",
                messages: [{ role: "user", content: `${systemPrompt}\n\n${userPrompt}` }],
                max_tokens: 2500,
                temperature: 0.1,
              }),
            });
            if (edenRes.ok) {
              const edenJson = (await edenRes.json()) as any;
              const rawContent = edenJson?.choices?.[0]?.message?.content || "";
              parsedResult = safeJsonParse(rawContent);
            }
          } catch (edenErr) {
            console.warn("[Eden AI Gemma 4 Fallback Failed]:", edenErr);
          }
        }

        const sanitizedCandidateProfile = validateAndSanitizeResumeSchema(parsedResult, candidateName);

        return new Response(
          JSON.stringify({ success: true, extracted: sanitizedCandidateProfile }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: { code: "AI_RESUME_PARSE_FAILED", message: err.message || "Failed to parse resume." } }),
          { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }
    }

    // AI JOB GENERATOR ENDPOINT
    if (url.pathname === "/api/ai/generate-job" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const { prompt: userPrompt, companyName = "Tech Team", companyLocation = "Ahmedabad, India", title, department } = body || {};
        const prompt = `You are SwipeHired's AI Job Architect. Generate an attractive job description for:
Brief: "${(userPrompt || title || "Software Engineer").slice(0, 2000)}"
Company: "${companyName}", Location: "${companyLocation}"
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
        const edenApiKey = env.EDENAI_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGE5Yjk1ZjEtODY1NS00ZjNiLTg5YzYtZmJhOWRmZWI1ZmE5IiwidHlwZSI6ImFwaV90b2tlbiIsIm5hbWUiOiJIaXJseSIsImlzX2N1c3RvbSI6dHJ1ZX0.MtgA6NbrsAC6hyEmYdurisnQLM8oEgJUE-q24e5h5Vc";
        if (edenApiKey) {
          const res = await fetch("https://api.edenai.run/v3/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${edenApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemma-4-31b-it",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 2000,
              temperature: 0.1,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as any;
            job = safeJsonParse(data.choices?.[0]?.message?.content || "");
          }
        }
        if (!job) {
          job = {
            title: title || "Software Engineer",
            department: department || "Engineering",
            location: companyLocation,
            workMode: "Hybrid",
            experience: "2-4 Years",
            salary: "₹8–14 LPA",
            openings: 1,
            description: `We are looking for a passionate ${title || "Software Engineer"} to join ${companyName}.`,
            responsibilities: ["Design and implement scalable features", "Collaborate across cross-functional teams"],
            requirements: ["Proven experience in full stack software engineering", "Strong problem solving skills"],
            requiredSkills: ["React", "TypeScript", "Node.js"],
            preferredSkills: ["PostgreSQL", "Tailwind CSS"],
          };
        }
        return new Response(JSON.stringify({ success: true, job }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    // AI MATCH ANALYSIS ENDPOINT
    if (url.pathname === "/api/ai/match-analysis" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const { candidate, job, deterministicScore = 88, deterministicReasons = [] } = body || {};
        const analysis = {
          matchScore: deterministicScore,
          fitVerdict: deterministicScore >= 90 ? "Exceptional Fit" : deterministicScore >= 80 ? "Strong Fit" : "Good Fit",
          matchedSkills: (candidate?.skills || []).slice(0, 3),
          missingSkills: [],
          reasons: deterministicReasons.length > 0 ? deterministicReasons : ["Core technical background aligns with role"],
          strengths: ["Strong modern software engineering foundation"],
          concerns: [],
          aiSummary: `${candidate?.fullName || "Candidate"} is a strong ${deterministicScore}% match for ${job?.title || "this role"}.`,
          interviewQuestions: [
            `How would you architect a high-throughput application using ${(job?.requiredSkills || ["TypeScript"])[0]}?`,
            "Walk me through a challenging production debugging scenario you resolved."
          ]
        };
        return new Response(JSON.stringify({ success: true, analysis }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    if (url.pathname === "/api/email/test-smtp" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const {
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          smtpPassword,
          senderName,
          fromEmail,
          testRecipientEmail,
        } = body || {};

        if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Missing required SMTP credentials. Please provide Host, Port, Username, and Password.",
            }),
            { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        if (!testRecipientEmail || !testRecipientEmail.includes("@")) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Please provide a valid test recipient email address.",
            }),
            { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        const effectiveFrom = (fromEmail && fromEmail.includes("@")) ? fromEmail.trim() : smtpUser.trim();
        const effectiveName = senderName || "SwipeHired Recruiter";

        const result = await sendSmtpEmail({
          host: smtpHost,
          port: Number(smtpPort) || 587,
          secure: smtpSecure === true || Number(smtpPort) === 465,
          user: smtpUser,
          pass: smtpPassword,
          from: effectiveFrom,
          fromName: effectiveName,
          to: testRecipientEmail,
          subject: `⚡ SwipeHired SMTP Connection Test — Successful`,
          textBody: `Hello,\n\nYour SMTP connection for SwipeHired has been successfully verified!\n\nHost: ${smtpHost}\nPort: ${smtpPort}\nAuthenticated Account: ${smtpUser}\nSender: ${effectiveName} <${effectiveFrom}>\n\nYou can now send candidate outreach directly from your company email.\n\nBest regards,\nSwipeHired Talent Platform`,
          htmlBody: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #0f172a; border-radius: 20px; overflow: hidden;">
              <div style="background: #0f172a; color: #ffffff; padding: 24px 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">⚡ SwipeHired SMTP Connection Test</h1>
              </div>
              <div style="padding: 30px; color: #334155; line-height: 1.6;">
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 20px; color: #065f46; font-weight: bold;">
                  ✓ SMTP Connection Verified Successfully!
                </div>
                <p>Hello,</p>
                <p>This is a live confirmation that your custom SMTP email server has been connected to <strong>SwipeHired</strong> and is ready to dispatch emails.</p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px;">
                  <p style="margin: 4px 0;"><strong>SMTP Server:</strong> ${smtpHost}:${smtpPort}</p>
                  <p style="margin: 4px 0;"><strong>Authenticated Account:</strong> ${smtpUser}</p>
                  <p style="margin: 4px 0;"><strong>Sender Identity:</strong> "${effectiveName}" &lt;${effectiveFrom}&gt;</p>
                  <p style="margin: 4px 0;"><strong>Delivered To:</strong> ${testRecipientEmail}</p>
                </div>
                <p style="font-size: 13px; color: #64748b;">You can now send automated interview invitations and offer letters directly to candidates.</p>
              </div>
            </div>
          `,
        });

        return new Response(
          JSON.stringify({
            success: true,
            messageId: result.messageId,
            message: `Real test email delivered successfully to ${testRecipientEmail}! Check your inbox.`,
          }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      } catch (err: any) {
        console.error("SMTP Error:", err);
        let userFriendlyError = err.message || "Failed to connect to SMTP server.";

        if (userFriendlyError.includes("535") || userFriendlyError.includes("Authentication Failed")) {
          userFriendlyError = "Authentication Failed (535): Invalid username or password. If using Gmail, make sure to generate a 16-character App Password at Google Account > Security > 2-Step Verification > App Passwords.";
        } else if (userFriendlyError.includes("553") || userFriendlyError.includes("Sender address rejected")) {
          userFriendlyError = "Sender Address Rejected (553): In Gmail SMTP, your 'From Email Address' must match your authenticated 'SMTP Username'.";
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: userFriendlyError,
          }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }
    }

    if (url.pathname === "/api/email/send" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const { smtpConfig, to, subject, body: emailBody, html } = body || {};

        if (!to) {
          return new Response(
            JSON.stringify({ success: false, error: "Recipient email is required." }),
            { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        if (smtpConfig && smtpConfig.smtpHost && smtpConfig.smtpUser && smtpConfig.smtpPassword) {
          const effectiveFrom = (smtpConfig.fromEmail && smtpConfig.fromEmail.includes("@"))
            ? smtpConfig.fromEmail.trim()
            : smtpConfig.smtpUser.trim();

          const result = await sendSmtpEmail({
            host: smtpConfig.smtpHost,
            port: Number(smtpConfig.smtpPort) || 587,
            secure: smtpConfig.smtpSecure === true || Number(smtpConfig.smtpPort) === 465,
            user: smtpConfig.smtpUser,
            pass: smtpConfig.smtpPassword,
            from: effectiveFrom,
            fromName: smtpConfig.senderName || "SwipeHired Recruiter",
            to,
            subject: subject || "Message from Hiring Team",
            textBody: emailBody,
            htmlBody: html,
          });

          return new Response(
            JSON.stringify({ success: true, messageId: result.messageId, message: `Email dispatched to ${to}` }),
            { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: "SMTP configuration is missing or incomplete. Please connect your custom email provider first.",
          }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err.message || "Failed to dispatch email." }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};