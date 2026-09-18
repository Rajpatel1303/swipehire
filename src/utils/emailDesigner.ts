/**
 * SwipeHired Email Design & Formatting Engine
 * Converts plain-text and template emails into responsive, high-converting HTML emails.
 * Compatible with Gmail, Apple Mail, Outlook, Yahoo Mail, and mobile email clients.
 */

export type EmailDesignTheme = "modern" | "executive" | "corporate" | "tech_dark";

export interface DesignedEmailOptions {
  theme?: EmailDesignTheme;
  subject: string;
  bodyText: string;
  companyName: string;
  companyLogo?: string;
  candidateName?: string;
  jobTitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  senderName?: string;
  senderTitle?: string;
}

export interface EmailThemeConfig {
  id: EmailDesignTheme;
  name: string;
  description: string;
  headerBg: string;
  headerTextColor: string;
  accentColor: string;
  accentBg: string;
  buttonBg: string;
  buttonTextColor: string;
  bodyBg: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subtextColor: string;
  tagColor: string;
}

export const EMAIL_THEMES: Record<EmailDesignTheme, EmailThemeConfig> = {
  modern: {
    id: "modern",
    name: "Modern Gradient",
    description: "Vibrant emerald & sky gradient header with clean card styling",
    headerBg: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
    headerTextColor: "#ffffff",
    accentColor: "#0284c7",
    accentBg: "#f0f9ff",
    buttonBg: "#0284c7",
    buttonTextColor: "#ffffff",
    bodyBg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    textColor: "#1e293b",
    subtextColor: "#64748b",
    tagColor: "#0369a1",
  },
  executive: {
    id: "executive",
    name: "Executive Slate",
    description: "Sleek, minimalist dark slate header with crisp typography",
    headerBg: "#0f172a",
    headerTextColor: "#ffffff",
    accentColor: "#059669",
    accentBg: "#ecfdf5",
    buttonBg: "#0f172a",
    buttonTextColor: "#ffffff",
    bodyBg: "#f1f5f9",
    cardBg: "#ffffff",
    cardBorder: "#cbd5e1",
    textColor: "#0f172a",
    subtextColor: "#475569",
    tagColor: "#047857",
  },
  corporate: {
    id: "corporate",
    name: "Corporate Navy & Amber",
    description: "Formal enterprise branding with warm gold & navy accents",
    headerBg: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)",
    headerTextColor: "#ffffff",
    accentColor: "#d97706",
    accentBg: "#fffbeb",
    buttonBg: "#d97706",
    buttonTextColor: "#ffffff",
    bodyBg: "#fdfbf7",
    cardBg: "#ffffff",
    cardBorder: "#fed7aa",
    textColor: "#1c1917",
    subtextColor: "#78716c",
    tagColor: "#b45309",
  },
  tech_dark: {
    id: "tech_dark",
    name: "Tech Midnight",
    description: "Modern developer-focused dark canvas with electric accents",
    headerBg: "#090d16",
    headerTextColor: "#38bdf8",
    accentColor: "#38bdf8",
    accentBg: "#1e293b",
    buttonBg: "#0284c7",
    buttonTextColor: "#ffffff",
    bodyBg: "#0b0f19",
    cardBg: "#111827",
    cardBorder: "#1f2937",
    textColor: "#f3f4f6",
    subtextColor: "#9ca3af",
    tagColor: "#38bdf8",
  },
};

/**
 * Replace template placeholders with actual or sample data
 */
export function interpolateVariables(
  text: string,
  vars: { candidateName?: string; jobTitle?: string; companyName?: string }
): string {
  const cName = vars.candidateName || "Alex Johnson";
  const jTitle = vars.jobTitle || "Senior Full-Stack Engineer";
  const compName = vars.companyName || "SwipeHired Partner";

  return text
    .replace(/\{\{\s*candidate_name\s*\}\}/gi, cName)
    .replace(/\{\{\s*job_title\s*\}\}/gi, jTitle)
    .replace(/\{\{\s*company_name\s*\}\}/gi, compName);
}

/**
 * Parses plain text paragraphs and bullet points into styled HTML elements
 */
