import { supabase } from "./client";
import { EmailTemplate, WhatsAppTemplate } from "../../types";
import { DEFAULT_EMAIL_TEMPLATES, DEFAULT_WHATSAPP_TEMPLATES } from "../defaultTemplates";
import { AuditService } from "./audit";

export class TemplatesService {
  /**
   * Fetch Email Templates for current authenticated company and defaults
   */
  static async getEmailTemplates(companyId?: string): Promise<EmailTemplate[]> {
    try {
      let query = supabase.from("email_templates").select("*");
      if (companyId) {
        query = query.or(`company_id.eq.${companyId},company_id.is.null`);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return DEFAULT_EMAIL_TEMPLATES;
      }

      const dbTemplates: EmailTemplate[] = data.map((t) => ({
        id: t.id,
        companyId: t.company_id || undefined,
        title: t.title,
        category: t.category as any,
        subject: t.subject,
        bodyTemplate: t.body_template,
      }));

      // Merge: Any default template not yet saved by the company remains available
      const merged: EmailTemplate[] = [...dbTemplates];
      for (const def of DEFAULT_EMAIL_TEMPLATES) {
        const exists = dbTemplates.some(
          (t) => t.id === def.id || (t.category === def.category && t.category !== "custom")
        );
        if (!exists) {
          merged.push(def);
        }
      }

      return merged;
    } catch (err) {
      console.warn("[TemplatesService] Error fetching email templates:", err);
      return DEFAULT_EMAIL_TEMPLATES;
    }
  }

  /**
   * Save or update an Email Template in Supabase
   */
  static async saveEmailTemplate(template: EmailTemplate, companyId?: string): Promise<EmailTemplate> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser || authError) {
        throw new Error("Unauthorized: Please sign in to save email templates.");
      }

      let resolvedCompanyId = companyId || template.companyId;
      if (!resolvedCompanyId) {
        const { data: userComp } = await supabase
          .from("companies")
          .select("id")
          .eq("user_id", authUser.id)
          .maybeSingle();
        resolvedCompanyId = userComp?.id;
      }

      const { data: existing } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", template.id)
        .maybeSingle();

      const payload: any = {
        id: template.id,
        company_id: resolvedCompanyId,
        title: template.title,
        category: template.category || "custom",
        subject: template.subject,
        body_template: template.bodyTemplate,
      };

      const { data, error } = await supabase
        .from("email_templates")
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.error("[TemplatesService] Failed to upsert email template:", error);
        throw new Error(`Database error saving email template: ${error.message}`);
      }

      await AuditService.log({
        actorUserId: authUser.id,
        actorRole: "company",
        companyId: resolvedCompanyId,
        action: existing ? "email_template_updated" : "email_template_created",
        entityType: "template",
        entityId: data.id,
        oldData: existing ? { title: existing.title, category: existing.category } : {},
        newData: { title: data.title, category: data.category, subject: data.subject },
        metadata: { title: data.title, category: data.category },
      });

      return {
        id: data.id,
        companyId: data.company_id,
        title: data.title,
        category: data.category as any,
        subject: data.subject,
        bodyTemplate: data.body_template,
      };
    } catch (err: any) {
      console.error("[TemplatesService] saveEmailTemplate error:", err.message || err);
      throw err;
    }
  }

  /**
   * Delete an Email Template from Supabase
   */
  static async deleteEmailTemplate(id: string): Promise<boolean> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authData?.user || authError) {
        throw new Error("Unauthorized: Please sign in to delete email templates.");
      }

      const { data: existing } = await supabase
        .from("email_templates")
        .select("title, company_id")
        .eq("id", id)
        .maybeSingle();

      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[TemplatesService] Failed to delete email template:", error);
        throw new Error(`Database error deleting email template: ${error.message}`);
      }

      await AuditService.log({
        actorUserId: authData.user.id,
        actorRole: "company",
        companyId: existing?.company_id,
        action: "email_template_deleted",
        entityType: "template",
        entityId: id,
        oldData: { title: existing?.title },
      });

      return true;
    } catch (err: any) {
      console.error("[TemplatesService] deleteEmailTemplate error:", err.message || err);
      throw err;
    }
  }

  /**
   * Fetch WhatsApp Templates
   */
  static async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const { data, error } = await supabase.from("whatsapp_templates").select("*");
      if (error || !data || data.length === 0) return DEFAULT_WHATSAPP_TEMPLATES;
      return data.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category as any,
        messageTemplate: t.message_template,
      }));
    } catch {
      return DEFAULT_WHATSAPP_TEMPLATES;
    }
  }
}
