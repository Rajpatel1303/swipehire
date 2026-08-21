import { supabase } from "./client";
import { CompanyProfile } from "../../types";
import { AuditService } from "./audit";

export class CompaniesService {
  /**
   * Fetch all companies
   */
  static async getCompanies(): Promise<CompanyProfile[]> {
    try {
      const { data, error } = await supabase.from("companies").select("*");
      if (error || !data) {
        console.warn("[CompaniesService] Failed to fetch companies:", error?.message);
        return [];
      }

      return data.map((c) => ({
        id: c.id,
        userId: c.user_id,
        companyName: c.company_name,
        contactPerson: c.contact_person,
        email: c.email,
        phone: c.phone || "",
        logo: c.logo || "",
        website: c.website || "",
        industry: c.industry,
        size: c.size,
        location: c.location,
        about: c.about || "",
        culture: c.culture || [],
        benefits: c.benefits || [],
        isCompleted: !!c.is_completed,
        isVerified: !!c.is_verified,
        emailIntegration: (c.email_integration as any) || {
          provider: "none",
          connectedEmail: "",
          senderName: "",
          isConnected: false,
        },
      }));
    } catch (err) {
      console.warn("[CompaniesService] Error fetching companies:", err);
      return [];
    }
  }

  /**
   * Save or update company profile
   */
  static async saveCompany(company: CompanyProfile): Promise<boolean> {
    try {
      const payload: any = {
        id: company.id,
        company_name: company.companyName,
        contact_person: company.contactPerson,
        email: company.email,
        phone: company.phone,
        logo: company.logo,
        website: company.website,
        industry: company.industry,
        size: company.size,
        location: company.location,
        about: company.about,
        culture: company.culture,
        benefits: company.benefits,
        is_completed: company.isCompleted,
        is_verified: company.isVerified,
        email_integration: company.emailIntegration as any,
        updated_at: new Date().toISOString(),
      };
      if (company.userId) {
        payload.user_id = company.userId;
      }
      const { error } = await supabase.from("companies").upsert(payload);
      if (error) {
        console.warn("[CompaniesService] Failed to upsert company:", error.message);
        return false;
      }

      await AuditService.log({
        actorId: company.userId || company.id,
        actorRole: "company",
        action: "update_company_profile",
        entityType: "company",
        entityId: company.id,
        metadata: { companyName: company.companyName, isVerified: company.isVerified },
      });

      return true;
    } catch (err) {
      console.warn("[CompaniesService] Unexpected error saving company:", err);
      return false;
    }
  }
}