export function formatBodyContentToHtml(bodyText: string, theme: EmailThemeConfig): string {
  const lines = bodyText.split("\n");
  const htmlParts: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
      htmlParts.push(`<div style="height: 14px; line-height: 14px;">&nbsp;</div>`);
      continue;
    }

    // Check for bullet points (•, -, *, or 1., 2.)
    const bulletMatch = trimmed.match(/^([•\-\*]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        htmlParts.push(
          `<ul style="margin: 8px 0 12px 0; padding-left: 20px; list-style-type: none;">`
        );
        inList = true;
      }
      const itemText = bulletMatch[2];
      htmlParts.push(
        `<li style="margin-bottom: 8px; line-height: 1.6; color: ${theme.textColor}; font-size: 14px; position: relative;">
          <span style="display: inline-block; width: 18px; height: 18px; background-color: ${theme.accentBg}; border-radius: 50%; color: ${theme.accentColor}; font-weight: bold; text-align: center; line-height: 18px; font-size: 11px; margin-right: 8px;">✓</span>
          ${itemText}
        </li>`
      );
      continue;
    }

    if (inList) {
      htmlParts.push(`</ul>`);
      inList = false;
    }

    // First greeting line (e.g. "Hi Alex,")
    if (i === 0 && (trimmed.startsWith("Hi ") || trimmed.startsWith("Dear ") || trimmed.startsWith("Hello "))) {
      htmlParts.push(
        `<p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: ${theme.textColor}; line-height: 1.5;">${trimmed}</p>`
      );
      continue;
    }

    // Callout / Next steps heading
    if (trimmed.toLowerCase().startsWith("next steps:") || trimmed.toLowerCase().startsWith("during this") || trimmed.toLowerCase().startsWith("what to expect:")) {
      htmlParts.push(
        `<div style="margin: 16px 0 12px 0; padding: 10px 14px; background-color: ${theme.accentBg}; border-left: 4px solid ${theme.accentColor}; border-radius: 6px; font-size: 13px; font-weight: 700; color: ${theme.textColor};">
          ${trimmed}
        </div>`
      );
      continue;
    }

    // Regular paragraph
    htmlParts.push(
      `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.7; color: ${theme.textColor};">${trimmed}</p>`
    );
  }

  if (inList) {
    htmlParts.push(`</ul>`);
  }

  return htmlParts.join("\n");
}

/**
 * Generates an email-client compliant, responsive HTML email string
 */
export function buildDesignedEmailHtml(opts: DesignedEmailOptions): string {
  const theme = EMAIL_THEMES[opts.theme || "modern"];
  const companyName = opts.companyName || "SwipeHired Partner";
  const candidateName = opts.candidateName || "Candidate";
  const jobTitle = opts.jobTitle || "Open Role";

  // Interpolate variables inside subject & body
  const rawSubject = interpolateVariables(opts.subject, {
    candidateName,
    jobTitle,
    companyName,
  });

  const rawBody = interpolateVariables(opts.bodyText, {
    candidateName,
    jobTitle,
    companyName,
  });

  const bodyHtml = formatBodyContentToHtml(rawBody, theme);

  const ctaText = opts.ctaText || (rawBody.toLowerCase().includes("interview") ? "Schedule Interview Round →" : "View Application on SwipeHired →");
  const ctaUrl = opts.ctaUrl || "https://swipehire.ownmylands.workers.dev";
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${rawSubject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .email-header-pad { padding: 24px 20px !important; }
      .email-body-pad { padding: 24px 20px !important; }
      .cta-button { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${theme.bodyBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${theme.bodyBg};">
    <tr>
      <td align="center" style="padding: 30px 12px;">
        <!-- Container -->
        <table class="email-container" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; background-color: ${theme.cardBg}; border: 1px solid ${theme.cardBorder}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td class="email-header-pad" style="padding: 32px 36px; background: ${theme.headerBg}; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <!-- Company Logo/Pill -->
                    <div style="display: inline-block; padding: 6px 14px; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; margin-bottom: 12px;">
                      <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${theme.headerTextColor};">
                        ✦ ${companyName}
                      </span>
                    </div>
                    <!-- Role / Subject -->
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: ${theme.headerTextColor}; line-height: 1.3; letter-spacing: -0.5px;">
                      ${jobTitle}
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); font-weight: 500;">
                      Recruitment Update via SwipeHired
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="email-body-pad" style="padding: 36px 36px 28px 36px; background-color: ${theme.cardBg};">
              ${bodyHtml}

              <!-- Primary Action CTA Button -->
              <div style="margin: 32px 0 24px 0; text-align: center;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="20%" stroke="f" fillcolor="${theme.buttonBg}">
                  <w:anchorlock/>
                  <center style="color:${theme.buttonTextColor};font-family:sans-serif;font-size:14px;font-weight:bold;">${ctaText}</center>
                </v:roundrect>
                <![endif]-->
                <a class="cta-button" href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: ${theme.buttonBg}; color: ${theme.buttonTextColor}; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); transition: background-color 0.2s;">
                  ${ctaText}
                </a>
              </div>

              <!-- Recruiter Signoff Box -->
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid ${theme.cardBorder}; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <p style="margin: 0; font-size: 12px; text-transform: uppercase; font-weight: 800; color: ${theme.subtextColor}; letter-spacing: 0.5px;">
                    Sent By
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: ${theme.textColor};">
                    ${opts.senderName || companyName}
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 12px; color: ${theme.subtextColor};">
                    Talent Acquisition & Hiring Team
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer Safe-Harbor -->
          <tr>
            <td style="padding: 24px 36px; background-color: ${theme.bodyBg}; border-top: 1px solid ${theme.cardBorder}; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${theme.subtextColor}; line-height: 1.6;">
                You received this priority message because you applied for the <strong>${jobTitle}</strong> opportunity at <strong>${companyName}</strong> via SwipeHired.
              </p>
              <div style="margin-top: 10px; font-size: 10px; color: ${theme.subtextColor};">
                <span>Verified Direct Outreach</span> · <span>Protected by 72-Hour Response SLA</span>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 10px; font-weight: 700; color: ${theme.subtextColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                © ${currentYear} ${companyName} · Powered by SwipeHired Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
