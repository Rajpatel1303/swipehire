import { supabase } from "./client";
import { EmailTemplate, WhatsAppTemplate } from "../../types";

export class TemplatesService {
  /**
   * Fetch Email Templates
   */
  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase.from("email_templates").select("*");
      if (error || !data) return [];
      return data.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category as any,
        subject: t.subject,
        bodyTemplate: t.body_template,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch WhatsApp Templates
   */
  static async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates").select("*");
      if (error || !data) return [];
      return data.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category as any,
        messageTemplate: t.message_template,
      }));
    } catch {
      return [];
    }
  }
}
