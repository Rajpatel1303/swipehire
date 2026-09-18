import { EmailTemplate, WhatsAppTemplate } from "../types";

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tmpl_interview",
    title: "Virtual Interview Invitation",
    category: "interview",
    subject: "Interview Invitation: {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}!

After reviewing your impressive background and profile on SwipeHired, our engineering & leadership team would love to invite you for a virtual interview round.

During this 45-minute conversation, we will discuss:
• Your past technical projects and problem-solving approach
• Key responsibilities for the {{job_title}} role
• Our company vision, engineering culture, and growth roadmap
• Any questions you have for our team

Please let us know your availability over the next few business days, or book a time slot directly using the calendar link provided in your candidate portal.

We look forward to speaking with you!

Warm regards,
{{company_name}} Talent Acquisition Team`,
  },
  {
    id: "tmpl_shortlisted",
    title: "Application Shortlisted",
    category: "shortlisted",
    subject: "Great news! You've been shortlisted for {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_name}},

We have great news! Your profile for the {{job_title}} position at {{company_name}} has been officially shortlisted by our hiring team.

Your technical skills, relevant experience, and problem-solving track record stood out among applicants.

Next Steps:
1. Our recruiting team is currently finalizing interview schedules.
2. You will receive an interview calendar invite and preparation kit within 24-48 hours.
3. In the meantime, you can review our tech stack and company overview on our SwipeHired company page.

Congratulations on moving forward in our hiring pipeline!

Best regards,
The Hiring Team at {{company_name}}`,
  },
  {
    id: "tmpl_received",
    title: "Application Received Confirmation",
    category: "received",
    subject: "Application Received: {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_name}},

Thank you for applying for the {{job_title}} role at {{company_name}} through SwipeHired!

We have successfully received your application, resume, and profile details. Our hiring managers and technical recruiters are currently reviewing your qualifications against the core requirements for this position.

What to Expect:
• Our team typically reviews applications within 2 to 3 business days.
• If your profile aligns with our current needs, we will reach out with an invitation for an introductory call.
• You can track your real-time application status directly in your SwipeHired dashboard.

Thank you again for considering {{company_name}} as the next step in your career journey.

Best regards,
{{company_name}} Recruiting Team`,
  },
  {
    id: "tmpl_rejection",
    title: "Application Status Update",
    category: "rejection",
    subject: "Update regarding your application for {{job_title}} at {{company_name}}",
    bodyTemplate: `Dear {{candidate_name}},

Thank you so much for taking the time to apply for the {{job_title}} position at {{company_name}} and for sharing your background with us.

We received a remarkably high volume of talented applicants for this role. After careful review and consideration, we have decided to move forward with candidates whose specific experience more closely matches our immediate technical requirements at this stage.

Please note that this was a difficult decision. We were genuinely impressed by your skills and would love to stay connected for future opportunities as our engineering and product teams continue to expand.

We wish you every success in your ongoing job search and professional endeavors.

Warm regards,
{{company_name}} People & Talent Team`,
  },
  {
    id: "tmpl_assessment",
    title: "Technical Assessment & Take-Home",
    category: "custom",
    subject: "Technical Assessment: {{job_title}} at {{company_name}}",
    bodyTemplate: `Hi {{candidate_name}},

Thank you for progressing through the initial interview rounds for the {{job_title}} role at {{company_name}}!

As the next step in our evaluation, we would love for you to complete a brief technical assessment. This exercise is designed to give you a realistic preview of the problems our engineering team solves every day.

Assessment Guidelines:
• Scope: Hands-on implementation focused on clean architecture and problem-solving
• Expected Time: 90 - 120 minutes at your own pace
• Submission Deadline: Within 4 calendar days
• Environment: You may use your preferred IDE and modern tooling

Please find the problem brief and repository access instructions attached to your SwipeHired dashboard.

If you have any questions or require an extension, please don't hesitate to reach out!

Best of luck,
{{company_name}} Engineering Hiring Committee`,
  },
  {
    id: "tmpl_offer",
    title: "Offer & Compensation Discussion",
    category: "shortlisted",
    subject: "Official Offer: Welcome to {{company_name}} as {{job_title}}!",
    bodyTemplate: `Dear {{candidate_name}},

On behalf of the entire leadership and engineering team at {{company_name}}, we are thrilled to extend an official offer of employment for the {{job_title}} position!

Throughout our interview conversations, our team was deeply impressed by your technical depth, execution speed, and collaborative mindset. We are confident you will make a tremendous impact here.

Summary of Terms:
• Position: {{job_title}}
• Organization: {{company_name}}
• Placement Channel: SwipeHired Fast-Track Program
• Next Step: Review and sign your formal offer letter package

We would love to schedule a brief 15-minute call today to walk through your compensation structure, start date, and onboarding roadmap.

Congratulations once again! We cannot wait to build the future with you.

Warmest regards,
{{company_name}} Leadership & Talent Team`,
  },
];

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "wa_interview",
    title: "Interview Scheduled WhatsApp",
    category: "interview",
    messageTemplate: "Hi {{candidate_name}} 👋! You're invited to interview for *{{job_title}}* at *{{company_name}}*. Please check your email or calendar invite for details.",
  },
  {
    id: "wa_shortlist",
    title: "Shortlisted WhatsApp",
    category: "shortlist",
    messageTemplate: "Congratulations {{candidate_name}} 🎉! You've been shortlisted for *{{job_title}}* at *{{company_name}}*. Our talent team will reach out shortly!",
  },
  {
    id: "wa_update",
    title: "Application Received WhatsApp",
    category: "update",
    messageTemplate: "Hi {{candidate_name}}, we received your application for *{{job_title}}* at *{{company_name}}*. We will review it within 2-3 business days!",
  },
];