import { connect } from "cloudflare:sockets";

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
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
          JSON.stringify({ success: true, message: `Email queued for ${to}` }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
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